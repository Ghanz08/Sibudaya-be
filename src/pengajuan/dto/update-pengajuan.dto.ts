import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdatePengajuanPentasDto {
  @ApiPropertyOptional({
    example: 'Pembinaan Sanggar',
    enum: ['Pembinaan Sanggar', 'Pentas Seni'],
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  jenis_kegiatan?: string;

  @ApiPropertyOptional({ example: 'Pentas Seni Tribhuwana 2026' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  judul_kegiatan?: string;

  @ApiPropertyOptional({
    example: 'Melestarikan seni tari tradisional Yogyakarta',
  })
  @IsString()
  @IsOptional()
  tujuan_kegiatan?: string;

  @ApiPropertyOptional({ example: 'Gedung Societet, Yogyakarta' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  lokasi_kegiatan?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsDateString()
  @IsOptional()
  tanggal_mulai?: string;

  @ApiPropertyOptional({ example: '2026-07-03' })
  @IsDateString()
  @IsOptional()
  tanggal_selesai?: string;

  @ApiPropertyOptional({ example: '30000000' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  total_pengajuan_dana?: number;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nomor_rekening?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nama_pemegang_rekening?: string;

  @ApiPropertyOptional({ example: 'Bank Mandiri' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nama_bank?: string;

  @ApiPropertyOptional({ example: 'Jl. Malioboro No. 1, Yogyakarta' })
  @IsString()
  @IsOptional()
  alamat_lembaga?: string;
}

export class UpdatePengajuanHibahDto {
  @ApiPropertyOptional({
    example: 'Gamelan Slendro Pelog',
    enum: ['Gamelan Slendro Pelog', 'Alat Musik Kesenian', 'Pakaian Kesenian'],
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  jenis_kegiatan?: string;

  @ApiPropertyOptional({ example: 'Wayan Sujana' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nama_penerima?: string;

  @ApiPropertyOptional({ example: 'wayan@email.com' })
  @IsEmail()
  @IsOptional()
  email_penerima?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  no_hp_penerima?: string;

  @ApiPropertyOptional({ example: 'Jl. Kaliurang No. 10' })
  @IsString()
  @IsOptional()
  alamat_pengiriman?: string;

  @ApiPropertyOptional({ example: 'Daerah Istimewa Yogyakarta' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  provinsi?: string;

  @ApiPropertyOptional({ example: 'Sleman' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  kabupaten_kota?: string;

  @ApiPropertyOptional({ example: 'Depok' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  kecamatan?: string;

  @ApiPropertyOptional({ example: 'Caturtunggal' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  kelurahan_desa?: string;

  @ApiPropertyOptional({ example: '55281' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  kode_pos?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  catatan?: string;
}

export class BatalkanPengajuanDto {
  @ApiPropertyOptional({
    description: 'Alasan pembatalan oleh pemohon',
    example: 'Memilih membatalkan pengajuan saat ini',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  alasan?: string;
}
