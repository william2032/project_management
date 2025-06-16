import { Controller, Get } from '@nestjs/common';
import { MailService } from '../mailer/mailer.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get('send-email')
  async sendTest() {
    await this.mailService.sendTestEmail('otwanemark254@gmail.com');
    return 'Email sent';
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
