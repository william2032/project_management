import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  @Get('send-email')
  async sendTest() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return 'Email sent';
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
