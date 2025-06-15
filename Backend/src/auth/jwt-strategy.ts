import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomJwtService } from './jwt.service';
import { UsersService } from '../users/users.service';
import { JwtPayload, RequestUser } from './types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private jwtService: CustomJwtService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.usersService.findById(parseInt(payload.sub));
    if (!user) throw new UnauthorizedException('Invalid token');
    return user;
  }
}
