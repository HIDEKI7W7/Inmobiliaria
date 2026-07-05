'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, removeToken } from '@/utils/session';
import { useAgents } from '@/context/AgentContext';

export type Tab =
  | 'dashboard'
  | 'properties'
  | 'agents'
  | 'prospects'
  | 'owners'
  | 'developers'
  | 'contracts'
  | 'payments'
  | 'expenses'
  | 'reports'
  | 'marketing_planes'
  | 'config_permissions'
  | 'announcements'
  | 'colaboraciones';

interface AdminSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  counts: {
    properties: number;
    prospects: number;
    owners: number;
    developers: number;
    contracts: number;
    payments: number;
    expenses: number;
    agents: number;
  };
}

const Icon = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    {d2 && <path strokeLinecap="round" strokeLinejoin="round" d={d2} />}
  </svg>
);

const ICONS: Record<Tab, JSX.Element> = {
  dashboard: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  properties: <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  agents: <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0-.001h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  prospects: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  owners: <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  developers: <Icon d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" d2="M9 21V12h6v9" />,
  contracts: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  payments: <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  expenses: <Icon d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  reports: <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  marketing_planes: <Icon d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" d2="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />,
  config_permissions: <Icon d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />,
  announcements: <Icon d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  colaboraciones: <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
};

