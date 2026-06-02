import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = process.env.SEARCH_SERVICE_PORT || 4070;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  console.log(`Search Service running on port ${PORT}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start search service:', err);
  process.exit(1);
});
