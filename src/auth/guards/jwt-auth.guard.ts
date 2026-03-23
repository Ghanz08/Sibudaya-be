import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { SafeUser } from '../auth.service';

/**
 * JwtAuthGuard
 * Memproteksi endpoint agar hanya bisa diakses dengan Bearer token yang valid.
 * Attach user ke req.user setelah token tervalidasi.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = SafeUser>(
    err: unknown,
    user: TUser,
    info: unknown,
  ): TUser {
    void info;

    if (err) {
      if (err instanceof Error) {
        throw err;
      }

      throw new UnauthorizedException(
        'Akses ditolak. Token tidak valid atau sudah expired.',
      );
    }

    if (!user) {
      throw new UnauthorizedException(
        'Akses ditolak. Token tidak valid atau sudah expired.',
      );
    }

    return user;
  }
}
