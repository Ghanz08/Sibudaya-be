-- Normalize status defaults and existing data to DALAM_PROSES

-- AlterTable
ALTER TABLE "pencairan_dana" ALTER COLUMN "status" SET DEFAULT 'DALAM_PROSES';

-- AlterTable
ALTER TABLE "pengiriman_sarana" ALTER COLUMN "status" SET DEFAULT 'DALAM_PROSES';

-- Update existing data
UPDATE "pencairan_dana"
SET "status" = 'DALAM_PROSES'
WHERE "status" IN ('PROSES', 'MENUNGGU_KONFIRMASI');

-- Update existing data
UPDATE "pengiriman_sarana"
SET "status" = 'DALAM_PROSES'
WHERE "status" = 'PROSES';
