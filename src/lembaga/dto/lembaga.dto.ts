import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLembagaDto {
  @ApiProperty({ example: 'Sanggar Tribhuwana' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nama_lembaga: string;

  @ApiProperty({
    example: 'Sanggar',
    description: 'Sanggar | Paguyuban | Komunitas seni | Lainnya',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  jenis_kesenian: string;

  @ApiProperty({ example: 'Jl. Malioboro No. 1, Yogyakarta' })
  @IsString()
  @IsNotEmpty()
  alamat: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  no_hp: string;

  @ApiProperty({ example: 'sanggar@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class UpdateLembagaDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nama_lembaga?: string;

  @ApiPropertyOptional({
    description: 'Sanggar | Paguyuban | Komunitas seni | Lainnya',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  jenis_kesenian?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  alamat?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(20)
  no_hp?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UploadSertifikatDto {
  @ApiProperty({ example: 'NIK.2024.00001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomor_nik: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsString()
  @IsNotEmpty()
  tanggal_terbit: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsString()
  @IsNotEmpty()
  tanggal_berlaku_sampai: string;
}
