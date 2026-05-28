'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutAction() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // 1. Invalidación en el servidor
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('El servidor no respondió OK al logout, procediendo con limpieza local.');
      }
    } catch (err) {
      console.error('Error durante la llamada de logout en servidor:', err);
    } finally {
      // 2. Limpieza de cookies del lado del cliente
      document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
      
      // 3. Limpieza de almacenamiento local
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');

      // 4. Redirección síncrona/inmediata al login
      router.replace('/login');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-4 py-3.5 text-xs uppercase font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 flex items-center gap-3 select-none hover:scale-[1.01]"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
      </svg>
      <span>Cerrar Sesión</span>
    </button>
  );
}
