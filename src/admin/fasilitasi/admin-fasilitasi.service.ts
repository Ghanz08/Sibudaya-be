import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../common/upload/upload.service';
import { CreatePaketDto, UpdatePaketDto } from './dto/admin-fasilitasi.dto';

@Injectable()
export class AdminFasilitasiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  findAll() {
    return this.prisma.jenis_fasilitasi.findMany({
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

  async createPaket(jenisFasilitasiId: number, dto: CreatePaketDto) {
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

    return this.prisma.paket_fasilitasi.delete({
      where: { paket_id: paketId },
    });
  }

  async uploadTemplate(
    jenisFasilitasiId: number,
    type: 'proposal' | 'laporan',
    file: Express.Multer.File,
  ) {
    const jenis = await this.prisma.jenis_fasilitasi.findUnique({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
    });
    if (!jenis) throw new NotFoundException('Jenis fasilitasi tidak ditemukan');

    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', '').replace(/\\/g, '/'),
      file.filename,
    );

    const field =
      type === 'proposal' ? 'template_proposal_file' : 'template_laporan_file';

    const oldPath = jenis[field];
    if (oldPath) this.uploadService.deleteFile(oldPath);

    return this.prisma.jenis_fasilitasi.update({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
      data: { [field]: filePath },
    });
  }
}
