'use client';

/**
 * Cliente Layout — Next.js App Router
 *
 * Guard de autenticación y autorización para la sección de Clientes:
 * - Sin sesión → /login
 * - Rol CLIENTE → Acceso Autorizado
 * - Rol ADMIN → Acceso Autorizado (como visor o suplantador)
 * - Otros roles → Redirección a sus respectivos dashboards
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/utils/session';

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();

    if (!user) {
      router.replace('/login?redirect=/cliente');
      return;
    }

    const role = user.role?.toUpperCase();
    if (role === 'CLIENTE' || role === 'ADMIN') {
      setAuthorized(true);
    } else if (role === 'PROPIETARIO') {
      router.replace('/propietario/dashboard');
    } else if (role === 'AGENTE') {
      router.replace('/agente/kanban');
    } else {
      router.replace('/login');
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#04045E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-[#b9fa3c]" />
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold animate-pulse">
            Cargando portal de cliente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      {children}
    </div>
  );
}
