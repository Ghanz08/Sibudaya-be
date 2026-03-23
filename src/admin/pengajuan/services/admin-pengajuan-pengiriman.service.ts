import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadService } from '../../../common/upload/upload.service';
import { STATUS } from '../../../common/constants/status.constants';
import { AdminPengajuanNotifierService } from './admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './admin-pengajuan-query.service';
import { AdminPengajuanAssertionService } from './admin-pengajuan-assertion.service';
import { UploadBuktiPengirimanDto } from '../dto/admin-pengajuan.dto';

/** Handles Pengiriman Sarana workflow (Step 6, Hibah only) */
@Injectable()
export class AdminPengajuanPengirimanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly queryService: AdminPengajuanQueryService,
    private readonly assertionService: AdminPengajuanAssertionService,
    private readonly notifierService: AdminPengajuanNotifierService,
  ) {}

  async uploadBukti(
    pengajuanId: string,
    dto: UploadBuktiPengirimanDto,
    file: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException('File bukti pengiriman wajib diunggah');

    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertJenisHibah(pengajuan);

    if (pengajuan.surat_persetujuan?.status !== STATUS.SELESAI) {
      throw new BadRequestException(
        'Surat persetujuan belum dikonfirmasi. Pengiriman sarana belum bisa dilakukan.',
      );
    }

    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', ''),
      file.filename,
    );

    // delete old if re-uploading
    if (pengajuan.pengiriman_sarana?.bukti_pengiriman) {
      this.uploadService.deleteFile(
        pengajuan.pengiriman_sarana.bukti_pengiriman,
      );
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    const pengiriman = await this.prisma.pengiriman_sarana.upsert({
      where: { pengajuan_id: pengajuanId },
      create: {
        pengajuan_id: pengajuanId,
        tanggal_pengiriman: new Date(dto.tanggal_pengiriman),
        bukti_pengiriman: filePath,
        catatan: dto.catatan,
        status: STATUS.SELESAI,
      },
      update: {
        tanggal_pengiriman: new Date(dto.tanggal_pengiriman),
        bukti_pengiriman: filePath,
        catatan: dto.catatan,
        status: STATUS.SELESAI,
      },
    });

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Sarana Prasarana Dikirim',
      'Fasilitas hibah telah dikirim oleh Dinas Kebudayaan DIY ke alamat yang terdaftar.',
    );

    return pengiriman;
  }
}