const NAV_ITEMS: { id: Tab; label: string; countKey?: keyof AdminSidebarProps['counts'] }[] = [
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'properties',  label: 'Propiedades',  countKey: 'properties' },
  { id: 'agents',      label: 'Agentes',      countKey: 'agents' },
  { id: 'prospects',   label: 'Prospectos',   countKey: 'prospects' },
  { id: 'owners',      label: 'Propietarios', countKey: 'owners' },
  { id: 'developers',  label: 'Constructoras',countKey: 'developers' },
  { id: 'contracts',   label: 'Contratos',    countKey: 'contracts' },
  { id: 'payments',    label: 'Ingresos',     countKey: 'payments' },
  { id: 'expenses',    label: 'Gastos',       countKey: 'expenses' },
  { id: 'reports',     label: 'Reportes' },
  { id: 'marketing_planes', label: 'Planes de Marketing' },
  { id: 'announcements', label: 'Comunicados' },
  { id: 'colaboraciones', label: 'Colaboraciones' }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const router = useRouter();
  const { agents } = useAgents();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('admin');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState({
    gestioInmobiliaria: true,
    operacionesFinanzas: true,
    administracion: true,
  });

  const isGroupActive = (group: 'gestioInmobiliaria' | 'operacionesFinanzas' | 'administracion') => {
    if (group === 'gestioInmobiliaria') {
      return ['properties', 'owners', 'developers', 'agents', 'prospects'].includes(activeTab);
    }
    if (group === 'operacionesFinanzas') {
      return ['contracts', 'payments', 'expenses', 'colaboraciones'].includes(activeTab);
    }
    if (group === 'administracion') {
      return ['dashboard', 'reports', 'marketing_planes', 'config_permissions', 'announcements'].includes(activeTab);
    }
    return false;
  };

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setUserEmail(user.email.split('@')[0]);
    }

    const stored = localStorage.getItem('admin_sidebar_collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // Auto-expand category containing the activeTab
  useEffect(() => {
    if (['properties', 'owners', 'developers', 'agents', 'prospects'].includes(activeTab)) {
      setExpandedGroups(prev => ({ ...prev, gestioInmobiliaria: true }));
    } else if (['contracts', 'payments', 'expenses'].includes(activeTab)) {
      setExpandedGroups(prev => ({ ...prev, operacionesFinanzas: true }));
    } else if (['dashboard', 'reports', 'marketing_planes', 'config_permissions', 'announcements'].includes(activeTab)) {
      setExpandedGroups(prev => ({ ...prev, administracion: true }));
    }
  }, [activeTab]);

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const handleNav = (tab: Tab) => {
    if (tab === 'marketing_planes') {
      router.push('/admin/planes-mkt');
    } else if (tab === 'announcements') {
      router.push('/admin/comunicados');
    } else {
      if (pathname?.includes('/admin/planes-mkt') || pathname?.includes('/admin/comunicados')) {
        localStorage.setItem('propio_admin_active_tab', tab);
        router.push('/admin');
      } else {
        if (onTabChange) {
          onTabChange(tab);
        }
      }
    }
    setIsMobileOpen(false);
  };

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('admin_sidebar_collapsed', String(nextVal));
  };

  const renderCategoryHeader = (
    label: string, 
    groupKey: 'gestioInmobiliaria' | 'operacionesFinanzas' | 'administracion'
  ) => {
    if (isCollapsed && !isMobileOpen) return null;
    
    const hasActiveChild = isGroupActive(groupKey);

    return (
      <button
        onClick={() => setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
        className={`w-full flex items-center px-3.5 py-2 mt-4 mb-1 text-[10px] font-black uppercase tracking-[0.15em] transition-colors cursor-pointer select-none rounded-lg hover:bg-white/[0.03] text-left ${
          hasActiveChild ? 'text-white' : 'text-white/40'
        }`}
      >
        <span>{label}</span>
      </button>
    );
  };

  const renderNavItem = (item: typeof NAV_ITEMS[number]) => {
    const isActive = activeTab === item.id;
    const count = item.countKey === 'agents' ? agents.length : (item.countKey ? counts[item.countKey] : undefined);

    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.id)}
        title={isCollapsed ? item.label : undefined}
        className={`
          group w-full flex items-center rounded-xl text-[11px] font-semibold tracking-wide
          transition-all duration-200 relative h-9 cursor-pointer
          ${isCollapsed && !isMobileOpen ? 'md:justify-center px-0' : 'px-3.5'}
          ${isActive
            ? 'bg-white/[0.07] text-white shadow-sm font-black'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
          }
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#b9fa3c] rounded-r-full" />
        )}

        <span className={`transition-colors duration-200 shrink-0 ${isActive ? 'text-[#b9fa3c]' : 'text-slate-500 group-hover:text-slate-350'}`}>
          {ICONS[item.id]}
        </span>

        {(!isCollapsed || isMobileOpen) && (
          <span className="ml-3 flex-grow text-left truncate transition-opacity duration-300">{item.label}</span>
        )}

        {count !== undefined && (!isCollapsed || isMobileOpen) && (
          <span className={`
            text-[8px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center tabular-nums transition-all
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
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#04045E] text-white shadow-lg border border-white/10"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-[#04045E]/40 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col h-full shrink-0 select-none
          bg-[#04045E] border-r border-white/5
          shadow-2xl shadow-black/20
          transition-all duration-300 ease-in-out
          md:static md:translate-x-0 md:z-auto md:shadow-none md:shrink-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-64 md:w-16' : 'w-64'}
        `}
      >
        <div className={`flex items-center px-6 py-5 border-b border-white/5 ${isCollapsed ? 'md:px-3.5 md:justify-center' : ''} h-[76px]`}>
          <div className="flex items-center gap-3 overflow-hidden select-none">
            <div className="flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
                  fill="#b9fa3c"
                />
              </svg>
            </div>
            
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

          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        </div>

        {(!isCollapsed || isMobileOpen) && (
          <div className="px-5 pt-4 pb-1 transition-opacity duration-300">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.18em]">
              Gestión General
            </span>
          </div>
        )}

        <nav className={`flex-grow px-3 pb-4 space-y-1 overflow-y-auto ${isCollapsed ? 'md:px-2 pt-2' : 'pt-1'}`}>
          {/* Categoría 1: GESTIÓN INMOBILIARIA */}
          {renderCategoryHeader("🏠 GESTIÓN INMOBILIARIA", "gestioInmobiliaria")}
          <div className={`transition-all duration-300 overflow-hidden ${
            (isCollapsed && !isMobileOpen) || expandedGroups.gestioInmobiliaria 
              ? 'max-h-96 opacity-100' 
              : 'max-h-0 opacity-0'
          } space-y-1`}>
            {NAV_ITEMS.filter(item => ['properties', 'owners', 'developers', 'agents', 'prospects'].includes(item.id)).map(renderNavItem)}
          </div>

          {/* Categoría 2: OPERACIONES Y FINANZAS */}
          {renderCategoryHeader("📊 OPERACIONES Y FINANZAS", "operacionesFinanzas")}
          <div className={`transition-all duration-300 overflow-hidden ${
            (isCollapsed && !isMobileOpen) || expandedGroups.operacionesFinanzas 
              ? 'max-h-96 opacity-100' 
              : 'max-h-0 opacity-0'
          } space-y-1`}>
            {NAV_ITEMS.filter(item => ['contracts', 'payments', 'expenses', 'colaboraciones'].includes(item.id)).map(renderNavItem)}
          </div>

          {/* Categoría 3: ADMINISTRACIÓN */}
          {renderCategoryHeader("📈 ADMINISTRACIÓN", "administracion")}
          <div className={`transition-all duration-300 overflow-hidden ${
            (isCollapsed && !isMobileOpen) || expandedGroups.administracion 
              ? 'max-h-96 opacity-100' 
              : 'max-h-0 opacity-0'
          } space-y-1`}>
            {NAV_ITEMS.filter(item => ['dashboard', 'reports', 'marketing_planes', 'config_permissions', 'announcements'].includes(item.id)).map(renderNavItem)}
          </div>
        </nav>


        <div className={`shrink-0 p-4 border-t border-white/5 bg-[#030352]/40 ${isCollapsed ? 'md:p-2' : ''}`}>
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 ${isCollapsed ? 'md:p-1 md:justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-[#b9fa3c] flex items-center justify-center shrink-0 border border-[#b9fa3c]/35 shadow-sm">
              <span className="text-[#04045E] text-[11px] font-black uppercase">
                {userEmail.slice(0, 2)}
              </span>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex-grow min-w-0 transition-opacity duration-300">
                <p className="text-white text-[11px] font-bold truncate capitalize">{userEmail}</p>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Admin</p>
              </div>
            )}
          </div>

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
              <span className="transition-opacity duration-300">Cerrar Sesión</span>
            )}
          </button>
        </div>

        <div className="hidden md:flex shrink-0 p-2 border-t border-white/5 bg-[#03034d]">
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
