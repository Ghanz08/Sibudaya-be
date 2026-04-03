import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
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
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthTokens, SafeUser } from './auth.service';
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
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private buildGoogleFrontendCallbackUrl(tokens: AuthTokens): string {
    const configuredFrontends =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const frontendBaseUrl =
      configuredFrontends
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)[0] ?? 'http://localhost:3000';

    const callbackUrl = new URL('/auth/google/callback', frontendBaseUrl);
    callbackUrl.searchParams.set('access_token', tokens.access_token);
    callbackUrl.searchParams.set('refresh_token', tokens.refresh_token);

    return callbackUrl.toString();
  }

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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
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
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @ApiOperation({ summary: 'Reset password menggunakan token' })
  @ApiResponse({ status: 200, description: 'Password berhasil direset' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
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
  googleCallback(@Req() req: { user: AuthTokens }, @Res() res: Response) {
    const redirectUrl = this.buildGoogleFrontendCallbackUrl(req.user);
    return res.redirect(redirectUrl);
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

  @ApiOperation({ summary: 'Update profil user yang sedang login' })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Data user setelah update' })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@CurrentUser() user: SafeUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.user_id, dto);
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
