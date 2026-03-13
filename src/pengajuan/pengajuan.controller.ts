import {
  Body,
  Controller,
  Get,
  Param,
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
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PengajuanService } from './pengajuan.service';
import {
  CreatePengajuanHibahDto,
  CreatePengajuanPentasDto,
} from './dto/create-pengajuan.dto';
import {
  BatalkanPengajuanDto,
  UpdatePengajuanHibahDto,
  UpdatePengajuanPentasDto,
} from './dto/update-pengajuan.dto';
import { createDiskStorage } from '../common/upload/multer-storage.util';
import {
  imageAndPdfFilter,
  MAX_FILE_SIZE,
} from '../common/upload/file-filter.util';

@ApiTags('Pengajuan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('pengajuan')
export class PengajuanController {
  constructor(private readonly pengajuanService: PengajuanService) {}

  @Post('pentas')
  @ApiOperation({ summary: 'Submit pengajuan Fasilitasi Pentas' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('proposal_file', {
      storage: createDiskStorage('uploads/proposal'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  submitPentas(
    @CurrentUser() user: { user_id: string },
    @Body() dto: CreatePengajuanPentasDto,
    @UploadedFile() proposalFile: Express.Multer.File,
  ) {
    return this.pengajuanService.submitPentas(user.user_id, dto, proposalFile);
  }

  @Post('hibah')
  @ApiOperation({ summary: 'Submit pengajuan Fasilitasi Hibah' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('proposal_file', {
      storage: createDiskStorage('uploads/proposal'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  submitHibah(
    @CurrentUser() user: { user_id: string },
    @Body() dto: CreatePengajuanHibahDto,
    @UploadedFile() proposalFile: Express.Multer.File,
  ) {
    return this.pengajuanService.submitHibah(user.user_id, dto, proposalFile);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar pengajuan saya' })
  findAll(@CurrentUser() user: { user_id: string }) {
    return this.pengajuanService.findByUser(user.user_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail pengajuan (timeline)' })
  findOne(@CurrentUser() user: { user_id: string }, @Param('id') id: string) {
    return this.pengajuanService.findDetail(id, user.user_id);
  }

  @Post(':id/laporan')
  @ApiOperation({ summary: 'Upload laporan kegiatan' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file_laporan', {
      storage: createDiskStorage('uploads/laporan'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  uploadLaporan(
    @CurrentUser() user: { user_id: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.pengajuanService.uploadLaporan(id, user.user_id, file);
  }

  @Patch(':id/revisi/pentas')
  @ApiOperation({
    summary: 'Perbarui pengajuan Pentas setelah pemeriksaan ditolak',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('proposal_file', {
      storage: createDiskStorage('uploads/proposal'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  revisiPentas(
    @CurrentUser() user: { user_id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePengajuanPentasDto,
    @UploadedFile() proposalFile?: Express.Multer.File,
  ) {
    return this.pengajuanService.revisiPentas(
      id,
      user.user_id,
      dto,
      proposalFile,
    );
  }

  @Patch(':id/revisi/hibah')
  @ApiOperation({
    summary: 'Perbarui pengajuan Hibah setelah pemeriksaan ditolak',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('proposal_file', {
      storage: createDiskStorage('uploads/proposal'),
      fileFilter: imageAndPdfFilter,
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  revisiHibah(
    @CurrentUser() user: { user_id: string },
    @Param('id') id: string,
    @Body() dto: UpdatePengajuanHibahDto,
    @UploadedFile() proposalFile?: Express.Multer.File,
  ) {
    return this.pengajuanService.revisiHibah(
      id,
      user.user_id,
      dto,
      proposalFile,
    );
  }

  @Patch(':id/batal')
  @ApiOperation({
    summary: 'Batalkan pengajuan setelah pemeriksaan ditolak',
  })
  batalkan(
    @CurrentUser() user: { user_id: string },
    @Param('id') id: string,
    @Body() dto: BatalkanPengajuanDto,
  ) {
    return this.pengajuanService.batalkanPengajuan(id, user.user_id, dto);
  }
}
