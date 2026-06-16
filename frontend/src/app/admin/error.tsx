'use client';
import { useEffect } from 'react';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[AdminError]', error.message); }, [error]);
  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔐</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Error en el Panel Admin</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Ocurrió un error crítico en el panel de administración. Por seguridad, serás redirigido.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-[#b9fa3c] text-[#0b0b0f] font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
            🔄 Reintentar
          </button>
          <a href="/" className="px-5 py-2.5 border border-white/10 text-gray-300 font-medium rounded-xl text-sm hover:border-white/30 transition-colors">
            🏠 Inicio
          </a>
        </div>
        {error.digest && <p className="mt-4 text-xs text-gray-600 font-mono">Ref: {error.digest}</p>}
      </div>
    </div>
  );
}
