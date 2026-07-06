'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, Tab } from '@/components/ui/AdminSidebar';
import { AgentProvider, useAgents } from '@/context/AgentContext';
import { getCurrentUser } from '@/utils/session';

// ==========================================
// [INTERFACES_Y_TIPOS_RBAC]
// ==========================================
export interface UserPermissionModules {
  propiedades: boolean;
  agentes: boolean;
  prospectos: boolean;
  propietarios: boolean;
  constructoras: boolean;
  contratos: boolean;
  ingresos: boolean;
  gastos: boolean;
  reportes: boolean;
  planesMkt: boolean;
}

export interface UserPermission {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  isActive: boolean; // Logical ban flag
  rol: 'ADMINISTRADOR' | 'AGENTE' | 'USUARIO GENERAL';
  modulos: UserPermissionModules;
}

export interface RoleMatrixRow {
  moduloSistema: string;
  admin: boolean;
  agente: boolean;
  propietario: boolean;
  cliente: boolean;
}

const MOCK_USERS_PERMISSIONS: UserPermission[] = [
  {
    id: 'usr-1',
    nombre: 'René Vargas',
    email: 'rene.vargas@propio.com',
    activo: true,
    isActive: true,
    rol: 'ADMINISTRADOR',
    modulos: {
      propiedades: true,
      agentes: true,
      prospectos: true,
      propietarios: true,
      constructoras: true,
      contratos: true,
      ingresos: true,
      gastos: true,
      reportes: true,
      planesMkt: true,
    }
  },
  {
    id: 'usr-2',
    nombre: 'Roberto Claros',
    email: 'roberto.claros@propio.com',
    activo: true,
    isActive: true,
    rol: 'AGENTE',
    modulos: {
      propiedades: true,
      agentes: false,
      prospectos: true,
      propietarios: false,
      constructoras: false,
      contratos: true,
      ingresos: false,
      gastos: false,
      reportes: true,
      planesMkt: false,
    }
  },
  {
    id: 'usr-3',
    nombre: 'Lucía Arteaga',
    email: 'lucia.arteaga@propio.com',
    activo: true,
    isActive: true,
    rol: 'AGENTE',
    modulos: {
      propiedades: true,
      agentes: false,
      prospectos: true,
      propietarios: false,
      constructoras: false,
      contratos: true,
      ingresos: false,
      gastos: false,
      reportes: true,
      planesMkt: false,
    }
  },
  {
    id: 'usr-4',
    nombre: 'Juan Pérez',
    email: 'juan.perez@propio.com',
    activo: true,
    isActive: true,
    rol: 'USUARIO GENERAL',
    modulos: {
      propiedades: true,
      agentes: false,
      prospectos: false,
      propietarios: false,
      constructoras: false,
      contratos: false,
      ingresos: false,
      gastos: false,
      reportes: false,
      planesMkt: false,
    }
  }
];

const ROLE_MATRIX_DATA: RoleMatrixRow[] = [
  {
    moduloSistema: 'VALIDACIÓN DE PROPIEDADES',
    admin: true,
    agente: true,
    propietario: false,
    cliente: false,
  },
  {
    moduloSistema: "MÓDULO 'MIS CIERRES'",
    admin: true,
    agente: true,
    propietario: false,
    cliente: false,
  },
  {
    moduloSistema: 'CONCILIACIÓN DE INGRESOS',
    admin: true,
    agente: false,
    propietario: false,
    cliente: false,
  },
];

const MODULE_KEYS: Array<{ key: keyof UserPermissionModules; label: string }> = [
  { key: 'propiedades', label: 'Propiedades' },
  { key: 'agentes', label: 'Agentes' },
  { key: 'prospectos', label: 'Prospectos' },
  { key: 'propietarios', label: 'Propietarios' },
  { key: 'constructoras', label: 'Constructoras' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'ingresos', label: 'Ingresos' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'reportes', label: 'Reportes' },
  { key: 'planesMkt', label: 'Planes Mkt' },
];

