import { Role } from 'generated/prisma';

// Payload for JWT tokens
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// User attached to request.user
export interface RequestUser {
  id: number;
  email: string;
  role: Role;
}
