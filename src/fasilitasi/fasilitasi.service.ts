import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FasilitasiService {
  constructor(private readonly prisma: PrismaService) {}

  findJenisLembaga() {
    return this.prisma.jenis_lembaga.findMany({
      orderBy: { jenis_lembaga_id: 'asc' },
    });
  }

  findAll() {
    return this.prisma.jenis_fasilitasi.findMany({
      include: {
        paket_fasilitasi: {
          orderBy: { nilai_bantuan: 'desc' },
        },
      },
    });
  }

  findPaketByJenis(jenisFasilitasiId: number) {
    return this.prisma.paket_fasilitasi.findMany({
      where: { jenis_fasilitasi_id: jenisFasilitasiId },
      orderBy: { nilai_bantuan: 'desc' },
    });
  }
}
