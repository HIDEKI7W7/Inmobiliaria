import { Injectable, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { hasRealCredential } from './strategies/oauth-profile';

@Injectable()
export class GoogleAuthGuard extends PassportAuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      !hasRealCredential(process.env.GOOGLE_CLIENT_ID) ||
      !hasRealCredential(process.env.GOOGLE_CLIENT_SECRET)
    ) {
      throw new ServiceUnavailableException(
        'El servicio de autenticación con Google no está disponible. ' +
          'Configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET reales en backend/.env ' +
          'y reinicia el servidor para activar el flujo OAuth oficial.',
      );
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}

@Injectable()
export class FacebookAuthGuard extends PassportAuthGuard('facebook') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      !hasRealCredential(process.env.FACEBOOK_APP_ID) ||
      !hasRealCredential(process.env.FACEBOOK_APP_SECRET)
    ) {
      throw new ServiceUnavailableException(
        'El servicio de autenticación con Facebook no está disponible. ' +
          'Configura FACEBOOK_APP_ID y FACEBOOK_APP_SECRET reales en backend/.env ' +
          'y reinicia el servidor para activar el flujo OAuth oficial.',
      );
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}

@Injectable()
export class AppleAuthGuard extends PassportAuthGuard('apple') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      !hasRealCredential(process.env.APPLE_CLIENT_ID) ||
      !hasRealCredential(process.env.APPLE_TEAM_ID)
    ) {
      throw new ServiceUnavailableException(
        'El servicio de autenticación con Apple no está disponible. ' +
          'Configura APPLE_CLIENT_ID y APPLE_TEAM_ID reales en backend/.env ' +
          'y reinicia el servidor para activar el flujo OAuth oficial.',
      );
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
