import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard for protecting routes with JWT authentication
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
