import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { getBackendUrl, OAuthProfile } from './oauth-profile';

/**
 * GoogleStrategy registers the Passport strategy with placeholder-safe defaults.
 * Real credential validation is enforced at request-time by GoogleAuthGuard,
 * which throws ServiceUnavailableException BEFORE canActivate() reaches this strategy.
 * This prevents a server startup crash when GOOGLE_CLIENT_ID is not configured.
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '__UNCONFIGURED__',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '__UNCONFIGURED__',
      callbackURL: `${getBackendUrl()}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google no devolvió un correo verificable.'), false);
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
