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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ── Pentas ──────────────────────────────────────────────────────────────────

export class CreatePengajuanPentasDto {
  /** jenis_fasilitasi_id = 1 (Pentas) — hardcoded in service */

  @ApiProperty({
    example: 'Pembinaan Sanggar',
    description: 'Jenis paket: Pembinaan Sanggar | Pentas Seni',
    enum: ['Pembinaan Sanggar', 'Pentas Seni'],
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  jenis_kegiatan: string;

  @ApiProperty({ example: 'Pentas Seni Tribhuwana 2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  judul_kegiatan: string;

  @ApiProperty({ example: 'Melestarikan seni tari tradisional Yogyakarta' })
  @IsString()
  @IsNotEmpty()
  tujuan_kegiatan: string;

  @ApiProperty({ example: 'Gedung Societet, Yogyakarta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lokasi_kegiatan: string;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  tanggal_mulai: string;

  @ApiProperty({ example: '2026-07-03' })
  @IsDateString()
  tanggal_selesai: string;

  @ApiProperty({ example: '30000000' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_pengajuan_dana: number;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomor_rekening: string;

  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama_pemegang_rekening: string;

  @ApiProperty({ example: 'Bank Mandiri' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama_bank: string;

  @ApiProperty({ example: 'Jl. Malioboro No. 1, Yogyakarta' })
  @IsString()
  @IsNotEmpty()
  alamat_lembaga: string;
}

// ── Hibah ───────────────────────────────────────────────────────────────────

export class CreatePengajuanHibahDto {
  /** jenis_fasilitasi_id = 2 (Hibah) — hardcoded in service */

  @ApiProperty({
    example: 'Gamelan Slendro Pelog',
    description:
      'Jenis sarana: Gamelan Slendro Pelog | Alat Musik Kesenian | Pakaian Kesenian',
    enum: ['Gamelan Slendro Pelog', 'Alat Musik Kesenian', 'Pakaian Kesenian'],
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  jenis_kegiatan: string;

  @ApiProperty({ example: 'Wayan Sujana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama_penerima: string;

  @ApiProperty({ example: 'wayan@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email_penerima: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  no_hp_penerima: string;

  @ApiProperty({ example: 'Jl. Kaliurang No. 10' })
  @IsString()
  @IsNotEmpty()
  alamat_pengiriman: string;

  @ApiProperty({ example: 'Daerah Istimewa Yogyakarta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provinsi: string;

  @ApiProperty({ example: 'Sleman' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  kabupaten_kota: string;

  @ApiProperty({ example: 'Depok' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  kecamatan: string;

  @ApiProperty({ example: 'Caturtunggal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  kelurahan_desa: string;

  @ApiProperty({ example: '55281' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  kode_pos: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  catatan?: string;
}
