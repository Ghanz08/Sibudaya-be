import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../common/upload/upload.service';
import { NotifikasiService } from '../notifikasi/notifikasi.service';
import { STATUS } from '../common/constants/status.constants';
import {
  CreatePengajuanHibahDto,
  CreatePengajuanPentasDto,
} from './dto/create-pengajuan.dto';
import {
  BatalkanPengajuanDto,
  UpdatePengajuanHibahDto,
  UpdatePengajuanPentasDto,
} from './dto/update-pengajuan.dto';
import {
  PengajuanTimelineResponse,
  TimelineStep,
  TimelineStatus,
} from './dto/pengajuan-timeline.dto';

@Injectable()
export class PengajuanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notifikasiService: NotifikasiService,
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

    const result = await this.prisma.pengajuan.create({
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
        status: STATUS.DALAM_PROSES,
        status_pemeriksaan: STATUS.DALAM_PROSES,
      },
      include: this.pengajuanInclude,
    });

    await this.notifikasiService.kirimKeAdmin(
      'Pengajuan Fasilitasi Pentas Baru',
      `Ada pengajuan Fasilitasi Pentas baru yang perlu diperiksa (${dto.judul_kegiatan ?? ''}).`,
      userId,
    );

    return result;
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

    const result = await this.prisma.pengajuan.create({
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
        status: STATUS.DALAM_PROSES,
        status_pemeriksaan: STATUS.DALAM_PROSES,
      },
      include: this.pengajuanInclude,
    });

    await this.notifikasiService.kirimKeAdmin(
      'Pengajuan Fasilitasi Hibah Baru',
      `Ada pengajuan Fasilitasi Hibah baru (${dto.nama_penerima ?? ''}) yang perlu diperiksa.`,
      userId,
    );

    return result;
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

    return {
      ...data,
      timeline: this.buildTimeline(data),
    };
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

    await this.notifikasiService.kirimKeAdmin(
      'Laporan Kegiatan Diunggah',
      `Pemohon telah mengunggah laporan kegiatan. Silakan tinjau dan setujui laporan tersebut.`,
      userId,
    );

    return laporan;
  }

  async revisiPentas(
    pengajuanId: string,
    userId: string,
    dto: UpdatePengajuanPentasDto,
    proposalFile?: Express.Multer.File,
  ) {
    const pengajuan = await this.getOwnedPengajuanOrThrow(pengajuanId, userId);

    if (pengajuan.jenis_fasilitasi_id !== 1) {
      throw new BadRequestException('Pengajuan ini bukan jenis Pentas');
    }
    this.assertCanRevise(pengajuan.status_pemeriksaan);

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
    if (dto.alamat_lembaga !== undefined)
      updateData.alamat_pengiriman = dto.alamat_lembaga;

    if (proposalFile) {
      if (pengajuan.proposal_file) {
        this.uploadService.deleteFile(pengajuan.proposal_file);
      }
      updateData.proposal_file = this.uploadService.buildFilePath(
        proposalFile.destination.replace(process.cwd() + '/', ''),
        proposalFile.filename,
      );
    }

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: updateData,
      include: this.pengajuanInclude,
    });

    await this.notifikasiService.kirimKeAdmin(
      'Pengajuan Pentas Diperbarui',
      `Pemohon telah memperbarui data pengajuan Fasilitasi Pentas. Silakan periksa kembali.`,
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
    const pengajuan = await this.getOwnedPengajuanOrThrow(pengajuanId, userId);

    if (pengajuan.jenis_fasilitasi_id !== 2) {
      throw new BadRequestException('Pengajuan ini bukan jenis Hibah');
    }
    this.assertCanRevise(pengajuan.status_pemeriksaan);

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
      if (pengajuan.proposal_file) {
        this.uploadService.deleteFile(pengajuan.proposal_file);
      }
      updateData.proposal_file = this.uploadService.buildFilePath(
        proposalFile.destination.replace(process.cwd() + '/', ''),
        proposalFile.filename,
      );
    }

    const updated = await this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: updateData,
      include: this.pengajuanInclude,
    });

    await this.notifikasiService.kirimKeAdmin(
      'Pengajuan Hibah Diperbarui',
      `Pemohon telah memperbarui data pengajuan Fasilitasi Hibah. Silakan periksa kembali.`,
      userId,
    );

    return updated;
  }

  async batalkanPengajuan(
    pengajuanId: string,
    userId: string,
    dto: BatalkanPengajuanDto,
  ) {
    const pengajuan = await this.getOwnedPengajuanOrThrow(pengajuanId, userId);
    this.assertCanRevise(pengajuan.status_pemeriksaan);

    return this.prisma.pengajuan.update({
      where: { pengajuan_id: pengajuanId },
      data: {
        status: STATUS.DITOLAK,
        catatan_pemeriksaan: dto.alasan ?? 'Dibatalkan oleh pemohon',
      },
      include: this.pengajuanInclude,
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
        status: { notIn: [STATUS.DITOLAK, STATUS.SELESAI] },
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
      if (pengajuan.surat_persetujuan?.status !== STATUS.SELESAI) {
        throw new BadRequestException(
          'Tahap Surat Persetujuan belum selesai. Upload laporan belum diizinkan.',
        );
      }
    } else {
      // Hibah: pengiriman_sarana must be SELESAI
      if (pengajuan.pengiriman_sarana?.status !== STATUS.SELESAI) {
        throw new BadRequestException(
          'Tahap Pengiriman Sarana Prasarana belum selesai. Upload laporan belum diizinkan.',
        );
      }
    }
  }

  private assertCanRevise(statusPemeriksaan: string) {
    if (statusPemeriksaan !== STATUS.DITOLAK) {
      throw new BadRequestException(
        'Perbarui atau batalkan pengajuan hanya bisa setelah pemeriksaan ditolak',
      );
    }
  }

  private normalizeStepStatus(status?: string | null): TimelineStatus {
    if (status === STATUS.DITOLAK) return STATUS.DITOLAK;
    if (status === STATUS.SELESAI || status === STATUS.DISETUJUI)
      return STATUS.SELESAI;
    return STATUS.DALAM_PROSES;
  }

  private buildTimeline(data: any): PengajuanTimelineResponse {
    const isPentas = data.jenis_fasilitasi_id === 1;
    const pemeriksaanStatus = this.normalizeStepStatus(data.status_pemeriksaan);
    const pemeriksaanRejected = pemeriksaanStatus === STATUS.DITOLAK;

    const surveyStatus = data.survey_lapangan
      ? this.normalizeStepStatus(data.survey_lapangan.status)
      : STATUS.BELUM_TERSEDIA;
    const surveyRejected = surveyStatus === STATUS.DITOLAK;

    const suratPrereq = isPentas
      ? pemeriksaanStatus === STATUS.SELESAI
      : surveyStatus === STATUS.SELESAI;
    const suratStatus: TimelineStatus = suratPrereq
      ? data.surat_persetujuan
        ? this.normalizeStepStatus(data.surat_persetujuan.status)
        : STATUS.DALAM_PROSES
      : STATUS.BELUM_TERSEDIA;

    const pengirimanStatus: TimelineStatus = !isPentas
      ? suratStatus === STATUS.SELESAI
        ? data.pengiriman_sarana
          ? this.normalizeStepStatus(data.pengiriman_sarana.status)
          : STATUS.DALAM_PROSES
        : STATUS.BELUM_TERSEDIA
      : STATUS.BELUM_TERSEDIA;

    const pencairanStatus: TimelineStatus = isPentas
      ? data.laporan_kegiatan?.status === STATUS.DISETUJUI
        ? data.pencairan_dana
          ? this.normalizeStepStatus(data.pencairan_dana.status)
          : STATUS.DALAM_PROSES
        : STATUS.BELUM_TERSEDIA
      : STATUS.BELUM_TERSEDIA;

    const laporanPrereq = isPentas
      ? suratStatus === STATUS.SELESAI
      : pengirimanStatus === STATUS.SELESAI;
    const laporanStatus: TimelineStatus = laporanPrereq
      ? data.laporan_kegiatan
        ? this.normalizeStepStatus(data.laporan_kegiatan.status)
        : STATUS.DALAM_PROSES
      : STATUS.BELUM_TERSEDIA;

    const terminalAtSurvey = !isPentas && surveyRejected;
    const forceBelumTersedia = (status: TimelineStatus): TimelineStatus => {
      if (terminalAtSurvey && status !== STATUS.DITOLAK) {
        return STATUS.BELUM_TERSEDIA;
      }
      return status;
    };

    const steps: TimelineStep[] = [
      {
        code: 'PENDAFTARAN',
        title: 'Pengajuan Data Pendaftaran',
        status: STATUS.SELESAI,
      },
      {
        code: 'PEMERIKSAAN',
        title: 'Pemeriksaan Data oleh Admin dan Penetapan Paket Fasilitas',
        status: pemeriksaanStatus,
        actions: pemeriksaanRejected
          ? {
              can_batalkan_pengajuan: true,
              can_perbarui_pengajuan: true,
            }
          : undefined,
      },
    ];

    if (!isPentas) {
      steps.push({
        code: 'SURVEY',
        title: 'Survey Lapangan oleh Pihak Dinas Kebudayaan',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : surveyStatus,
        ),
        is_terminal: surveyRejected,
      });
    }

    steps.push({
      code: 'SURAT_PERSETUJUAN',
      title: 'Pengisian dan Penandatanganan Surat Persetujuan',
      status: forceBelumTersedia(
        pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : suratStatus,
      ),
    });

    if (isPentas) {
      steps.push({
        code: 'PELAPORAN',
        title: 'Pelaporan Kegiatan',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : laporanStatus,
        ),
        actions:
          laporanStatus === STATUS.DITOLAK
            ? { can_unggah_ulang_laporan: true }
            : undefined,
      });
      steps.push({
        code: 'PENCAIRAN',
        title: 'Pencairan Dana',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : pencairanStatus,
        ),
      });
    } else {
      steps.push({
        code: 'PENGIRIMAN',
        title: 'Pengiriman Sarana Prasarana',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : pengirimanStatus,
        ),
      });
      steps.push({
        code: 'PELAPORAN',
        title: 'Pelaporan Kegiatan',
        status: forceBelumTersedia(
          pemeriksaanRejected ? STATUS.BELUM_TERSEDIA : laporanStatus,
        ),
        actions:
          laporanStatus === STATUS.DITOLAK
            ? { can_unggah_ulang_laporan: true }
            : undefined,
      });
    }

    return {
      status_global: data.status,
      jenis_fasilitasi_id: data.jenis_fasilitasi_id,
      steps,
    };
  }

  private readonly pengajuanInclude = {
    jenis_fasilitasi: true,
    paket_fasilitasi: true,
    lembaga_budaya: true,
  } as const;
}
