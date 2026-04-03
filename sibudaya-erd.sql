-- PostgreSQL Schema for Sibudaya-be
-- Generated from Prisma schema for ERD conversion

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    no_telp VARCHAR(20),
    address TEXT
);

-- Cultural institutions table
CREATE TABLE lembaga_budaya (
    lembaga_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    nama_lembaga VARCHAR(255) NOT NULL,
    jenis_kesenian VARCHAR(50) NOT NULL,
    alamat TEXT NOT NULL,
    no_hp VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- NIK certificate table
CREATE TABLE sertifikat_nik (
    nik_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lembaga_id UUID UNIQUE NOT NULL,
    nomor_nik VARCHAR(100) UNIQUE NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    tanggal_terbit DATE NOT NULL,
    tanggal_berlaku_sampai DATE NOT NULL,
    status_verifikasi VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    catatan_admin TEXT,
    FOREIGN KEY (lembaga_id) REFERENCES lembaga_budaya(lembaga_id) ON DELETE CASCADE
);

-- Types of facilitation table
CREATE TABLE jenis_fasilitasi (
    jenis_fasilitasi_id INTEGER PRIMARY KEY,
    nama VARCHAR(50) UNIQUE NOT NULL,
    deskripsi TEXT,
    template_proposal_file VARCHAR(255),
    template_laporan_file VARCHAR(255)
);

-- Facilitation packages table
CREATE TABLE paket_fasilitasi (
    paket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jenis_fasilitasi_id INTEGER NOT NULL,
    nama_paket VARCHAR(100) NOT NULL,
    kuota INTEGER NOT NULL,
    nilai_bantuan DECIMAL(18, 2),
    catatan TEXT,
    FOREIGN KEY (jenis_fasilitasi_id) REFERENCES jenis_fasilitasi(jenis_fasilitasi_id) ON DELETE CASCADE
);

-- Applications/submissions table
CREATE TABLE pengajuan (
    pengajuan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lembaga_id UUID NOT NULL,
    jenis_fasilitasi_id INTEGER NOT NULL,
    paket_id UUID,
    jenis_kegiatan VARCHAR(100),
    -- Pentas (performance) fields
    judul_kegiatan VARCHAR(255),
    tujuan_kegiatan TEXT,
    lokasi_kegiatan VARCHAR(255),
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    total_pengajuan_dana DECIMAL(18, 2),
    nomor_rekening VARCHAR(100),
    nama_pemegang_rekening VARCHAR(255),
    nama_bank VARCHAR(100),
    -- Hibah (grant) fields
    nama_penerima VARCHAR(255),
    alamat_pengiriman TEXT,
    provinsi VARCHAR(100),
    kabupaten_kota VARCHAR(100),
    kecamatan VARCHAR(100),
    kelurahan_desa VARCHAR(100),
    kode_pos VARCHAR(10),
    -- Documents
    proposal_file VARCHAR(255) NOT NULL,
    sertifikat_nik_file VARCHAR(255),
    -- Status
    status VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    status_pemeriksaan VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    catatan_pemeriksaan TEXT,
    surat_penolakan_file VARCHAR(255),
    tanggal_pengajuan TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lembaga_id) REFERENCES lembaga_budaya(lembaga_id) ON DELETE CASCADE,
    FOREIGN KEY (jenis_fasilitasi_id) REFERENCES jenis_fasilitasi(jenis_fasilitasi_id),
    FOREIGN KEY (paket_id) REFERENCES paket_fasilitasi(paket_id)
);

-- Approval letter table
CREATE TABLE surat_persetujuan (
    surat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID UNIQUE NOT NULL,
    nomor_surat VARCHAR(100),
    file_path VARCHAR(255) NOT NULL,
    tanggal_terbit DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    tanggal_konfirmasi TIMESTAMP,
    FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(pengajuan_id) ON DELETE CASCADE
);

-- Field survey table
CREATE TABLE survey_lapangan (
    survey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID UNIQUE NOT NULL,
    tanggal_survey DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    catatan TEXT,
    FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(pengajuan_id) ON DELETE CASCADE
);

-- Activity report table
CREATE TABLE laporan_kegiatan (
    laporan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID UNIQUE NOT NULL,
    file_laporan VARCHAR(255),
    template_file VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    catatan_admin TEXT,
    tanggal_upload TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(pengajuan_id) ON DELETE CASCADE
);

-- Fund disbursement table
CREATE TABLE pencairan_dana (
    pencairan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID UNIQUE NOT NULL,
    bukti_transfer VARCHAR(255),
    tanggal_pencairan DATE,
    total_dana DECIMAL(18, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(pengajuan_id) ON DELETE CASCADE
);

-- Equipment/facility delivery table
CREATE TABLE pengiriman_sarana (
    pengiriman_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID UNIQUE NOT NULL,
    tanggal_pengiriman DATE,
    bukti_pengiriman VARCHAR(255),
    catatan TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DALAM_PROSES',
    FOREIGN KEY (pengajuan_id) REFERENCES pengajuan(pengajuan_id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE notifikasi (
    notifikasi_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    judul VARCHAR(255) NOT NULL,
    pesan TEXT NOT NULL,
    status_baca BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_lembaga_budaya_user_id ON lembaga_budaya(user_id);
CREATE INDEX idx_sertifikat_nik_lembaga_id ON sertifikat_nik(lembaga_id);
CREATE INDEX idx_pengajuan_lembaga_id ON pengajuan(lembaga_id);
CREATE INDEX idx_pengajuan_jenis_fasilitasi_id ON pengajuan(jenis_fasilitasi_id);
CREATE INDEX idx_pengajuan_paket_id ON pengajuan(paket_id);
CREATE INDEX idx_pengajuan_status ON pengajuan(status);
CREATE INDEX idx_notifikasi_user_id ON notifikasi(user_id);
CREATE INDEX idx_notifikasi_status_baca ON notifikasi(status_baca);
