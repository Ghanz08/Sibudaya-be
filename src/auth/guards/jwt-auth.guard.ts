import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard
 * Memproteksi endpoint agar hanya bisa diakses dengan Bearer token yang valid.
 * Attach user ke req.user setelah token tervalidasi.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw (
        err ??
        new UnauthorizedException(
          'Akses ditolak. Token tidak valid atau sudah expired.',
        )
      );
    }
    return user;
  }
}
