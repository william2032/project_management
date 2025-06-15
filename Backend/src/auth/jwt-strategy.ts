import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomJwtService } from './jwt.service';
import { UsersService } from '../users/users.service';
import { JwtPayload, RequestUser } from './types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private jwtService: CustomJwtService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload): Promise<RequestUser> {
    console.log('JWT Strategy - Request headers:', request.headers);
    console.log('JWT Strategy - Payload:', payload);
    
    if (!payload.sub) {
      console.log('JWT Strategy - No subject in payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findById(parseInt(payload.sub));
    console.log('JWT Strategy - Found user:', user);
    
    if (!user) {
      console.log('JWT Strategy - User not found');
      throw new UnauthorizedException('User not found');
    }

    if (user.role !== 'admin') {
      console.log('JWT Strategy - User is not an admin');
      throw new UnauthorizedException('User is not an admin');
    }
    
    console.log('JWT Strategy - User validated:', user);
    return user;
  }
}
