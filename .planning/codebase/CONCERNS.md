# CONCERNS

## 1) Cross-Platform File Path Fragility
- Several services compute relative upload paths by replacing `process.cwd() + '/'` in destination strings.
- On Windows, separators differ (`\\`), risking malformed path persistence.
- Files to review:
  - `src/admin/pengajuan/admin-pengajuan.service.ts`
  - `src/lembaga/lembaga.service.ts`
  - `src/admin/fasilitasi/admin-fasilitasi.service.ts`

## 2) Business Workflow Complexity With Limited Tests
- Core workflow has many state transitions (`DALAM_PROSES`, `DISETUJUI`, `DITOLAK`, `SELESAI`) across multiple entities.
- Limited automated tests for admin workflow services increase regression risk.
- High-risk areas:
  - `src/admin/pengajuan/services/*`
  - `src/pengajuan/services/*`

## 3) Potential Orphaned Upload Artifacts
- Files are stored on local disk and manually deleted on replace in selected paths.
- Not all lifecycle paths are guaranteed to clean up files on hard-delete or rollback scenarios.
- No centralized garbage collector for stale files detected.

## 4) Local-Disk Storage Scalability
- Upload storage is tied to local filesystem under app root.
- Horizontal scaling or stateless deployment will require shared/object storage migration.

## 5) Config and Secret Hygiene Risk
- README and `.env.example` include realistic secret-like examples and default admin credentials guidance.
- Operational risk if teams reuse sample values in non-local environments.

## 6) Type Safety Weak Spots
- At least one explicit `as any` cast in JWT expiry config in auth module.
- Could mask config type errors at compile time.

## 7) Domain Coupling Through Literal IDs
- `jenis_fasilitasi_id` uses literal IDs (1 = Pentas, 2 = Hibah) in multiple decision points.
- Coupling risk if master data changes unexpectedly.
- Partial mitigation exists via constants, but literals still appear in service logic.

## 8) E2E Scope Is Very Narrow
- Existing e2e validates root endpoint only.
- No end-to-end verification for auth, upload, and pengajuan workflow.

## 9) Migration/Seed Drift Risk
- Many migrations and evolving schema complexity.
- Need disciplined backward compatibility checks for DTOs and frontend contracts.

## Recommended Hardening Sequence
1. Standardize path handling using `path.relative()` helper everywhere.
2. Add workflow transition tests for admin and user pengajuan flows.
3. Add file lifecycle audit (create/replace/delete/rollback) and cleanup strategy.
4. Expand e2e suite for auth + one happy-path + one rejection-path workflow.
