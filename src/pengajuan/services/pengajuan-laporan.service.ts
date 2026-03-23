import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../common/upload/upload.service';
import { STATUS } from '../../common/constants/status.constants';
import { PengajuanAssertionService } from './pengajuan-assertion.service';
import { PengajuanNotifierService } from './pengajuan-notifier.service';
import { PengajuanQueryService } from './pengajuan-query.service';

@Injectable()
export class PengajuanLaporanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly queryService: PengajuanQueryService,
    private readonly assertionService: PengajuanAssertionService,
    private readonly notifierService: PengajuanNotifierService,
  ) {}

  async uploadLaporan(
    pengajuanId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File laporan wajib diunggah');

    const pengajuan = await this.queryService.getOwnedPengajuanOrThrow(
      pengajuanId,
      userId,
    );

    this.assertionService.assertLaporanUnlocked(pengajuan);

    const existing = await this.prisma.laporan_kegiatan.findUnique({
      where: { pengajuan_id: pengajuanId },
    });

    const filePath = this.uploadService.replaceFileFromMulter(
      file,
      existing?.file_laporan,
    );

    const laporan = await this.prisma.laporan_kegiatan.upsert({
      where: { pengajuan_id: pengajuanId },
      create: {
        pengajuan_id: pengajuanId,
        file_laporan: filePath,
        status: STATUS.DALAM_PROSES,
      },
      update: {
        file_laporan: filePath,
        status: STATUS.DALAM_PROSES,
        catatan_admin: null,
      },
    });

    await this.notifierService.kirimKeAdminDanSuperAdmin(
      'Laporan Kegiatan Diunggah',
      'Pemohon telah mengunggah laporan kegiatan. Silakan tinjau dan setujui laporan tersebut.',
      userId,
    );

    return laporan;
  }
}
