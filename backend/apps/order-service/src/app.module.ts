import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [HealthController, OrderController],
  providers: [OrderService, PrismaService]
})
export class AppModule {}