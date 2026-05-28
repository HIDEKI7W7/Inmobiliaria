import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Obtener token del header de Autorización o de la cookie propio_token
    let token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      token = request.cookies.get('propio_token')?.value;
    }

    if (!token) {
      return NextResponse.json(
        { message: 'No estás autorizado para realizar esta acción. Inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // Llamar al backend real de NestJS
    const response = await fetch(`${backendUrl}/auth/onboarding`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.message || 'No pudimos guardar tu configuración inicial.' },
        { status: response.status }
      );
    }

    const { backendToken } = data;
    const nextResponse = NextResponse.json(data);

    // Si el backend devolvió un nuevo token con los claims actualizados de onboarding y rol,
    // actualizamos la cookie HTTP-Only segura en el navegador
    if (backendToken) {
      const isProduction = process.env.NODE_ENV === 'production';
      nextResponse.cookies.set('propio_token', backendToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 604800, // 7 días
        path: '/',
      });
    }

    return nextResponse;
  } catch (error: any) {
    console.error('BFF Onboarding Proxy Error:', error);
    return NextResponse.json(
      { message: 'Error interno de comunicación con el servidor al guardar el perfil.' },
      { status: 500 }
    );
  }
}
