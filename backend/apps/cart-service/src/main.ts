import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || '4030');
  await app.listen(port);
  console.log('cart-service listening on port ' + port);
}

void bootstrap();