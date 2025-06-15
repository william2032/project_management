/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsersService } from './users.service';
import {
  RegisterUserDto,
  LoginUserDto,
  UpdateUserDto,
  UserResponse,
  DeleteResponse,
} from './types/types';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto): Promise<UserResponse> {
    return this.usersService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto) {
    try {
      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
        loginDto,
      );
      console.log('Login successful for:', loginDto.email);
      console.log(
        'Generated token:',
        result.access_token.substring(0, 50) + '...',
      );
      return result;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Login failed:', error.message);
      } else {
        console.error('Login failed:', error);
      }
      throw error;
    }
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard) // Only requires valid JWT, not admin
  getCurrentUser(
    @Request() req: { user: { userId: number; email: string; role: string } },
  ) {
    return {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getById(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.update(+id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteUser(@Param('id') id: string): Promise<DeleteResponse> {
    return this.usersService.delete(+id);
  }

  @Get(':id/projects')
  @UseGuards(JwtAuthGuard)
  async getUserProjects(@Param('id') id: string) {
    return this.usersService.getUserProjects(+id);
  }
}
