# STACK

## Runtime and Language
- Language: TypeScript
- Runtime: Node.js (NestJS backend)
- Module system: CommonJS output via Nest build defaults
- Package manager: pnpm (`pnpm-lock.yaml` present)

## Core Framework
- NestJS v11 as application framework (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`)
- API docs with Swagger (`@nestjs/swagger`)
- Security and traffic guardrails:
  - HTTP headers hardening with `helmet`
  - Rate limiting with `@nestjs/throttler`
- Global request validation with `ValidationPipe`

## Data Layer
- ORM: Prisma v7 (`prisma` + `@prisma/client`)
- Database adapter: `@prisma/adapter-pg`
- Database engine: PostgreSQL (`pg`)
- Prisma Client generated to `src/generated/prisma` (see `prisma/schema.prisma`)

## Auth and Identity
- Passport-based auth (`passport`, `@nestjs/passport`)
- JWT auth (`@nestjs/jwt`, `passport-jwt`)
- Local login (`passport-local`)
- Google OAuth 2.0 (`passport-google-oauth20`)
- Password hashing: `bcryptjs`

## API and Validation
- DTO validation: `class-validator`
- DTO transform: `class-transformer`
- OpenAPI docs mounted at `/api/docs`
- Global API prefix: `/api/v1`

## File Upload and Static Serving
- Upload middleware: `multer`
- Static files served from local `uploads/` via `ServeStaticModule`
- Upload domains observed: proposal, sertifikat, surat, laporan, pencairan, pengiriman, penolakan, template

## Build and Tooling
- Build: `nest build`
- Dev run: `nest start --watch`
- Linting: ESLint v9 + Prettier plugin
- Formatting: Prettier
- Test runner: Jest + ts-jest

## Key Config Files
- `package.json`
- `nest-cli.json`
- `tsconfig.json`, `tsconfig.build.json`
- `eslint.config.mjs`
- `prisma/schema.prisma`
- `test/jest-e2e.json`
