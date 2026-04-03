import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../common/upload/upload.service';
import { NotifikasiService } from '../../notifikasi/notifikasi.service';
import { STATUS } from '../../common/constants/status.constants';
import {
  FilterPengajuanDto,
  SetSurveyDto,
  SetujuiPemeriksaanDto,
  TolakSurveyDto,
  TolakLaporanDto,
  TolakPemeriksaanDto,
  UpdateTimelineStatusDto,
  UploadBuktiPencairanDto,
  UploadBuktiPengirimanDto,
  UploadSuratPersetujuanDto,
} from './dto/admin-pengajuan.dto';
import { AdminPengajuanQueryService } from './services/admin-pengajuan-query.service';

@Injectable()
export class AdminPengajuanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
    private readonly notifikasiService: NotifikasiService,
    private readonly queryService: AdminPengajuanQueryService,
  ) {}

  // ── List & Detail ─────────────────────────────────────────────────────────

  getDashboard(filter: FilterPengajuanDto) {
    return this.queryService.getDashboard(filter);
  }

  findAll(filter: FilterPengajuanDto) {
    return this.prisma.pengajuan.findMany({
      where: {
        ...(filter.status && { status: filter.status }),
        ...(filter.jenis_fasilitasi_id && {
          jenis_fasilitasi_id: Number(filter.jenis_fasilitasi_id),
        }),
      },
      include: {
        lembaga_budaya: { include: { sertifikat_nik: true } },
        jenis_fasilitasi: true,
        paket_fasilitasi: true,
      },
      orderBy: { tanggal_pengajuan: 'desc' },
    });
  }

  async findDetail(pengajuanId: string) {
    const data = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: {
        lembaga_budaya: { include: { users: true, sertifikat_nik: true } },
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
    return data;
  }

  // ── Step 2: Pemeriksaan ───────────────────────────────────────────────────

  async setujuiPemeriksaan(pengajuanId: string, dto: SetujuiPemeriksaanDto) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Pemeriksaan Pengajuan Disetujui',
      'Data pengajuan Anda telah diverifikasi dan dinyatakan sesuai ketentuan. Silakan tunggu informasi selanjutnya.',
    );

    return updated;
  }

  async tolakPemeriksaan(
    pengajuanId: string,
    dto: TolakPemeriksaanDto,
    suratFile?: Express.Multer.File,
  ) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Pengajuan Ditolak',
      `Pemeriksaan data pengajuan ditolak. Silakan perbarui pengajuan atau batalkan pengajuan. ${rejectionNote}`.trim(),
    );

    return updated;
  }

  // ── Step 3 Hibah: Survey Lapangan ─────────────────────────────────────────

  async setSurvey(pengajuanId: string, dto: SetSurveyDto) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertJenisHibah(pengajuan);
    this.assertPemeriksaanDisetujui(pengajuan);

    const userId = pengajuan.lembaga_budaya.user_id;

    const survey = await this.prisma.survey_lapangan.upsert({
      where: { pengajuan_id: pengajuanId },
      create: {
        pengajuan_id: pengajuanId,
        tanggal_survey: new Date(dto.tanggal_survey),
        status: STATUS.DALAM_PROSES,
        catatan: dto.catatan,
      },
      update: {
        tanggal_survey: new Date(dto.tanggal_survey),
        catatan: dto.catatan,
      },
    });

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Jadwal Survey Lapangan Ditetapkan',
      `Dinas Kebudayaan DIY akan melakukan survey lapangan pada ${dto.tanggal_survey}. Pastikan Anda dapat hadir pada tanggal tersebut.`,
    );

    return survey;
  }

  async selesaikanSurvey(pengajuanId: string) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertJenisHibah(pengajuan);

    if (!pengajuan.survey_lapangan) {
      throw new BadRequestException(
        'Tanggal survey belum ditetapkan oleh admin',
      );
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    const survey = await this.prisma.survey_lapangan.update({
      where: { pengajuan_id: pengajuanId },
      data: { status: STATUS.SELESAI },
    });

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Survey Lapangan Selesai',
      'Survey lapangan telah dilaksanakan. Proses selanjutnya akan segera diinformasikan.',
    );

    return survey;
  }

  async tolakSurvey(pengajuanId: string, dto: TolakSurveyDto) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertJenisHibah(pengajuan);

    if (!pengajuan.survey_lapangan) {
      throw new BadRequestException(
        'Tanggal survey belum ditetapkan oleh admin',
      );
    }
    if (pengajuan.survey_lapangan.status === STATUS.DITOLAK) {
      throw new BadRequestException('Survey lapangan sudah ditolak');
    }

    const userId = pengajuan.lembaga_budaya.user_id;

    await this.prisma.$transaction([
      this.prisma.survey_lapangan.update({
        where: { pengajuan_id: pengajuanId },
        data: { status: STATUS.DITOLAK, catatan: dto.catatan },
      }),
      this.prisma.pengajuan.update({
        where: { pengajuan_id: pengajuanId },
        data: { status: STATUS.DITOLAK },
      }),
    ]);

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Survey Lapangan Ditolak',
      `Pengajuan hibah tidak dapat dilanjutkan karena hasil survey lapangan ditolak. ${dto.catatan}`,
    );

    return { message: 'Survey lapangan ditolak dan pengajuan dihentikan' };
  }

  // ── Step: Surat Persetujuan (upload) ─────────────────────────────────────

  async uploadSuratPersetujuan(
    pengajuanId: string,
    dto: UploadSuratPersetujuanDto,
    file: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException('File surat persetujuan wajib diunggah');

    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertPemeriksaanDisetujui(pengajuan);

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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Surat Persetujuan Tersedia',
      'Surat persetujuan telah diterbitkan. Silakan unduh dan lakukan penandatanganan secara langsung di Kantor Dinas Kebudayaan DIY.',
    );

    return surat;
  }

  async konfirmasiSuratPersetujuan(pengajuanId: string) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);

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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Surat Persetujuan Dikonfirmasi',
      'Penandatanganan surat persetujuan telah dikonfirmasi di Kantor Dinas Kebudayaan DIY.',
    );

    return surat;
  }

  // ── Step: Laporan Kegiatan (admin actions) ────────────────────────────────

  async setujuiLaporan(pengajuanId: string) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);

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

      await this.kirimNotifikasiUserDanSuperAdmin(
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

      await this.kirimNotifikasiUserDanSuperAdmin(
        userId,
        'Pengajuan Selesai',
        'Laporan kegiatan telah diverifikasi. Proses fasilitasi hibah Anda dinyatakan selesai.',
      );
    }

    return { message: 'Laporan disetujui' };
  }

  async tolakLaporan(pengajuanId: string, dto: TolakLaporanDto) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);

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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Laporan Kegiatan Ditolak',
      `Laporan kegiatan Anda perlu diperbaiki. Alasan: ${dto.catatan_admin}`,
    );

    return { message: 'Laporan ditolak' };
  }

  // ── Step Pentas: Pencairan Dana ───────────────────────────────────────────

  async uploadBuktiPencairan(
    pengajuanId: string,
    dto: UploadBuktiPencairanDto,
    file: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException('File bukti transfer wajib diunggah');

    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertJenisPentas(pengajuan);

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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Bukti Pencairan Dana Diunggah',
      'Bukti transfer dana fasilitasi telah diunggah oleh Dinas. Mohon menunggu konfirmasi penyelesaian.',
    );

    return pencairan;
  }

  async selesaikanPencairan(pengajuanId: string) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertJenisPentas(pengajuan);

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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Pencairan Dana Selesai',
      'Dana fasilitasi telah dicairkan ke rekening lembaga budaya Anda. Proses fasilitasi pentas dinyatakan selesai.',
    );

    return { message: 'Pencairan dana selesai' };
  }

  // ── Step Hibah: Pengiriman Sarana ─────────────────────────────────────────

  async uploadBuktiPengiriman(
    pengajuanId: string,
    dto: UploadBuktiPengirimanDto,
    file: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException('File bukti pengiriman wajib diunggah');

    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    this.assertJenisHibah(pengajuan);

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

    await this.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Sarana Prasarana Dikirim',
      'Fasilitas hibah telah dikirim oleh Dinas Kebudayaan DIY ke alamat yang terdaftar.',
    );

    return pengiriman;
  }

  // ── Flexible Timeline Status (admin override) ────────────────────────────

  async updateTimelineStatus(
    pengajuanId: string,
    dto: UpdateTimelineStatusDto,
  ) {
    const pengajuan = await this.findDetailOrThrow(pengajuanId);
    const isPentas = pengajuan.jenis_fasilitasi_id === 1;
    const now = new Date();

    const targetStatus =
      dto.status === 'COMPLETED'
        ? STATUS.SELESAI
        : dto.status === 'REJECTED'
          ? STATUS.DITOLAK
          : STATUS.DALAM_PROSES;
    const rejectionNote = dto.note?.trim();

    if (targetStatus === STATUS.DITOLAK && !rejectionNote) {
      throw new BadRequestException('Alasan penolakan wajib diisi');
    }

    await this.prisma.$transaction(async (tx) => {
      switch (dto.step) {
        case 'PEMERIKSAAN': {
          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status_pemeriksaan:
                targetStatus === STATUS.SELESAI
                  ? STATUS.DISETUJUI
                  : targetStatus,
              status:
                targetStatus === STATUS.DITOLAK
                  ? STATUS.DITOLAK
                  : STATUS.DALAM_PROSES,
              ...(targetStatus === STATUS.DITOLAK
                ? { catatan_pemeriksaan: rejectionNote }
                : {}),
              ...(targetStatus !== STATUS.DITOLAK
                ? { catatan_pemeriksaan: null }
                : {}),
            },
          });

          await tx.survey_lapangan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.surat_persetujuan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.pengiriman_sarana.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.laporan_kegiatan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.pencairan_dana.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          break;
        }

        case 'SURVEY': {
          if (isPentas) {
            throw new BadRequestException(
              'Step survey hanya tersedia untuk Fasilitasi Hibah',
            );
          }

          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: { status_pemeriksaan: STATUS.DISETUJUI },
          });

          await tx.survey_lapangan.upsert({
            where: { pengajuan_id: pengajuanId },
            create: {
              pengajuan_id: pengajuanId,
              tanggal_survey: now,
              status: targetStatus,
              catatan:
                targetStatus === STATUS.DITOLAK ? rejectionNote : dto.note,
            },
            update: {
              status: targetStatus,
              ...(targetStatus === STATUS.DITOLAK
                ? { catatan: rejectionNote }
                : dto.note
                  ? { catatan: dto.note }
                  : {}),
            },
          });

          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status: STATUS.DALAM_PROSES,
            },
          });

          await tx.surat_persetujuan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.pengiriman_sarana.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.laporan_kegiatan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          break;
        }

        case 'SURAT_PERSETUJUAN': {
          if (targetStatus === STATUS.DITOLAK) {
            throw new BadRequestException(
              'Penolakan step surat persetujuan belum didukung karena tidak ada kolom alasan penolakan',
            );
          }

          const surat = await tx.surat_persetujuan.findUnique({
            where: { pengajuan_id: pengajuanId },
          });

          if (!surat) {
            throw new BadRequestException(
              'Surat persetujuan belum diunggah. Unggah surat terlebih dahulu.',
            );
          }

          await tx.surat_persetujuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status: targetStatus,
              tanggal_konfirmasi: targetStatus === STATUS.SELESAI ? now : null,
            },
          });

          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status: STATUS.DALAM_PROSES,
            },
          });

          await tx.pengiriman_sarana.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.laporan_kegiatan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          await tx.pencairan_dana.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          break;
        }

        case 'PENGIRIMAN': {
          if (isPentas) {
            throw new BadRequestException(
              'Step pengiriman hanya tersedia untuk Fasilitasi Hibah',
            );
          }

          await tx.pengiriman_sarana.upsert({
            where: { pengajuan_id: pengajuanId },
            create: {
              pengajuan_id: pengajuanId,
              status: targetStatus,
              catatan:
                targetStatus === STATUS.DITOLAK ? rejectionNote : undefined,
            },
            update: {
              status: targetStatus,
              ...(targetStatus === STATUS.DITOLAK
                ? { catatan: rejectionNote }
                : {}),
            },
          });

          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status:
                targetStatus === STATUS.DITOLAK
                  ? STATUS.DITOLAK
                  : STATUS.DALAM_PROSES,
            },
          });

          await tx.laporan_kegiatan.deleteMany({
            where: { pengajuan_id: pengajuanId },
          });
          break;
        }

        case 'PELAPORAN': {
          await tx.laporan_kegiatan.upsert({
            where: { pengajuan_id: pengajuanId },
            create: {
              pengajuan_id: pengajuanId,
              status: targetStatus,
              catatan_admin:
                targetStatus === STATUS.DITOLAK ? rejectionNote : dto.note,
            },
            update: {
              status: targetStatus,
              ...(targetStatus === STATUS.DITOLAK
                ? { catatan_admin: rejectionNote }
                : dto.note
                  ? { catatan_admin: dto.note }
                  : {}),
            },
          });

          if (isPentas) {
                if (targetStatus === STATUS.SELESAI) {
                  await tx.pencairan_dana.upsert({
                    where: { pengajuan_id: pengajuanId },
                    create: {
                      pengajuan_id: pengajuanId,
                      status: STATUS.DALAM_PROSES,
                    },
                    update: {
                      status: STATUS.DALAM_PROSES,
                    },
                  });
                } else {
                  await tx.pencairan_dana.deleteMany({
                    where: { pengajuan_id: pengajuanId },
                  });
                }
          }

          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status:
                !isPentas && targetStatus === STATUS.SELESAI
                  ? STATUS.SELESAI
                  : STATUS.DALAM_PROSES,
            },
          });
          break;
        }

        case 'PENCAIRAN': {
          if (!isPentas) {
            throw new BadRequestException(
              'Step pencairan hanya tersedia untuk Fasilitasi Pentas',
            );
          }

          if (targetStatus === STATUS.DITOLAK) {
            throw new BadRequestException(
              'Penolakan step pencairan belum didukung karena tidak ada kolom alasan penolakan',
            );
          }

          await tx.pencairan_dana.upsert({
            where: { pengajuan_id: pengajuanId },
            create: {
              pengajuan_id: pengajuanId,
              status: targetStatus,
            },
            update: { status: targetStatus },
          });

          await tx.pengajuan.update({
            where: { pengajuan_id: pengajuanId },
            data: {
              status:
                targetStatus === STATUS.SELESAI
                  ? STATUS.SELESAI
                  : STATUS.DALAM_PROSES,
            },
          });
          break;
        }

        default:
          throw new BadRequestException('Step timeline tidak dikenali');
      }
    });

    return this.findDetailOrThrow(pengajuanId);
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async findDetailOrThrow(pengajuanId: string) {
    const data = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: {
        lembaga_budaya: { include: { users: true, sertifikat_nik: true } },
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
    return data;
  }

  private assertPemeriksaanDisetujui(
    pengajuan: Awaited<ReturnType<AdminPengajuanService['findDetailOrThrow']>>,
  ) {
    if (pengajuan.status_pemeriksaan !== STATUS.DISETUJUI) {
      throw new BadRequestException(
        'Pemeriksaan data belum disetujui. Tahap ini belum bisa dilanjutkan.',
      );
    }
  }

  private assertJenisPentas(
    pengajuan: Awaited<ReturnType<AdminPengajuanService['findDetailOrThrow']>>,
  ) {
    if (pengajuan.jenis_fasilitasi_id !== 1) {
      throw new BadRequestException(
        'Aksi ini hanya berlaku untuk Fasilitasi Pentas',
      );
    }
  }

  private assertJenisHibah(
    pengajuan: Awaited<ReturnType<AdminPengajuanService['findDetailOrThrow']>>,
  ) {
    if (pengajuan.jenis_fasilitasi_id !== 2) {
      throw new BadRequestException(
        'Aksi ini hanya berlaku untuk Fasilitasi Hibah',
      );
    }
  }

  private async kirimNotifikasiUserDanSuperAdmin(
    userId: string,
    judulUser: string,
    pesanUser: string,
  ) {
    return this.notifikasiService.kirim(userId, judulUser, pesanUser);
  }
}
