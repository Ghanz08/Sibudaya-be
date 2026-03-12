/*
  Warnings:

  - You are about to drop the column `total_dana` on the `pengiriman_sarana` table. All the data in the column will be lost.
  - Added the required column `jenis_fasilitasi_id` to the `pengajuan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pengajuan" DROP CONSTRAINT "pengajuan_paket_id_fkey";

-- DropIndex
DROP INDEX "surat_persetujuan_nomor_surat_key";

-- AlterTable
ALTER TABLE "jenis_fasilitasi" ADD COLUMN     "deskripsi" TEXT,
ALTER COLUMN "nama" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "laporan_kegiatan" ADD COLUMN     "template_file" VARCHAR(255),
ALTER COLUMN "file_laporan" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DALAM_PROSES',
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "pencairan_dana" ALTER COLUMN "bukti_transfer" DROP NOT NULL,
ALTER COLUMN "tanggal_pencairan" DROP NOT NULL,
ALTER COLUMN "total_dana" DROP NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "pengajuan" ADD COLUMN     "catatan_pemeriksaan" TEXT,
ADD COLUMN     "jenis_fasilitasi_id" INTEGER NOT NULL,
ADD COLUMN     "jenis_kegiatan" VARCHAR(100),
ADD COLUMN     "kabupaten_kota" VARCHAR(100),
ADD COLUMN     "kecamatan" VARCHAR(100),
ADD COLUMN     "kelurahan_desa" VARCHAR(100),
ADD COLUMN     "kode_pos" VARCHAR(10),
ADD COLUMN     "nama_pemegang_rekening" VARCHAR(255),
ADD COLUMN     "nama_penerima" VARCHAR(255),
ADD COLUMN     "provinsi" VARCHAR(100),
ADD COLUMN     "status_pemeriksaan" VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
ADD COLUMN     "surat_penolakan_file" VARCHAR(255),
ALTER COLUMN "paket_id" DROP NOT NULL,
ALTER COLUMN "total_pengajuan_dana" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DALAM_PROSES',
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "pengiriman_sarana" DROP COLUMN "total_dana",
ADD COLUMN     "bukti_pengiriman" VARCHAR(255),
ADD COLUMN     "catatan" TEXT,
ALTER COLUMN "tanggal_pengiriman" DROP NOT NULL,
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "surat_persetujuan" ADD COLUMN     "status" VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
ADD COLUMN     "tanggal_konfirmasi" TIMESTAMP(3),
ALTER COLUMN "nomor_surat" DROP NOT NULL;

-- CreateTable
CREATE TABLE "survey_lapangan" (
    "survey_id" UUID NOT NULL,
    "pengajuan_id" UUID NOT NULL,
    "tanggal_survey" DATE NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    "catatan" TEXT,

    CONSTRAINT "survey_lapangan_pkey" PRIMARY KEY ("survey_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "survey_lapangan_pengajuan_id_key" ON "survey_lapangan"("pengajuan_id");

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_jenis_fasilitasi_id_fkey" FOREIGN KEY ("jenis_fasilitasi_id") REFERENCES "jenis_fasilitasi"("jenis_fasilitasi_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_fasilitasi"("paket_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_lapangan" ADD CONSTRAINT "survey_lapangan_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan"("pengajuan_id") ON DELETE CASCADE ON UPDATE CASCADE;
