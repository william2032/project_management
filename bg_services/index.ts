import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@backend/prisma/prisma.service';
import { EmailService } from '@backend/email/email.service';
import { BackgroundServiceManager } from './service-manager';
import { MailerService } from '@nestjs-modules/mailer';
import { createTransport } from 'nodemailer';

async function bootstrap() {
    const prisma = new PrismaService();
    const configService = new ConfigService();

    const mailerConfig = {
        host: configService.get<string>('MAIL_HOST'),
        port: configService.get<number>('MAIL_PORT'),
        user: configService.get<string>('MAIL_USER'),
        pass: configService.get<string>('MAIL_PASS'),
    };
    if (!mailerConfig.host || !mailerConfig.port || !mailerConfig.user || !mailerConfig.pass) {
        throw new Error('Mailer configuration is incomplete. Please check your environment variables.');
    }

    const transporter = createTransport({
        host: mailerConfig.host,
        port: mailerConfig.port,
        auth: {
            user: mailerConfig.user,
            pass: mailerConfig.pass,
        },
    });

    // Mock MailerService instance for direct usage (adjust as per your EmailService requirements)
    const mailerService = new MailerService({ transporter, defaults: { from: mailerConfig.user } } as any, null as any);

    const emailService = new EmailService(mailerService);
    const serviceManager = new BackgroundServiceManager(configService, prisma, emailService);

    // Handle shutdown gracefully
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received. Shutting down background services...');
        await serviceManager.stopAll();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        console.log('SIGINT received. Shutting down background services...');
        await serviceManager.stopAll();
        process.exit(0);
    });

    // Start all services
    await serviceManager.startAll();
}

bootstrap().catch(err => {
    console.error('Failed to start background services:', err);
    process.exit(1);
});