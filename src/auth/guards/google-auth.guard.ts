import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * GoogleAuthGuard
 * Digunakan pada GET /auth/google untuk memulai OAuth flow.
 * Dan pada GET /auth/google/callback untuk menerima callback dari Google.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
