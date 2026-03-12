import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan validasi global (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip field yang tidak ada di DTO
      forbidNonWhitelisted: false, // jangan error untuk file upload fields (proposal_file, dll)
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
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
bootstrap();
