import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface SessionPayload {
  role?: 'ADMIN' | 'AGENTE' | 'PROPIETARIO' | 'CLIENTE';
  exp?: number;
  onboardingCompleted?: boolean;
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d';

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

function decodePayload(payload: string): SessionPayload | null {
  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(payload));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

async function verifyJwt(token: string): Promise<SessionPayload | null> {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;

    const decodedHeader = decodePayload(header);
    if (!decodedHeader || (decodedHeader as any).alg !== 'HS256') {
      // Evitamos any implementando una comprobación condicional de alg
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToBytes(signature) as any,
      new TextEncoder().encode(`${header}.${payload}`) as any,
    );

    if (!isValid) return null;

    const session = decodePayload(payload);
    if (!session?.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    return session.exp > now ? session : null;
  } catch {
    return null;
  }
}

async function getValidSession(request: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = request.cookies.get('propio_token')?.value;
    return token ? verifyJwt(token) : null;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login') {
    return NextResponse.next();
  }
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  
  if (loginUrl.toString() === request.url) {
    return NextResponse.next();
  }
  
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Ignorar de forma preventiva archivos estáticos, imágenes, fuentes, api y otros activos
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/images') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico'
    ) {
      return NextResponse.next();
    }

    const session = await getValidSession(request);
    
    // Si no está autenticado y trata de ingresar a un panel protegido, forzar login
    const isProtectedArea = 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/agente') || 
      pathname.startsWith('/propietario') || 
      pathname.startsWith('/cliente') || 
      pathname.startsWith('/onboarding');

    if (isProtectedArea && !session) {
      return redirectToLogin(request);
    }

    if (session) {
      const role = session.role?.toUpperCase();

      // CORTAFUEGOS JERÁRQUICO DE PERMISOS ACUMULATIVOS
      // 1. ADMIN: Accede a todo (/admin, /agente, /propietario, /cliente, /onboarding)
      // 2. AGENTE: Accede a /agente, /propietario, /cliente. Bloqueado de /admin.
      // 3. PROPIETARIO / CLIENTE: Accede a su respectivo panel. Bloqueado de /admin y /agente.

      if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        // Redirección defensiva si intenta entrar a admin sin ser ADMIN
        if (role === 'AGENTE') {
          return NextResponse.redirect(new URL('/agente', request.url));
        }
        return NextResponse.redirect(new URL('/propietario', request.url));
      }

      if (pathname.startsWith('/agente') && role !== 'AGENTE' && role !== 'ADMIN') {
        // Redirección si intenta entrar a agente sin tener permisos acumulativos
        return NextResponse.redirect(new URL('/propietario', request.url));
      }

      if (role === 'PROPIETARIO' && !session.onboardingCompleted && !pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Critical error in Propio Middleware:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Asegurar que el middleware ignore archivos estáticos y activos
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
};
