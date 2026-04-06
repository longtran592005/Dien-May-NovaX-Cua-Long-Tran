import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [HealthController, PaymentController],
  providers: [PaymentService]
})
export class AppModule {}