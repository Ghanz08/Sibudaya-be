import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../common/upload/upload.service';
import { STATUS } from '../../common/constants/status.constants';
import { PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA } from '../../common/constants/pengajuan-include.constants';
import {
  CreatePengajuanHibahDto,
  CreatePengajuanPentasDto,
} from '../dto/create-pengajuan.dto';
import { PengajuanNotifierService } from './pengajuan-notifier.service';

@Injectable()
export class PengajuanSubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notifierService: PengajuanNotifierService,
  ) {}

  async submitPentas(
    userId: string,
    dto: CreatePengajuanPentasDto,
    proposalFile: Express.Multer.File,
  ) {
    if (!proposalFile) {
      throw new BadRequestException('File proposal wajib diunggah');
    }

    const lembaga = await this.getLembagaOrThrow(userId);

    const proposalPath =
      this.uploadService.buildFilePathFromMulter(proposalFile);

    const paket = dto.paket_id
      ? await this.prisma.paket_fasilitasi.findFirst({
          where: {
            paket_id: dto.paket_id,
            jenis_fasilitasi_id: 1,
            deleted_at: null,
          },
        })
      : null;

    if (dto.paket_id && !paket) {
      throw new BadRequestException('Paket fasilitasi tidak valid');
    }

    const result = await this.prisma.pengajuan.create({
      data: {
        lembaga_id: lembaga.lembaga_id,
        jenis_fasilitasi_id: 1,
        paket_id: paket?.paket_id ?? null,
        jenis_kegiatan: dto.jenis_kegiatan,
        judul_kegiatan: dto.judul_kegiatan,
        tujuan_kegiatan: dto.tujuan_kegiatan,
        lokasi_kegiatan: dto.lokasi_kegiatan,
        tanggal_mulai: new Date(dto.tanggal_mulai),
        tanggal_selesai: new Date(dto.tanggal_selesai),
        total_pengajuan_dana: dto.total_pengajuan_dana,
        nomor_rekening: dto.nomor_rekening,
        nama_pemegang_rekening: dto.nama_pemegang_rekening,
        nama_bank: dto.nama_bank,
        alamat_pengiriman: dto.alamat_lembaga,
        proposal_file: proposalPath,
        status: STATUS.DALAM_PROSES,
        status_pemeriksaan: STATUS.DALAM_PROSES,
      },
      include: PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA,
    });

    await this.notifierService.kirimKeAdminDanSuperAdmin(
      'Pengajuan Fasilitasi Pentas Baru',
      `Ada pengajuan Fasilitasi Pentas baru yang perlu diperiksa (${dto.judul_kegiatan ?? ''}).`,
      userId,
    );

    return result;
  }

  async submitHibah(
    userId: string,
    dto: CreatePengajuanHibahDto,
    proposalFile: Express.Multer.File,
  ) {
    if (!proposalFile) {
      throw new BadRequestException('File proposal wajib diunggah');
    }

    const lembaga = await this.getLembagaOrThrow(userId);

    const proposalPath =
      this.uploadService.buildFilePathFromMulter(proposalFile);

    const paket = dto.paket_id
      ? await this.prisma.paket_fasilitasi.findFirst({
          where: {
            paket_id: dto.paket_id,
            jenis_fasilitasi_id: 2,
            deleted_at: null,
          },
        })
      : null;

    if (dto.paket_id && !paket) {
      throw new BadRequestException('Paket fasilitasi tidak valid');
    }

    const result = await this.prisma.pengajuan.create({
      data: {
        lembaga_id: lembaga.lembaga_id,
        jenis_fasilitasi_id: 2,
        paket_id: paket?.paket_id ?? null,
        jenis_kegiatan: dto.jenis_kegiatan,
        nama_penerima: dto.nama_penerima,
        alamat_pengiriman: dto.alamat_pengiriman,
        provinsi: dto.provinsi,
        kabupaten_kota: dto.kabupaten_kota,
        kecamatan: dto.kecamatan,
        kelurahan_desa: dto.kelurahan_desa,
        kode_pos: dto.kode_pos,
        proposal_file: proposalPath,
        status: STATUS.DALAM_PROSES,
        status_pemeriksaan: STATUS.DALAM_PROSES,
      },
      include: PENGAJUAN_INCLUDE_BASE_WITH_LEMBAGA,
    });

    await this.notifierService.kirimKeAdminDanSuperAdmin(
      'Pengajuan Fasilitasi Hibah Baru',
      `Ada pengajuan Fasilitasi Hibah baru (${dto.nama_penerima ?? ''}) yang perlu diperiksa.`,
      userId,
    );

    return result;
  }

  private async getLembagaOrThrow(userId: string) {
    const lembaga = await this.prisma.lembaga_budaya.findUnique({
      where: { user_id: userId },
    });

    if (!lembaga) {
      throw new BadRequestException(
        'Anda belum mendaftarkan lembaga budaya. Daftarkan lembaga terlebih dahulu.',
      );
    }

    return lembaga;
  }
}
