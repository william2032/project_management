import { Injectable, Logger } from '@nestjs/common';
import { BaseBackgroundService } from './base.background.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { addDays, subDays, differenceInHours } from 'date-fns';
import { EmailStatus, Status } from 'generated/prisma';
import { ProjectWithAssignee } from './types';

@Injectable()
export class ProjectStatusBackgroundService extends BaseBackgroundService {
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly DEADLINE_WARNING_HOURS = 24;
  private readonly STALE_DAYS = 7;
  protected readonly logger = new Logger(ProjectStatusBackgroundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    super('ProjectStatusBackgroundService');
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.logger.log('ProjectStatusBackgroundService started');
    await this.checkProjects();
    this.checkInterval = setInterval(
      () => {
        void this.checkProjects().catch((err) => {
          this.logger.error('Error checking projects:', err);
        });
      },
      60 * 60 * 1000,
    );
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    await this.checkProjects();
    this.logger.log('ProjectStatusBackgroundService stopped');
  }

  private async checkProjects(): Promise<void> {
    const now = new Date();
    await Promise.all([
      this.checkDeadlineProjects(now),
      this.checkStaleProjects(now),
    ]);
  }

  private async checkDeadlineProjects(now: Date): Promise<void> {
    const deadlineProjects = await this.prisma.project.findMany({
      where: {
        endDate: {
          gte: now,
          lte: addDays(now, 1),
        },
        status: Status.in_progress,
        emailStatus: EmailStatus.NOT_SENT,
      },
      include: { assignedTo: true },
    });

    // for (const project of deadlineProjects) {
    //     if (
    //         differenceInHours(project.endDate, now) <= this.DEADLINE_WARNING_HOURS
    //     ) {
    //         await this.sendDeadlineWarning(project);
    //     }
    // }
  }

  private async checkStaleProjects(now: Date): Promise<void> {
    const staleProjects = await this.prisma.project.findMany({
      where: {
        updatedAt: {
          lte: subDays(now, this.STALE_DAYS),
        },
        status: Status.in_progress,
        emailStatus: EmailStatus.NOT_SENT,
      },
      include: { assignedTo: true },
    });

    for (const project of staleProjects) {
      const projectWithAssignee: ProjectWithAssignee = {
        ...project,
        assignee: project.assignedTo, // Map assignedTo to assignee
      };
      await this.sendStaleWarning(projectWithAssignee);
    }
  }

  private async sendDeadlineWarning(
    project: ProjectWithAssignee,
  ): Promise<void> {
    if (!project.assignee) return;

    await this.emailService.sendMail({
      to: project.assignee.email,
      subject: `Project "${project.name}" deadline approaching`,
      template: 'deadline-warning',
      context: {
        projectName: project.name as string,
        // endDate: project.endDate.toISOString(),
      },
    });

    await this.prisma.project.update({
      where: { id: project.id },
      data: { emailStatus: EmailStatus.SENT },
    });

    this.logger.log(`Deadline warning sent for project ${project.name}`);
  }

  private async sendStaleWarning(project: ProjectWithAssignee): Promise<void> {
    if (!project.assignee) return;

    await this.emailService.sendMail({
      to: project.assignee.email,
      subject: `Project "${project.name}" is stale`,
      template: 'stale-warning',
      context: {
        projectName: project.name as string,
        // endDate: project.endDate.toISOString() ,
        updatedAt: project.updatedAt.toISOString(),
      },
    });

    await this.prisma.project.update({
      where: { id: project.id },
      data: { emailStatus: EmailStatus.SENT },
    });

    this.logger.log(`Stale warning sent for project ${project.name}`);
  }
}
