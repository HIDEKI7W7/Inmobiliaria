import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Sesión cerrada con éxito.' });
    
    // Purgar cookie httpOnly propio_token
    response.cookies.set('propio_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
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
