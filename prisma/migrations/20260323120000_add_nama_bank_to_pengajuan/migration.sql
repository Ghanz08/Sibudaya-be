-- Add nama_bank for pentas submissions.
-- Nullable to keep backward compatibility for existing pengajuan rows.
ALTER TABLE "pengajuan"
ADD COLUMN "nama_bank" VARCHAR(100);
