import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || '4060');
  await app.listen(port);
  console.log('ai-service listening on port ' + port);
}

void bootstrap();