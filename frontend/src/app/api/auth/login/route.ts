import { NextRequest, NextResponse } from 'next/server';

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

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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

    // Configurar respuesta y cookie HTTP-Only segura
    const nextResponse = NextResponse.json(data);
    const isProduction = process.env.NODE_ENV === 'production';

    nextResponse.cookies.set('propio_token', backendToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 604800, // 7 días en segundos
      path: '/',
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
