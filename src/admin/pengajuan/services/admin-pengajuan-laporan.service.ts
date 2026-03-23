import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { STATUS } from '../../../common/constants/status.constants';
import { AdminPengajuanNotifierService } from './admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './admin-pengajuan-query.service';
import { TolakLaporanDto } from '../dto/admin-pengajuan.dto';

/** Handles Laporan Kegiatan workflow (Step 5) for both Pentas & Hibah */
@Injectable()
export class AdminPengajuanLaporanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: AdminPengajuanQueryService,
    private readonly notifierService: AdminPengajuanNotifierService,
  ) {}

  async setujui(pengajuanId: string) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);

    if (!pengajuan.laporan_kegiatan) {
      throw new BadRequestException(
        'Pemohon belum mengunggah laporan kegiatan',
      );
    }
    if (pengajuan.laporan_kegiatan.status !== STATUS.DALAM_PROSES) {
      throw new BadRequestException('Laporan sudah diproses sebelumnya');
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    await this.prisma.laporan_kegiatan.update({
      where: { pengajuan_id: pengajuanId },
      data: { status: STATUS.DISETUJUI },
    });

    // For Pentas: create pencairan_dana record; for Hibah: mark pengajuan SELESAI
    if (pengajuan.jenis_fasilitasi_id === 1) {
      await this.prisma.pencairan_dana.upsert({
        where: { pengajuan_id: pengajuanId },
        create: { pengajuan_id: pengajuanId, status: STATUS.DALAM_PROSES },
        update: {},
      });

      await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
        userId,
        'Laporan Kegiatan Disetujui',
        'Laporan kegiatan Anda telah diverifikasi. Proses pencairan dana akan segera dilakukan.',
      );
    } else {
      // Hibah — selesai
      await this.prisma.pengajuan.update({
        where: { pengajuan_id: pengajuanId },
        data: { status: STATUS.SELESAI },
      });

      await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
        userId,
        'Pengajuan Selesai',
        'Laporan kegiatan telah diverifikasi. Proses fasilitasi hibah Anda dinyatakan selesai.',
      );
    }

    return { message: 'Laporan disetujui' };
  }

  async tolak(pengajuanId: string, dto: TolakLaporanDto) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);

    if (!pengajuan.laporan_kegiatan) {
      throw new BadRequestException(
        'Pemohon belum mengunggah laporan kegiatan',
      );
    }
    if (pengajuan.laporan_kegiatan.status !== STATUS.DALAM_PROSES) {
      throw new BadRequestException('Laporan sudah diproses sebelumnya');
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    await this.prisma.laporan_kegiatan.update({
      where: { pengajuan_id: pengajuanId },
      data: { status: STATUS.DITOLAK, catatan_admin: dto.catatan_admin },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Laporan Kegiatan Ditolak',
      `Laporan kegiatan Anda perlu diperbaiki. Alasan: ${dto.catatan_admin}`,
    );

    return { message: 'Laporan ditolak' };
  }
}
