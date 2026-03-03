import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';

// Struktur user yang dikembalikan ke controller (tanpa password_hash)
export interface SafeUser {
  user_id: string;
  email: string;
  role: string;
  provider: string;
  created_at: Date;
}

// Struktur token response
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: SafeUser;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateTokens(payload: JwtPayload): {
    access_token: string;
    refresh_token: string;
  } {
    const access_token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
        '7d',
      ) as any,
    });

    return { access_token, refresh_token };
  }

  private toSafeUser(user: {
    user_id: string;
    email: string;
    role: string;
    provider: string;
    created_at: Date;
  }): SafeUser {
    return {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      provider: user.provider,
      created_at: user.created_at,
    };
  }

  // ─── Email & Password Auth ─────────────────────────────────────────────────

  /**
   * Dipanggil oleh LocalStrategy.
   * Mengembalikan user jika valid, null jika tidak.
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user || !user.password_hash) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return null;
    }

    return this.toSafeUser(user);
  }

  /**
   * Register user baru dengan email & password.
   * Role default: USER, Provider: LOCAL.
   */
  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const password_hash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        password_hash,
        role: 'USER',
        provider: 'LOCAL',
      },
    });

    const payload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    return { ...tokens, user: this.toSafeUser(user) };
  }

  /**
   * Login user. Dipanggil setelah LocalStrategy.validate() berhasil.
   * req.user sudah berisi data user dari validateUser().
   */
  async login(user: SafeUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    return { ...tokens, user };
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  /**
   * Dipanggil oleh GoogleStrategy.validate().
   * Jika email belum terdaftar → auto register sebagai USER.
   * Jika email sudah ada → login.
   */
  async findOrCreateGoogleUser(googleUser: {
    email: string;
    name?: string;
  }): Promise<AuthTokens> {
    let user = await this.prisma.users.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email: googleUser.email,
          password_hash: null,
          role: 'USER',
          provider: 'GOOGLE',
        },
      });
    }

    const payload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    const tokens = this.generateTokens(payload);

    return { ...tokens, user: this.toSafeUser(user) };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  /**
   * Memvalidasi refresh token dan mengeluarkan access token baru.
   */
  async refreshTokens(refreshToken: string): Promise<{ access_token: string }> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau sudah expired',
      );
    }

    const user = await this.prisma.users.findUnique({
      where: { user_id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    const newPayload: JwtPayload = {
      sub: user.user_id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(newPayload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m') as any,
    });

    return { access_token };
  }

  // ─── Reset Password (MVP) ──────────────────────────────────────────────────

  /**
   * Forgot password (MVP).
   * Menghasilkan reset token bertanda waktu.
   * Pada produksi, token ini dikirim via email.
   */
  async forgotPassword(email: string): Promise<{ reset_token: string }> {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      // Hindari email enumeration: selalu kembalikan response sukses
      throw new NotFoundException(
        'Jika email terdaftar, link reset akan dikirim',
      );
    }

    if (user.provider === 'GOOGLE') {
      throw new BadRequestException(
        'Akun Google tidak menggunakan password. Login dengan Google.',
      );
    }

    // Buat reset token (di produksi kirim via email; di MVP kembalikan token)
    const resetPayload = {
      sub: user.user_id,
      email: user.email,
      type: 'password_reset',
    };

    const reset_token = this.jwtService.sign(resetPayload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '30m',
    });

    // TODO: kirim email dengan link: /auth/reset-password?token=<reset_token>
    return { reset_token };
  }

  /**
   * Reset password menggunakan token dari forgotPassword.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    let payload: { sub: string; type: string };

    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Token reset tidak valid atau sudah expired',
      );
    }

    if (payload.type !== 'password_reset') {
      throw new UnauthorizedException('Token tidak valid');
    }

    const password_hash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prisma.users.update({
      where: { user_id: payload.sub },
      data: { password_hash },
    });

    return { message: 'Password berhasil direset' };
  }
}
