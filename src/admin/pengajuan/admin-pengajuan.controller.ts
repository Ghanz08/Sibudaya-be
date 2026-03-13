import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';
import { AdminPengajuanService } from './admin-pengajuan.service';
import {
  FilterPengajuanDto,
  SetSurveyDto,
  SetujuiPemeriksaanDto,
  TolakSurveyDto,
  TolakLaporanDto,
  TolakPemeriksaanDto,
  UploadBuktiPencairanDto,
  UploadBuktiPengirimanDto,
  UploadSuratPersetujuanDto,
} from './dto/admin-pengajuan.dto';
import { createDiskStorage } from '../../common/upload/multer-storage.util';
import {
  imageAndPdfFilter,
  MAX_FILE_SIZE,
} from '../../common/upload/file-filter.util';

@ApiTags('Admin - Pengajuan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('admin/pengajuan')
export class AdminPengajuanController {
  constructor(private readonly service: AdminPengajuanService) {}

  // ── List & Detail ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Daftar semua pengajuan (dengan filter)' })
  findAll(@Query() filter: FilterPengajuanDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail lengkap pengajuan' })
  findDetail(@Param('id') id: string) {
    return this.service.findDetail(id);
  }

  // ── Step 2: Pemeriksaan ───────────────────────────────────────────────────

  @Patch(':id/setujui')
  @ApiOperation({
    summary: 'Setujui pemeriksaan (wajib paket_id untuk Pentas)',
  })
  setujui(@Param('id') id: string, @Body() dto: SetujuiPemeriksaanDto) {
    return this.service.setujuiPemeriksaan(id, dto);
  }

  @Patch(':id/tolak')
  @ApiOperation({
    summary: 'Tolak pemeriksaan dengan surat penolakan (opsional)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('surat_penolakan', {
      storage: createDiskStorage('uploads/penolakan'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  tolak(
    @Param('id') id: string,
    @Body() dto: TolakPemeriksaanDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.tolakPemeriksaan(id, dto, file);
  }

  // ── Step 3 Hibah: Survey Lapangan ─────────────────────────────────────────

  @Post(':id/survey')
  @ApiOperation({ summary: '[Hibah] Tetapkan tanggal survey lapangan' })
  setSurvey(@Param('id') id: string, @Body() dto: SetSurveyDto) {
    return this.service.setSurvey(id, dto);
  }

  @Patch(':id/survey/selesai')
  @ApiOperation({ summary: '[Hibah] Tandai survey lapangan selesai' })
  selesaikanSurvey(@Param('id') id: string) {
    return this.service.selesaikanSurvey(id);
  }

  @Patch(':id/survey/tolak')
  @ApiOperation({
    summary: '[Hibah] Tandai survey lapangan ditolak (terminal)',
  })
  tolakSurvey(@Param('id') id: string, @Body() dto: TolakSurveyDto) {
    return this.service.tolakSurvey(id, dto);
  }

  // ── Step: Surat Persetujuan ───────────────────────────────────────────────

  @Post(':id/surat-persetujuan')
  @ApiOperation({ summary: 'Upload surat persetujuan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('surat_file', {
      storage: createDiskStorage('uploads/surat'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadSurat(
    @Param('id') id: string,
    @Body() dto: UploadSuratPersetujuanDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadSuratPersetujuan(id, dto, file);
  }

  @Patch(':id/surat-persetujuan/konfirmasi')
  @ApiOperation({
    summary: 'Konfirmasi surat persetujuan sudah ditandatangani',
  })
  konfirmasiSurat(@Param('id') id: string) {
    return this.service.konfirmasiSuratPersetujuan(id);
  }

  // ── Step: Laporan Kegiatan ────────────────────────────────────────────────

  @Patch(':id/laporan/setujui')
  @ApiOperation({ summary: 'Setujui laporan kegiatan' })
  setujuiLaporan(@Param('id') id: string) {
    return this.service.setujuiLaporan(id);
  }

  @Patch(':id/laporan/tolak')
  @ApiOperation({ summary: 'Tolak laporan kegiatan (wajib alasan)' })
  tolakLaporan(@Param('id') id: string, @Body() dto: TolakLaporanDto) {
    return this.service.tolakLaporan(id, dto);
  }

  // ── Step Pentas: Pencairan Dana ───────────────────────────────────────────

  @Post(':id/pencairan')
  @ApiOperation({ summary: '[Pentas] Upload bukti transfer pencairan dana' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('bukti_transfer', {
      storage: createDiskStorage('uploads/pencairan'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadPencairan(
    @Param('id') id: string,
    @Body() dto: UploadBuktiPencairanDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadBuktiPencairan(id, dto, file);
  }

  @Patch(':id/pencairan/selesai')
  @ApiOperation({ summary: '[Pentas] Konfirmasi pencairan dana selesai' })
  selesaikanPencairan(@Param('id') id: string) {
    return this.service.selesaikanPencairan(id);
  }

  // ── Step Hibah: Pengiriman Sarana ─────────────────────────────────────────

  @Post(':id/pengiriman')
  @ApiOperation({ summary: '[Hibah] Upload bukti pengiriman sarana prasarana' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('bukti_pengiriman', {
      storage: createDiskStorage('uploads/pengiriman'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadPengiriman(
    @Param('id') id: string,
    @Body() dto: UploadBuktiPengirimanDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadBuktiPengiriman(id, dto, file);
  }
}
