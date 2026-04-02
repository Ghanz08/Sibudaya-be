import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
