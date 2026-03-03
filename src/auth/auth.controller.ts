import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { SafeUser } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles, Role } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email & Password ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Register user baru (role: USER)' })
  @ApiResponse({
    status: 201,
    description:
      'Berhasil register, mengembalikan access_token & refresh_token',
  })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Login dengan email & password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Berhasil login, mengembalikan access_token & refresh_token',
  })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Req() req: { user: SafeUser }) {
    return this.authService.login(req.user);
  }

  // ─── Token Management ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Tukar refresh_token dengan access_token baru' })
  @ApiBody({
    schema: {
      properties: { refresh_token: { type: 'string' } },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({ status: 200, description: 'access_token baru' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  // ─── Reset Password ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Request reset password (kembalikan reset token)' })
  @ApiResponse({
    status: 200,
    description: 'Reset token (di produksi dikirim via email)',
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @ApiOperation({ summary: 'Reset password menggunakan token' })
  @ApiResponse({ status: 200, description: 'Password berhasil direset' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Redirect ke halaman login Google' })
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleLogin() {}

  @ApiOperation({ summary: 'Callback Google OAuth — mengembalikan JWT tokens' })
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: { user: any }) {
    return req.user;
  }

  // ─── Protected Endpoints ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Ambil data user yang sedang login' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Data user' })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: SafeUser) {
    return user;
  }

  @ApiOperation({ summary: '[ADMIN & SUPER_ADMIN] Contoh endpoint terbatas' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin-only')
  adminOnly(@CurrentUser() user: SafeUser) {
    return { message: `Selamat datang Admin, ${user.email}`, role: user.role };
  }

  @ApiOperation({ summary: '[SUPER_ADMIN] Contoh endpoint khusus Super Admin' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('super-admin-only')
  superAdminOnly(@CurrentUser() user: SafeUser) {
    return { message: `Halo Super Admin, ${user.email}` };
  }
}
