/* eslint-disable prettier/prettier */
import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt-strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomJwtService } from './jwt.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from 'src/users/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register JWT strategy
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret-key',
        signOptions: {
          expiresIn: '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [AuthService, CustomJwtService, PrismaService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule, CustomJwtService],
})
export class AuthModule {}
