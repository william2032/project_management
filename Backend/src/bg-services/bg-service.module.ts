import { Module } from '@nestjs/common';
import { EmailBackgroundService } from './email.background.service';
import { ProjectStatusBackgroundService } from './project-status.background.service';
import { BackgroundServiceManager } from './background-service.manager';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [EmailModule, PrismaModule],
    providers: [
        EmailBackgroundService,
        ProjectStatusBackgroundService,
        BackgroundServiceManager,
    ],
    exports: [BackgroundServiceManager],
})
export class BackgroundServicesModule {}