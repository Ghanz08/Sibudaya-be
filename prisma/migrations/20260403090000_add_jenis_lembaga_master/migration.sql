-- Master data jenis lembaga untuk pengaturan admin fasilitasi.
CREATE TABLE "jenis_lembaga" (
    "jenis_lembaga_id" SERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jenis_lembaga_pkey" PRIMARY KEY ("jenis_lembaga_id")
);

CREATE UNIQUE INDEX "jenis_lembaga_nama_key" ON "jenis_lembaga"("nama");
