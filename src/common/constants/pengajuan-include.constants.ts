export const PENGAJUAN_INCLUDE_LIST_BASIC = {
  jenis_fasilitasi: true,
  paket_fasilitasi: true,
} as const;

export const PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA = {
  jenis_fasilitasi: true,
  paket_fasilitasi: true,
  lembaga_budaya: true,
} as const;

export const PENGAJUAN_INCLUDE_DETAIL_USER = {
  lembaga_budaya: { include: { users: true } },
  jenis_fasilitasi: true,
  paket_fasilitasi: true,
  surat_persetujuan: true,
  survey_lapangan: true,
  laporan_kegiatan: true,
  pencairan_dana: true,
  pengiriman_sarana: true,
} as const;

export const PENGAJUAN_INCLUDE_OWNED_USER = {
  lembaga_budaya: true,
  surat_persetujuan: true,
  pengiriman_sarana: true,
  laporan_kegiatan: true,
} as const;

export const PENGAJUAN_INCLUDE_ADMIN_LIST = {
  lembaga_budaya: { include: { sertifikat_nik: true } },
  jenis_fasilitasi: true,
  paket_fasilitasi: true,
} as const;

export const PENGAJUAN_INCLUDE_ADMIN_DETAIL = {
  lembaga_budaya: { include: { users: true, sertifikat_nik: true } },
  jenis_fasilitasi: true,
  paket_fasilitasi: true,
  surat_persetujuan: true,
  survey_lapangan: true,
  laporan_kegiatan: true,
  pencairan_dana: true,
  pengiriman_sarana: true,
} as const;
