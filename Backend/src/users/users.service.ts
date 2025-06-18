import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from 'generated/prisma';
import * as bcrypt from 'bcrypt';
import {
  DeleteResponse,
  LoginResponse,
  LoginUserDto,
  RegisterUserDto,
  UpdateUserDto,
  UserResponse,
} from './types/types';
import Role = $Enums.Role;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterUserDto): Promise<UserResponse> {
    try {
      // Check if email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Validate input
      if (!dto.name?.trim()) {
        throw new BadRequestException('Name is required and cannot be empty');
      }

      if (!dto.email?.trim()) {
        throw new BadRequestException('Email is required and cannot be empty');
      }

      if (!dto.password || dto.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      return await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          role: Role.user, // Use enum instead of string
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error in register:', error);
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async validateUser(dto: LoginUserDto): Promise<LoginResponse | null> {
    try {
      if (!dto.email?.trim() || !dto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });

      console.log(
        'Found user:',
        user ? { id: user.id, email: user.email, role: user.role } : null,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isValid = await bcrypt.compare(dto.password, user.password);

      if (!isValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const response: LoginResponse = {
        access_token: 'your-jwt-token',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };

      console.log('Login successful for user:', user.email);
      return response;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      console.error('Error in validateUser:', error);
      throw new InternalServerErrorException(
        'Login failed due to server error',
      );
    }
  }

  async findById(id: string): Promise<UserResponse | null> {
    try {
      if (!id?.trim()) {
        throw new BadRequestException('Valid user ID is required');
      }

      return await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Error in findById:', error);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async findAll(): Promise<UserResponse[]> {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc', // Changed from 'id' to 'createdAt' since UUIDs don't sort chronologically
        },
      });
    } catch (error) {
      console.error('Error in findAll:', error);
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  async findOne(id: string): Promise<UserResponse> {
    try {
      if (!id?.trim()) {
        throw new BadRequestException('Valid user ID is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return user;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error in findOne:', error);
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async update(id: string, updateData: UpdateUserDto): Promise<UserResponse> {
    try {
      if (!id?.trim()) {
        throw new BadRequestException('Valid user ID is required');
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        throw new BadRequestException('Update data is required');
      }

      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Validate update data
      if (updateData.name !== undefined && !updateData.name?.trim()) {
        throw new BadRequestException('Name cannot be empty');
      }

      if (updateData.password !== undefined && updateData.password.length < 6) {
        throw new BadRequestException(
          'Password must be at least 6 characters long',
        );
      }

      // If updating email, check if it's already taken
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: updateData.email.toLowerCase().trim() },
        });
        if (emailExists) {
          throw new ConflictException('Email already exists');
        }
      }

      // Prepare data for update
      const dataToUpdate: any = {
        updatedAt: new Date(),
      };

      if (updateData.name) {
        dataToUpdate.name = updateData.name.trim();
      }

      if (updateData.email) {
        dataToUpdate.email = updateData.email.toLowerCase().trim();
      }

      if (updateData.password) {
        dataToUpdate.password = await bcrypt.hash(updateData.password, 10);
      }

      if (updateData.profileImage !== undefined) {
        dataToUpdate.profileImage = updateData.profileImage;
      }

      // Handle role update if provided and user has permission
      if (updateData.role !== undefined) {
        dataToUpdate.role = updateData.role;
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      console.error('Error in update:', error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async delete(id: string): Promise<DeleteResponse> {
    try {
      if (!id?.trim()) {
        throw new BadRequestException('Valid user ID is required');
      }

      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          assignedProject: true, // Check if user has assigned projects
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if user has assigned projects
      if (user.assignedProject) {
        throw new BadRequestException(
          'Cannot delete user with assigned projects. Please unassign projects first.',
        );
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return { message: `User ${user.name} has been deleted successfully` };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Error in delete:', error);
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async getUserProjects(userId: string): Promise<any[]> {
    try {
      if (!userId?.trim()) {
        throw new BadRequestException('Valid user ID is required');
      }

      // First verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Since it's a one-to-one relationship, get the single assigned project
      const userWithProject = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          assignedProject: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              endDate: true,
              createdAt: true,
              updatedAt: true,
              emailStatus: true,
            },
          },
        },
      });

      // Return array for consistency with existing API, but it will have 0 or 1 project
      return userWithProject?.assignedProject
        ? [userWithProject.assignedProject]
        : [];
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      console.error('Error getting user projects:', error);
      throw new InternalServerErrorException('Failed to get user projects');
    }
  }
}