export default function PermisosPage() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propio_admin_agents');
      if (stored) {
        try {
          setAgents(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <AgentProvider value={{ agents, setAgents }}>
      <PermisosDashboard />
    </AgentProvider>
  );
}

function PermisosDashboard() {
  const router = useRouter();
  const { agents } = useAgents();

  // Navigation counts for sidebar sync
  const [counts, setCounts] = useState({
    properties: 0,
    prospects: 0,
    owners: 0,
    developers: 0,
    contracts: 0,
    payments: 0,
    expenses: 0,
    agents: 0,
  });

  const [currentUserEmail, setCurrentUserEmail] = useState('admin');

  // ==========================================
  // [ESTADOS_Y_PERSISTENCIA_PERMISOS]
  // ==========================================
  const [usuariosPermisos, setUsuariosPermisos] = useState<UserPermission[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_admin_users_permissions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error al cargar permisos de LocalStorage:', e);
        }
      }
    }
    return MOCK_USERS_PERMISSIONS;
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('propio_admin_users_permissions', JSON.stringify(usuariosPermisos));
  }, [usuariosPermisos]);

  // Load counts for consistency in sidebar
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setCurrentUserEmail(user.email.split('@')[0]);
    }

    const cachedProps = localStorage.getItem('propio_admin_properties');
    const cachedProspects = localStorage.getItem('propio_admin_prospects');
    const cachedOwners = localStorage.getItem('propio_admin_owners');
    const cachedContracts = localStorage.getItem('propio_admin_contracts');
    const cachedPayments = localStorage.getItem('propio_admin_payments');
    const cachedExpenses = localStorage.getItem('propio_admin_expenses');

    setCounts({
      properties: cachedProps ? JSON.parse(cachedProps).length : 0,
      prospects: cachedProspects ? JSON.parse(cachedProspects).length : 0,
      owners: cachedOwners ? JSON.parse(cachedOwners).length : 0,
      developers: 0,
      contracts: cachedContracts ? JSON.parse(cachedContracts).length : 0,
      payments: cachedPayments ? JSON.parse(cachedPayments).length : 0,
      expenses: cachedExpenses ? JSON.parse(cachedExpenses).length : 0,
      agents: agents.length,
    });
  }, [agents.length]);

  // ==========================================
  // [LOGICA_CRUD_CON_SOFT_DELETE]
  // ==========================================
  const handleCrearUsuario = (data: { nombre: string; email: string; rol: 'ADMINISTRADOR' | 'AGENTE' | 'USUARIO GENERAL'; modulos: UserPermissionModules }) => {
    const nuevo: UserPermission = {
      id: `usr-${Date.now()}`,
      nombre: data.nombre,
      email: data.email,
      activo: true,
      isActive: true,
      rol: data.rol,
      modulos: { ...data.modulos },
    };
    const updated = [...usuariosPermisos, nuevo];
    setUsuariosPermisos(updated);
    localStorage.setItem('propio_admin_users_permissions', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('local-storage'));
    }
    router.refresh();
  };

  const handleEditarUsuario = (id: string, data: { nombre: string; email: string; rol: 'ADMINISTRADOR' | 'AGENTE' | 'USUARIO GENERAL'; modulos: UserPermissionModules }) => {
    const updated = usuariosPermisos.map(u => (u.id === id ? { ...u, nombre: data.nombre, email: data.email, rol: data.rol, modulos: { ...data.modulos } } : u));
    setUsuariosPermisos(updated);
    localStorage.setItem('propio_admin_users_permissions', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('local-storage'));
    }
    router.refresh();
  };

  const handleAlternarAccesoUsuario = (id: string) => {
    const updated = usuariosPermisos.map(u => {
      if (u.id !== id) return u;
      const nextActivo = !u.activo;
      return {
        ...u,
        activo: nextActivo,
        isActive: nextActivo,
      };
    });
    setUsuariosPermisos(updated);
    localStorage.setItem('propio_admin_users_permissions', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('local-storage'));
    }
    router.refresh();
  };

  const handleToggleModuloOptimista = (userId: string, moduloKey: keyof UserPermissionModules) => {
    const updated = usuariosPermisos.map(u => {
      if (u.id !== userId) return u;
      return {
        ...u,
        modulos: {
          ...u.modulos,
          [moduloKey]: !u.modulos[moduloKey],
        },
      };
    });
    setUsuariosPermisos(updated);
    localStorage.setItem('propio_admin_users_permissions', JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('local-storage'));
    }
    router.refresh();
  };

  // Form & Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserPermission | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRol, setFormRol] = useState<'ADMINISTRADOR' | 'AGENTE' | 'USUARIO GENERAL'>('USUARIO GENERAL');
  const [formModulos, setFormModulos] = useState<UserPermissionModules>({
    propiedades: false,
    agentes: false,
    prospectos: false,
    propietarios: false,
    constructoras: false,
    contratos: false,
    ingresos: false,
    gastos: false,
    reportes: false,
    planesMkt: false,
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormNombre('');
    setFormEmail('');
    setFormRol('USUARIO GENERAL');
    setFormModulos({
      propiedades: false,
      agentes: false,
      prospectos: false,
      propietarios: false,
      constructoras: false,
      contratos: false,
      ingresos: false,
      gastos: false,
      reportes: false,
      planesMkt: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserPermission) => {
    setEditingUser(user);
    setFormNombre(user.nombre);
    setFormEmail(user.email);
    setFormRol(user.rol || 'USUARIO GENERAL');
    setFormModulos({ ...user.modulos });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formEmail.trim()) {
      alert('Por favor, completa los campos requeridos.');
      return;
    }

    if (editingUser) {
      handleEditarUsuario(editingUser.id, {
        nombre: formNombre,
        email: formEmail,
        rol: formRol,
        modulos: formModulos,
      });
    } else {
      handleCrearUsuario({
        nombre: formNombre,
        email: formEmail,
        rol: formRol,
        modulos: formModulos,
      });
    }
    setIsModalOpen(false);
  };

  const toggleFormModulo = (key: keyof UserPermissionModules) => {
    setFormModulos(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="flex w-full min-h-screen md:h-screen md:overflow-hidden bg-[#F8FAFC] font-sans antialiased flex-col md:flex-row">
      {/* LEFT SIDEBAR */}
      <AdminSidebar
        activeTab="config_permissions"
        onTabChange={(tab) => {
          if (tab === 'config_permissions') return;
          router.push('/admin');
        }}
        counts={counts}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-h-screen md:h-full md:overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center z-20 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <h1 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
              Control de Accesos y Permisos (RBAC)
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> AÑADIR NUEVO USUARIO
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Admin: {currentUserEmail}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow overflow-y-auto p-8 space-y-8 pb-32">
          {/* Main User Permissions List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                  Matriz de Accesos por Usuario
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Define qué secciones de la barra lateral puede ver y operar cada administrador o agente.
                </p>
              </div>
              <div className="flex gap-2 text-[9px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Activo
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-slate-300" /> Soft Delete / Suspendido
                </span>
              </div>
            </div>

            {/* ========================================== */}
            {/* JSX_TABLA_MATRIZ_POR_USUARIO */}
            {/* ========================================== */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                    <th className="p-3 w-48">Perfil / Usuario</th>
                    {MODULE_KEYS.map(m => (
                      <th key={m.key} className="p-3 text-center w-24">
                        {m.label}
                      </th>
                    ))}
                    <th className="p-3 text-center w-36">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-700">
                  {usuariosPermisos.map(user => (
                    <tr
                      key={user.id}
                      className={`border-b transition-colors ${user.activo ? 'hover:bg-slate-50/80' : 'bg-slate-50/40 text-slate-400'
                        }`}
                    >
                      {/* Primera Columna: Caja de Perfil */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`font-black uppercase text-xs ${user.activo ? 'text-[#04045E]' : 'text-slate-400 line-through'}`}>
                            {user.nombre}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal">{user.email}</span>
                          
                          {/* Role Badge */}
                          <span className={`inline-block text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                            user.rol === 'ADMINISTRADOR'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : user.rol === 'AGENTE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-100 border-slate-250 text-slate-750'
                          }`}>
                            {user.rol || 'USUARIO GENERAL'}
                          </span>

                          {!user.activo && (
                            <span className="inline-block text-[8px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">
                              Suspendido (Histórico)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 10 Columnas de Modulos */}
                      {MODULE_KEYS.map(m => (
                        <td key={m.key} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={user.modulos[m.key]}
                            onChange={() => handleToggleModuloOptimista(user.id, m.key)}
                            disabled={!user.activo}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-400 border-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          />
                        </td>
                      ))}

                      {/* Botones de acción */}
                      <td className="p-3 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleAlternarAccesoUsuario(user.id)}
                            className={`py-1 px-2.5 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer ${user.activo
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                              }`}
                          >
                            {user.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================== */}
          {/* JSX_MATRIZ_GENERAL_PRIVILEGIOS */}
          {/* ========================================== */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                Matriz de Privilegios y Roles Generales
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Políticas globales del sistema no editables para los roles estáticos de la plataforma.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                    <th className="p-3">Módulo del Sistema</th>
                    <th className="p-3 text-center">Administrador</th>
                    <th className="p-3 text-center">Agente</th>
                    <th className="p-3 text-center">Propietario</th>
                    <th className="p-3 text-center">Cliente / Inquilino</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-bold text-slate-700">
                  {ROLE_MATRIX_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-black text-[#04045E] uppercase text-[10px]">
                        {row.moduloSistema}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.admin}
                          readOnly
                          disabled
                          className="w-4 h-4 rounded text-slate-500 border-slate-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.agente}
                          readOnly
                          disabled
                          className="w-4 h-4 rounded text-slate-500 border-slate-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.propietario}
                          readOnly
                          disabled
                          className="w-4 h-4 rounded text-slate-500 border-slate-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={row.cliente}
                          readOnly
                          disabled
                          className="w-4 h-4 rounded text-slate-500 border-slate-300 disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">
                {editingUser ? 'Editar Cuenta y Permisos' : 'Añadir Nueva Cuenta y Permisos'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={formNombre}
                    onChange={e => setFormNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. juan.perez@propio.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                    Rol / Nivel Base
                  </label>
                  <select
                    value={formRol}
                    onChange={e => setFormRol(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="AGENTE">AGENTE</option>
                    <option value="USUARIO GENERAL">USUARIO GENERAL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                  Permisos de Módulos (Acceso a Sidebar)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {MODULE_KEYS.map(m => (
                    <div
                      key={m.key}
                      onClick={() => toggleFormModulo(m.key)}
                      className={`flex flex-col justify-between p-3 rounded-xl border text-center cursor-pointer transition-all ${formModulos[m.key]
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70'
                        }`}
                    >
                      <span className="text-[10px] font-bold block mb-2">{m.label}</span>
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={formModulos[m.key]}
                          onChange={() => { }} // Controlled via card click
                          className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-400 border-slate-300 cursor-pointer pointer-events-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#04045E] hover:bg-[#04045E]/90 text-[#b9fa3c] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
