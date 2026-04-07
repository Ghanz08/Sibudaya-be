-- DropIndex
DROP INDEX "sertifikat_nik_lembaga_id_key";

-- CreateIndex
CREATE INDEX "sertifikat_nik_lembaga_id_idx" ON "sertifikat_nik"("lembaga_id");
