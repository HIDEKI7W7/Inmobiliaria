'use client';

/**
 * social-simulator/page.tsx
 *
 * LEGACY ROUTE — Simulador eliminado en producción.
 * Esta página ya no sirve ningún flujo OAuth simulado.
 * Redirige automáticamente al inicio de sesión real.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function CountdownSeconds() {
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return <span className="font-black text-slate-300">{seconds}s</span>;
}

export default function SocialSimulatorDisabledPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0b0b0f] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Ambient glows */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full bg-red-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-slate-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-transparent" />

        {/* Icon */}
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <svg className="h-7 w-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-100">
          Simulador Desactivado
        </h1>
        <p className="mt-2 text-xs font-semibold text-red-400 uppercase tracking-widest">
          Función de Desarrollo Eliminada
        </p>

        <p className="mt-5 text-sm text-slate-300 leading-relaxed">
          El simulador de acceso social ha sido{' '}
          <span className="font-bold text-white">desmantelado permanentemente</span>.
          La autenticación ahora se realiza exclusivamente a través de los proveedores OAuth oficiales
          (Google, Apple, Facebook).
        </p>

        <div className="mt-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-left">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            ¿Necesitas acceso OAuth real?
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Configura tus credenciales reales en{' '}
            <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">
              backend/.env
            </code>{' '}
            y reinicia el servidor. El sistema activará automáticamente el flujo oficial.
          </p>
        </div>

        {/* Countdown redirect notice */}
        <p className="mt-6 text-xs text-slate-500 font-medium">
          Serás redirigido a la pantalla de inicio de sesión en{' '}
          <CountdownSeconds />
          ...
        </p>

        <Link
          href="/login"
          className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-sm font-bold text-slate-100 transition-all duration-200 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Ir al Login ahora
        </Link>
      </div>
    </main>
  );
}
