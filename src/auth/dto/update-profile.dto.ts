import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Budi', description: 'Nama depan user' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Santoso',
    description: 'Nama belakang user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email user',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({ example: '081234567890', description: 'Nomor HP' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  no_telp?: string;

  @ApiPropertyOptional({
    example: 'Jl. Malioboro No. 10, Yogyakarta',
    description: 'Alamat user',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
