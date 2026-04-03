-- Add status field to jenis_fasilitasi for enable/disable functionality.
-- Default to 'ACTIVE' to maintain backward compatibility with existing records.
ALTER TABLE "jenis_fasilitasi"
ADD COLUMN "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
