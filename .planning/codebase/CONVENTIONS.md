# CONVENTIONS

## Coding Style
- TypeScript throughout backend.
- Uses NestJS idioms: decorators, DI constructor injection, module boundaries.
- Uses explicit exception classes for business errors.
- Mixed but generally clear bilingual comments/messages (Bahasa Indonesia for domain-facing messages).

## API Layer Conventions
- Swagger decorators used extensively on controllers (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`).
- Protected routes apply guards declaratively (`@UseGuards(JwtAuthGuard, RolesGuard)`).
- Role authorization expressed with `@Roles(...)` custom decorator.

## DTO and Validation Conventions
- DTO classes used for payload contract and validation.
- Global `ValidationPipe` enabled with `whitelist: true`, `transform: true`.
- `forbidNonWhitelisted` intentionally disabled to support multipart scenarios.

## Service Composition Conventions
- Simple features keep logic in one `*.service.ts`.
- Complex features decompose into service slices under `services/`.
- Delegator services used as facades (example: `src/pengajuan/pengajuan.service.ts`).

## Persistence Conventions
- Prisma is the only persistence access path.
- Reused include objects extracted into constants (`src/common/constants/pengajuan-include.constants.ts`).
- Status values centralized in constants object (`src/common/constants/status.constants.ts`).

## Upload/File Handling Conventions
- Upload interceptor per route with explicit storage target and file filter.
- File path normalization converts `\\` to `/` before persistence.
- Existing files are deleted before replacement to reduce orphan artifacts.

## Error and Response Conventions
- Global HTTP exception filter provides unified error shape with:
  - `success`
  - `statusCode`
  - `message`
  - `path`
  - `timestamp`
- Business rule failures prefer descriptive domain-specific messages.

## Security Conventions
- Access token and refresh token handled separately.
- Refresh token validation happens server-side before issuing new access token.
- Throttling globally enabled and route-level tighter limits for auth endpoints.

## Notable Inconsistencies
- Some path handling still uses `process.cwd() + '/'` string replacement, which is platform-sensitive.
- A few `as any` casts exist around JWT expiry config in auth module.
