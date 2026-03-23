import { BadRequestException, Injectable } from '@nestjs/common';
import { STATUS } from '../../common/constants/status.constants';

@Injectable()
export class PengajuanAssertionService {
  assertCanRevise(statusPemeriksaan: string) {
    if (statusPemeriksaan !== STATUS.DITOLAK) {
      throw new BadRequestException(
        'Perbarui atau batalkan pengajuan hanya bisa setelah pemeriksaan ditolak',
      );
    }
  }

  assertLaporanUnlocked(pengajuan: {
    jenis_fasilitasi_id: number;
    surat_persetujuan?: { status?: string | null } | null;
    pengiriman_sarana?: { status?: string | null } | null;
  }) {
    if (pengajuan.jenis_fasilitasi_id === 1) {
      if (pengajuan.surat_persetujuan?.status !== STATUS.SELESAI) {
        throw new BadRequestException(
          'Tahap Surat Persetujuan belum selesai. Upload laporan belum diizinkan.',
        );
      }
      return;
    }

    if (pengajuan.pengiriman_sarana?.status !== STATUS.SELESAI) {
      throw new BadRequestException(
        'Tahap Pengiriman Sarana Prasarana belum selesai. Upload laporan belum diizinkan.',
      );
    }
  }
}
