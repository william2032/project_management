import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  UserResponse,
  LoginResponse,
  UpdateUserDto,
  DeleteResponse,
  RegisterUserDto,
  LoginUserDto,
} from './types/types';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterUserDto): Promise<UserResponse> {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Validate input
      if (!dto.name?.trim()) {
        throw new BadRequestException('Name is required and cannot be empty');
      }

      if (!dto.email?.trim()) {
        throw new BadRequestException('Email is required and cannot be empty');
      }

      if (!dto.password || dto.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const newUser = await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          role: 'user',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      });

      return newUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error in register:', error);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async validateUser(dto: LoginUserDto): Promise<LoginResponse | null> {
    try {
      if (!dto.email?.trim() || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });

      console.log(
        'Found user:',
        user ? { id: user.id, email: user.email, role: user.role } : null,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isValid = await bcrypt.compare(dto.password, user.password);

      if (!isValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const response: LoginResponse = {
        access_token: 'your-jwt-token',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      console.log('Login successful for user:', user.email);
      return response;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('Error in validateUser:', error);
      throw new InternalServerErrorException(
        'Login failed due to server error',
      );
    }
  }

  async findById(id: number): Promise<UserResponse | null> {
    try {
      if (!id || id <= 0) {
        throw new BadRequestException('Valid user ID is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error in findById:', error);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async findAll(): Promise<UserResponse[]> {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      return users;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  async findOne(id: number): Promise<UserResponse> {
    try {
      if (!id || id <= 0) {
        throw new BadRequestException('Valid user ID is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error in findOne:', error);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async update(id: number, updateData: UpdateUserDto): Promise<UserResponse> {
    try {
      if (!id || id <= 0) {
        throw new BadRequestException('Valid user ID is required');
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new BadRequestException('Update data is required');
      }

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Validate update data
      if (updateData.name !== undefined && !updateData.name?.trim()) {
        throw new BadRequestException('Name cannot be empty');
      }

      if (updateData.password !== undefined && updateData.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }

      // If updating email, check if it's already taken
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: updateData.email.toLowerCase().trim() },
        });
        if (emailExists) {
          throw new ConflictException('Email already exists');
        }
      }

      // Prepare data for update
      const dataToUpdate: Partial<UpdateUserDto> = {};

      if (updateData.name) {
        dataToUpdate.name = updateData.name.trim();
      }

      if (updateData.email) {
        dataToUpdate.email = updateData.email.toLowerCase().trim();
      }

      if (updateData.password) {
        dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
      }

      if (updateData.profileImage !== undefined) {
        dataToUpdate.profileImage = updateData.profileImage;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error in update:', error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async delete(id: number): Promise<DeleteResponse> {
    try {
      if (!id || id <= 0) {
        throw new BadRequestException('Valid user ID is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return { message: `User ${user.name} has been deleted successfully` };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error in delete:', error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}
