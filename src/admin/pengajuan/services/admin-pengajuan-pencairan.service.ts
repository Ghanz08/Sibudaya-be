import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadService } from '../../../common/upload/upload.service';
import { STATUS } from '../../../common/constants/status.constants';
import { AdminPengajuanNotifierService } from './admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './admin-pengajuan-query.service';
import { AdminPengajuanAssertionService } from './admin-pengajuan-assertion.service';
import { UploadBuktiPencairanDto } from '../dto/admin-pengajuan.dto';

/** Handles Pencairan Dana workflow (Step 6, Pentas only) */
@Injectable()
export class AdminPengajuanPencairanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly queryService: AdminPengajuanQueryService,
    private readonly assertionService: AdminPengajuanAssertionService,
    private readonly notifierService: AdminPengajuanNotifierService,
  ) {}

  async uploadBukti(
    pengajuanId: string,
    dto: UploadBuktiPencairanDto,
    file: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException('File bukti transfer wajib diunggah');

    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertJenisPentas(pengajuan);

    if (!pengajuan.pencairan_dana) {
      throw new BadRequestException(
        'Tahap pencairan dana belum dibuka. Laporan kegiatan harus disetujui terlebih dahulu.',
      );
    }
    if (pengajuan.pencairan_dana.status !== STATUS.DALAM_PROSES) {
      throw new BadRequestException('Bukti transfer sudah diunggah');
    }
    if (pengajuan.pencairan_dana.bukti_transfer) {
      throw new BadRequestException('Bukti transfer sudah diunggah');
    }

    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', ''),
      file.filename,
    );

    const userId = pengajuan.lembaga_budaya.user_id;

    const pencairan = await this.prisma.pencairan_dana.update({
      where: { pengajuan_id: pengajuanId },
      data: {
        bukti_transfer: filePath,
        total_dana: dto.total_dana,
        tanggal_pencairan: new Date(dto.tanggal_pencairan),
        status: STATUS.DALAM_PROSES,
      },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Bukti Pencairan Dana Diunggah',
      'Bukti transfer dana fasilitasi telah diunggah oleh Dinas. Mohon menunggu konfirmasi penyelesaian.',
    );

    return pencairan;
  }

  async selesai(pengajuanId: string) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertJenisPentas(pengajuan);

    if (
      pengajuan.pencairan_dana?.status !== STATUS.DALAM_PROSES ||
      !pengajuan.pencairan_dana?.bukti_transfer
    ) {
      throw new BadRequestException(
        'Bukti transfer belum diunggah atau pencairan sudah selesai',
      );
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    await this.prisma.$transaction([
      this.prisma.pencairan_dana.update({
        where: { pengajuan_id: pengajuanId },
        data: { status: STATUS.SELESAI },
      }),
      this.prisma.pengajuan.update({
        where: { pengajuan_id: pengajuanId },
        data: { status: STATUS.SELESAI },
      }),
    ]);

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Pencairan Dana Selesai',
      'Dana fasilitasi telah dicairkan ke rekening lembaga budaya Anda. Proses fasilitasi pentas dinyatakan selesai.',
    );

    return { message: 'Pencairan dana selesai' };
  }
}
