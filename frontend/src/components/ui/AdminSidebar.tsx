'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, removeToken } from '@/utils/session';

type Tab =
  | 'dashboard'
  | 'properties'
  | 'clients'
  | 'owners'
  | 'developers'
  | 'contracts'
  | 'payments'
  | 'expenses'
  | 'reports';

interface AdminSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  counts: {
    properties: number;
    clients: number;
    owners: number;
    developers: number;
    contracts: number;
    payments: number;
    expenses: number;
  };
}

// ─── Micro Icon Components ────────────────────────────────────────────────────
const Icon = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const ICONS: Record<Tab, JSX.Element> = {
  dashboard: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  properties: <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  clients: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  owners: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  developers: <Icon d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" d2="M9 21V12h6v9" />,
  contracts: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  payments: <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  expenses: <Icon d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  reports: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
};

const NAV_ITEMS: { id: Tab; label: string; countKey?: keyof AdminSidebarProps['counts'] }[] = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'properties',  label: 'Propiedades',  countKey: 'properties' },
  { id: 'clients',     label: 'Clientes',     countKey: 'clients' },
  { id: 'owners',      label: 'Propietarios', countKey: 'owners' },
  { id: 'developers',  label: 'Constructoras',countKey: 'developers' },
  { id: 'contracts',   label: 'Contratos',    countKey: 'contracts' },
  { id: 'payments',    label: 'Pagos',        countKey: 'payments' },
  { id: 'expenses',    label: 'Gastos',       countKey: 'expenses' },
  { id: 'reports',     label: 'Reportes' },
];

export const MAP_TAB_TO_SPANISH_PATH: Record<Tab, string> = {
  dashboard: '/admin/dashboard',
  properties: '/admin/propiedades',
  clients: '/admin/clientes',
  owners: '/admin/propietarios',
  developers: '/admin/constructoras',
  contracts: '/admin/contratos',
  payments: '/admin/pagos',
  expenses: '/admin/gastos',
  reports: '/admin/reportes'
};

