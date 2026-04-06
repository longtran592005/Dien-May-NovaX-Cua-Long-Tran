import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CartController } from './cart.controller';

@Module({
  controllers: [HealthController, CartController]
})
export class AppModule {}