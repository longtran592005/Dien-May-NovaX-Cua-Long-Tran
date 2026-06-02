import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PrismaService } from './prisma.service';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  controllers: [HealthController, CatalogController, PricingController],
  providers: [CatalogService, PricingService, PrismaService]
})
export class AppModule {}