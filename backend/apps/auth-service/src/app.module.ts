import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [HealthController, AuthController],
  providers: [AuthService, PrismaService]
})
export class AppModule {}