import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { SafeUser } from '../auth.service';

type AuthenticatedRequest = Request & {
  user?: SafeUser;
};

/**
 * @CurrentUser()
 * Mengambil objek user yang sudah terautentikasi dari request.
 * Hanya bekerja setelah JwtAuthGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
