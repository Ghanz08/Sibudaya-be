# STRUCTURE

## Top-Level Layout
- `src/`: main backend source.
- `prisma/`: schema, migrations, and seed.
- `test/`: e2e configuration and smoke e2e test.
- `docs/`: project docs (includes sequence diagrams).
- `uploads/`: runtime file storage buckets.

## Source Directory Overview
- `src/main.ts`: bootstrap and platform setup.
- `src/app.module.ts`: module composition root.
- `src/auth/`: auth controllers, strategies, guards, decorators, DTOs.
- `src/admin/`: admin-facing API domains:
  - `pengajuan/`
  - `fasilitasi/`
  - `pengaturan-akun/`
- `src/pengajuan/`: user-facing pengajuan flow and workflow services.
- `src/lembaga/`: lembaga profile and sertifikat handling.
- `src/fasilitasi/`: public facilitation list endpoints.
- `src/notifikasi/`: notification behavior.
- `src/mail/`: email delivery integration.
- `src/common/`: shared constants, filters, upload utilities.
- `src/prisma/`: Prisma service/module wrappers.
- `src/generated/prisma/`: generated client output.

## Pattern for Feature Organization
- Most features use the pattern:
  - `*.module.ts`
  - `*.controller.ts`
  - `*.service.ts`
  - `dto/`
- More complex features split orchestration into `services/` subfolder.

## Database Artifacts
- `prisma/schema.prisma`: canonical schema.
- `prisma/migrations/*`: historical schema migrations.
- `prisma/seed.ts`: bootstrap seed data.

## Test File Placement
- Unit tests colocated in `src/**` with `*.spec.ts` suffix.
- E2E tests in `test/*.e2e-spec.ts`.

## Naming Conventions (Observed)
- Files: kebab-case for domain names and service files.
- Constants: SCREAMING_SNAKE in exported objects.
- DTO classes grouped by action (`create-*`, `update-*`, route-specific DTOs).

## Operations and Build Files
- `package.json`: scripts for build/start/test/db lifecycle.
- `eslint.config.mjs`: lint config.
- `tsconfig*.json`: TypeScript compilation config.
- `nest-cli.json`: Nest build tooling config.

## Note on Upload Paths
- Upload folders are explicit and constrained in `src/common/upload/multer-storage.util.ts` via `UploadFolder` union.
