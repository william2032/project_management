import { MailerService } from '@nestjs-modules/mailer';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginUserDto } from '../users/dtos/login-user.dto';
import { RegisterUserDto } from '../users/dtos/register-user.dto';
import { UsersService } from '../users/users.service';
import { CustomJwtService } from './jwt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10');

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: CustomJwtService,
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async register(userData: RegisterUserDto) {
    this.logger.log(`Registering user: ${userData.email}`);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      this.logger.warn(`User already exists: ${existingUser.email}`);
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(
      userData.password,
      this.SALT_ROUNDS,
    );

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    this.logger.log(`User registered successfully: ${user.email}`);
    return { message: 'User created', user };
  }

  async login(email: string, password: string, dto: LoginUserDto) {
    this.logger.log(`Attempting login for: ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    this.logger.debug(`Found user: ${user?.email || 'Not found'}`);

    if (!user) {
      this.logger.warn('User not found during login');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, user.password);
    this.logger.debug(`Password validation result: ${isValid}`);

    if (user && isValid) {
      const payload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };

      const token = this.jwtService.generateToken(payload);

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Welcome to Teach2Give!',
          template: '../templates/email/welcome.ejs',
          context: {
            name: user.name,
            email: user.email,
          },
        });
      } catch (emailError) {
        this.logger.warn(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Failed to send welcome email to ${user.email}: ${emailError.message}`,
        );
      }

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }

    this.logger.warn('Invalid credentials during login');
    throw new UnauthorizedException('Invalid credentials');
  }
}
