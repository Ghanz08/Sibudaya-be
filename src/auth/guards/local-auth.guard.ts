import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard
 * Digunakan pada route POST /auth/login.
 * Otomatis memanggil LocalStrategy.validate(email, password).
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
