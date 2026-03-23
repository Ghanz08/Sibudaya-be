import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadService } from '../../../common/upload/upload.service';
import { STATUS } from '../../../common/constants/status.constants';
import { AdminPengajuanNotifierService } from './admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './admin-pengajuan-query.service';
import { AdminPengajuanAssertionService } from './admin-pengajuan-assertion.service';
import { UploadSuratPersetujuanDto } from '../dto/admin-pengajuan.dto';

/** Handles Surat Persetujuan workflow (Step 4) for both Pentas & Hibah */
@Injectable()
export class AdminPengajuanSuratService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly queryService: AdminPengajuanQueryService,
    private readonly assertionService: AdminPengajuanAssertionService,
    private readonly notifierService: AdminPengajuanNotifierService,
  ) {}

  async upload(
    pengajuanId: string,
    dto: UploadSuratPersetujuanDto,
    file: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException('File surat persetujuan wajib diunggah');

    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertPemeriksaanDisetujui(pengajuan);

    // For Hibah: survey must be SELESAI first
    if (
      pengajuan.jenis_fasilitasi_id === 2 &&
      pengajuan.survey_lapangan?.status !== 'SELESAI'
    ) {
      throw new BadRequestException('Survey lapangan belum selesai');
    }

    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', ''),
      file.filename,
    );

    // delete old file if re-uploading
    if (pengajuan.surat_persetujuan?.file_path) {
      this.uploadService.deleteFile(pengajuan.surat_persetujuan.file_path);
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    const surat = await this.prisma.surat_persetujuan.upsert({
      where: { pengajuan_id: pengajuanId },
      create: {
        pengajuan_id: pengajuanId,
        nomor_surat: dto.nomor_surat,
        file_path: filePath,
        tanggal_terbit: new Date(dto.tanggal_terbit),
        status: STATUS.DALAM_PROSES,
      },
      update: {
        nomor_surat: dto.nomor_surat,
        file_path: filePath,
        tanggal_terbit: new Date(dto.tanggal_terbit),
        status: STATUS.DALAM_PROSES,
      },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Surat Persetujuan Tersedia',
      'Surat persetujuan telah diterbitkan. Silakan unduh dan lakukan penandatanganan secara langsung di Kantor Dinas Kebudayaan DIY.',
    );

    return surat;
  }

  async konfirmasi(pengajuanId: string) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);

    if (!pengajuan.surat_persetujuan) {
      throw new BadRequestException('Surat persetujuan belum diunggah');
    }
    if (pengajuan.surat_persetujuan.status === STATUS.SELESAI) {
      throw new BadRequestException('Surat persetujuan sudah dikonfirmasi');
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    const surat = await this.prisma.surat_persetujuan.update({
      where: { pengajuan_id: pengajuanId },
      data: {
        status: STATUS.SELESAI,
        tanggal_konfirmasi: new Date(),
      },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Surat Persetujuan Dikonfirmasi',
      'Penandatanganan surat persetujuan telah dikonfirmasi di Kantor Dinas Kebudayaan DIY.',
    );

    return surat;
  }
}
