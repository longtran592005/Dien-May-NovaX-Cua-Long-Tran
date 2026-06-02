import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.EMAIL_SERVICE_PORT || '4080');
  await app.listen(port);
  console.log('email-service listening on port ' + port);
}

void bootstrap();
