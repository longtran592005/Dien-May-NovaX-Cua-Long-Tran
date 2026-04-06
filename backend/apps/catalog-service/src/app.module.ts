import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [HealthController, CatalogController],
  providers: [CatalogService, PrismaService]
})
export class AppModule {}