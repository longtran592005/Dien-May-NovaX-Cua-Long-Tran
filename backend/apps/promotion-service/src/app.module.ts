import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PromotionController } from './promotion.controller';
import { PromotionService } from './promotion.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [HealthController, PromotionController],
  providers: [PromotionService, PrismaService]
})
export class AppModule {}
