'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutAction from '@/components/LogoutAction';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

export default function AgenteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/agente/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'Mis Propiedades',
      href: '/agente/propiedades',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Gestión de Leads',
      href: '/agente/leads',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Mis Clientes',
      href: '/agente/clientes',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Mis Cierres',
      href: '/agente/cierres',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Calendario',
      href: '/agente/calendario',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased">
      
      {/* OVERLAY BACKDROP EN MOBILE AL ABRIR LA SIDEBAR */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/45 z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR - MOBILE RESPONSIVE */}
      <aside className={`fixed inset-y-0 left-0 w-64 h-full flex-shrink-0 bg-[#04045E] text-white flex flex-col justify-between border-r border-[#04045E]/15 z-50 select-none transform transition-transform duration-300 md:relative md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 select-none group">
              <svg viewBox="0 0 100 100" className="w-8 h-8 group-hover:scale-105 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
                  fill="#b9fa3c"
                />
              </svg>
              <div className="text-xl font-bold tracking-tight text-white">
                Propio<span className="text-[#b9fa3c] font-black">.</span>
                <span className="block text-[8px] font-bold tracking-widest text-[#b9fa3c] uppercase mt-0.5">Panel del Agente</span>
              </div>
            </Link>

            {/* Cerrar Sidebar en Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1 text-slate-300 hover:text-white rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Menú de Navegación */}
          <nav className="p-4 space-y-1.5 mt-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/agente/dashboard' && pathname === '/agente') ||
                (item.href === '/agente/leads' && pathname === '/agente/kanban');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'border-l-4 border-l-[#b9fa3c] bg-white/10 text-white'
                      : 'border-l-4 border-l-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`${isActive ? 'text-[#b9fa3c]' : 'text-slate-400'}`}>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Acción Destacada: Añadir propiedad + Salir lateral */}
            <div className="pt-8 px-2 flex gap-2">
              <Link
                href="/propietario/nuevo"
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#b9fa3c] text-[#04045E] hover:brightness-95 hover:scale-[1.02] transition-all py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-lime-950/20 text-center"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Añadir propiedad
              </Link>
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch (err) {
                    console.error(err);
                  } finally {
                    document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
                    localStorage.removeItem('propio_token');
                    localStorage.removeItem('propio_user');
                    window.location.href = '/login';
                  }
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-3.5 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center border border-red-500/20"
                title="Cerrar Sesión"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </nav>
        </div>

        {/* Footer Sidebar / Logout */}
        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="px-4 py-2 bg-white/5 rounded-xl text-center">
            <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">Conectado como</span>
            <span className="block text-[10px] font-bold text-white mt-0.5 truncate">Agente Verificado</span>
          </div>
          <LogoutAction />
        </div>

      </aside>

      {/* CONTENEDOR DEL CONTENIDO PRINCIPAL - AISLADO */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Cabecera superior fija - flex-shrink-0 */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex justify-between items-center z-20 flex-shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* Botón Hamburguesa en Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-[#04045E] hover:bg-slate-100 rounded-lg"
              title="Abrir menú"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xs md:text-sm font-black text-[#04045E] uppercase tracking-wider hidden sm:block">
              {pathname === '/agente' || pathname === '/agente/dashboard' 
                ? 'Resumen General' 
                : pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
          </div>

          {/* Calificación de Estrellas e ID del Asesor */}
          <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs select-none">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 text-amber-700 px-2.5 py-1 rounded-xl font-black">
              <span>⭐ 4.9</span>
              <span className="opacity-60 hidden md:inline">Score</span>
            </div>
            
            <div className="bg-[#04045E]/5 border border-[#04045E]/10 text-[#04045E] px-2.5 py-1 rounded-xl font-black uppercase tracking-wider">
              ID: <span className="text-emerald-600">AGT-2026-007</span>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Activo</span>
            </div>
          </div>
        </header>

        {/* LIENZO DE TRABAJO INYECTABLE - TOTALMENTE AISLADO */}
        <main className="flex-1 overflow-y-auto relative p-6 md:p-8">
          {children}
        </main>
        
      </div>

    </div>
  );
}
