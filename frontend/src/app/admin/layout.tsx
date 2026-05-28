'use client';

/**
 * Admin Layout — Next.js App Router
 *
 * Guard de autenticación y autorización:
 * - Sin sesión → /login
 * - Rol PROPIETARIO → /propietario/dashboard   (no tiene acceso al admin)
 * - Rol AGENTE     → /agente/kanban
 * - Solo ADMIN puede acceder a este layout
 *
 * Este layout sobreescribe el RootLayout (no incluye Navbar/Footer globales)
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/utils/session';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace('/login?redirect=/admin');
      return;
    }

    switch (user.role?.toUpperCase()) {
      case 'ADMIN':
        setAuthorized(true);
        break;
      case 'PROPIETARIO':
        router.replace('/propietario/dashboard');
        break;
      case 'AGENTE':
        router.replace('/agente/kanban');
        break;
      default:
        router.replace('/login');
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#04045E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-[#b9fa3c]" />
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold animate-pulse">
            Verificando acceso...
          </p>
        </div>
      </div>
    );
  }

  return (
    // Sobreescribe el layout raíz: sin Navbar ni Footer globales
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      {children}
    </div>
  );
}
