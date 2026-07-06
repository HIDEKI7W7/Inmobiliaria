import { NextRequest, NextResponse } from 'next/server';
import { resolveApiUrl } from '@/utils/resolveApiUrl';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'El correo electrónico y la contraseña son requeridos.' },
        { status: 400 }
      );
    }

    const backendUrl = resolveApiUrl();

    // Llamar al backend real de NestJS
    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || 'Credenciales inválidas. Verifica tu correo y contraseña.' },
        { status: response.status }
      );
    }

    const { backendToken } = data;
    if (!backendToken) {
      return NextResponse.json(
        { message: 'Error de autenticación: No se recibió token del backend.' },
        { status: 500 }
      );
    }

    nextResponse.cookies.set('propio_token', backendToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // Use 'lax' in both dev and prod to guarantee cross-port and cross-subdomain access
      maxAge: 604800, // 7 días en segundos
      path: '/',
      domain: isProduction ? '.propioinmuebles.com' : undefined, // Allow sharing between www and root domains in prod
    });

    return nextResponse;
  } catch (error: any) {
    console.error('BFF Login Proxy Error:', error);
    return NextResponse.json(
      { message: 'Error interno de comunicación con el backend de autenticación.' },
      { status: 500 }
    );
  }
}
