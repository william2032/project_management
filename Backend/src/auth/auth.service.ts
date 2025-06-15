import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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
    console.log('Auth Service - Registering user:', { email: userData.email });
    
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log('Auth Service - User already exists:', existingUser.email);
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

    console.log('Auth Service - User registered successfully:', user);
    return { message: 'User created', user };
  }

  async login(email: string, password: string, dto: LoginUserDto) {
    console.log('Auth Service - Attempting login for:', email);
    
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    console.log('Auth Service - Found user:', user ? { ...user, password: '[REDACTED]' } : null);

    if (!user) {
      console.log('Auth Service - User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    console.log('Auth Service - Password validation:', isValid);

    if (user && isValid) {
      const payload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };
      console.log('Auth Service - Generating token with payload:', payload);
      
      const token = this.jwtService.generateToken(payload);
      console.log('Auth Service - Token generated:', token.substring(0, 20) + '...');
      
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }

    console.log('Auth Service - Invalid credentials');
    throw new UnauthorizedException('Invalid credentials');
  }
}
