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
  ResetAdminPasswordDto,
  UpdateAdminAccountDto,
} from './dto/admin-account.dto';

@ApiTags('Admin - Pengaturan Akun')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin/pengaturan-akun')
export class AdminAccountController {
  constructor(private readonly service: AdminAccountService) {}

  @Get('admins')
  @ApiOperation({ summary: '[SUPER_ADMIN] Daftar akun admin' })
  findAllAdmins() {
    return this.service.findAllAdmins();
  }

  @Get('admins/:user_id')
  @ApiOperation({ summary: '[SUPER_ADMIN] Detail akun admin' })
  @ApiResponse({ status: 404, description: 'Akun admin tidak ditemukan' })
  findAdminById(@Param('user_id') userId: string) {
    return this.service.findAdminById(userId);
  }

  @Post('admins')
  @ApiOperation({ summary: '[SUPER_ADMIN] Buat akun admin baru' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  createAdmin(@Body() dto: CreateAdminAccountDto) {
    return this.service.createAdmin(dto);
  }

  @Patch('admins/:user_id')
  @ApiOperation({ summary: '[SUPER_ADMIN] Update akun admin' })
  @ApiResponse({ status: 404, description: 'Akun admin tidak ditemukan' })
  updateAdmin(
    @Param('user_id') userId: string,
    @Body() dto: UpdateAdminAccountDto,
  ) {
    return this.service.updateAdmin(userId, dto);
  }

  @Patch('admins/:user_id/reset-password')
  @ApiOperation({ summary: '[SUPER_ADMIN] Reset password akun admin' })
  @ApiResponse({ status: 404, description: 'Akun admin tidak ditemukan' })
  resetAdminPassword(
    @Param('user_id') userId: string,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.service.resetAdminPassword(userId, dto);
  }

  @Delete('admins/:user_id')
  @ApiOperation({ summary: '[SUPER_ADMIN] Hapus akun admin' })
  @ApiResponse({ status: 404, description: 'Akun admin tidak ditemukan' })
  deleteAdmin(@Param('user_id') userId: string) {
    return this.service.deleteAdmin(userId);
  }
}
