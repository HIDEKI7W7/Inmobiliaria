'use client';

import React, { useState } from 'react';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all duration-300">
      {/* Área de Autonomía: Paddings amplios para un respiro visual premium */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-4 flex justify-between items-center">
        
        {/* Logo de Propio */}
        <a href="/" className="flex items-center gap-1.5 group select-none">
          <span className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-propio-blue transition-transform duration-300 group-hover:scale-[1.02]">
            Propio
          </span>
          <span className="h-2.5 w-2.5 rounded-full bg-propio-green animate-pulse"></span>
        </a>

        {/* Enlaces de Navegación (Desktop) */}
        <div className="hidden md:flex items-center gap-8 font-sans font-black text-sm uppercase tracking-wider">
          <a href="/" className="text-propio-blue hover:text-propio-green transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-propio-green">
            Inicio
          </a>
          <a href="/properties" className="text-propio-blue hover:text-propio-green transition-colors duration-200 py-2 border-b-2 border-transparent hover:border-propio-green">
            Propiedades
          </a>
          <a href="#" className="text-propio-blue/60 hover:text-propio-blue transition-colors duration-200 py-2 border-b-2 border-transparent">
            Nosotros
          </a>
          <a href="#" className="text-propio-blue/60 hover:text-propio-blue transition-colors duration-200 py-2 border-b-2 border-transparent">
            Blog
          </a>
        </div>

        {/* Botón de Acción / CTA (Desktop) */}
        <div className="hidden md:block">
          <a
            href="/properties"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-propio-green text-propio-blue hover:bg-propio-blue hover:text-propio-green font-heading font-black text-xs uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md border-2 border-propio-green hover:border-propio-blue transition-all duration-300 transform active:scale-95"
          >
            Contacto / Login
          </a>
        </div>

        {/* Botón de Menú Móvil (Hamburger) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-xl text-propio-blue hover:bg-slate-100 transition-all focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menú Móvil Desplegable (Drawer) */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-4 invisible pointer-events-none'
        }`}
      >
        <div className="px-6 py-8 flex flex-col gap-6 font-sans font-black text-sm uppercase tracking-wider">
          <a
            href="/"
            onClick={() => setIsOpen(false)}
            className="text-propio-blue hover:text-propio-green transition-colors duration-200 pb-2 border-b border-slate-50"
          >
            Inicio
          </a>
          <a
            href="/properties"
            onClick={() => setIsOpen(false)}
            className="text-propio-blue hover:text-propio-green transition-colors duration-200 pb-2 border-b border-slate-50"
          >
            Propiedades
          </a>
          <a
            href="#"
            onClick={() => setIsOpen(false)}
            className="text-propio-blue/60 hover:text-propio-blue transition-colors duration-200 pb-2 border-b border-slate-50"
          >
            Nosotros
          </a>
          <a
            href="#"
            onClick={() => setIsOpen(false)}
            className="text-propio-blue/60 hover:text-propio-blue transition-colors duration-200 pb-2 border-b border-slate-50"
          >
            Blog
          </a>
          <a
            href="/properties"
            onClick={() => setIsOpen(false)}
            className="w-full text-center py-3 bg-propio-green text-propio-blue font-heading font-black text-xs uppercase tracking-widest rounded-xl shadow-md border-2 border-propio-green block transition-all"
          >
            Contacto / Login
          </a>
        </div>
      </div>
    </nav>
  );
};
