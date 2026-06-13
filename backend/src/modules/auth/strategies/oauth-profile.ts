export type SocialProvider = 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export interface OAuthProfile {
  provider: SocialProvider;
  providerId: string;
  email: string;
  name?: string;
}

/**
 * Checks whether a credential string looks like a real OAuth credential.
 * Real Google Client IDs are 70+ chars; real FB App IDs are 15+ digits.
 * This is checked at request-time inside each Guard, NOT at startup,
 * so the server can start even without social credentials configured
 * (useful when running with email/password only or local dev).
 */
export function hasRealCredential(value: string | undefined): boolean {
  if (!value || value.trim() === '') return false;
  const v = value.trim();
  if (v.length <= 20) return false;
  const FORBIDDEN_FRAGMENTS = [
    'mock-',
    'tu_google',
    'tu_facebook',
    'tu_apple',
    'placeholder',
    'development-',
    'your_',
    'change_me',
    'xxxxxxx',
    'test-credential',
  ];
  return !FORBIDDEN_FRAGMENTS.some((f) => v.toLowerCase().includes(f));
}

/**
 * @deprecated Use hasRealCredential() inside Guards instead.
 * requireEnv was previously called at module-load time and would crash
 * the server if OAuth credentials were absent. Guards now check lazily
 * at request time and throw ServiceUnavailableException gracefully.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[CONFIG ERROR] Variable de entorno requerida "${name}" no está definida.`,
    );
  }
  return value.trim();
}

export function getBackendUrl(): string {
  return process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || 'http://localhost:4000';
}
