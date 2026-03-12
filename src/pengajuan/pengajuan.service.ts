import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../common/upload/upload.service';
import {
  CreatePengajuanHibahDto,
  CreatePengajuanPentasDto,
} from './dto/create-pengajuan.dto';

@Injectable()
export class PengajuanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  // ── Submit Pentas ─────────────────────────────────────────────────────────

  async submitPentas(
    userId: string,
    dto: CreatePengajuanPentasDto,
    proposalFile: Express.Multer.File,
  ) {
    if (!proposalFile) {
      throw new BadRequestException('File proposal wajib diunggah');
    }

    const lembaga = await this.getLembagaOrThrow(userId);
    await this.checkDuplikatPengajuan(lembaga.lembaga_id, 1);

    const proposalPath = this.uploadService.buildFilePath(
      proposalFile.destination.replace(process.cwd() + '/', ''),
      proposalFile.filename,
    );

    return this.prisma.pengajuan.create({
      data: {
        lembaga_id: lembaga.lembaga_id,
        jenis_fasilitasi_id: 1,
        jenis_kegiatan: dto.jenis_kegiatan,
        judul_kegiatan: dto.judul_kegiatan,
        tujuan_kegiatan: dto.tujuan_kegiatan,
        lokasi_kegiatan: dto.lokasi_kegiatan,
        tanggal_mulai: new Date(dto.tanggal_mulai),
        tanggal_selesai: new Date(dto.tanggal_selesai),
        total_pengajuan_dana: dto.total_pengajuan_dana,
        nomor_rekening: dto.nomor_rekening,
        nama_pemegang_rekening: dto.nama_pemegang_rekening,
        alamat_pengiriman: dto.alamat_lembaga,
        proposal_file: proposalPath,
        status: 'DALAM_PROSES',
        status_pemeriksaan: 'DALAM_PROSES',
      },
      include: this.pengajuanInclude,
    });
  }

  // ── Submit Hibah ──────────────────────────────────────────────────────────

  async submitHibah(
    userId: string,
    dto: CreatePengajuanHibahDto,
    proposalFile: Express.Multer.File,
  ) {
    if (!proposalFile) {
      throw new BadRequestException('File proposal wajib diunggah');
    }

    const lembaga = await this.getLembagaOrThrow(userId);
    await this.checkDuplikatPengajuan(lembaga.lembaga_id, 2);

    const proposalPath = this.uploadService.buildFilePath(
      proposalFile.destination.replace(process.cwd() + '/', ''),
      proposalFile.filename,
    );

    return this.prisma.pengajuan.create({
      data: {
        lembaga_id: lembaga.lembaga_id,
        jenis_fasilitasi_id: 2,
        jenis_kegiatan: dto.jenis_kegiatan,
        nama_penerima: dto.nama_penerima,
        alamat_pengiriman: dto.alamat_pengiriman,
        provinsi: dto.provinsi,
        kabupaten_kota: dto.kabupaten_kota,
        kecamatan: dto.kecamatan,
        kelurahan_desa: dto.kelurahan_desa,
        kode_pos: dto.kode_pos,
        proposal_file: proposalPath,
        status: 'DALAM_PROSES',
        status_pemeriksaan: 'DALAM_PROSES',
      },
      include: this.pengajuanInclude,
    });
  }

  // ── List pengajuan milik user ─────────────────────────────────────────────

  async findByUser(userId: string) {
    const lembaga = await this.prisma.lembaga_budaya.findUnique({
      where: { user_id: userId },
    });
    if (!lembaga) return [];

    return this.prisma.pengajuan.findMany({
      where: { lembaga_id: lembaga.lembaga_id },
      include: {
        jenis_fasilitasi: true,
        paket_fasilitasi: true,
      },
      orderBy: { tanggal_pengajuan: 'desc' },
    });
  }

  // ── Detail pengajuan (timeline) ───────────────────────────────────────────

  async findDetail(pengajuanId: string, userId: string) {
    const data = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: {
        lembaga_budaya: { include: { users: true } },
        jenis_fasilitasi: true,
        paket_fasilitasi: true,
        surat_persetujuan: true,
        survey_lapangan: true,
        laporan_kegiatan: true,
        pencairan_dana: true,
        pengiriman_sarana: true,
      },
    });

    if (!data) throw new NotFoundException('Pengajuan tidak ditemukan');

    // Only owner or admin can view detail (controller also handles role guard)
    if (data.lembaga_budaya.user_id !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses pengajuan ini');
    }

    return data;
  }

  // ── Upload laporan kegiatan (user) ────────────────────────────────────────

  async uploadLaporan(
    pengajuanId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File laporan wajib diunggah');

    const pengajuan = await this.getOwnedPengajuanOrThrow(pengajuanId, userId);

    // Laporan only allowed if surat_persetujuan is SELESAI (for Pentas)
    // or pengiriman_sarana is SELESAI (for Hibah)
    await this.assertLaporanUnlocked(pengajuan);

    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', ''),
      file.filename,
    );

    // Delete old file if re-uploading
    const existing = await this.prisma.laporan_kegiatan.findUnique({
      where: { pengajuan_id: pengajuanId },
    });
    if (existing?.file_laporan) {
      this.uploadService.deleteFile(existing.file_laporan);
    }

    return this.prisma.laporan_kegiatan.upsert({
      where: { pengajuan_id: pengajuanId },
      create: {
        pengajuan_id: pengajuanId,
        file_laporan: filePath,
        status: 'DALAM_PROSES',
      },
      update: {
        file_laporan: filePath,
        status: 'DALAM_PROSES',
        catatan_admin: null,
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  private async checkDuplikatPengajuan(
    lembagaId: string,
    jenisFasilitasiId: number,
  ) {
    const active = await this.prisma.pengajuan.findFirst({
      where: {
        lembaga_id: lembagaId,
        jenis_fasilitasi_id: jenisFasilitasiId,
        status: { not: 'DITOLAK' },
      },
    });
    if (active) {
      throw new BadRequestException(
        'Anda sudah memiliki pengajuan aktif untuk jenis fasilitasi ini',
      );
    }
  }

  private async getOwnedPengajuanOrThrow(pengajuanId: string, userId: string) {
    const pengajuan = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: {
        lembaga_budaya: true,
        surat_persetujuan: true,
        pengiriman_sarana: true,
        laporan_kegiatan: true,
      },
    });
    if (!pengajuan) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (pengajuan.lembaga_budaya.user_id !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses pengajuan ini');
    }
    return pengajuan;
  }

  private async assertLaporanUnlocked(
    pengajuan: Awaited<
      ReturnType<PengajuanService['getOwnedPengajuanOrThrow']>
    >,
  ) {
    if (pengajuan.jenis_fasilitasi_id === 1) {
      // Pentas: surat_persetujuan must be SELESAI
      if (pengajuan.surat_persetujuan?.status !== 'SELESAI') {
        throw new BadRequestException(
          'Tahap Surat Persetujuan belum selesai. Upload laporan belum diizinkan.',
        );
      }
    } else {
      // Hibah: pengiriman_sarana must be SELESAI
      if (pengajuan.pengiriman_sarana?.status !== 'SELESAI') {
        throw new BadRequestException(
          'Tahap Pengiriman Sarana Prasarana belum selesai. Upload laporan belum diizinkan.',
        );
      }
    }
  }

  private readonly pengajuanInclude = {
    jenis_fasilitasi: true,
    paket_fasilitasi: true,
    lembaga_budaya: true,
  } as const;
}
