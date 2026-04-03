import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJenisLembagaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama: string;
}

export class UpdateJenisLembagaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama: string;
}

export class CreatePaketDto {
  @IsString()
  @IsNotEmpty()
  nama_paket: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  kuota: number;

  @IsOptional()
  @IsString()
  nilai_bantuan?: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class UpdatePaketDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nama_paket?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  kuota?: number;

  @IsOptional()
  @IsString()
  nilai_bantuan?: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class CreateKuotaDto {
  @IsString()
  @IsNotEmpty()
  nama_paket: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  kuota: number;

  @IsOptional()
  @IsString()
  nilai_bantuan?: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}

export class UpdateKuotaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nama_paket?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  kuota?: number;

  @IsOptional()
  @IsString()
  nilai_bantuan?: string;

  @IsOptional()
  @IsString()
  catatan?: string;
}
