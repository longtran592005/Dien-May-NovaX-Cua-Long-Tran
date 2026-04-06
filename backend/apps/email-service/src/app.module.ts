import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  controllers: [HealthController, EmailController],
  providers: [EmailService]
})
export class AppModule {}
