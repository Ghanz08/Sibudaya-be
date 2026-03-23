import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { STATUS } from '../../../common/constants/status.constants';
import { AdminPengajuanNotifierService } from './admin-pengajuan-notifier.service';
import { AdminPengajuanQueryService } from './admin-pengajuan-query.service';
import { AdminPengajuanAssertionService } from './admin-pengajuan-assertion.service';
import { SetSurveyDto, TolakSurveyDto } from '../dto/admin-pengajuan.dto';

/** Handles Survey Lapangan workflow (Step 3, Hibah only) */
@Injectable()
export class AdminPengajuanSurveyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryService: AdminPengajuanQueryService,
    private readonly assertionService: AdminPengajuanAssertionService,
    private readonly notifierService: AdminPengajuanNotifierService,
  ) {}

  async set(pengajuanId: string, dto: SetSurveyDto) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertJenisHibah(pengajuan);
    this.assertionService.assertPemeriksaanDisetujui(pengajuan);

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

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Jadwal Survey Lapangan Ditetapkan',
      `Dinas Kebudayaan DIY akan melakukan survey lapangan pada ${dto.tanggal_survey}. Pastikan Anda dapat hadir pada tanggal tersebut.`,
    );

    return survey;
  }

  async selesai(pengajuanId: string) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertJenisHibah(pengajuan);

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

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Survey Lapangan Selesai',
      'Survey lapangan telah dilaksanakan. Proses selanjutnya akan segera diinformasikan.',
    );

    return survey;
  }

  async tolak(pengajuanId: string, dto: TolakSurveyDto) {
    const pengajuan = await this.queryService.findDetailOrThrow(pengajuanId);
    this.assertionService.assertJenisHibah(pengajuan);

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

    await this.notifierService.kirimNotifikasiUserDanSuperAdmin(
      userId,
      'Survey Lapangan Ditolak',
      `Pengajuan hibah tidak dapat dilanjutkan karena hasil survey lapangan ditolak. ${dto.catatan}`,
    );

    return { message: 'Survey lapangan ditolak dan pengajuan dihentikan' };
  }
}
