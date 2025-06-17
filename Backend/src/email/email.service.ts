import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailOptions } from './interfaces/email.interface';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private mailerService: MailerService) {}

    sendMail(options: EmailOptions): Promise<void> {
        return this.mailerService.sendMail(options);
    }

    async sendProjectAssignmentEmail(
        assignee: { email: string; name: string },
        projectName: string,
    ): Promise<boolean> {
        try {
            await this.mailerService.sendMail({
                to: assignee.email,
                subject: 'Project Assigned',
                template: 'project-assigned',
                context: {
                    projectName,
                    userName: assignee.name,
                },
            });
            this.logger.log(`Project assignment email sent to ${assignee.email}`);
            return true;
        } catch (error) {
            this.logger.error(
                `Failed to send project assignment email to ${assignee.email}:`,
                error,
            );
            return false;
        }
    }

    async sendProjectCompletionEmail(
        projectName: string,
        userName: string,
    ): Promise<boolean> {
        try {
            await this.mailerService.sendMail({
                to: 'markndwiga@gmail.com',
                subject: 'Project Completed',
                template: 'project-completed',
                context: {
                    projectName,
                    userName,
                },
            });
            this.logger.log(`Project completion email sent to admin`);
            return true;
        } catch (error) {
            this.logger.error('Failed to send project completion email:', error);
            return false;
        }
    }
}