export type Role = 'admin' | 'user'; //  specific roles

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  profileImage: string | null;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: Role;
  };
}

export interface DeleteResponse {
  message: string;
}

export class RegisterUserDto {
  name: string;
  email: string;
  password: string;
}

export class LoginUserDto {
  email: string;
  password: string;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  profileImage?: string;
  role?: Role; // Added role to update DTO
}
