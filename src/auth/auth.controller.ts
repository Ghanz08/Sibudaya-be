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

const authTokensExample = {
  access_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token-signature',
  refresh_token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-signature',
  user: {
    user_id: 'c6b97f28-6f0f-45d5-bdcf-e3556b094ef8',
    email: 'user@example.com',
    role: 'USER',
    provider: 'LOCAL',
    created_at: '2026-04-16T08:30:00.000Z',
    first_name: 'Budi',
    last_name: 'Santoso',
    no_telp: '081234567890',
    address: 'Jl. Merdeka No. 10, Bandung',
  },
};

const authErrorExample = (
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

  private setAuthCookies(
    res: Response,
    tokens: { access_token: string; refresh_token?: string },
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    if (tokens.refresh_token) {
      res.cookie('refresh_token', tokens.refresh_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  private readCookie(req: { headers?: { cookie?: string } }, name: string) {
    const rawCookie = req.headers?.cookie;
    if (!rawCookie) return null;

    const token = rawCookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.split('=')[1];

    return token ? decodeURIComponent(token) : null;
  }

  // ─── Email & Password ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Register user baru (role: USER)' })
  @ApiResponse({
    status: 201,
    description:
      'Berhasil register, mengembalikan access_token & refresh_token',
    content: {
      'application/json': {
        example: authTokensExample,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email sudah terdaftar',
    content: {
      'application/json': {
        example: authErrorExample(409, 'Email sudah terdaftar', '/api/v1/auth/register'),
      },
    },
  })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @ApiOperation({ summary: 'Login dengan email & password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Berhasil login, mengembalikan access_token & refresh_token',
    content: {
      'application/json': {
        example: authTokensExample,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Email atau password salah',
    content: {
      'application/json': {
        example: authErrorExample(401, 'Unauthorized', '/api/v1/auth/login'),
      },
    },
  })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Req() req: { user: SafeUser },
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(req.user);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  // ─── Token Management ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Tukar refresh_token dengan access_token baru' })
  @ApiBody({
    schema: {
      properties: { refresh_token: { type: 'string' } },
      required: ['refresh_token'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'access_token baru',
    content: {
      'application/json': {
        example: {
          access_token:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-access-token-signature',
        },
      },
    },
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refreshToken(
    @Body('refresh_token') refreshToken: string | undefined,
    @Req() req: { headers?: { cookie?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const effectiveRefreshToken =
      refreshToken ?? this.readCookie(req, 'refresh_token');

    const refreshed = await this.authService.refreshTokens(
      effectiveRefreshToken ?? '',
    );
    this.setAuthCookies(res, refreshed);
    return refreshed;
  }

  // ─── Reset Password ────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Request reset password (kembalikan reset token)' })
  @ApiResponse({
    status: 200,
    description: 'Reset token (di produksi dikirim via email)',
    content: {
      'application/json': {
        example: {
          message:
            'Jika email terdaftar, link reset password akan dikirim ke email kamu.',
        },
      },
    },
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @ApiOperation({ summary: 'Reset password menggunakan token' })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil direset',
    content: {
      'application/json': {
        example: {
          message: 'Password berhasil direset',
        },
      },
    },
  })
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
    this.setAuthCookies(res, req.user);
    const redirectUrl = this.buildGoogleFrontendCallbackUrl(req.user);
    return res.redirect(redirectUrl);
  }

  @ApiOperation({ summary: 'Logout dan hapus auth cookie' })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil',
    content: {
      'application/json': {
        example: { message: 'Logout berhasil' },
      },
    },
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { message: 'Logout berhasil' };
  }

  // ─── Protected Endpoints ──────────────────────────────────────────────────

  @ApiOperation({ summary: 'Ambil data user yang sedang login' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Data user',
    content: {
      'application/json': {
        example: authTokensExample.user,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid',
    content: {
      'application/json': {
        example: authErrorExample(401, 'Unauthorized', '/api/v1/auth/me'),
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: SafeUser) {
    return user;
  }

  @ApiOperation({ summary: 'Update profil user yang sedang login' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Data user setelah update',
    content: {
      'application/json': {
        example: {
          ...authTokensExample.user,
          first_name: 'Budi Update',
          no_telp: '081300000000',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid',
    content: {
      'application/json': {
        example: authErrorExample(401, 'Unauthorized', '/api/v1/auth/me'),
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@CurrentUser() user: SafeUser, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.user_id, dto);
  }

  @ApiOperation({ summary: '[ADMIN & SUPER_ADMIN] Contoh endpoint terbatas' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Berhasil akses endpoint admin',
    content: {
      'application/json': {
        example: {
          message: 'Selamat datang Admin, admin@example.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin-only')
  adminOnly(@CurrentUser() user: SafeUser) {
    return { message: `Selamat datang Admin, ${user.email}`, role: user.role };
  }

  @ApiOperation({ summary: '[SUPER_ADMIN] Contoh endpoint khusus Super Admin' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Berhasil akses endpoint super admin',
    content: {
      'application/json': {
        example: {
          message: 'Halo Super Admin, superadmin@example.com',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @Get('super-admin-only')
  superAdminOnly(@CurrentUser() user: SafeUser) {
    return { message: `Halo Super Admin, ${user.email}` };
  }
}
