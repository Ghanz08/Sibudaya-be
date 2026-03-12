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

@ApiTags('Lembaga')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lembaga')
export class LembagaController {
  constructor(private readonly lembagaService: LembagaService) {}

  @Post()
  @ApiOperation({ summary: 'Daftarkan lembaga budaya baru' })
  create(
    @CurrentUser() user: { user_id: string },
    @Body() dto: CreateLembagaDto,
  ) {
    return this.lembagaService.create(user.user_id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lihat data lembaga saya' })
  findMe(@CurrentUser() user: { user_id: string }) {
    return this.lembagaService.findByUser(user.user_id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update data lembaga saya' })
  update(
    @CurrentUser() user: { user_id: string },
    @Body() dto: UpdateLembagaDto,
  ) {
    return this.lembagaService.update(user.user_id, dto);
  }

  @Post('me/sertifikat-nik')
  @ApiOperation({ summary: 'Upload / update Sertifikat NIK lembaga' })
  @ApiConsumes('multipart/form-data')
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
