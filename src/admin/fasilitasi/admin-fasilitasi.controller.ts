import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';
import { AdminFasilitasiService } from './admin-fasilitasi.service';
import {
  CreateJenisLembagaDto,
  CreateKuotaDto,
  CreatePaketDto,
  UpdateJenisLembagaDto,
  UpdateKuotaDto,
  UpdatePaketDto,
} from './dto/admin-fasilitasi.dto';
import { createDiskStorage } from '../../common/upload/multer-storage.util';
import {
  imageAndPdfFilter,
  MAX_FILE_SIZE,
} from '../../common/upload/file-filter.util';

@ApiTags('Admin - Fasilitasi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/fasilitasi')
export class AdminFasilitasiController {
  constructor(private readonly service: AdminFasilitasiService) {}

  @Get('jenis-lembaga')
  findAllJenisLembaga() {
    return this.service.findAllJenisLembaga();
  }

  @Post('jenis-lembaga')
  createJenisLembaga(@Body() dto: CreateJenisLembagaDto) {
    return this.service.createJenisLembaga(dto);
  }

  @Patch('jenis-lembaga/:jenis_lembaga_id')
  updateJenisLembaga(
    @Param('jenis_lembaga_id', ParseIntPipe) jenisLembagaId: number,
    @Body() dto: UpdateJenisLembagaDto,
  ) {
    return this.service.updateJenisLembaga(jenisLembagaId, dto);
  }

  @Delete('jenis-lembaga/:jenis_lembaga_id')
  deleteJenisLembaga(
    @Param('jenis_lembaga_id', ParseIntPipe) jenisLembagaId: number,
  ) {
    return this.service.deleteJenisLembaga(jenisLembagaId);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':jenis_id/kuota')
  findKuotaByJenis(@Param('jenis_id', ParseIntPipe) jenisId: number) {
    return this.service.findKuotaByJenis(jenisId);
  }

  @Post(':jenis_id/kuota')
  createKuota(
    @Param('jenis_id', ParseIntPipe) jenisId: number,
    @Body() dto: CreateKuotaDto,
  ) {
    return this.service.createKuota(jenisId, dto);
  }

  @Patch('kuota/:paket_id')
  updateKuota(@Param('paket_id') paketId: string, @Body() dto: UpdateKuotaDto) {
    return this.service.updateKuota(paketId, dto);
  }

  @Delete('kuota/:paket_id')
  deleteKuota(@Param('paket_id') paketId: string) {
    return this.service.deleteKuota(paketId);
  }

  @Post(':jenis_id/paket')
  createPaket(
    @Param('jenis_id', ParseIntPipe) jenisId: number,
    @Body() dto: CreatePaketDto,
  ) {
    return this.service.createPaket(jenisId, dto);
  }

  @Patch('paket/:paket_id')
  updatePaket(@Param('paket_id') paketId: string, @Body() dto: UpdatePaketDto) {
    return this.service.updatePaket(paketId, dto);
  }

  @Delete('paket/:paket_id')
  deletePaket(@Param('paket_id') paketId: string) {
    return this.service.deletePaket(paketId);
  }

  @Post(':jenis_id/template/proposal')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('uploads/template'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadTemplateProposal(
    @Param('jenis_id', ParseIntPipe) jenisId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadTemplate(jenisId, 'proposal', file);
  }

  @Post(':jenis_id/template/laporan')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createDiskStorage('uploads/template'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadTemplateLaporan(
    @Param('jenis_id', ParseIntPipe) jenisId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadTemplate(jenisId, 'laporan', file);
  }
}
