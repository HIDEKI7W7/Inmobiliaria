import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { getBackendUrl, OAuthProfile } from './oauth-profile';
import { VerifyCallback } from 'passport-google-oauth20';

/**
 * FacebookStrategy registers the Passport strategy with placeholder-safe defaults.
 * Real credential validation is enforced at request-time by FacebookAuthGuard,
 * which throws ServiceUnavailableException BEFORE canActivate() reaches this strategy.
 * This prevents a server startup crash when FACEBOOK_APP_ID is not configured.
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID || '__UNCONFIGURED__',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '__UNCONFIGURED__',
      callbackURL: `${getBackendUrl()}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails'],
      scope: ['email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Facebook no devolvió un correo verificable.'), false);
    }

    const user: OAuthProfile = {
      provider: 'FACEBOOK',
      providerId: profile.id,
      email,
      name: profile.displayName,
    };

    return done(null, user);
  }
}
