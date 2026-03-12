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
  @ApiProperty({ example: 'Budi', description: 'Nama depan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama depan wajib diisi' })
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Santoso', description: 'Nama belakang' })
  @IsString()
  @IsNotEmpty({ message: 'Nama belakang wajib diisi' })
  @MaxLength(100)
  last_name: string;

  @ApiProperty({
    example: 'Jl. Merdeka No. 1, Yogyakarta',
    description: 'Alamat lengkap',
  })
  @IsString()
  @IsNotEmpty({ message: 'Alamat wajib diisi' })
  address: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email unik pengguna',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor telepon' })
  @IsString()
  @IsNotEmpty({ message: 'Nomor HP wajib diisi' })
  @MaxLength(20)
  no_telp: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password minimal 8 karakter',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(64, { message: 'Password maksimal 64 karakter' })
  password: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Konfirmasi password — harus sama dengan password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirm_password: string;
}
