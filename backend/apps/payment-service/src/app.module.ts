import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [HealthController, PaymentController],
  providers: [PaymentService, PrismaService]
})
export class AppModule {}