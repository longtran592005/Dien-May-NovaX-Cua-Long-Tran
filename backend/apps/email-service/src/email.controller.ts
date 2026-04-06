import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

interface SendEmailDto {
  to: string;
  subject: string;
  template: 'otp' | 'password-reset' | 'welcome';
  variables?: Record<string, string | number>;
}

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  async send(@Body() payload: SendEmailDto) {
    if (!payload.to || !payload.subject || !payload.template) {
      throw new BadRequestException('Missing required email fields');
    }

    return this.emailService.sendTemplateEmail(payload);
  }
}
