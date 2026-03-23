import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
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
          status_pemeriksaan: STATUS.DALAM_PROSES,
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
      include: {
        lembaga_budaya: { include: { sertifikat_nik: true } },
        jenis_fasilitasi: true,
        paket_fasilitasi: true,
      },
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

  private buildWhere(filter: FilterPengajuanDto): Prisma.pengajuanWhereInput {
    const search = filter.search?.trim();

    return {
      ...(filter.status && { status: filter.status }),
      ...(filter.jenis_fasilitasi_id && {
        jenis_fasilitasi_id: Number(filter.jenis_fasilitasi_id),
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
