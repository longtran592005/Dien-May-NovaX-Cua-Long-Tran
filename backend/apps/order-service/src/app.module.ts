import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [HealthController, OrderController],
  providers: [OrderService]
})
export class AppModule {}