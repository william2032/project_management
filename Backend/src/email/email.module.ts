import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

@Module({
  imports: [
    // imports: [ConfigModule],
    // inject: [ConfigService],
    // useFactory: (config: ConfigService) => ({
    ConfigModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false, // Use TLS for port 587
        auth: {
          user: process.env.MAIL_USER || 'w41314343@gmail.com',
          pass: process.env.MAIL_PASS || 'vzungemgfvmixrgj', // Replace with actual App Password
        },
      },
      defaults: {
        from: '"Project Management" <w41314343@gmail.com>',
      },
      template: {
        dir: join(process.cwd(), 'src', 'mail', 'templates'),
        adapter: new EjsAdapter(),
        options: {
          strict: false,
        },
      },
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
