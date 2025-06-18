import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EmailBackgroundService } from './email.background.service';
import { ProjectStatusBackgroundService } from './project-status.background.service';

@Injectable()
export class BackgroundServiceManager implements OnModuleInit, OnModuleDestroy {
    constructor(
        private readonly emailService: EmailBackgroundService,
        private readonly projectStatusService: ProjectStatusBackgroundService,
    ) {}

    async onModuleInit() {
        await this.startAll();
    }

    async onModuleDestroy() {
        await this.stopAll();
    }

    private async startAll(): Promise<void> {
        await Promise.all([
            this.emailService.start(),
            this.projectStatusService.start(),
        ]);
    }

    private async stopAll(): Promise<void> {
        await Promise.all([
            this.emailService.stop(),
            this.projectStatusService.stop(),
        ]);
    }
}