import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../common/upload/upload.service';
import { STATUS } from '../../common/constants/status.constants';
import { PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA } from '../../common/constants/pengajuan-include.constants';
import {
  BatalkanPengajuanDto,
  UpdatePengajuanHibahDto,
  UpdatePengajuanPentasDto,
} from '../dto/update-pengajuan.dto';
import { PengajuanAssertionService } from './pengajuan-assertion.service';
import { PengajuanNotifierService } from './pengajuan-notifier.service';
import { PengajuanQueryService } from './pengajuan-query.service';

@Injectable()
export class PengajuanRevisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly queryService: PengajuanQueryService,
    private readonly assertionService: PengajuanAssertionService,
    private readonly notifierService: PengajuanNotifierService,
  ) {}

  async revisiPentas(
    pengajuanId: string,
    userId: string,
    dto: UpdatePengajuanPentasDto,
    proposalFile?: Express.Multer.File,
  ) {
    const pengajuan = await this.queryService.getOwnedPengajuanOrThrow(
      pengajuanId,
      userId,
    );

    if (pengajuan.jenis_fasilitasi_id !== 1) {
      throw new BadRequestException('Pengajuan ini bukan jenis Pentas');
    }
    this.assertionService.assertCanRevise(pengajuan.status_pemeriksaan);

    const updateData: Record<string, unknown> = {
      status: STATUS.DALAM_PROSES,
      status_pemeriksaan: STATUS.DALAM_PROSES,
      catatan_pemeriksaan: null,
      surat_penolakan_file: null,
      paket_id: null,
    };

    if (dto.jenis_kegiatan !== undefined)
      updateData.jenis_kegiatan = dto.jenis_kegiatan;
    if (dto.judul_kegiatan !== undefined)
      updateData.judul_kegiatan = dto.judul_kegiatan;
    if (dto.tujuan_kegiatan !== undefined)
      updateData.tujuan_kegiatan = dto.tujuan_kegiatan;
    if (dto.lokasi_kegiatan !== undefined)
      updateData.lokasi_kegiatan = dto.lokasi_kegiatan;
    if (dto.tanggal_mulai !== undefined)
      updateData.tanggal_mulai = new Date(dto.tanggal_mulai);
    if (dto.tanggal_selesai !== undefined)
      updateData.tanggal_selesai = new Date(dto.tanggal_selesai);
    if (dto.total_pengajuan_dana !== undefined)
      updateData.total_pengajuan_dana = dto.total_pengajuan_dana;
    if (dto.nomor_rekening !== undefined)
      updateData.nomor_rekening = dto.nomor_rekening;
    if (dto.nama_pemegang_rekening !== undefined)
      updateData.nama_pemegang_rekening = dto.nama_pemegang_rekening;
    if (dto.nama_bank !== undefined) updateData.nama_bank = dto.nama_bank;
    if (dto.alamat_lembaga !== undefined)
      updateData.alamat_pengiriman = dto.alamat_lembaga;

    if (proposalFile) {
      updateData.proposal_file = this.uploadService.replaceFileFromMulter(
        proposalFile,
        pengajuan.proposal_file,
      );
    }

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: updateData,
      include: PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA,
    });

    await this.notifierService.kirimKeAdminDanSuperAdmin(
      'Pengajuan Pentas Diperbarui',
      'Pemohon telah memperbarui data pengajuan Fasilitasi Pentas. Silakan periksa kembali.',
      userId,
    );

    return updated;
  }

  async revisiHibah(
    pengajuanId: string,
    userId: string,
    dto: UpdatePengajuanHibahDto,
    proposalFile?: Express.Multer.File,
  ) {
    const pengajuan = await this.queryService.getOwnedPengajuanOrThrow(
      pengajuanId,
      userId,
    );

    if (pengajuan.jenis_fasilitasi_id !== 2) {
      throw new BadRequestException('Pengajuan ini bukan jenis Hibah');
    }
    this.assertionService.assertCanRevise(pengajuan.status_pemeriksaan);

    const updateData: Record<string, unknown> = {
      status: STATUS.DALAM_PROSES,
      status_pemeriksaan: STATUS.DALAM_PROSES,
      catatan_pemeriksaan: null,
      surat_penolakan_file: null,
      paket_id: null,
    };

    if (dto.jenis_kegiatan !== undefined)
      updateData.jenis_kegiatan = dto.jenis_kegiatan;
    if (dto.nama_penerima !== undefined)
      updateData.nama_penerima = dto.nama_penerima;
    if (dto.alamat_pengiriman !== undefined)
      updateData.alamat_pengiriman = dto.alamat_pengiriman;
    if (dto.provinsi !== undefined) updateData.provinsi = dto.provinsi;
    if (dto.kabupaten_kota !== undefined)
      updateData.kabupaten_kota = dto.kabupaten_kota;
    if (dto.kecamatan !== undefined) updateData.kecamatan = dto.kecamatan;
    if (dto.kelurahan_desa !== undefined)
      updateData.kelurahan_desa = dto.kelurahan_desa;
    if (dto.kode_pos !== undefined) updateData.kode_pos = dto.kode_pos;

    if (proposalFile) {
      updateData.proposal_file = this.uploadService.replaceFileFromMulter(
        proposalFile,
        pengajuan.proposal_file,
      );
    }

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: updateData,
      include: PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA,
    });

    await this.notifierService.kirimKeAdminDanSuperAdmin(
      'Pengajuan Hibah Diperbarui',
      'Pemohon telah memperbarui data pengajuan Fasilitasi Hibah. Silakan periksa kembali.',
      userId,
    );

    return updated;
  }

  async batalkanPengajuan(
    pengajuanId: string,
    userId: string,
    dto: BatalkanPengajuanDto,
  ) {
    const pengajuan = await this.queryService.getOwnedPengajuanOrThrow(
      pengajuanId,
      userId,
    );
    this.assertionService.assertCanRevise(pengajuan.status_pemeriksaan);

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: {
        status: STATUS.DITOLAK,
        catatan_pemeriksaan: dto.alasan ?? 'Dibatalkan oleh pemohon',
      },
      include: PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA,
    });

    await this.notifierService.kirimKeAdminDanSuperAdmin(
      'Pengajuan Dibatalkan oleh Pemohon',
      `Pemohon membatalkan pengajuan. Alasan: ${dto.alasan ?? 'Dibatalkan oleh pemohon'}`,
      userId,
    );

    return updated;
  }
}
