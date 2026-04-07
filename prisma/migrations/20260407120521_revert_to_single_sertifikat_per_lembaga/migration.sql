/*
  Warnings:

  - A unique constraint covering the columns `[lembaga_id]` on the table `sertifikat_nik` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "sertifikat_nik_lembaga_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "sertifikat_nik_lembaga_id_key" ON "sertifikat_nik"("lembaga_id");
