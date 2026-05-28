export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'AGENTE' | 'PROPIETARIO' | 'ABOGADO' | string;
  objective?: 'COMPRAR' | 'ALQUILAR' | 'VENDER' | null;
  onboardingCompleted?: boolean;
  exp?: number;
}

const TOKEN_KEY = 'propio_token';

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

  // Cualquier otra variante o ausencia de rol debe devolver al usuario a la página de inicio pública.
  return '/';
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax${
      window.location.protocol === 'https:' ? '; Secure' : ''
    }`;
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function getCurrentUser(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  if (payload.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      removeToken();
      return null;
    }
  }

  return payload;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
