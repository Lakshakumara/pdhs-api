import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:4200', credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // ← required for @TransformDate() to work
    whitelist: true,
  }));

  // Serve Angular static files from the 'client' folder.
  // NestJS API routes take priority because they are registered first.
  const clientPath = join(__dirname, '..', '..', 'client');
  app.use(express.static(clientPath));

  // SPA fallback: for any non-/api route, serve index.html so Angular
  // router can handle client-side navigation (deep links, page reloads).
  app.use((req: any, res: any, next: any) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(clientPath, 'index.html'));
    } else {
      next();
    }
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
