import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [ShippingController, HealthController],
  providers: [ShippingService, PrismaService]
})
export class AppModule {}
