import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as express from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Rate limiting
  app.use(
    '/api/auth/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 50,
      message: JSON.stringify({ message: 'Too many login attempts, please try again later.', code: 'RATE_LIMIT' }),
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(
    '/api/auth/register',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: JSON.stringify({ message: 'Too many registration attempts, please try again later.', code: 'RATE_LIMIT' }),
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Request size limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Finance App API')
    .setDescription('API for finance management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
