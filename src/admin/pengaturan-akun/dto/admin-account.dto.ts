import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAdminAccountDto {
  @ApiProperty({ example: 'Admin', description: 'Nama depan admin' })
  @IsString()
  @IsNotEmpty({ message: 'Nama depan wajib diisi' })
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Satu', description: 'Nama belakang admin' })
  @IsString()
  @IsNotEmpty({ message: 'Nama belakang wajib diisi' })
  @MaxLength(100)
  last_name: string;

  @ApiPropertyOptional({
    example: 'Jl. Malioboro No. 10, Yogyakarta',
    description: 'Alamat admin',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'admin1@example.com',
    description: 'Email unik admin',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @ApiProperty({ example: '081234567890', description: 'Nomor HP admin' })
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
    description: 'Konfirmasi password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirm_password: string;
}

export class UpdateAdminAccountDto {
  @ApiPropertyOptional({ example: 'Admin', description: 'Nama depan admin' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama depan tidak boleh kosong' })
  @MaxLength(100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Satu', description: 'Nama belakang admin' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama belakang tidak boleh kosong' })
  @MaxLength(100)
  last_name?: string;

  @ApiPropertyOptional({
    example: 'Jl. Malioboro No. 10, Yogyakarta',
    description: 'Alamat admin',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'admin1@example.com',
    description: 'Email unik admin',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({
    example: '081234567890',
    description: 'Nomor HP admin',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nomor HP tidak boleh kosong' })
  @MaxLength(20)
  no_telp?: string;

  @ApiPropertyOptional({
    example: 'PasswordBaru123!',
    description: 'Password baru minimal 8 karakter',
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(64, { message: 'Password maksimal 64 karakter' })
  password?: string;

  @ApiPropertyOptional({
    example: 'PasswordBaru123!',
    description: 'Konfirmasi password baru',
  })
  @IsOptional()
  @IsString()
  confirm_password?: string;
}

export class ResetAdminPasswordDto {
  @ApiProperty({
    example: 'AdminBaru123!',
    description: 'Password baru untuk admin',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(64, { message: 'Password maksimal 64 karakter' })
  new_password: string;

  @ApiProperty({
    example: 'AdminBaru123!',
    description: 'Konfirmasi password baru',
  })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi' })
  confirm_new_password: string;
}
