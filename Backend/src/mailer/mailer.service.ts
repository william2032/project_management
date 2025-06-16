/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ejs from 'ejs';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';
import path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

export interface WelcomeEmailContext {
  username: string;
  email: string;
  project: string;
  supportEmail?: string;
  loginUrl: string;
}
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor(private configService: ConfigService) {}
  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };
    this.transporter = nodemailer.createTransport(smtpConfig);
    this.logger.log('Email transporter initialized successfully');
  }
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let html = options.html;

      if (options.template && options.context) {
        html = await this.renderTemplate(options.template, options.context);
      }

      const mailOptions = {
        from: this.configService.get<string>(
          'SMTP_FROM',
          'otwanemark254@gmail.com',
        ),
        to: options.to,
        subject: options.subject,
        html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${options.to}: ${result.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to} : ${error.messageId}`,
      );
    }
  }

  async sendWelcome(to: string, context: WelcomeEmailContext): Promise<void> {
    const emailOptions: EmailOptions = {
      to,
      subject: `Welcome to ${context.project} project management system`,
      template: 'Welcome',
      context: {
        ...context,
        loginUrl:
          context.loginUrl ||
          `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000/api/login')}`,
        supportEmail:
          context.supportEmail ||
          `${this.configService.get<string>('SUPPORT_EMAIL', 'projectassignment@gmail.com')} `,
        username: context.username || 'User',
      },
    };
    await this.sendEmail(emailOptions);
  }

  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    try {
      const templatesPath = path.join(
        this.templatesPath,
        `${templateName}.ejs`,
      );

      if (!fs.existsSync(templatesPath)) {
        throw new Error(
          `Template ${templateName} not found at ${templatesPath}`,
        );
      }

      const templateOptions = {
        filename: templatesPath,
        cache: process.env.NODE_ENV === 'production',
        compileDebug: process.env.NODE_ENV !== 'production',
      };
      const html = await ejs.renderFile(
        templatesPath,
        context,
        templateOptions,
      );

      return html;
    } catch (error) {
      this.logger.error(
        `Template rendering failed for ${templateName} : ${error.message}`,
      );
      throw error;
    }
  }
}
