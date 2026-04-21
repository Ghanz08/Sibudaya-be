import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import {
  PENGAJUAN_INCLUDE_ADMIN_DETAIL,
  PENGAJUAN_INCLUDE_ADMIN_LIST,
} from '../../../common/constants/pengajuan-include.constants';
import { STATUS } from '../../../common/constants/status.constants';
import { PrismaService } from '../../../prisma/prisma.service';
import { FilterPengajuanDto } from '../dto/admin-pengajuan.dto';

@Injectable()
export class AdminPengajuanQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(filter: FilterPengajuanDto) {
    const where = this.buildWhere(filter);

    const [
      total_pengajuan,
      dalam_proses,
      perlu_tindakan,
      selesai,
      ditolak,
      daftar_terbaru,
    ] = await Promise.all([
      this.prisma.pengajuan.count({ where }),
      this.prisma.pengajuan.count({
        where: { ...where, status: STATUS.DALAM_PROSES },
      }),
      this.prisma.pengajuan.count({
        where: {
          ...where,
          status: STATUS.DALAM_PROSES,
          OR: [
            { status_pemeriksaan: STATUS.DALAM_PROSES },
            {
              jenis_fasilitasi_id: 2,
              status_pemeriksaan: { in: [STATUS.DISETUJUI, STATUS.SELESAI] },
              survey_lapangan: { is: null },
            },
            { survey_lapangan: { is: { status: STATUS.DALAM_PROSES } } },
            {
              jenis_fasilitasi_id: 1,
              status_pemeriksaan: { in: [STATUS.DISETUJUI, STATUS.SELESAI] },
              surat_persetujuan: { is: null },
            },
            {
              jenis_fasilitasi_id: 2,
              survey_lapangan: { is: { status: STATUS.SELESAI } },
              surat_persetujuan: { is: null },
            },
            { surat_persetujuan: { is: { status: STATUS.DALAM_PROSES } } },
            {
              jenis_fasilitasi_id: 2,
              surat_persetujuan: { is: { status: STATUS.SELESAI } },
              pengiriman_sarana: { is: null },
            },
            { pengiriman_sarana: { is: { status: STATUS.DALAM_PROSES } } },
            { laporan_kegiatan: { is: { status: STATUS.DALAM_PROSES } } },
            {
              jenis_fasilitasi_id: 1,
              laporan_kegiatan: { is: { status: STATUS.DISETUJUI } },
              pencairan_dana: { is: null },
            },
            {
              jenis_fasilitasi_id: 1,
              pencairan_dana: {
                is: {
                  bukti_transfer: null,
                  OR: [
                    { tanggal_pencairan: { not: null } },
                    { total_dana: { not: null } },
                  ],
                },
              },
            },
            {
              jenis_fasilitasi_id: 1,
              pencairan_dana: { is: { status: { not: STATUS.SELESAI } } },
            },
            { pencairan_dana: { is: { status: STATUS.DALAM_PROSES } } },
          ],
        },
      }),
      this.prisma.pengajuan.count({
        where: { ...where, status: STATUS.SELESAI },
      }),
      this.prisma.pengajuan.count({
        where: { ...where, status: STATUS.DITOLAK },
      }),
      this.prisma.pengajuan.findMany({
        where,
        select: {
          pengajuan_id: true,
          judul_kegiatan: true,
          tanggal_pengajuan: true,
          status: true,
          status_pemeriksaan: true,
          lembaga_budaya: { select: { nama_lembaga: true } },
          jenis_fasilitasi: { select: { nama: true } },
        },
        orderBy: { tanggal_pengajuan: 'desc' },
        take: 10,
      }),
    ]);

    return {
      statistik: {
        total_pengajuan,
        dalam_proses,
        perlu_tindakan,
        selesai,
        ditolak,
      },
      daftar_terbaru,
    };
  }

  findAll(filter: FilterPengajuanDto) {
    const where = this.buildWhere(filter);
    const orderBy = this.buildOrderBy(filter);
    const take = filter.limit;
    const skip = take ? ((filter.page ?? 1) - 1) * take : undefined;

    return this.prisma.pengajuan.findMany({
      where,
      include: PENGAJUAN_INCLUDE_ADMIN_LIST,
      orderBy,
      skip,
      take,
    });
  }

  async findDetail(pengajuanId: string) {
    const data = await this.findDetailOrThrow(pengajuanId);
    return data;
  }

  async findDetailOrThrow(pengajuanId: string) {
    const data = await this.prisma.pengajuan.findUnique({
      where: { pengajuan_id: pengajuanId },
      include: PENGAJUAN_INCLUDE_ADMIN_DETAIL,
    });

    if (!data) throw new NotFoundException('Pengajuan tidak ditemukan');
    return data;
  }

  private buildWhere(filter: FilterPengajuanDto): Prisma.pengajuanWhereInput {
    const search = filter.search?.trim();
    const startDate = filter.start_date
      ? new Date(`${filter.start_date}T00:00:00.000Z`)
      : undefined;
    const endDate = filter.end_date
      ? new Date(`${filter.end_date}T23:59:59.999Z`)
      : undefined;

    const tanggalPengajuanFilter =
      startDate || endDate
        ? {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          }
        : undefined;

    return {
      ...(filter.status && { status: filter.status }),
      ...(filter.jenis_fasilitasi_id && {
        jenis_fasilitasi_id: Number(filter.jenis_fasilitasi_id),
      }),
      ...(tanggalPengajuanFilter && {
        tanggal_pengajuan: tanggalPengajuanFilter,
      }),
      ...(search && {
        OR: [
          { judul_kegiatan: { contains: search, mode: 'insensitive' } },
          {
            lembaga_budaya: {
              nama_lembaga: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };
  }

  private buildOrderBy(
    filter: FilterPengajuanDto,
  ): Prisma.pengajuanOrderByWithRelationInput {
    const sortOrder: Prisma.SortOrder = filter.sort_order ?? 'desc';

    if (filter.sort_by === 'nama_lembaga') {
      return {
        lembaga_budaya: {
          nama_lembaga: sortOrder,
        },
      };
    }

    if (filter.sort_by === 'status') {
      return { status: sortOrder };
    }

    return { tanggal_pengajuan: sortOrder };
  }
}
