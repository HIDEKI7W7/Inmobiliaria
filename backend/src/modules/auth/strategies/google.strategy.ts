import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { getBackendUrl, OAuthProfile, requireEnv } from './oauth-profile';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${getBackendUrl()}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google no devolvio un correo verificable.'), false);
    }

    const user: OAuthProfile = {
      provider: 'GOOGLE',
      providerId: profile.id,
      email,
      name: profile.displayName,
    };

    return done(null, user);
  }
}
