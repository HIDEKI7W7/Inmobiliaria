'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const Footer = () => {
  const pathname = usePathname();

  // Ocultar Footer en paneles administrativos, login y rutas de agente
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/agente') || pathname === '/login') {
    return null;
  }

  return (
    <footer className="w-full bg-[#04045E] text-white p-10 mt-auto border-t border-[#04045E]/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="font-heading font-black text-xl tracking-tight text-white flex items-center gap-0.5">
            Propio<span className="text-[#b9fa3c] text-2xl leading-none font-bold">.</span>
          </span>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-bold">Inmobiliaria digital inteligente</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-xs text-white/60">
          <span>Email: contacto@propio.com.bo</span>
          <span>Soporte: +591 712 34567</span>
          <span>© 2026 Propio Digital. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
};
