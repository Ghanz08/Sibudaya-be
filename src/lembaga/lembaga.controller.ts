import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LembagaService } from './lembaga.service';
import {
  CreateLembagaDto,
  UpdateLembagaDto,
  UploadSertifikatDto,
} from './dto/lembaga.dto';
import { createDiskStorage } from '../common/upload/multer-storage.util';
import {
  imageAndPdfFilter,
  MAX_FILE_SIZE,
} from '../common/upload/file-filter.util';

const lembagaExample = {
  lembaga_id: 'f5ad8818-a442-4e5a-b543-b0d0b7be4d66',
  user_id: 'c6b97f28-6f0f-45d5-bdcf-e3556b094ef8',
  nama_lembaga: 'Sanggar Seni Budaya Nusantara',
  jenis_kesenian: 'Tari Tradisional',
  alamat: 'Jl. Diponegoro No. 12, Bandung',
  no_hp: '081234567890',
  email: 'sanggar@example.com',
  created_at: '2026-04-16T08:30:00.000Z',
  updated_at: '2026-04-16T08:30:00.000Z',
  sertifikat_nik: {
    sertifikat_id: '5dbf08d6-791f-4b9e-b4cc-80bd2139d3ec',
    lembaga_id: 'f5ad8818-a442-4e5a-b543-b0d0b7be4d66',
    nomor_nik: 'NIK-2026-001',
    file_path: '/uploads/sertifikat/sertifikat-nik-2026.pdf',
    tanggal_terbit: '2026-01-01T00:00:00.000Z',
    tanggal_berlaku_sampai: '2028-01-01T00:00:00.000Z',
    status_verifikasi: 'PENDING',
    catatan_admin: null,
  },
};

const lembagaErrorExample = (
  statusCode: number,
  message: string | string[],
  path: string,
) => ({
  success: false,
  statusCode,
  message,
  path,
  timestamp: '2026-04-16T08:30:00.000Z',
});

@ApiTags('Lembaga')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lembaga')
export class LembagaController {
  constructor(private readonly lembagaService: LembagaService) {}

  @Post()
  @ApiOperation({ summary: 'Daftarkan lembaga budaya baru' })
  @ApiResponse({
    status: 201,
    description: 'Lembaga budaya berhasil didaftarkan',
    content: {
      'application/json': {
        example: lembagaExample,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Lembaga budaya sudah terdaftar',
    content: {
      'application/json': {
        example: lembagaErrorExample(
          409,
          'Anda sudah memiliki lembaga budaya yang terdaftar',
          '/api/v1/lembaga',
        ),
      },
    },
  })
  create(
    @CurrentUser() user: { user_id: string },
    @Body() dto: CreateLembagaDto,
  ) {
    return this.lembagaService.create(user.user_id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lihat data lembaga saya' })
  @ApiResponse({
    status: 200,
    description: 'Data lembaga berhasil diambil',
    content: {
      'application/json': {
        example: lembagaExample,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Lembaga budaya tidak ditemukan',
    content: {
      'application/json': {
        example: lembagaErrorExample(
          404,
          'Lembaga budaya tidak ditemukan',
          '/api/v1/lembaga/me',
        ),
      },
    },
  })
  findMe(@CurrentUser() user: { user_id: string }) {
    return this.lembagaService.findByUser(user.user_id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update data lembaga saya' })
  @ApiResponse({
    status: 200,
    description: 'Data lembaga berhasil diperbarui',
    content: {
      'application/json': {
        example: {
          ...lembagaExample,
          no_hp: '081355555555',
          alamat: 'Jl. Diponegoro No. 99, Bandung',
        },
      },
    },
  })
  update(
    @CurrentUser() user: { user_id: string },
    @Body() dto: UpdateLembagaDto,
  ) {
    return this.lembagaService.update(user.user_id, dto);
  }

  @Post('me/sertifikat-nik')
  @ApiOperation({ summary: 'Upload / update Sertifikat NIK lembaga' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Sertifikat NIK berhasil diunggah atau diperbarui',
    content: {
      'application/json': {
        example: lembagaExample.sertifikat_nik,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'File atau format data tidak valid',
    content: {
      'application/json': {
        example: lembagaErrorExample(
          400,
          'File sertifikat NIK wajib diunggah',
          '/api/v1/lembaga/me/sertifikat-nik',
        ),
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('uploads/sertifikat'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadSertifikat(
    @CurrentUser() user: { user_id: string },
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadSertifikatDto,
  ) {
    return this.lembagaService.uploadSertifikatNik(user.user_id, file, dto);
  }
}
