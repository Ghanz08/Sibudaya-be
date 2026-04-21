import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../common/upload/upload.service';
import {
  CreateJenisLembagaDto,
  CreateKuotaDto,
  CreatePaketDto,
  UpdateJenisLembagaDto,
  UpdateKuotaDto,
  UpdatePaketDto,
} from './dto/admin-fasilitasi.dto';
import { STATUS } from '../../common/constants/status.constants';
import { MANAGED_JENIS_FASILITASI_IDS } from '../../common/constants/jenis-fasilitasi.constants';

@Injectable()
export class AdminFasilitasiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  private normalizeNama(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  findAllJenisLembaga() {
    return this.prisma.jenis_lembaga.findMany({
      orderBy: { jenis_lembaga_id: 'asc' },
    });
  }

  async createJenisLembaga(dto: CreateJenisLembagaDto) {
    const nama = this.normalizeNama(dto.nama);

    const existing = await this.prisma.jenis_lembaga.findFirst({
      where: { nama: { equals: nama, mode: 'insensitive' } },
    });

    if (existing) {
      throw new ConflictException('Jenis lembaga sudah ada');
    }

    return this.prisma.jenis_lembaga.create({ data: { nama } });
  }

  async updateJenisLembaga(jenisLembagaId: number, dto: UpdateJenisLembagaDto) {
    const current = await this.prisma.jenis_lembaga.findUnique({
      where: { jenis_lembaga_id: jenisLembagaId },
    });

    if (!current) {
      throw new NotFoundException('Jenis lembaga tidak ditemukan');
    }

    const namaBaru = this.normalizeNama(dto.nama);
    const duplicate = await this.prisma.jenis_lembaga.findFirst({
      where: {
        nama: { equals: namaBaru, mode: 'insensitive' },
        NOT: { jenis_lembaga_id: jenisLembagaId },
      },
    });

    if (duplicate) {
      throw new ConflictException('Nama jenis lembaga sudah digunakan');
    }

    const [, updatedJenisLembaga] = await this.prisma.$transaction([
      this.prisma.lembaga_budaya.updateMany({
        where: { jenis_kesenian: current.nama },
        data: { jenis_kesenian: namaBaru },
      }),
      this.prisma.jenis_lembaga.update({
        where: { jenis_lembaga_id: jenisLembagaId },
        data: { nama: namaBaru },
      }),
    ]);

    return updatedJenisLembaga;
  }

  async deleteJenisLembaga(jenisLembagaId: number) {
    const current = await this.prisma.jenis_lembaga.findUnique({
      where: { jenis_lembaga_id: jenisLembagaId },
    });

    if (!current) {
      throw new NotFoundException('Jenis lembaga tidak ditemukan');
    }

    const usageCount = await this.prisma.lembaga_budaya.count({
      where: { jenis_kesenian: current.nama },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        'Jenis lembaga tidak dapat dihapus karena masih digunakan oleh data lembaga',
      );
    }

    return this.prisma.jenis_lembaga.delete({
      where: { jenis_lembaga_id: jenisLembagaId },
    });
  }

  findAll() {
    return this.prisma.jenis_fasilitasi.findMany({
      where: {
        jenis_fasilitasi_id: {
          in: [...MANAGED_JENIS_FASILITASI_IDS],
        },
      },
      include: {
        paket_fasilitasi: {
          include: {
            _count: { select: { pengajuan: true } },
          },
          orderBy: { nama_paket: 'asc' },
        },
      },
      orderBy: { jenis_fasilitasi_id: 'asc' },
    });
  }

  async findKuotaByJenis(jenisFasilitasiId: number) {
    const jenis = await this.prisma.jenis_fasilitasi.findUnique({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
    });
    if (!jenis) throw new NotFoundException('Jenis fasilitasi tidak ditemukan');

    return this.prisma.paket_fasilitasi.findMany({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
      include: { _count: { select: { pengajuan: true } } },
      orderBy: { nama_paket: 'asc' },
    });
  }

  createKuota(jenisFasilitasiId: number, dto: CreateKuotaDto) {
    return this.createPaket(jenisFasilitasiId, dto);
  }

  updateKuota(paketId: string, dto: UpdateKuotaDto) {
    return this.updatePaket(paketId, dto);
  }

  deleteKuota(paketId: string) {
    return this.deletePaket(paketId);
  }

  async createPaket(jenisFasilitasiId: number, dto: CreatePaketDto) {
    this.assertManagedJenisId(jenisFasilitasiId);

    const jenis = await this.prisma.jenis_fasilitasi.findUnique({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
    });
    if (!jenis) throw new NotFoundException('Jenis fasilitasi tidak ditemukan');

    return this.prisma.paket_fasilitasi.create({
      data: {
        jenis_fasilitasi_id: jenisFasilitasiId,
        nama_paket: dto.nama_paket,
        kuota: dto.kuota,
        nilai_bantuan: dto.nilai_bantuan ?? null,
        catatan: dto.catatan ?? null,
      },
    });
  }

  async updatePaket(paketId: string, dto: UpdatePaketDto) {
    const paket = await this.prisma.paket_fasilitasi.findUnique({
      where: { paket_id: paketId },
    });
    if (!paket) throw new NotFoundException('Paket tidak ditemukan');

    return this.prisma.paket_fasilitasi.update({
      where: { paket_id: paketId },
      data: {
        ...(dto.nama_paket !== undefined && { nama_paket: dto.nama_paket }),
        ...(dto.kuota !== undefined && { kuota: dto.kuota }),
        ...(dto.nilai_bantuan !== undefined && {
          nilai_bantuan: dto.nilai_bantuan,
        }),
        ...(dto.catatan !== undefined && { catatan: dto.catatan }),
      },
    });
  }

  async deletePaket(paketId: string) {
    const paket = await this.prisma.paket_fasilitasi.findUnique({
      where: { paket_id: paketId },
      include: { _count: { select: { pengajuan: true } } },
    });
    if (!paket) throw new NotFoundException('Paket tidak ditemukan');
    if (paket._count.pengajuan > 0) {
      throw new BadRequestException(
        'Paket tidak dapat dihapus karena masih digunakan oleh pengajuan yang ada',
      );
    }

    await this.prisma.paket_fasilitasi.delete({
      where: { paket_id: paketId },
    });

    return {
      message: 'Paket fasilitasi berhasil dihapus',
      paket_id: paketId,
    };
  }

  async uploadTemplate(
    jenisFasilitasiId: number,
    type: 'proposal' | 'laporan' | 'panduan',
    file: Express.Multer.File,
  ) {
    this.assertManagedJenisId(jenisFasilitasiId);

    const jenis = await this.prisma.jenis_fasilitasi.findUnique({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
    });
    if (!jenis) throw new NotFoundException('Jenis fasilitasi tidak ditemukan');

    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', '').replace(/\\/g, '/'),
      file.filename,
    );

    let oldPath: string | null = null;
    let updatePayload: Record<string, string>;

    if (type === 'proposal') {
      oldPath = jenis.template_proposal_file;
      updatePayload = { template_proposal_file: filePath };
    } else if (type === 'laporan') {
      oldPath = jenis.template_laporan_file;
      updatePayload = { template_laporan_file: filePath };
    } else {
      oldPath = jenis.panduan_file;
      updatePayload = { panduan_file: filePath };
    }

    if (oldPath) this.uploadService.deleteFile(oldPath);

    return this.prisma.jenis_fasilitasi.update({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
      data: updatePayload,
    });
  }

  /**
   * Calculate quota usage (approved pengajuan count) for a package
   */
  private async getQuotaUsage(paketId: string): Promise<number> {
    const result = await this.prisma.pengajuan.count({
      where: {
        paket_id: paketId,
        status: {
          in: [STATUS.DISETUJUI, STATUS.SELESAI],
        },
      },
    });
    return result;
  }

  /**
   * Get single jenis fasilitasi with paket and quota information
   */
  async findJenisByIdWithQuota(jenisFasilitasiId: number) {
    this.assertManagedJenisId(jenisFasilitasiId);

    const jenis = await this.prisma.jenis_fasilitasi.findUnique({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
      include: {
        paket_fasilitasi: {
          orderBy: { nama_paket: 'asc' },
        },
      },
    });

    if (!jenis) {
      throw new NotFoundException('Jenis fasilitasi tidak ditemukan');
    }

    // Calculate quota usage for each paket
    const paketWithQuota = await Promise.all(
      jenis.paket_fasilitasi.map(async (paket) => {
        const quota_used = await this.getQuotaUsage(paket.paket_id);
        return {
          ...paket,
          quota_used,
          quota_available: paket.kuota - quota_used,
        };
      }),
    );

    return {
      ...jenis,
      paket_fasilitasi: paketWithQuota,
    };
  }

  private assertManagedJenisId(jenisFasilitasiId: number) {
    if (!MANAGED_JENIS_FASILITASI_IDS.includes(jenisFasilitasiId)) {
      throw new NotFoundException('Jenis fasilitasi tidak ditemukan');
    }
  }
}
