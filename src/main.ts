import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
  transform: true,      // ← required for @TransformDate() to work
  whitelist: true,
}))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
