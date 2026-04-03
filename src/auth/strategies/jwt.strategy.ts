import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

function extractCookieToken(
  req: { headers?: { cookie?: string } } | undefined,
  name: string,
): string | null {
  const rawCookie = req?.headers?.cookie;
  if (!rawCookie) return null;

  const token = rawCookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.split('=')[1];

  return token ? decodeURIComponent(token) : null;
}

export interface JwtPayload {
  sub: string; // user_id
  email: string;
  role: string;
}

/**
 * JwtStrategy
 * Memvalidasi access token dari header Authorization: Bearer <token>.
 * Setelah valid, user object ditempel ke req.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { headers?: { cookie?: string } }) =>
          extractCookieToken(req, 'access_token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.users.findUnique({
      where: { user_id: payload.sub },
      select: {
        user_id: true,
        email: true,
        role: true,
        provider: true,
        created_at: true,
        first_name: true,
        last_name: true,
        no_telp: true,
        address: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Token tidak valid atau user tidak ditemukan',
      );
    }

    return user;
  }
}
