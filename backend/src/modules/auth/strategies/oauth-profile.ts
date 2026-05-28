export type SocialProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export interface OAuthProfile {
  provider: SocialProvider;
  providerId: string;
  email: string;
  name?: string;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  
  // 1. Validación de existencia y placeholders por defecto
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
    console.warn(
      `\n========================================================================\n` +
      `⚠️ [ADVERTENCIA DE DESARROLLO]: ${name} NO ESTÁ CONFIGURADO O TIENE EL VALOR POR DEFECTO!\n` +
      `========================================================================\n` +
      `La variable de entorno ${name} mantiene un marcador de posición o no existe ("${value || ''}").\n` +
      `El inicio de sesión social a través de este proveedor fallará en tiempo de ejecución,\n` +
      `pero el arranque del servidor continuará para permitir el desarrollo local y login por correo.\n` +
      `Para activarlo formalmente:\n` +
      `  1. Configura el ID y el Secreto válidos en 'backend/.env'.\n` +
      `========================================================================\n`
    );
    return `development-placeholder-${name.toLowerCase()}`;
  }

  // 2. Validación de espacios en blanco ocultos (Típico error de copy-paste en Windows)
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
