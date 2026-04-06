import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || '4050');
  await app.listen(port);
  console.log('payment-service listening on port ' + port);
}

void bootstrap();