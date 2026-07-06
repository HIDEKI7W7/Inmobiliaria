import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Sesión cerrada con éxito.' });
    
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('propio_token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
      domain: isProduction ? '.propioinmuebles.com' : undefined,
    });

    return response;
  } catch (error) {
    console.error('BFF Logout Proxy Error:', error);
    return NextResponse.json(
      { message: 'Error interno al cerrar la sesión.' },
      { status: 500 }
    );
  }
}
