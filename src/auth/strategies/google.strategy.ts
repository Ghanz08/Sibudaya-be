import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * GoogleStrategy
 * Menangani OAuth 2.0 Google login.
 * Jika email belum terdaftar → auto register sebagai USER.
 * Jika email sudah ada → login biasa.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { emails, displayName } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('Email tidak tersedia dari Google'), false);
    }

    const user = await this.authService.findOrCreateGoogleUser({
      email,
      name: displayName,
    });

    return done(null, user);
  }
}
