import { Injectable, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends PassportAuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const credential = process.env.GOOGLE_CLIENT_ID;
    if (!credential || credential.trim() === '' || credential.includes('tu_google_client_id_real')) {
      throw new ServiceUnavailableException('El servicio de autenticación de Google no está disponible (credenciales de OAuth no configuradas).');
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}

@Injectable()
export class FacebookAuthGuard extends PassportAuthGuard('facebook') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const credential = process.env.FACEBOOK_APP_ID;
    if (!credential || credential.trim() === '' || credential.includes('tu_facebook_app_id_real')) {
      throw new ServiceUnavailableException('El servicio de autenticación de Facebook no está disponible (credenciales de OAuth no configuradas).');
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}

@Injectable()
export class AppleAuthGuard extends PassportAuthGuard('apple') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const credential = process.env.APPLE_CLIENT_ID;
    if (!credential || credential.trim() === '' || credential.includes('tu_apple_')) {
      throw new ServiceUnavailableException('El servicio de autenticación de Apple no está disponible (credenciales de OAuth no configuradas).');
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
