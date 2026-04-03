# INTEGRATIONS

## Database
- PostgreSQL via Prisma adapter:
  - Prisma datasource uses `provider = "postgresql"`
  - Runtime connection from `DATABASE_URL`
- Main wiring:
  - `src/prisma/prisma.service.ts`
  - `prisma/schema.prisma`

## Authentication Providers
- Local auth (email/password):
  - `src/auth/strategies/local.strategy.ts`
  - `src/auth/auth.service.ts`
- JWT tokens:
  - Access and refresh token generation in `src/auth/auth.service.ts`
  - JWT strategy in `src/auth/strategies/jwt.strategy.ts`
- Google OAuth 2.0:
  - Strategy in `src/auth/strategies/google.strategy.ts`
  - Endpoints in `src/auth/auth.controller.ts` (`/auth/google`, `/auth/google/callback`)

## Email Provider
- Resend SDK dependency (`resend`)
- Password reset flow triggers outbound email from mail module:
  - `src/mail/mail.service.ts`
  - `src/auth/auth.service.ts` (`forgotPassword`)

## Frontend / Browser Integration
- CORS allowlist from `FRONTEND_URL` env (comma-separated supported)
- Credentials enabled (`app.enableCors({ credentials: true })`)
- API served under `/api/v1` for frontend consumption

## File Storage Integration
- Current storage is local filesystem under project `uploads/`
- Static exposure at `/uploads/*` via Nest `ServeStaticModule`
- Upload utility APIs:
  - `src/common/upload/multer-storage.util.ts`
  - `src/common/upload/upload.service.ts`

## API Documentation Consumers
- Swagger UI endpoint: `/api/docs`
- Uses bearer auth schema named `access-token`

## Developer and QA Integrations
- Postman collection files exist in repo root:
  - `postman_collection.json`
- ERD SQL file for schema reference:
  - `sibudaya-erd.sql`

## Environment Variables (Not Exhaustive)
- Database: `DATABASE_URL`
- App: `PORT`, `FRONTEND_URL`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Email: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

## Notes
- No external object storage integration detected (S3/GCS/etc.); uploads are local disk based.
- No queue/broker integration detected (Redis/Kafka/RabbitMQ).
