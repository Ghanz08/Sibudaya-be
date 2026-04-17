import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';
import { AdminAccountService } from './admin-account.service';
import {
  CreateAdminAccountDto,
  UpdateAdminAccountDto,
} from './dto/admin-account.dto';

const adminAccountExample = {
  user_id: 'ad14f8b0-7997-4a14-ac0d-faf6d3320edf',
  first_name: 'Admin',
  last_name: 'Satu',
  full_name: 'Admin Satu',
  email: 'admin@example.com',
  no_telp: '081234567890',
  address: 'Jl. Cendana No. 5, Bandung',
  role: 'ADMIN',
  provider: 'LOCAL',
  created_at: '2026-04-16T08:30:00.000Z',
};

const adminErrorExample = (
  statusCode: number,
  message: string | string[],
  path: string,
) => ({
  success: false,
  statusCode,
  message,
  path,
  timestamp: '2026-04-16T08:30:00.000Z',
});

@ApiTags('Admin - Pengaturan Akun')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/pengaturan-akun')
export class AdminAccountController {
  constructor(private readonly service: AdminAccountService) {}

  @Get('admins')
  @ApiOperation({ summary: '[SUPER_ADMIN] Daftar akun admin' })
  @ApiResponse({
    status: 200,
    description: 'Daftar akun admin berhasil diambil',
    content: {
      'application/json': {
        example: [adminAccountExample],
      },
    },
  })
  findAllAdmins() {
    return this.service.findAllAdmins();
  }

  @Get('admins/summary')
  @ApiOperation({ summary: '[SUPER_ADMIN] Ringkasan akun admin untuk beranda' })
  @ApiResponse({
    status: 200,
    description: 'Ringkasan akun admin berhasil diambil',
    content: {
      'application/json': {
        example: {
          statistik: {
            total_admin: 10,
            local_admin: 7,
          },
          admin_terbaru: [adminAccountExample],
        },
      },
    },
  })
  getAdminsSummary() {
    return this.service.getAdminsSummary();
  }

  @Get('admins/:user_id')
  @ApiOperation({ summary: '[SUPER_ADMIN] Detail akun admin' })
  @ApiResponse({
    status: 200,
    description: 'Detail akun admin berhasil diambil',
    content: {
      'application/json': {
        example: adminAccountExample,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Akun admin tidak ditemukan',
    content: {
      'application/json': {
        example: adminErrorExample(
          404,
          'Akun admin tidak ditemukan',
          '/api/v1/admin/pengaturan-akun/admins/unknown-id',
        ),
      },
    },
  })
  findAdminById(@Param('user_id') userId: string) {
    return this.service.findAdminById(userId);
  }

  @Post('admins')
  @ApiOperation({ summary: '[SUPER_ADMIN] Buat akun admin baru' })
  @ApiResponse({
    status: 201,
    description: 'Akun admin berhasil dibuat',
    content: {
      'application/json': {
        example: adminAccountExample,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email sudah terdaftar',
    content: {
      'application/json': {
        example: adminErrorExample(
          409,
          'Email sudah terdaftar',
          '/api/v1/admin/pengaturan-akun/admins',
        ),
      },
    },
  })
  createAdmin(@Body() dto: CreateAdminAccountDto) {
    return this.service.createAdmin(dto);
  }

  @Patch('admins/:user_id')
  @ApiOperation({ summary: '[SUPER_ADMIN] Update akun admin' })
  @ApiResponse({
    status: 200,
    description: 'Akun admin berhasil diperbarui',
    content: {
      'application/json': {
        example: {
          ...adminAccountExample,
          first_name: 'Admin Update',
          full_name: 'Admin Update Satu',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Akun admin tidak ditemukan',
    content: {
      'application/json': {
        example: adminErrorExample(
          404,
          'Akun admin tidak ditemukan',
          '/api/v1/admin/pengaturan-akun/admins/unknown-id',
        ),
      },
    },
  })
  updateAdmin(
    @Param('user_id') userId: string,
    @Body() dto: UpdateAdminAccountDto,
  ) {
    return this.service.updateAdmin(userId, dto);
  }

  @Patch('admins/:user_id/reset-password')
  @ApiOperation({
    summary:
      '[SUPER_ADMIN] Reset password akun admin ke default (ADMIN_DEFAULT_PASSWORD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Password admin berhasil direset',
    content: {
      'application/json': {
        example: { message: 'Password admin berhasil direset' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Akun admin tidak ditemukan',
    content: {
      'application/json': {
        example: adminErrorExample(
          404,
          'Akun admin tidak ditemukan',
          '/api/v1/admin/pengaturan-akun/admins/unknown-id/reset-password',
        ),
      },
    },
  })
  resetAdminPassword(@Param('user_id') userId: string) {
    return this.service.resetAdminPassword(userId);
  }

  @Delete('admins/:user_id')
  @ApiOperation({ summary: '[SUPER_ADMIN] Hapus akun admin' })
  @ApiResponse({
    status: 200,
    description: 'Akun admin berhasil dihapus',
    content: {
      'application/json': {
        example: {
          message: 'Akun admin admin@example.com berhasil dihapus',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Akun admin tidak ditemukan',
    content: {
      'application/json': {
        example: adminErrorExample(
          404,
          'Akun admin tidak ditemukan',
          '/api/v1/admin/pengaturan-akun/admins/unknown-id',
        ),
      },
    },
  })
  deleteAdmin(@Param('user_id') userId: string) {
    return this.service.deleteAdmin(userId);
  }
}
