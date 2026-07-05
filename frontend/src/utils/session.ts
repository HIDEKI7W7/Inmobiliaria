export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  whatsappPhone?: string;
  role: 'ADMIN' | 'AGENTE' | 'PROPIETARIO' | 'ABOGADO' | string;
  objective?: 'COMPRAR' | 'ALQUILAR' | 'VENDER' | null;
  onboardingCompleted?: boolean;
  exp?: number;
}

const TOKEN_KEY = 'propio_token';
// Duración de cookie: 7 días en segundos
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function decodeToken(token: string): JWTPayload | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedString =
      typeof window !== 'undefined'
        ? window.atob(payloadBase64)
        : Buffer.from(payloadBase64, 'base64').toString('utf-8');

    return JSON.parse(decodedString);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

export function getRedirectPathByRole(
  role: string,
  objective?: string | null,
  onboardingCompleted = true,
): string {
  if (!onboardingCompleted && role?.toUpperCase() !== 'ADMIN' && role?.toUpperCase() !== 'AGENTE') {
    return '/onboarding';
  }

  const roleUpper = role?.toUpperCase();

  if (roleUpper === 'ADMIN') {
    return '/admin';
  }

  if (roleUpper === 'AGENTE') {
    return '/agente/kanban';
  }

  if (roleUpper === 'CLIENTE') {
    return '/cliente';
  }

  if (roleUpper === 'PROPIETARIO') {
    if (objective?.toUpperCase() === 'VENDER') {
      return '/propietario/publicar';
    }
    return '/propietario/dashboard';
  }

  // Cualquier otra variante o ausencia de rol devuelve al inicio público
  return '/';
}

/** Lee el valor de una cookie del cliente por nombre. */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

/**
 * Escribe el token en AMBOS sitios de persistencia:
 *  - localStorage (acceso rápido en cliente)
 *  - document.cookie con max-age de 7 días y path=/ (sobrevive F5 y reinicios de pestaña)
 *
 * El middleware de Next.js lee desde la cookie, por lo que ambas fuentes deben estar sincronizadas.
 */
export function saveToken(token: string): void {
  if (typeof window === 'undefined') return;

  // 1. localStorage (lectura rápida en JS)
  localStorage.setItem(TOKEN_KEY, token);

  // 2. Cookie persistente de 7 días leída por el middleware del servidor
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * Obtiene el token con estrategia de doble fuente:
 * 1. Primero intenta desde localStorage (más rápido)
 * 2. Si localStorage está vacío (F5 en sesión privada, limpieza de datos), recupera desde la cookie
 * 3. Si recupera desde cookie, rehidrata localStorage para restaurar la sesión completa
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Fuente primaria: localStorage
  const fromStorage = localStorage.getItem(TOKEN_KEY);
  if (fromStorage) return fromStorage;

  // Fuente fallback: cookie del navegador (sobrevive F5)
  const fromCookie = readCookie(TOKEN_KEY);
  if (fromCookie) {
    // Rehidratar localStorage desde la cookie para normalizar el estado
    try {
      localStorage.setItem(TOKEN_KEY, fromCookie);
    } catch (_e) {
      // localStorage bloqueado (modo privado estricto) — la cookie sigue funcionando
    }
    return fromCookie;
  }

  return null;
}

/**
 * Elimina completamente la sesión de AMBAS fuentes.
 * Solo debe llamarse desde el botón "Cerrar Sesión".
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;

  // Borrar de localStorage
  localStorage.removeItem(TOKEN_KEY);

  // Expirar la cookie de inmediato fijando una fecha pasada
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getCurrentUser(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  // Garantizar que campos obligatorios tengan valores seguros por defecto
  const safePayload: JWTPayload = {
    userId: payload.userId || '',
    email: payload.email || '',
    name: payload.name || '',
    whatsappPhone: payload.whatsappPhone || '',
    role: payload.role || 'PROPIETARIO',
    objective: payload.objective || null,
    onboardingCompleted: payload.onboardingCompleted ?? false,
    exp: payload.exp,
  };

  // Verificar expiración del token — si expiró, limpiar sesión
  if (safePayload.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (safePayload.exp < currentTime) {
      removeToken();
      return null;
    }
  }

  return safePayload;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
