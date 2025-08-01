import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseBackgroundService } from '@backend/bg-services/base.background.service';
import { EmailBackgroundService } from '@backend/bg-services/email.background.service';
import { ProjectStatusBackgroundService } from '@backend/bg-services/project-status.background.service';
import { PrismaService } from '@backend/prisma/prisma.service';
import { EmailService } from '@backend/email/email.service';

export class BackgroundServiceManager {
    private readonly logger = new Logger('BackgroundServiceManager');
    private readonly services: BaseBackgroundService[];

    constructor(
        configService: ConfigService,
        prisma: PrismaService,
        emailService: EmailService
    ) {
        this.services = [
            new EmailBackgroundService(emailService, prisma),
            new ProjectStatusBackgroundService(prisma, emailService, configService)
        ] as BaseBackgroundService[];
    }

    async startAll(): Promise<void> {
        this.logger.log('Starting all background services...');

        for (const service of this.services) {
            try {
                await service.start();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to start service: ${service.constructor.name}`, errorMessage);
            }
        }
    }

    async stopAll(): Promise<void> {
        this.logger.log('Stopping all background services...');

        for (const service of this.services) {
            try {
                await service.stop();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to stop service: ${service.constructor.name}`, errorMessage);
            }
        }
    }
}