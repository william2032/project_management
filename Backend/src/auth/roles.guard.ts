/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    console.log('Required roles:', requiredRoles);

    if (!requiredRoles) {
      console.log('No roles required, allowing access');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('User from request:', user);
    console.log('User role:', user?.role);

    const hasRole = requiredRoles.includes(user?.role);
    console.log('Has required role:', hasRole);

    return hasRole;
  }
}
