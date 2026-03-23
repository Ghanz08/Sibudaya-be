import {
  IsDateString,
  IsInt,
  IsIn,
  ValidateIf,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { STATUS } from '../../../common/constants/status.constants';

// ── Pemeriksaan ──────────────────────────────────────────────────────────────

export class SetujuiPemeriksaanDto {
  @ApiPropertyOptional({
    description: 'Wajib diisi untuk Fasilitasi Pentas',
  })
  @IsUUID('all')
  @IsOptional()
  paket_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  catatan?: string;
}

export class TolakPemeriksaanDto {
  @ApiProperty({ description: 'Alasan penolakan pemeriksaan' })
  @IsString()
  @IsNotEmpty()
  catatan_pemeriksaan?: string;
}

// ── Survey Lapangan ──────────────────────────────────────────────────────────

export class SetSurveyDto {
  @ApiProperty({ example: '2026-04-15' })
  @IsDateString()
  @IsNotEmpty()
  tanggal_survey: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  catatan?: string;
}

export class TolakSurveyDto {
  @ApiProperty({ description: 'Alasan penolakan hasil survey lapangan' })
  @IsString()
  @IsNotEmpty()
  catatan: string;
}

// ── Surat Persetujuan ────────────────────────────────────────────────────────

export class UploadSuratPersetujuanDto {
  @ApiPropertyOptional({ example: 'SP/2026/001' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nomor_surat?: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  @IsNotEmpty()
  tanggal_terbit: string;
}

// ── Laporan Kegiatan (admin action) ──────────────────────────────────────────

export class TolakLaporanDto {
  @ApiProperty({ description: 'Alasan penolakan laporan' })
  @IsString()
  @IsNotEmpty()
  catatan_admin: string;
}

// ── Flexible Timeline Status (admin override) ───────────────────────────────

export class UpdateTimelineStatusDto {
  @ApiProperty({
    enum: [
      'PEMERIKSAAN',
      'SURVEY',
      'SURAT_PERSETUJUAN',
      'PENGIRIMAN',
      'PELAPORAN',
      'PENCAIRAN',
    ],
  })
  @IsIn([
    'PEMERIKSAAN',
    'SURVEY',
    'SURAT_PERSETUJUAN',
    'PENGIRIMAN',
    'PELAPORAN',
    'PENCAIRAN',
  ])
  @IsString()
  step:
    | 'PEMERIKSAAN'
    | 'SURVEY'
    | 'SURAT_PERSETUJUAN'
    | 'PENGIRIMAN'
    | 'PELAPORAN'
    | 'PENCAIRAN';

  @ApiProperty({ enum: ['IN_PROGRESS', 'COMPLETED', 'REJECTED'] })
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'REJECTED'])
  @IsString()
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

  @ApiPropertyOptional({
    description: 'Alasan penolakan. Wajib saat status = REJECTED',
  })
  @ValidateIf((o: UpdateTimelineStatusDto) => o.status === 'REJECTED')
  @IsString()
  @IsNotEmpty()
  note?: string;
}

// ── Pencairan Dana ───────────────────────────────────────────────────────────

export class UploadBuktiPencairanDto {
  @ApiProperty({ example: '30000000' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_dana: number;

  @ApiProperty({ example: '2026-05-01' })
  @IsDateString()
  @IsNotEmpty()
  tanggal_pencairan: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  catatan?: string;
}

// ── Pengiriman Sarana ─────────────────────────────────────────────────────────

export class UploadBuktiPengirimanDto {
  @ApiProperty({ example: '2026-05-10' })
  @IsDateString()
  @IsNotEmpty()
  tanggal_pengiriman: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  catatan?: string;
}

// ── Filter list ───────────────────────────────────────────────────────────────

export class FilterPengajuanDto {
  @ApiPropertyOptional({ example: 'DALAM_PROSES' })
  @IsIn([STATUS.DALAM_PROSES, STATUS.DITOLAK, STATUS.SELESAI])
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: '1' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  jenis_fasilitasi_id?: number;

  @ApiPropertyOptional({ example: 'sanggar trihuwana' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'tanggal_pengajuan' })
  @IsIn(['tanggal_pengajuan', 'nama_lembaga', 'status'])
  @IsString()
  @IsOptional()
  sort_by?: 'tanggal_pengajuan' | 'nama_lembaga' | 'status';

  @ApiPropertyOptional({ example: 'desc' })
  @IsIn(['asc', 'desc'])
  @IsString()
  @IsOptional()
  sort_order?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