export const MAP_TAB_TO_ENGLISH_PATH: Record<Tab, string> = {
  dashboard: '/admin/dashboard',
  properties: '/admin/properties',
  clients: '/admin/clients',
  owners: '/admin/owners',
  developers: '/admin/developers',
  contracts: '/admin/contracts',
  payments: '/admin/payments',
  expenses: '/admin/expenses',
  reports: '/admin/reports'
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('admin');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setUserEmail(user.email.split('@')[0]);
    }

    // Cargar estado de colapsado desde localStorage
    const stored = localStorage.getItem('admin_sidebar_collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const handleNav = (tab: Tab) => {
    router.push(MAP_TAB_TO_SPANISH_PATH[tab]);
    if (onTabChange) {
      onTabChange(tab);
    }
    setIsMobileOpen(false);
  };

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('admin_sidebar_collapsed', String(nextVal));
  };

  return (
    <>
      {/* Hamburger btn (mobile only) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#04045E] text-white shadow-lg border border-white/10"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-[#04045E]/40 backdrop-blur-sm z-40"
        />
      )}

      {/* ── SIDEBAR CORPORATIVO COMPASS-STYLE ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-[#04045E] border-r border-white/5
          shadow-2xl shadow-black/20
          transition-all duration-300 ease-in-out
          md:static md:translate-x-0 md:z-auto md:shadow-none
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-64 md:w-16' : 'w-64'}
        `}
      >
        {/* ── BRAND HEADER ── */}
        <div className={`flex items-center px-6 py-5 border-b border-white/5 ${isCollapsed ? 'md:px-3.5 md:justify-center' : ''} h-[76px]`}>
          <div className="flex items-center gap-3 overflow-hidden select-none">
            {/* Isotipo */}
            <div className="flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
                  fill="#b9fa3c"
                />
              </svg>
            </div>
            
            {/* Wordmark (hidden if collapsed on desktop) */}
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0 transition-opacity duration-300 animate-fadeIn">
                <div className="flex items-center gap-0.5">
                  <span className="text-white font-black text-lg tracking-tight leading-none">Propio</span>
                  <span className="text-[#b9fa3c] text-xl font-bold leading-none">.</span>
                </div>
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-[0.15em] block mt-0.5 whitespace-nowrap">
                  Administrador
                </span>
              </div>
            )}
          </div>

          {/* Close (mobile only) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── SECTION LABEL (hidden if collapsed on desktop) ── */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-5 pt-5 pb-2 transition-opacity duration-300 animate-fadeIn">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.18em]">
              Gestión General
            </span>
          </div>
        )}

        {/* ── NAV ITEMS ── */}
        <nav className={`flex-grow px-3 pb-4 space-y-1 overflow-y-auto ${isCollapsed ? 'md:px-2 pt-4' : 'pt-2'}`}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === MAP_TAB_TO_SPANISH_PATH[item.id] ||
                             pathname === MAP_TAB_TO_ENGLISH_PATH[item.id] ||
                             (item.id === 'dashboard' && (pathname === '/admin' || pathname === '/admin/'));
            const count = item.countKey ? counts[item.countKey] : undefined;

            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`
                  group w-full flex items-center rounded-xl text-[11px] font-semibold tracking-wide
                  transition-all duration-200 relative h-10
                  ${isCollapsed ? 'md:justify-center px-0' : 'px-3.5'}
                  ${isActive
                    ? 'bg-white/[0.07] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {/* Micro-borde verde lima activo en la izquierda */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#b9fa3c] rounded-r-full" />
                )}

                {/* Icono */}
                <span className={`transition-colors duration-200 shrink-0 ${isActive ? 'text-[#b9fa3c]' : 'text-slate-500 group-hover:text-slate-350'}`}>
                  {ICONS[item.id]}
                </span>

                {/* Etiqueta de texto (hidden if collapsed on desktop) */}
                {(!isCollapsed || isMobileOpen) && (
                  <span className="ml-3 flex-grow text-left truncate transition-opacity duration-300 animate-fadeIn">{item.label}</span>
                )}

                {/* Badge de conteo (hidden if collapsed on desktop) */}
                {count !== undefined && (!isCollapsed || isMobileOpen) && (
                  <span className={`
                    text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center tabular-nums transition-all
                    ${isActive
                      ? 'bg-[#b9fa3c]/20 text-[#b9fa3c]'
                      : 'bg-white/8 text-slate-400 group-hover:text-white/60'
                    }
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Divisor */}
          <div className={`my-3 border-t border-white/5 ${isCollapsed ? 'mx-1' : 'mx-2'}`} />

          {/* Sitio Público */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={isCollapsed ? 'Ver Sitio Público' : undefined}
            className={`
              group w-full flex items-center rounded-xl text-[11px] font-semibold tracking-wide
              text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 h-10
              ${isCollapsed ? 'md:justify-center px-0' : 'px-3.5'}
            `}
          >
            <span className="text-slate-500 group-hover:text-slate-350 shrink-0">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </span>
            {(!isCollapsed || isMobileOpen) && (
              <span className="ml-3 flex-grow text-left truncate transition-opacity duration-300 animate-fadeIn">Ver Sitio Público</span>
            )}
          </a>
        </nav>

        {/* ── USER / LOGOUT BLOCK ── */}
        <div className={`shrink-0 p-4 border-t border-white/5 bg-[#030352]/40 ${isCollapsed ? 'md:p-2' : ''}`}>
          {/* User profile card (simplified if collapsed) */}
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 ${isCollapsed ? 'md:p-1 md:justify-center' : ''}`}>
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-[#b9fa3c] flex items-center justify-center shrink-0 border border-[#b9fa3c]/35 shadow-sm">
              <span className="text-[#04045E] text-[11px] font-black uppercase">
                {userEmail.slice(0, 2)}
              </span>
            </div>
            {/* Nombre y Rol (hidden if collapsed on desktop) */}
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-grow min-w-0 transition-opacity duration-300 animate-fadeIn">
                <p className="text-white text-[11px] font-bold truncate capitalize">{userEmail}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Admin</p>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Cerrar Sesión' : undefined}
            className={`
              group w-full flex items-center gap-2.5 mt-3 py-2 rounded-xl text-[11px] font-semibold tracking-wide
              text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200
              ${isCollapsed ? 'md:justify-center px-0' : 'px-3.5'}
            `}
          >
            <svg className="w-[16px] h-[16px] shrink-0 text-slate-500 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {(!isCollapsed || isMobileOpen) && (
              <span className="transition-opacity duration-300 animate-fadeIn">Cerrar Sesión</span>
            )}
          </button>
        </div>

        {/* ── COLLAPSE BAR (Desktop only) ── */}
        <div className="hidden md:flex shrink-0 p-2.5 border-t border-white/5 bg-[#03034d]">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center py-1.5 rounded-lg text-slate-450 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
            title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

      </aside>
    </>
  );
};
