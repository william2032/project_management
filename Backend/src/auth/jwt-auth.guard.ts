/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Allow the request to proceed if there's a user
    if (user) {
      return user;
    }
    // Throw UnauthorizedException if no user
    throw new UnauthorizedException();
  }
}
