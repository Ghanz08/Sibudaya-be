import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

type CorsCallback = (err: Error | null, allow?: boolean) => void;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');

  // Aktifkan validasi global (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip field yang tidak ada di DTO
      forbidNonWhitelisted: false, // jangan error untuk file upload fields (proposal_file, dll)
      transform: true,
    }),
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  });

  // CORS
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsCallback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
  });

  // Prefix global API
  app.setGlobalPrefix('api/v1');

  // ─── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Sistem Informasi Layanan Fasilitasi Lembaga Budaya')
    .setDescription('API Documentation — PAD2 Backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan access_token dari response login',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Token tidak hilang saat refresh halaman
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`\n🚀 Server   : ${await app.getUrl()}`);
  console.log(`📄 Swagger  : ${await app.getUrl()}/api/docs\n`);
}
void bootstrap();
