import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';

@Module({
  imports: [],
  controllers: [SearchController, HealthController],
  providers: [SearchService, PrismaService]
})
export class AppModule {}
