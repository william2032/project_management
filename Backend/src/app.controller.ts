import { Controller, Get } from '@nestjs/common';
import { MailerService } from './mailer/mailer.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailerService,
  ) {}

  @Get('send-email')
  async sendTest() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await this.mailService.sendTestEmail('otwanemark254@gmail.com');
    return 'Email sent';
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
