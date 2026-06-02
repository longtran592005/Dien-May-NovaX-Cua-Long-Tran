import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 4060;
  await app.listen(port);
  console.log(`[shipping-service] listening on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('[shipping-service] failed to start:', err);
  process.exit(1);
});
