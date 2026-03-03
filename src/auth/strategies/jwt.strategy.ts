import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

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
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
