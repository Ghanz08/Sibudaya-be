import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email unik pengguna',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password minimal 8 karakter',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(64, { message: 'Password maksimal 64 karakter' })
  password: string;

  @ApiPropertyOptional({ example: 'Budi', description: 'Nama depan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Santoso', description: 'Nama belakang' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({
    example: '081234567890',
    description: 'Nomor telepon',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  no_telp?: string;

  @ApiPropertyOptional({
    example: 'Jl. Merdeka No. 1, Jakarta',
    description: 'Alamat lengkap',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
