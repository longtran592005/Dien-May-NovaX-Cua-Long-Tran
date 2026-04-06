import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || '4040');
  await app.listen(port);
  console.log('order-service listening on port ' + port);
}

void bootstrap();