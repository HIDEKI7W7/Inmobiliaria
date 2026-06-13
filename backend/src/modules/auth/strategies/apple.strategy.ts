import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { getBackendUrl, OAuthProfile } from './oauth-profile';

// passport-apple no publica tipos TypeScript estables.
const ApplePassportStrategy = require('passport-apple').Strategy;

type AppleIdToken = { sub?: string; email?: string };
type AppleProfile = { id?: string; email?: string; name?: { firstName?: string; lastName?: string } };
type AppleDone = (error: Error | null, user?: OAuthProfile | false) => void;

/**
 * AppleStrategy registers the Passport strategy with placeholder-safe defaults.
 * Real credential validation is enforced at request-time by AppleAuthGuard,
 * which throws ServiceUnavailableException BEFORE canActivate() reaches this strategy.
 * This prevents a server startup crash when APPLE_CLIENT_ID is not configured.
 */
@Injectable()
export class AppleStrategy extends PassportStrategy(ApplePassportStrategy, 'apple') {
  constructor() {
    super({
      clientID: process.env.APPLE_CLIENT_ID || '__UNCONFIGURED__',
      teamID: process.env.APPLE_TEAM_ID || '__UNCONFIGURED__',
      keyID: process.env.APPLE_KEY_ID || '__UNCONFIGURED__',
      privateKeyString: process.env.APPLE_PRIVATE_KEY || '__UNCONFIGURED__',
      callbackURL: `${getBackendUrl()}/api/auth/apple/callback`,
      scope: ['email', 'name'],
      passReqToCallback: false,
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    idToken: AppleIdToken,
    profile: AppleProfile,
    done: AppleDone,
  ) {
    const providerId = idToken?.sub || profile?.id;
    const email = idToken?.email || profile?.email;
    const name = profile?.name
      ? [profile.name.firstName, profile.name.lastName].filter(Boolean).join(' ')
      : undefined;

    if (!providerId || !email) {
      return done(new Error('Apple no devolvió un correo verificable.'), false);
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
