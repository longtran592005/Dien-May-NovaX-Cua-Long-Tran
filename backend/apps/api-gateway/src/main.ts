import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
    credentials: true
  });
  app.setGlobalPrefix('api/v1');
  const port = Number(process.env.PORT || '3000');
  await app.listen(port);
  console.log('api-gateway listening on port ' + port);
}

void bootstrap();