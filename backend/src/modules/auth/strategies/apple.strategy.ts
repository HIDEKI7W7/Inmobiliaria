import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getBackendUrl, OAuthProfile, requireEnv } from './oauth-profile';

// passport-apple no publica tipos TypeScript estables.
const ApplePassportStrategy = require('passport-apple').Strategy;

type AppleIdToken = { sub?: string; email?: string };
type AppleProfile = { id?: string; email?: string; name?: { firstName?: string; lastName?: string } };
type AppleDone = (error: Error | null, user?: OAuthProfile | false) => void;

@Injectable()
export class AppleStrategy extends PassportStrategy(ApplePassportStrategy, 'apple') {
  constructor() {
    super({
      clientID: requireEnv('APPLE_CLIENT_ID'),
      teamID: requireEnv('APPLE_TEAM_ID'),
      keyID: requireEnv('APPLE_KEY_ID'),
      privateKeyString: requireEnv('APPLE_PRIVATE_KEY'),
      callbackURL: `${getBackendUrl()}/api/auth/apple/callback`,
      scope: ['email', 'name'],
      passReqToCallback: false,
    });
  }

  validate(_accessToken: string, _refreshToken: string, idToken: AppleIdToken, profile: AppleProfile, done: AppleDone) {
    const providerId = idToken?.sub || profile?.id;
    const email = idToken?.email || profile?.email;
    const name = profile?.name
      ? [profile.name.firstName, profile.name.lastName].filter(Boolean).join(' ')
      : undefined;

    if (!providerId || !email) {
      return done(new Error('Apple no devolvio un correo verificable.'), false);
    }

    const user: OAuthProfile = {
      provider: 'APPLE',
      providerId,
      email,
      name,
    };

    return done(null, user);
  }
}
