import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { SafeUser } from '../auth.service';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

type AuthenticatedRequest = Request & {
  user?: SafeUser;
};

/**
 * RolesGuard
 * Digunakan SETELAH JwtAuthGuard untuk memvalidasi role user.
 * Gunakan bersama decorator @Roles(Role.ADMIN).
 *
 * Contoh:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(Role.ADMIN, Role.SUPER_ADMIN)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika tidak ada @Roles decorator, izinkan semua user yang sudah login
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!user) {
      throw new ForbiddenException('User tidak terautentikasi');
    }

    const hasRole = requiredRoles.includes(user.role as Role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Akses ditolak. Role '${user.role}' tidak memiliki izin untuk aksi ini.`,
      );
    }

    return true;
  }
}
