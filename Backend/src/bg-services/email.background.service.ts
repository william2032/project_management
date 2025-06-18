import { Injectable } from '@nestjs/common';
import { BaseBackgroundService } from './base.background.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from 'generated/prisma';
import { EmailOptions } from '../email/interfaces/email.interface';
import { EmailQueueItem } from './types';

interface ParsedEmailContext {
  projectName: string;
  endDate: string;
  updatedAt?: string;
  userName?: string;
  projectUrl?: string;
  message?: string;
}

@Injectable()
export class EmailBackgroundService extends BaseBackgroundService {
  private isRunning = false;
  private processInterval: NodeJS.Timeout | null = null;
  private readonly batchSize = 10;
  private readonly processingInterval = 60000;

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {
    super('EmailBackgroundService');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Email service is already running');
      return;
    }

    this.isRunning = true;
    await this.processEmailQueue();
    this.processInterval = setInterval(() => {
      void this.processEmailQueue().catch((err) => {
        this.logger.error('Error processing email queue:', err);
      });
    }, this.processingInterval);

    this.logger.log('Email background service started');
  }

  private async processEmailQueue(): Promise<void> {
    try {
      // First check if there are any NOT_SENT emails and mark them as PENDING
      await this.prisma.emailQueue.updateMany({
        where: { status: EmailStatus.NOT_SENT },
        data: { status: EmailStatus.PENDING },
      });

      // Then process PENDING emails
      const pendingEmails = await this.prisma.emailQueue.findMany({
        where: {
          status: EmailStatus.PENDING,
          retries: {
            lt: 3,
          },
        },
        take: this.batchSize,
        orderBy: { createdAt: 'asc' },
      });

      if (pendingEmails.length === 0) return;

      this.logger.log(`Processing ${pendingEmails.length} pending emails`);

      for (const email of pendingEmails) {
        try {
          await this.updateEmailStatus(email.id, EmailStatus.PROCESSING);

          const parsedContext = this.parseEmailContext(email.context);
          const emailOptions = this.createEmailOptions(email, parsedContext);

          await this.emailService.sendMail(emailOptions);
          await this.updateEmailStatus(email.id, EmailStatus.SENT);

          this.logger.log(`Successfully sent email ${email.id} to ${email.to}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await this.updateEmailStatus(
            email.id,
            EmailStatus.FAILED,
            errorMessage,
          );

          // Increment retry count
          await this.prisma.emailQueue.update({
            where: { id: email.id },
            data: { retries: { increment: 1 } },
          });

          this.logger.error(`Failed to send email ${email.id}:`, errorMessage);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to process email queue:', errorMessage);
    }
  }

  private parseEmailContext(contextString: string): ParsedEmailContext {
    try {
      const parsedContext = JSON.parse(contextString) as ParsedEmailContext;

      if (!parsedContext.projectName || !parsedContext.endDate) {
        throw new Error('Missing required fields in email context');
      }

      return parsedContext;
    } catch (error) {
      throw new Error(
        `Invalid email context: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private createEmailOptions(
    email: EmailQueueItem,
    context: ParsedEmailContext,
  ): EmailOptions {
    return {
      to: email.to,
      subject: email.subject,
      template: email.template,
      context: {
        projectName: context.projectName,
        // endDate: context.endDate,
        updatedAt: context.updatedAt,
        userName: context.userName,
        projectUrl: context.projectUrl,
        message: context.message,
      },
    };
  }

  private async updateEmailStatus(
    id: string,
    status: EmailStatus,
    error?: string,
  ): Promise<void> {
    await this.prisma.emailQueue.update({
      where: { id },
      data: {
        status,
        error: error || null,
        processedAt: status === EmailStatus.SENT ? new Date() : undefined,
      },
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    await this.processEmailQueue();
    this.isRunning = false;
    this.logger.log('Email background service stopped');
  }
}
