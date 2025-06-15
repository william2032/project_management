import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Role } from 'generated/prisma';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './types';

@Injectable()
export class CustomJwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateToken(payload: JwtPayload): string {
    console.log('JWT Service - Generating token with payload:', payload);
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      expiresIn: '24h',
    });
    console.log('JWT Service - Token generated:', token.substring(0, 20) + '...');
    return token;
  }

  verifyToken(token: string): JwtPayload {
    console.log('JWT Service - Verifying token:', token.substring(0, 20) + '...');
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'your-secret-key',
      });
      console.log('JWT Service - Token verified successfully:', payload);
      return payload;
    } catch (error) {
      console.error('JWT Service - Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    console.log('JWT Service - Decoding token:', token.substring(0, 20) + '...');
    try {
      const payload = this.jwtService.decode(token);
      console.log('JWT Service - Token decoded successfully:', payload);
      return payload as JwtPayload;
    } catch (error) {
      console.error('JWT Service - Token decoding failed:', error);
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string): string {
    console.log('JWT Service - Extracting token from header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('JWT Service - Invalid authorization header format');
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }
    const token = authHeader.substring(7);
    console.log('JWT Service - Token extracted:', token.substring(0, 20) + '...');
    return token;
  }
}
