export type SocialProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export interface OAuthProfile {
  provider: SocialProvider;
  providerId: string;
  email: string;
  name?: string;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  
  const isPlaceholder = 
    !value ||
    value.trim() === '' ||
    value.includes('tu_google_client_id_real') ||
    value.includes('tu_google_client_secret_real') ||
    value.includes('tu_facebook_app_id_real') ||
    value.includes('tu_facebook_app_secret_real') ||
    value.includes('tu_apple_') ||
    value.startsWith('development-placeholder-');

  if (isPlaceholder) {
    throw new Error(
      `[FATAL STARTUP ERROR] La variable de entorno de autenticación crítica ${name} no está configurada o mantiene un valor placeholder ("${value || ''}"). La aplicación no puede iniciar en un estado incompleto o inseguro.`
    );
  }

  if (value !== value.trim()) {
    throw new Error(
      `[ERROR DE CONFIGURACIÓN] La variable ${name} contiene espacios en blanco al inicio o al final.\n` +
      `Por favor, limpia el valor en 'backend/.env' para evitar errores de firma OAuth.`
    );
  }

  return value;
}

export function getBackendUrl(): string {
  return process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || 'http://localhost:4000';
}
