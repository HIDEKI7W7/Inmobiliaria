import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { getBackendUrl, OAuthProfile, requireEnv } from './oauth-profile';
import { VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: requireEnv('FACEBOOK_APP_ID'),
      clientSecret: requireEnv('FACEBOOK_APP_SECRET'),
      callbackURL: `${getBackendUrl()}/api/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'emails'],
      scope: ['email'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Facebook no devolvio un correo verificable.'), false);
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
