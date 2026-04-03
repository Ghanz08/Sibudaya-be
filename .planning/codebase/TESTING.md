# TESTING

## Test Stack
- Framework: Jest
- TypeScript transform: `ts-jest`
- HTTP integration testing: `supertest`
- Nest test utilities: `@nestjs/testing`

## Test Types Present
- Unit tests colocated in source:
  - `src/app.controller.spec.ts`
  - `src/prisma/prisma.service.spec.ts`
  - `src/pengajuan/pengajuan.service.spec.ts`
  - `src/pengajuan/dto/create-pengajuan.dto.spec.ts`
- E2E smoke test:
  - `test/app.e2e-spec.ts`

## Configuration
- Unit test config embedded in `package.json` (`jest` field).
- E2E config in `test/jest-e2e.json`.
- Script commands:
  - `pnpm test`
  - `pnpm test:watch`
  - `pnpm test:cov`
  - `pnpm test:e2e`

## Current Coverage Characteristics
- Positive:
  - Delegation behavior covered for `PengajuanService` facade.
  - DTO validation behavior explicitly tested for required field (`nama_bank`).
  - Basic app controller behavior smoke-tested.
- Gaps:
  - Minimal coverage for high-risk business workflows (admin approval, timeline transitions, quota management).
  - Limited negative-path and transaction behavior testing.
  - Prisma integration behavior mostly unverified beyond service definition test.

## Mocking Pattern
- Service dependencies mocked with object literals + `jest.fn()`.
- Integration-level persistence behavior largely not mocked with factories, indicating room for stronger test fixtures.

## Suggested Next Test Priorities
- Workflow state machine tests for `pengajuan` and `admin/pengajuan` transitions.
- File upload edge cases:
  - invalid mime
  - missing file
  - replacement cleanup
- Authorization matrix tests (USER vs ADMIN vs SUPER_ADMIN).
- Database transaction tests for coupled updates (`$transaction` paths).

## CI Signal Quality (Observed)
- Test scripts are available, but no explicit CI config observed in scanned files.
