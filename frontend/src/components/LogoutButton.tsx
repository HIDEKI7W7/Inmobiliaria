'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Llamada POST síncrona a la API del backend
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo completar el logout en el servidor.');
      }

      // 2. Limpieza de estados y almacenamiento local del cliente
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');

      // 3. router.replace('/login') para evitar regresar con el botón de "atrás"
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
      // Fallback local en caso de desconexión
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');
      router.replace('/login');
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className="w-full text-left px-4 py-3 text-xs uppercase font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex items-center gap-3 select-none"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
      </svg>
      {('Cerrar Sesión')}
    </button>
  );
}
