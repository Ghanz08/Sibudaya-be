# ARCHITECTURE

## Architecture Style
- Modular NestJS monolith.
- Feature modules grouped by domain (`auth`, `pengajuan`, `admin`, `fasilitasi`, `lembaga`, `notifikasi`, `mail`).
- Cross-cutting modules provided globally (`PrismaModule`, `UploadModule`).

## Entry Point and Bootstrapping
- Application bootstrap in `src/main.ts`.
- Boot steps:
  - Create app from `AppModule`
  - Global validation pipe
  - Helmet middleware
  - Global HTTP exception filter
  - HTTP request logging middleware
  - CORS allowlist parsing
  - Global prefix `/api/v1`
  - Swagger setup on `/api/docs`

## Composition Root
- `src/app.module.ts` imports major feature modules and infra modules.
- Global throttling guard is registered via `APP_GUARD`.

## Layering Pattern
- Controller layer: request/response mapping and decorators.
- Service layer: business rules and orchestration.
- Data access through Prisma client in services.
- DTO layer: validation and payload contracts.
- Guard/decorator layer: authentication + authorization.

## Domain Boundaries
- `auth`: register/login/refresh/reset password, role-based access helpers.
- `lembaga`: institution profile and certificate upload lifecycle.
- `fasilitasi`: public read endpoints for facilitation types and package lists.
- `pengajuan`: user submission, revision, laporan upload, status/timeline retrieval.
- `admin`: review and operational workflow for pengajuan plus facilitation master data.
- `notifikasi`: user and admin notifications.

## Internal Workflow Decomposition
- `pengajuan` and `admin/pengajuan` split logic into smaller services under `services/` folders.
- Example split in `pengajuan/services/*`:
  - submission
  - query
  - laporan
  - revision
  - assertion
  - notifier
  - timeline

## Data Flow (Typical)
- HTTP request -> Guard chain (JWT, Roles) -> Controller -> Domain service -> Prisma -> DB.
- File upload request -> Multer interceptor -> UploadService path handling -> DB path persistence.
- Domain events are represented as explicit service calls to notification service (not event bus based).

## Error Handling Strategy
- Domain errors via Nest exceptions (`BadRequestException`, `ConflictException`, etc.).
- Unified error response envelope by global catch-all filter in `src/common/filters/http-exception.filter.ts`.

## Security Controls
- Auth strategy and guards for identity.
- Role-based access via `@Roles` + `RolesGuard`.
- Throttling applied globally, with stricter route-level throttles on sensitive auth routes.
