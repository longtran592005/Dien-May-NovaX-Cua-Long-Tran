import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GatewayController } from './gateway.controller';

@Module({
  controllers: [HealthController, GatewayController]
})
export class AppModule {}