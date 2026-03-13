export const STATUS = {
  BELUM_TERSEDIA: 'BELUM_TERSEDIA',
  DALAM_PROSES: 'DALAM_PROSES',
  DISETUJUI: 'DISETUJUI',
  DITOLAK: 'DITOLAK',
  SELESAI: 'SELESAI',
} as const;

export type StatusValue = (typeof STATUS)[keyof typeof STATUS];
