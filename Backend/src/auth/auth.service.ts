import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CustomJwtService } from './jwt.service';
import { LoginUserDto } from '../users/dtos/login-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from '../users/dtos/register-user.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: CustomJwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(userData: RegisterUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      userData.password,
      this.SALT_ROUNDS,
    );

    // Create user with default 'USER' role
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return { message: 'User created', user };
  }

  async login(email: string, password: string, dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    console.log('Found user:', user);

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);

    if (user && isValid) {
      return {
        access_token: this.jwtService.generateToken({
          sub: user.id.toString(),
          email: user.email,
          role: user.role,
        }),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }

    throw new Error('Invalid credentials');
  }
}
