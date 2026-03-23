import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadService } from '../../../common/upload/upload.service';
import { STATUS } from '../../../common/constants/status.constants';
import { AdminPengajuanNotifierService } from './admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './admin-pengajuan-query.service';
import {
  SetujuiPemeriksaanDto,
  TolakPemeriksaanDto,
} from '../dto/admin-pengajuan.dto';

/** Handles Pemeriksaan workflow (Step 2) for both Pentas & Hibah */
@Injectable()
export class AdminPengajuanPemeriksaanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly queryService: AdminPengajuanQueryService,
    private readonly notifierService: AdminPengajuanNotifierService,
  ) {}

  async setujui(pengajuanId: string, dto: SetujuiPemeriksaanDto) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);

    if (pengajuan.status_pemeriksaan !== STATUS.DALAM_PROSES) {
      throw new BadRequestException('Pemeriksaan sudah diproses sebelumnya');
    }

    // Pentas wajib ada paket_id
    if (pengajuan.jenis_fasilitasi_id === 1 && !dto.paket_id) {
      throw new BadRequestException(
        'Penetapan paket fasilitasi wajib diisi untuk Fasilitasi Pentas',
      );
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: {
        status_pemeriksaan: STATUS.DISETUJUI,
        catatan_pemeriksaan: dto.catatan,
        paket_id: dto.paket_id ?? null,
      },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Pemeriksaan Pengajuan Disetujui',
      'Data pengajuan Anda telah diverifikasi dan dinyatakan sesuai ketentuan. Silakan tunggu informasi selanjutnya.',
    );

    return updated;
  }

  async tolak(
    pengajuanId: string,
    dto: TolakPemeriksaanDto,
    suratFile?: Express.Multer.File,
  ) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);

    if (pengajuan.status_pemeriksaan !== STATUS.DALAM_PROSES) {
      throw new BadRequestException('Pemeriksaan sudah diproses sebelumnya');
    }

    const rejectionNote = dto.catatan_pemeriksaan?.trim();
    if (!rejectionNote) {
      throw new BadRequestException('Alasan penolakan wajib diisi');
    }

    let suratPath: string | undefined;
    if (suratFile) {
      suratPath = this.uploadService.buildFilePath(
        suratFile.destination.replace(process.cwd() + '/', ''),
        suratFile.filename,
      );
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: {
        status_pemeriksaan: STATUS.DITOLAK,
        status: STATUS.DALAM_PROSES,
        catatan_pemeriksaan: rejectionNote,
        ...(suratPath && { surat_penolakan_file: suratPath }),
      },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Pengajuan Ditolak',
      `Pemeriksaan data pengajuan ditolak. Silakan perbarui pengajuan atau batalkan pengajuan. ${rejectionNote}`.trim(),
    );

    return updated;
  }
}
