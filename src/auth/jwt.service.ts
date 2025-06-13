import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Role } from 'generated/prisma';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(private configService: ConfigService) {
    this.secret =
      this.configService.get<string>('JWT_SECRET') || 'default-secret';
    this.expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '24h';
  }

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as unknown as JwtPayload;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token', error);
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as unknown as JwtPayload;
    } catch {
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid authorization header',
      );
    }
    return authHeader.substring(7);
  }
}