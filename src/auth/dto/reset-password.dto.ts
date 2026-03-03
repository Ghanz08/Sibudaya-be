import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token dari response forgot-password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token wajib diisi' })
  token: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'Password baru minimal 8 karakter',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  newPassword: string;
}
