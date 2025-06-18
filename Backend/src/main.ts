import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with more detailed configuration
  app.enableCors({
    origin: [
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'http://127.0.0.1:5503',
      'http://127.0.0.1:5502',
      'http://127.0.0.1:5504',
      'http://127.0.0.1:5505',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:63342',
      'http://localhost:63342',
      'http://127.0.0.1:63344',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });
  // Add global logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
  });
  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
bootstrap();
