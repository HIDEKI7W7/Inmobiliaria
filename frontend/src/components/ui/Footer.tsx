'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export const Footer = ({ forceRender }: { forceRender?: boolean } = {}) => {
  const pathname = usePathname();

  // ponytail: YAGNI - Hide Footer on control panels and auth views
  if (!forceRender && (pathname?.startsWith('/admin') || pathname?.startsWith('/agente') || pathname === '/login' || pathname === '/properties')) {
    return null;
  }

  return (
    <footer className="w-full bg-[#000033] text-white py-12 px-6 mt-auto border-t border-white/10 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
        
        {/* Columna Izquierda: Identidad de Marca */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2 select-none">
            {/* Isotipo verde lima oficial */}
            <svg viewBox="0 0 100 100" className="w-8 h-8 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
                fill="#ccff00"
              />
            </svg>
            <span className="font-heading font-black text-xl tracking-tight text-white">Propio</span>
          </div>
          <p className="text-[10px] text-slate-350 font-bold uppercase tracking-wider">
            Hazlo seguro, hazlo tuyo, <span className="text-[#ccff00]">hazlo propio.</span>
          </p>
        </div>

        {/* Columna Central: Redes Sociales */}
        <div className="flex items-center gap-6 justify-center md:pt-1">
          {/* TikTok */}
          <a
            href="https://www.tiktok.com/@propio.inmuebles?_r=1&_t=ZS-97GeWMZ1FA4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#ccff00] transition-colors hover:scale-105 active:scale-95 duration-200"
            aria-label="TikTok"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95.89 2.22 1.48 3.52 1.53.02 1.25.01 2.51.02 3.77-.92-.09-1.83-.4-2.62-.89-.66-.46-1.2-1.1-1.57-1.83v7.35c.07 1.41-.33 2.85-1.17 3.99-.9 1.15-2.28 1.88-3.72 1.93-1.85.1-3.74-.75-4.73-2.31-1.12-1.61-1.15-3.83-.15-5.5.9-1.39 2.45-2.23 4.12-2.14.01 1.28.01 2.56.02 3.84-.71-.05-1.46.22-1.92.79-.53.58-.6 1.53-.16 2.19.46.73 1.39 1.01 2.18.73.54-.2 1-.69 1.15-1.24.06-.5.03-1 .03-1.5V0z"/>
            </svg>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/share/1GfPYDUtCX/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#ccff00] transition-colors hover:scale-105 active:scale-95 duration-200"
            aria-label="Facebook"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
            </svg>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/propioinmuebles?utm_source=qr&igsh=aGVmdGhpNGFvb3Q="
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#ccff00] transition-colors hover:scale-105 active:scale-95 duration-200"
            aria-label="Instagram"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://www.youtube.com/@PropioInmuebles"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#ccff00] transition-colors hover:scale-105 active:scale-95 duration-200"
            aria-label="YouTube"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.107C19.518 3.5 12 3.5 12 3.5s-7.518 0-9.388.556a3.003 3.003 0 00-2.11 2.107C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.107C4.482 20.5 12 20.5 12 20.5s7.518 0 9.388-.556a3.003 3.003 0 002.11-2.107C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>

        {/* Columna Derecha: Contacto y Copyright */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>EMAIL: CONTACTO@PROPIO.COM.BO</span>
          <span>SOPORTE: +591 782 34567</span>
          <span className="text-[9px] text-slate-500 font-semibold tracking-normal mt-1">
            © 2026 PROPIO DIGITAL. TODOS LOS DERECHOS RESERVADOS.
          </span>
        </div>

      </div>
    </footer>
  );
};
