import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtPayload, CustomJwtService } from './jwt.service';
import { LoginUserDto } from '../users/dtos/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: CustomJwtService,
  ) {}

  async login(dto: LoginUserDto): Promise<{ access_token: string }> {
    const user = await this.userService.validateUser(dto);
    if (!user) throw new UnauthorizedException('invalid credentials');
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return { access_token: this.jwtService.generateToken(payload) };
  }
}
