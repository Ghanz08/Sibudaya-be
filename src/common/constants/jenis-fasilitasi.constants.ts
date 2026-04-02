export const JENIS_FASILITASI = {
  PENTAS: 1,
  HIBAH: 2,
} as const;

export const MANAGED_JENIS_FASILITASI_IDS: readonly number[] = [
  JENIS_FASILITASI.PENTAS,
  JENIS_FASILITASI.HIBAH,
];
