import {
  IsDateString,
  IsIn,
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
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
  @IsOptional()
  jenis_fasilitasi_id?: number;
}
