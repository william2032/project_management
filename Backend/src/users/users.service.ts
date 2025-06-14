import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dtos/login-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email exists');
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: 'user',
      },
      select: { id: true, email: true, role: true },
    });
  }

  async validateUser(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) return null;
    return { id: user.id, email: user.email, role: user.role };
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true },
    });
  }
}
