import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

// Strategy for validating JWT tokens
@Injectable()
export class JwtService extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Bearer token
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // Use JWT_SECRET from .env
    });
  }

  // Validate JWT payload and attach user to request
  async validate(payload: { sub: number; email: string; role: string }) {
    // Fetch user by ID from payload
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user; // Attach user to request.user
  }
}
