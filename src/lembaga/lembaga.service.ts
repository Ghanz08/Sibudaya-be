import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../common/upload/upload.service';
import {
  CreateLembagaDto,
  UpdateLembagaDto,
  UploadSertifikatDto,
} from './dto/lembaga.dto';

@Injectable()
export class LembagaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(userId: string, dto: CreateLembagaDto) {
    const existing = await this.prisma.lembaga_budaya.findUnique({
      where: { user_id: userId },
    });
    if (existing) {
      throw new ConflictException(
        'Anda sudah memiliki lembaga budaya yang terdaftar',
      );
    }

    return this.prisma.lembaga_budaya.create({
      data: {
        user_id: userId,
        nama_lembaga: dto.nama_lembaga,
        jenis_kesenian: dto.jenis_kesenian,
        alamat: dto.alamat,
        no_hp: dto.no_hp,
        email: dto.email,
      },
      include: { sertifikat_nik: true },
    });
  }

  async findByUser(userId: string) {
    const lembaga = await this.prisma.lembaga_budaya.findUnique({
      where: { user_id: userId },
      include: { sertifikat_nik: true },
    });
    if (!lembaga) {
      throw new NotFoundException('Lembaga budaya tidak ditemukan');
    }
    return lembaga;
  }

  async update(userId: string, dto: UpdateLembagaDto) {
    await this.findByUser(userId);
    return this.prisma.lembaga_budaya.update({
      where: { user_id: userId },
      data: dto,
      include: { sertifikat_nik: true },
    });
  }

  async uploadSertifikatNik(
    userId: string,
    file: Express.Multer.File,
    dto: UploadSertifikatDto,
  ) {
    if (!file) {
      throw new BadRequestException('File sertifikat NIK wajib diunggah');
    }

    const lembaga = await this.findByUser(userId);
    const filePath = this.uploadService.buildFilePath(
      file.destination.replace(process.cwd() + '/', ''),
      file.filename,
    );
    const tanggalTerbit = new Date(dto.tanggal_terbit);
    const tanggalBerlakuSampai = new Date(dto.tanggal_berlaku_sampai);

    if (
      Number.isNaN(tanggalTerbit.getTime()) ||
      Number.isNaN(tanggalBerlakuSampai.getTime())
    ) {
      throw new BadRequestException('Format tanggal sertifikat tidak valid');
    }

    if (tanggalBerlakuSampai < tanggalTerbit) {
      throw new BadRequestException(
        'Tanggal berlaku sertifikat harus setelah tanggal terbit',
      );
    }

    // Delete old file if exists
    if (lembaga.sertifikat_nik?.file_path) {
      this.uploadService.deleteFile(lembaga.sertifikat_nik.file_path);
    }

    // Auto update if exists, create if not (no error thrown)
    return await this.prisma.sertifikat_nik.upsert({
      where: { lembaga_id: lembaga.lembaga_id },
      create: {
        lembaga_id: lembaga.lembaga_id,
        nomor_nik: dto.nomor_nik,
        file_path: filePath,
        tanggal_terbit: tanggalTerbit,
        tanggal_berlaku_sampai: tanggalBerlakuSampai,
        status_verifikasi: 'PENDING',
      },
      update: {
        nomor_nik: dto.nomor_nik,
        file_path: filePath,
        tanggal_terbit: tanggalTerbit,
        tanggal_berlaku_sampai: tanggalBerlakuSampai,
        status_verifikasi: 'PENDING',
        catatan_admin: null,
      },
    });
  }
}
