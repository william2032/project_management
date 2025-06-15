import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard for protecting routes with JWT authentication
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('JWT Auth Guard - Checking authentication');
    const request = context.switchToHttp().getRequest();
    console.log('JWT Auth Guard - Request headers:', request.headers);
    
    // Check if Authorization header exists
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      console.log('JWT Auth Guard - No Authorization header');
      throw new UnauthorizedException('No token provided');
    }

    // Check if token is in correct format
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      console.log('JWT Auth Guard - Invalid token format');
      throw new UnauthorizedException('Invalid token format');
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('JWT Auth Guard - Handle request:', { err, user, info });
    if (err || !user) {
      console.log('JWT Auth Guard - Authentication failed:', err || 'No user found');
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
