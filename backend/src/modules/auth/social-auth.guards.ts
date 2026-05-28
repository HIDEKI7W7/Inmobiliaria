import { Injectable, ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

function hasRealCredential(value: string | undefined): boolean {
  return Boolean(value && !value.startsWith('mock-'));
}

function checkAndRedirect(context: ExecutionContext, provider: string, envVarName: string): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const credential = process.env[envVarName];

  if (!hasRealCredential(credential)) {
    if (!isDevelopment) {
      throw new ServiceUnavailableException(
        `OAuth de ${provider} no disponible: falta configurar credenciales reales (${envVarName}).`,
      );
    }

    const response = context.switchToHttp().getResponse();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    response.redirect(`${frontendUrl}/auth/social-simulator?provider=${provider}`);
    return false;
  }

  return true;
}

@Injectable()
export class GoogleAuthGuard extends PassportAuthGuard('google') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const shouldContinue = checkAndRedirect(context, 'GOOGLE', 'GOOGLE_CLIENT_ID');
    if (!shouldContinue) return false;

    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch {
      const response = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      response.redirect(`${frontendUrl}/auth/social-simulator?provider=GOOGLE&error=auth_failed`);
      return false;
    }
  }
}

@Injectable()
export class FacebookAuthGuard extends PassportAuthGuard('facebook') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const shouldContinue = checkAndRedirect(context, 'FACEBOOK', 'FACEBOOK_APP_ID');
    if (!shouldContinue) return false;

    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch {
      const response = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      response.redirect(`${frontendUrl}/auth/social-simulator?provider=FACEBOOK&error=auth_failed`);
      return false;
    }
  }
}

@Injectable()
export class AppleAuthGuard extends PassportAuthGuard('apple') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const shouldContinue = checkAndRedirect(context, 'APPLE', 'APPLE_CLIENT_ID');
    if (!shouldContinue) return false;

    try {
      const result = await super.canActivate(context);
      return result as boolean;
    } catch {
      const response = context.switchToHttp().getResponse();
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      response.redirect(`${frontendUrl}/auth/social-simulator?provider=APPLE&error=auth_failed`);
      return false;
    }
  }
}
