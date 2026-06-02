import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true
  });
  const port = Number(process.env.PORT || '4100');
  await app.listen(port);
  console.log('promotion-service listening on port ' + port);
}

void bootstrap();
