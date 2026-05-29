'use client';

import React from 'react';
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
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased">
      
      {/* SIDEBAR FIJA A LA IZQUIERDA - NO SCROLLABLE */}
      <aside className="w-64 h-full flex-shrink-0 bg-[#04045E] text-white flex flex-col justify-between border-r border-[#04045E]/15 z-30 select-none">
        
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-white/5">
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

            {/* Acción Destacada: Publicar Gratis */}
            <div className="pt-8 px-2">
              <Link
                href="/propietario/nuevo"
                className="flex items-center justify-center gap-2 w-full bg-[#b9fa3c] text-[#04045E] hover:brightness-95 hover:scale-[1.02] transition-all py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-lime-950/20"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Publicar Gratis
              </Link>
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
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center z-20 flex-shrink-0 select-none">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
              {pathname === '/agente' || pathname === '/agente/dashboard' 
                ? 'Resumen General' 
                : pathname.split('/').pop()?.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Servidor Activo</span>
          </div>
        </header>

        {/* LIENZO DE TRABAJO INYECTABLE - TOTALMENTE AISLADO */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
        
      </div>

    </div>
  );
}
