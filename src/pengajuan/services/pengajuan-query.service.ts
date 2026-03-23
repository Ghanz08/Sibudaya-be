import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PENGAJUAN_INCLUDE_DETAIL_USER,
  PENGAJUAN_INCLUDE_LIST_BASIC,
  PENGAJUAN_INCLUDE_OWNED_USER,
} from '../../common/constants/pengajuan-include.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { PengajuanTimelineService } from './pengajuan-timeline.service';

@Injectable()
export class PengajuanQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: PengajuanTimelineService,
  ) {}

  async findByUser(userId: string) {
    const lembaga = await this.prisma.lembaga_budaya.findUnique({
      where: { user_id: userId },
    });
    if (!lembaga) return [];

    return this.prisma.pengajuan.findMany({
      where: { lembaga_id: lembaga.lembaga_id },
      include: PENGAJUAN_INCLUDE_LIST_BASIC,
      orderBy: { tanggal_pengajuan: 'desc' },
    });
  }

  async findDetail(pengajuanId: string, userId: string) {
    const data = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: PENGAJUAN_INCLUDE_DETAIL_USER,
    });

    if (!data) throw new NotFoundException('Pengajuan tidak ditemukan');

    if (data.lembaga_budaya.user_id !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses pengajuan ini');
    }

    return {
      ...data,
      timeline: this.timelineService.buildTimeline(data),
    };
  }

  async getOwnedPengajuanOrThrow(pengajuanId: string, userId: string) {
    const pengajuan = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: PENGAJUAN_INCLUDE_OWNED_USER,
    });

    if (!pengajuan) throw new NotFoundException('Pengajuan tidak ditemukan');
    if (pengajuan.lembaga_budaya.user_id !== userId) {
      throw new ForbiddenException('Anda tidak berhak mengakses pengajuan ini');
    }

    return pengajuan;
  }
}
