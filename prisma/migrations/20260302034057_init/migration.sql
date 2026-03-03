-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "lembaga_budaya" (
    "lembaga_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "nama_lembaga" VARCHAR(255) NOT NULL,
    "jenis_kesenian" VARCHAR(20) NOT NULL,
    "alamat" TEXT NOT NULL,
    "no_hp" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lembaga_budaya_pkey" PRIMARY KEY ("lembaga_id")
);

-- CreateTable
CREATE TABLE "sertifikat_nik" (
    "nik_id" UUID NOT NULL,
    "lembaga_id" UUID NOT NULL,
    "nomor_nik" VARCHAR(100) NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "tanggal_terbit" DATE NOT NULL,
    "tanggal_berlaku_sampai" DATE NOT NULL,
    "status_verifikasi" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "catatan_admin" TEXT,

    CONSTRAINT "sertifikat_nik_pkey" PRIMARY KEY ("nik_id")
);

-- CreateTable
CREATE TABLE "jenis_fasilitasi" (
    "jenis_fasilitasi_id" INTEGER NOT NULL,
    "nama" VARCHAR(20) NOT NULL,

    CONSTRAINT "jenis_fasilitasi_pkey" PRIMARY KEY ("jenis_fasilitasi_id")
);

-- CreateTable
CREATE TABLE "paket_fasilitasi" (
    "paket_id" UUID NOT NULL,
    "jenis_fasilitasi_id" INTEGER NOT NULL,
    "nama_paket" VARCHAR(100) NOT NULL,
    "kuota" INTEGER NOT NULL,
    "nilai_bantuan" DECIMAL(18,2),
    "catatan" TEXT,

    CONSTRAINT "paket_fasilitasi_pkey" PRIMARY KEY ("paket_id")
);

-- CreateTable
CREATE TABLE "pengajuan" (
    "pengajuan_id" UUID NOT NULL,
    "lembaga_id" UUID NOT NULL,
    "paket_id" UUID NOT NULL,
    "judul_kegiatan" VARCHAR(255),
    "tujuan_kegiatan" TEXT,
    "lokasi_kegiatan" VARCHAR(255),
    "tanggal_mulai" DATE,
    "tanggal_selesai" DATE,
    "total_pengajuan_dana" DECIMAL(18,2) NOT NULL,
    "nomor_rekening" VARCHAR(100),
    "alamat_pengiriman" TEXT,
    "proposal_file" VARCHAR(255) NOT NULL,
    "sertifikat_nik_file" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'DIPROSES',
    "tanggal_pengajuan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengajuan_pkey" PRIMARY KEY ("pengajuan_id")
);

-- CreateTable
CREATE TABLE "surat_persetujuan" (
    "surat_id" UUID NOT NULL,
    "pengajuan_id" UUID NOT NULL,
    "nomor_surat" VARCHAR(100) NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "tanggal_terbit" DATE NOT NULL,

    CONSTRAINT "surat_persetujuan_pkey" PRIMARY KEY ("surat_id")
);

-- CreateTable
CREATE TABLE "laporan_kegiatan" (
    "laporan_id" UUID NOT NULL,
    "pengajuan_id" UUID NOT NULL,
    "file_laporan" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DIPROSES',
    "catatan_admin" TEXT,
    "tanggal_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laporan_kegiatan_pkey" PRIMARY KEY ("laporan_id")
);

-- CreateTable
CREATE TABLE "pencairan_dana" (
    "pencairan_id" UUID NOT NULL,
    "pengajuan_id" UUID NOT NULL,
    "bukti_transfer" VARCHAR(255) NOT NULL,
    "tanggal_pencairan" DATE NOT NULL,
    "total_dana" DECIMAL(18,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PROSES',

    CONSTRAINT "pencairan_dana_pkey" PRIMARY KEY ("pencairan_id")
);

-- CreateTable
CREATE TABLE "pengiriman_sarana" (
    "pengiriman_id" UUID NOT NULL,
    "pengajuan_id" UUID NOT NULL,
    "tanggal_pengiriman" DATE NOT NULL,
    "total_dana" DECIMAL(18,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'PROSES',

    CONSTRAINT "pengiriman_sarana_pkey" PRIMARY KEY ("pengiriman_id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "notifikasi_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "pesan" TEXT NOT NULL,
    "status_baca" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("notifikasi_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lembaga_budaya_user_id_key" ON "lembaga_budaya"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sertifikat_nik_lembaga_id_key" ON "sertifikat_nik"("lembaga_id");

-- CreateIndex
CREATE UNIQUE INDEX "sertifikat_nik_nomor_nik_key" ON "sertifikat_nik"("nomor_nik");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_fasilitasi_nama_key" ON "jenis_fasilitasi"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "surat_persetujuan_pengajuan_id_key" ON "surat_persetujuan"("pengajuan_id");

-- CreateIndex
CREATE UNIQUE INDEX "surat_persetujuan_nomor_surat_key" ON "surat_persetujuan"("nomor_surat");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_kegiatan_pengajuan_id_key" ON "laporan_kegiatan"("pengajuan_id");

-- CreateIndex
CREATE UNIQUE INDEX "pencairan_dana_pengajuan_id_key" ON "pencairan_dana"("pengajuan_id");

-- CreateIndex
CREATE UNIQUE INDEX "pengiriman_sarana_pengajuan_id_key" ON "pengiriman_sarana"("pengajuan_id");

-- AddForeignKey
ALTER TABLE "lembaga_budaya" ADD CONSTRAINT "lembaga_budaya_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sertifikat_nik" ADD CONSTRAINT "sertifikat_nik_lembaga_id_fkey" FOREIGN KEY ("lembaga_id") REFERENCES "lembaga_budaya"("lembaga_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paket_fasilitasi" ADD CONSTRAINT "paket_fasilitasi_jenis_fasilitasi_id_fkey" FOREIGN KEY ("jenis_fasilitasi_id") REFERENCES "jenis_fasilitasi"("jenis_fasilitasi_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_lembaga_id_fkey" FOREIGN KEY ("lembaga_id") REFERENCES "lembaga_budaya"("lembaga_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan" ADD CONSTRAINT "pengajuan_paket_id_fkey" FOREIGN KEY ("paket_id") REFERENCES "paket_fasilitasi"("paket_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat_persetujuan" ADD CONSTRAINT "surat_persetujuan_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan"("pengajuan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_kegiatan" ADD CONSTRAINT "laporan_kegiatan_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan"("pengajuan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pencairan_dana" ADD CONSTRAINT "pencairan_dana_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan"("pengajuan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengiriman_sarana" ADD CONSTRAINT "pengiriman_sarana_pengajuan_id_fkey" FOREIGN KEY ("pengajuan_id") REFERENCES "pengajuan"("pengajuan_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
