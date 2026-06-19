'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { propertiesService } from '../../services/properties.service';
import { contractsService, Contract } from '../../services/contracts.service';
import { paymentsService, Payment } from '../../services/payments.service';
import { expensesService, Expense } from '../../services/expenses.service';
import { Property } from '../../components/modules/properties/PropertyCard';
import { AdminSidebar, Tab } from '../../components/ui/AdminSidebar';
import { removeToken } from '../../utils/session';

// --- Types & Interfaces ---
interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number; // e.g. 1.5%
  splitPropio: number; // e.g. 50%
  splitAgent: number; // e.g. 50%
  salesVolume: number;
  rating: number;
  status: string;
  dateJoined: string;
}

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  budget: number;
  source: string;
  status: 'PENDIENTE' | 'CONTACTADO' | 'VISITA_AGENDADA' | 'COMPRADO';
  createdAt: string;
}

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  properties: string[]; // List of property titles
  plan: 'Gratis' | 'Contenidos' | 'Venta Pro' | 'Cierre Garantizado';
  status: string;
}

interface Developer {
  id: string;
  name: string;
  nit: string;
  representative: string;
  contact: string;
  stock: number;
  commissionScheme: string;
  stage: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterPlan, setFilterPlan] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modals & Sub-states
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingPlanProperty, setEditingPlanProperty] = useState<Property | null>(null);

  // Excel/PDF Simulation Alert
  const triggerExport = (format: 'Excel' | 'PDF', moduleName: string) => {
    alert(`📥 Exportando datos de ${moduleName} en formato ${format}...`);
  };

  // --- Initial Mock Data for Extended modules ---
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'AGT-2026-001', name: 'Roberto Claros', email: 'roberto@propio.bo', phone: '+591 772 34871', commissionRate: 1.5, splitPropio: 50, splitAgent: 50, salesVolume: 420000, rating: 4.8, status: 'Activo', dateJoined: '2026-01-15' },
    { id: 'AGT-2026-002', name: 'Lucía Arteaga', email: 'lucia@propio.bo', phone: '+591 601 98324', commissionRate: 1.5, splitPropio: 45, splitAgent: 55, salesVolume: 185000, rating: 4.9, status: 'Activo', dateJoined: '2026-02-10' },
    { id: 'AGT-2026-003', name: 'David Choque', email: 'david@propio.bo', phone: '+591 717 44901', commissionRate: 1.5, splitPropio: 50, splitAgent: 50, salesVolume: 95000, rating: 4.5, status: 'Activo', dateJoined: '2026-03-05' },
  ]);

  const [prospects, setProspects] = useState<Prospect[]>([
    { id: 'PR-101', name: 'Mateo Salvatierra', email: 'mateo@mail.com', phone: '+591 707 12345', interest: 'Casa en Cala Cala', budget: 320000, source: 'TikTok', status: 'VISITA_AGENDADA', createdAt: '2026-06-01' },
    { id: 'PR-102', name: 'Gabriela Torrico', email: 'gaby@mail.com', phone: '+591 727 98765', interest: 'Penthouse en Queru Queru', budget: 185000, source: 'WhatsApp', status: 'CONTACTADO', createdAt: '2026-06-12' },
    { id: 'PR-103', name: 'Jorge Siles', email: 'jorge@mail.com', phone: '+591 600 44332', interest: 'Departamento en El Prado', budget: 95000, source: 'Recomendado', status: 'PENDIENTE', createdAt: '2026-06-17' },
  ]);

  const [owners, setOwners] = useState<Owner[]>([
    { id: 'OWN-201', name: 'René Vargas', email: 'rene@mail.com', phone: '+591 798 12345', properties: ['Casa en Cala Cala', 'Terreno Comercial'], plan: 'Venta Pro', status: 'Verificado' },
    { id: 'OWN-202', name: 'Claudia Claure', email: 'clau@mail.com', phone: '+591 712 99887', properties: ['Penthouse en Queru Queru'], plan: 'Cierre Garantizado', status: 'Verificado' },
    { id: 'OWN-203', name: 'Pedro Mendoza', email: 'pedro@mail.com', phone: '+591 700 44332', properties: ['Departamento en El Prado'], plan: 'Gratis', status: 'Pendiente' },
  ]);

  const [developers, setDevelopers] = useState<Developer[]>([
    { id: 'DEV-301', name: 'Alianza Inmobiliaria', nit: '102938470', representative: 'Arq. Javier Ortiz', contact: 'javier@alianza.bo', stock: 18, commissionScheme: '3% Venta Escalonada', stage: 'Preventa Torre A' },
    { id: 'DEV-302', name: 'Constructora Cochabamba', nit: '987654321', representative: 'Ing. Raúl Gómez', contact: 'raul@conscocha.bo', stock: 8, commissionScheme: '2.5% Venta Directa', stage: 'Entrega Inmediata' },
  ]);

  // Production Kanban for Marketing Planes
  const [productionStages, setProductionStages] = useState<Record<string, Property[]>>({
    Nuevo: [],
    Contactado: [],
    Grabado: [],
    Publicado: [],
  });

  // Load backend data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [propsData, contractsData, paymentsData, expensesData] = await Promise.all([
        propertiesService.getProperties(),
        contractsService.getContracts(),
        paymentsService.getPayments(),
        expensesService.getExpenses()
      ]);
      setProperties(propsData);
      setContracts(contractsData);
      setPayments(paymentsData);
      setExpenses(expensesData);

      // Populate Marketing Kanban
      const mockNuevo = propsData.filter(p => !p.isVerified).slice(0, 2);
      const mockContactado = propsData.filter(p => p.isVerified).slice(0, 1);
      const mockGrabado = propsData.filter(p => p.isVerified).slice(1, 2);
      const mockPublicado = propsData.filter(p => p.isVerified).slice(2);
      
      setProductionStages({
        Nuevo: mockNuevo,
        Contactado: mockContactado,
        Grabado: mockGrabado,
        Publicado: mockPublicado
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleApproveProperty = async (id: string) => {
    try {
      await propertiesService.updatePropertyStatus(id, 'APROBADO', undefined, 'mock-admin-token');
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'APROBADO', isVerified: true, verified: true } : p));
      alert('Propiedad aprobada oficialmente para aparecer en el mapa general.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProperty = (id: string) => {
    if (confirm('¿Deseas dar de baja definitivamente este inmueble?')) {
      setProperties(prev => prev.filter(p => p.id !== id));
    }
  };

  // Document checklist traffic lights color mapping
  const getDocBadgeClass = (hasDoc: boolean) => {
    return hasDoc 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
      : 'bg-rose-100 text-rose-800 border-rose-300';
  };

  // Time in market colors (Verde < 30d, Amarillo 30-60d, Rojo > 60d)
  const getMarketTimeClass = (createdAtStr?: string) => {
    if (!createdAtStr) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    const elapsedDays = (Date.now() - new Date(createdAtStr).getTime()) / (1000 * 3600 * 24);
    if (elapsedDays < 30) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (elapsedDays < 60) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-rose-50 border-rose-200 text-rose-700';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased">
      
      {/* 1. LEFT SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        counts={{
          properties: properties.length,
          prospects: prospects.length,
          owners: owners.length,
          developers: developers.length,
          contracts: contracts.length,
          payments: payments.length,
          expenses: expenses.length,
          agents: agents.length
        }}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Fixed Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center z-20 shrink-0 select-none">
          <h1 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
            Consola del Administrador: <span className="text-[#04045E]/60">{activeTab}</span>
          </h1>
          
          <div className="bg-[#04045E]/5 border border-[#04045E]/10 text-[#04045E] px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider">
            🏢 Sucursal Cochabamba
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 relative">
          
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
                <p className="text-xs font-black text-[#04045E] uppercase tracking-widest animate-pulse">Cargando base de datos central...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              
              {/* ========================================== */}
              {/* TAB: DASHBOARD (Home KPIs) */}
              {/* ========================================== */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Inmuebles Activos</span>
                        <span className="text-3xl font-black text-[#04045E] tracking-tight">{properties.length}</span>
                        <span className="block text-[8px] font-bold text-emerald-600">92% verificados</span>
                      </div>
                      <span className="text-2xl">🏠</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Fuerza de Ventas</span>
                        <span className="text-3xl font-black text-[#04045E] tracking-tight">{agents.length}</span>
                        <span className="block text-[8px] font-bold text-emerald-600">3 Agentes asignados</span>
                      </div>
                      <span className="text-2xl">👥</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ingresos del Mes</span>
                        <span className="text-3xl font-black text-[#04045E] tracking-tight">$4,820 <span className="text-xs text-slate-400 font-bold">USD</span></span>
                        <span className="block text-[8px] font-bold text-emerald-600">100% conciliado</span>
                      </div>
                      <span className="text-2xl">💸</span>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center">
                      <div className="space-y-1">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Contratos Registrados</span>
                        <span className="text-3xl font-black text-[#04045E] tracking-tight">{contracts.length}</span>
                        <span className="block text-[8px] font-bold text-emerald-600">100% vigentes</span>
                      </div>
                      <span className="text-2xl">📋</span>
                    </div>
                  </div>

                  {/* Operational Summary */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Bitácora de Eventos Recientes</h3>
                    <div className="space-y-3 divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      <p className="pt-2 flex justify-between"><span>📢 Agente <strong>Roberto Claros</strong> registró un Cierre en Casa en Cala Cala</span> <span className="text-slate-400">Hace 1 hora</span></p>
                      <p className="pt-2 flex justify-between"><span>📄 Propietario <strong>René Vargas</strong> subió Folio Real para validación</span> <span className="text-slate-400">Hace 4 horas</span></p>
                      <p className="pt-2 flex justify-between"><span>💸 Pago de mensualidad conciliado para Contrato #CON-9021</span> <span className="text-slate-400">Ayer</span></p>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PROPERTIES */}
              {/* ========================================== */}
              {activeTab === 'properties' && (
                <div className="space-y-6">
                  {/* Toolbar & Filters */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        placeholder="Buscar propiedad..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none w-48"
                      />
                      <select
                        value={filterPlan}
                        onChange={e => setFilterPlan(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase"
                      >
                        <option value="ALL">Todos los Planes</option>
                        <option value="Gratis">Plan Gratis</option>
                        <option value="Venta Pro">Venta Pro</option>
                        <option value="Cierre Garantizado">Cierre Garantizado</option>
                      </select>
                      <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase"
                      >
                        <option value="ALL">Todos los Estados</option>
                        <option value="NUEVA_PUBLICACION">Pendientes</option>
                        <option value="APROBADO">Aprobados</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => triggerExport('Excel', 'Propiedades')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                      >
                        Exportar Excel 📊
                      </button>
                    </div>
                  </div>

                  {/* List / Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200">
                            <th className="py-4 px-6">Detalles Inmueble</th>
                            <th className="py-4 px-6">Antigüedad Mercado</th>
                            <th className="py-4 px-6">Plan</th>
                            <th className="py-4 px-6">Documentación</th>
                            <th className="py-4 px-6">Estado</th>
                            <th className="py-4 px-6 pr-6 text-right">Herramientas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                          {properties
                            .filter(p => (
                              (filterStatus === 'ALL' || p.status === filterStatus) &&
                              (searchQuery === '' || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            ))
                            .map((p) => {
                              // Time in market background
                              const timeClass = getMarketTimeClass(p.createdAt?.toString());
                              const plan = p.isVerified ? 'Venta Pro' : 'Gratis';
                              return (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                                  <td className="py-4 px-6">
                                    <p className="font-black text-[#04045E] uppercase tracking-tight">{p.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">📍 {p.location}</p>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${timeClass}`}>
                                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Activa'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className="font-bold text-[#04045E] uppercase text-[10px] bg-[#04045E]/5 px-2 py-0.5 rounded-lg border border-[#04045E]/10">
                                      {plan}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex gap-1">
                                      <span className={`text-[8px] font-black border px-1.5 py-0.5 rounded uppercase ${getDocBadgeClass(p.hasFolioReal || false)}`}>FR</span>
                                      <span className={`text-[8px] font-black border px-1.5 py-0.5 rounded uppercase ${getDocBadgeClass(p.hasCatastro || false)}`}>CT</span>
                                      <span className={`text-[8px] font-black border px-1.5 py-0.5 rounded uppercase ${getDocBadgeClass(p.hasTestimonio || false)}`}>TS</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      p.status === 'APROBADO' 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                        : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right pr-6">
                                    <div className="flex justify-end gap-2 items-center">
                                      {p.status === 'NUEVA_PUBLICACION' && (
                                        <button
                                          onClick={() => handleApproveProperty(p.id)}
                                          className="px-2.5 py-1 bg-[#b9fa3c] hover:brightness-95 text-[#04045E] font-black text-[9px] uppercase tracking-wider rounded-lg shadow-xs"
                                        >
                                          Aprobar
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => setEditingPlanProperty(p)}
                                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        title="Editar Plan"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteProperty(p.id)}
                                        className="text-slate-400 hover:text-red-500 text-xs font-bold"
                                        title="Eliminar"
                                      >
                                        🗑️
                                      </button>
                                      <a
                                        href={`https://wa.me/59170000000?text=${encodeURIComponent(`Hola, te escribo del portal Propio para informarte el estado de tu propiedad: "${p.title}".`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-6 h-6 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-full flex items-center justify-center shadow-xs"
                                      >
                                        💬
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: AGENTES */}
              {/* ========================================== */}
              {activeTab === 'agents' && (
                <div className="space-y-6">
                  {/* KPI row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ventas Totales Fuerza</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">$700,000 USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Comisiones Distribuidas</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">$10,500 USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Fuerza de Ventas Activa</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">3 Asesores</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Calificación Promedio</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">⭐ 4.73 / 5.0</span>
                    </div>
                  </div>

                  {/* Dual Tables: Fuerza de ventas & Historial Colaboración */}
                  <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider border-b pb-3 mb-4">Fuerza de Ventas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-3">ID Agente</th>
                            <th className="p-3">Nombre</th>
                            <th className="p-3">Contacto</th>
                            <th className="p-3">Comisión Base</th>
                            <th className="p-3">Reparto (Propio / Agente)</th>
                            <th className="p-3">Ventas</th>
                            <th className="p-3">Rating</th>
                            <th className="p-3 text-right">Herramientas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {agents.map(agt => (
                            <tr key={agt.id}>
                              <td className="p-3 font-bold text-slate-400">{agt.id}</td>
                              <td className="p-3 font-black text-[#04045E] uppercase">{agt.name}</td>
                              <td className="p-3 text-[10px] text-slate-500">{agt.email}<br/>{agt.phone}</td>
                              <td className="p-3 font-black">{agt.commissionRate}%</td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <span className="bg-blue-50 text-[#0066ff] px-2 py-0.5 rounded text-[10px] font-black">🏢 {agt.splitPropio}%</span>
                                  <span className="text-slate-300">/</span>
                                  <span className="bg-[#b9fa3c]/20 text-[#04045E] px-2 py-0.5 rounded text-[10px] font-black">👤 {agt.splitAgent}%</span>
                                </div>
                              </td>
                              <td className="p-3 font-bold">${agt.salesVolume.toLocaleString()} USD</td>
                              <td className="p-3 font-black text-amber-600">⭐ {agt.rating}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setEditingAgent(agt)}
                                  className="text-xs font-bold text-[#0066ff] hover:underline"
                                >
                                  Editar Comisión split
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PROSPECTOS */}
              {/* ========================================== */}
              {activeTab === 'prospects' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Leads</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{prospects.length} Prospectos</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Visitas Agendadas</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">1 Visita</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Procedencia Principal</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">TikTok Ads</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Leads Pendientes</span>
                      <span className="text-2xl font-black text-rose-500 mt-1 block">1 Lead</span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => triggerExport('Excel', 'Prospectos')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      Exportar Excel 📊
                    </button>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-4 pl-6">ID Prospecto</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Propiedad de Interés</th>
                            <th className="p-4">Presupuesto</th>
                            <th className="p-4">Origen</th>
                            <th className="p-4 pr-6 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {prospects.map(pr => (
                            <tr key={pr.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">{pr.id}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{pr.name}</td>
                              <td className="p-4 text-[10px] text-slate-500">{pr.email}<br/>{pr.phone}</td>
                              <td className="p-4 font-bold text-slate-600">{pr.interest}</td>
                              <td className="p-4 font-black">${pr.budget.toLocaleString()} USD</td>
                              <td className="p-4">
                                <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[8px] font-black px-2 py-0.5 rounded uppercase">
                                  {pr.source}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  pr.status === 'VISITA_AGENDADA'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : pr.status === 'CONTACTADO'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {pr.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PROPIETARIOS */}
              {/* ========================================== */}
              {activeTab === 'owners' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Propietarios</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{owners.length} Clientes</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ganancia para PROPIO</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">$12,000 USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Propiedades Activas Propietarios</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">4 Propiedades</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Planes Premium Activos</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">2 Premium</span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => triggerExport('Excel', 'Propietarios')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      Exportar Excel 📊
                    </button>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-4 pl-6">ID Propietario</th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Cartera de Propiedades</th>
                            <th className="p-4">Plan Activo</th>
                            <th className="p-4 pr-6 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {owners.map(own => (
                            <tr key={own.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">{own.id}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{own.name}</td>
                              <td className="p-4 text-[10px] text-slate-500">{own.email}<br/>{own.phone}</td>
                              <td className="p-4">
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 border px-2.5 py-1 rounded-xl font-bold text-[10px]">
                                  🏠 {own.properties.length} Inmuebles
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                  own.plan === 'Cierre Garantizado' 
                                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                    : own.plan === 'Venta Pro'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                  {own.plan}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6 space-x-2">
                                <a
                                  href={`https://wa.me/${own.phone.replace(/[^0-9]/g, '')}?text=Hola`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-block px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase"
                                >
                                  WhatsApp
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: CONSTRUCTORAS */}
              {/* ========================================== */}
              {activeTab === 'developers' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Constructoras Registradas</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{developers.length} Empresas</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Stock Total Asignado</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">26 Departamentos</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Proyectos Activos</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">3 Torres</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Comisión Promedio Pactada</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">2.75% Neto</span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => triggerExport('Excel', 'Constructoras')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      Exportar Excel 📊
                    </button>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-4 pl-6">ID Corporativo</th>
                            <th className="p-4">Empresa</th>
                            <th className="p-4">NIT</th>
                            <th className="p-4">Representante</th>
                            <th className="p-4">Contacto</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4">Esquema Comisión</th>
                            <th className="p-4">Etapa</th>
                            <th className="p-4 pr-6 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {developers.map(dev => (
                            <tr key={dev.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">{dev.id}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{dev.name}</td>
                              <td className="p-4 font-mono">{dev.nit}</td>
                              <td className="p-4 font-bold text-slate-600">{dev.representative}</td>
                              <td className="p-4 text-[10px] text-slate-400">{dev.contact}</td>
                              <td className="p-4 font-black text-emerald-600">{dev.stock} un.</td>
                              <td className="p-4 font-bold">{dev.commissionScheme}</td>
                              <td className="p-4">{dev.stage}</td>
                              <td className="p-4 text-right pr-6">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acreditado</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: CONTRATOS */}
              {/* ========================================== */}
              {activeTab === 'contracts' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Contratos</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{contracts.length} Contratos</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Contratos Vigentes</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">2 Activos</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Vencidos</span>
                      <span className="text-2xl font-black text-rose-500 mt-1 block">0 Contratos</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Por Vencer (30 días)</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">0 Contratos</span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <button
                      onClick={() => triggerExport('Excel', 'Contratos')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      Exportar Excel 📊
                    </button>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-4 pl-6">ID Contrato</th>
                            <th className="p-4">Propiedad</th>
                            <th className="p-4">Arrendatario</th>
                            <th className="p-4">Monto Mensual</th>
                            <th className="p-4">Vigencia</th>
                            <th className="p-4 pr-6 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {contracts.map(cnt => (
                            <tr key={cnt.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">{cnt.id.substring(0, 8).toUpperCase()}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{cnt.propertyId}</td>
                              <td className="p-4 text-slate-700">{cnt.tenantId}</td>
                              <td className="p-4 font-black">${cnt.monthlyAmount.toLocaleString()} USD</td>
                              <td className="p-4 text-slate-400 font-medium">
                                {new Date(cnt.startDate).toLocaleDateString()} - {new Date(cnt.endDate).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-right pr-6">
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border bg-emerald-50 text-emerald-700 border-emerald-250">
                                  VIGENTE
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PAYMENTS (Ingresos) */}
              {/* ========================================== */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ingresos del Mes</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">$4,820 USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Conciliación Pendiente</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">1 Pago</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ingresos Conciliados</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">3 Pagos</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Cobrado Gestión</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">$28,000 USD</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b flex justify-between items-center bg-slate-50/40">
                      <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Historial de Ingresos</h3>
                      <div className="flex gap-2">
                        <span className="bg-[#04045E] text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Agentes PROPIO</span>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Planes Publicidad</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-4 pl-6">ID Ingreso</th>
                            <th className="p-4">Contrato Relacionado</th>
                            <th className="p-4">Monto Cobrado</th>
                            <th className="p-4">Fecha Pago</th>
                            <th className="p-4">Método</th>
                            <th className="p-4">Comprobante</th>
                            <th className="p-4 pr-6 text-right">Conciliación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {payments.map(pay => (
                            <tr key={pay.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">{pay.id.substring(0, 8).toUpperCase()}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{pay.contractId.substring(0, 8).toUpperCase()}</td>
                              <td className="p-4 font-black text-emerald-600">${pay.amount.toLocaleString()} USD</td>
                              <td className="p-4 text-slate-500">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                              <td className="p-4 font-medium">{pay.paymentMethod}</td>
                              <td className="p-4">
                                <button
                                  onClick={() => setSelectedReceipt(`https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80`)}
                                  className="text-xs text-[#0066ff] hover:underline"
                                >
                                  👁️ Ver Comprobante
                                </button>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <button
                                  onClick={() => alert('¡Transacción conciliada con éxito!')}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase"
                                >
                                  Conciliar ✓
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: EXPENSES (Gastos) */}
              {/* ========================================== */}
              {activeTab === 'expenses' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Gastos Totales</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">$1,450 USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Gastos Aprobados</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">$1,200 USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Por Aprobar</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">1 Gasto</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Caja Chica Remanente</span>
                      <span className="text-2xl font-black text-slate-600 mt-1 block">$3,550 USD</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                            <th className="p-4 pl-6">ID Gasto (EGR)</th>
                            <th className="p-4">Concepto</th>
                            <th className="p-4">Categoría</th>
                            <th className="p-4">Monto</th>
                            <th className="p-4">Fecha Registro</th>
                            <th className="p-4 pr-6 text-right">Aprobación checklist</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {expenses.map(exp => (
                            <tr key={exp.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">EGR-{exp.id.substring(0, 5).toUpperCase()}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{exp.concept}</td>
                              <td className="p-4 text-slate-500">{exp.category}</td>
                              <td className="p-4 font-black text-rose-600">-${exp.amount.toLocaleString()} USD</td>
                              <td className="p-4 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                              <td className="p-4 text-right pr-6">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    onChange={() => alert('Gasto aprobado y guardado en auditoría.')}
                                    className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                                  />
                                  <span className="text-[10px] font-bold uppercase text-slate-400">Aprobar EGR</span>
                                </label>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: REPORTS */}
              {/* ========================================== */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  {/* Filters & Downloads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Rango de fechas</label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="bg-slate-50 border px-3 py-2 rounded-xl text-xs w-full focus:outline-none"
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="bg-slate-50 border px-3 py-2 rounded-xl text-xs w-full focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Filtro de Zona (Cochabamba)</label>
                      <select
                        value={selectedZone}
                        onChange={e => setSelectedZone(e.target.value)}
                        className="bg-slate-50 border px-3 py-2 rounded-xl text-xs w-full focus:outline-none"
                      >
                        <option value="ALL">Todas las Zonas</option>
                        <option value="Cala Cala">Cala Cala</option>
                        <option value="Queru Queru">Queru Queru</option>
                        <option value="El Prado">El Prado</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => triggerExport('Excel', 'Reportes')}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center"
                      >
                        Descargar (.xlsx) 📊
                      </button>
                      <button
                        onClick={() => triggerExport('PDF', 'Reportes')}
                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center"
                      >
                        Descargar (.pdf) 📄
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: MARKETING PLANES */}
              {/* ========================================== */}
              {activeTab === 'marketing_planes' && (
                <div className="space-y-6">
                  {/* Digital Contracts Repository */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Repositorio de Contratos Digitales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#04045E]">Contrato_Planes_CalaCala.pdf</p>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">24/05/2026</span>
                        </div>
                        <button onClick={() => alert('Descargando contrato digital...')} className="text-xs font-bold text-[#0066ff]">Descargar</button>
                      </div>
                      <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#04045E]">Contrato_Exclusividad_Queru.pdf</p>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">10/06/2026</span>
                        </div>
                        <button onClick={() => alert('Descargando contrato digital...')} className="text-xs font-bold text-[#0066ff]">Descargar</button>
                      </div>
                    </div>
                  </div>

                  {/* Production Kanban */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Kanban de Producción (Marketing)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {Object.keys(productionStages).map(stageKey => {
                        const items = productionStages[stageKey];
                        return (
                          <div key={stageKey} className="bg-white border rounded-2xl p-4 flex flex-col min-h-[300px] border-t-4 border-t-[#04045E]">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                              <span className="font-black text-xs text-[#04045E] uppercase tracking-wider">{stageKey}</span>
                              <span className="bg-slate-100 text-[#04045E] px-2 py-0.5 rounded text-[10px] font-black">{items.length}</span>
                            </div>
                            <div className="space-y-3 flex-1 overflow-y-auto">
                              {items.map(prop => (
                                <div key={prop.id} className="p-3 border border-slate-100 rounded-xl bg-[#F8FAFC] space-y-2 relative group hover:border-[#b9fa3c]">
                                  <h4 className="text-[11px] font-black text-[#04045E] uppercase tracking-tight leading-tight">{prop.title}</h4>
                                  <div className="flex gap-2 items-center justify-between">
                                    <span className="text-[8px] text-slate-400 font-bold">📍 {prop.location.split(',')[0]}</span>
                                    <a
                                      href="https://wa.me/59170000000"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-5 h-5 bg-[#25D366] text-white rounded-full flex items-center justify-center text-[10px]"
                                    >
                                      💬
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: CONFIG PERMISSIONS */}
              {/* ========================================== */}
              {activeTab === 'config_permissions' && (
                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider border-b pb-3 mb-4">Matriz de Privilegios y Roles</h3>
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
                        <tr>
                          <td className="p-3 font-black text-[#04045E] uppercase">Validación de Propiedades</td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled /></td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-black text-[#04045E] uppercase">Módulo "Mis Cierres"</td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled /></td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-black text-[#04045E] uppercase">Conciliación de Ingresos</td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* MODAL RECEIPT VIEWER */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Comprobante de Pago</h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <img src={selectedReceipt} alt="Comprobante" className="w-full h-64 object-cover rounded-xl border" />
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SPLIT COMMISSION MODAL */}
      {editingAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Editar Reparto de Comisión</h3>
              <button onClick={() => setEditingAgent(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold">
                Define el split de la comisión base de 1.5% para el agente: <strong>{editingAgent.name}</strong>
              </p>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Porcentaje PROPIO (%)</label>
                <input
                  type="number"
                  value={editingAgent.splitPropio}
                  onChange={e => setEditingAgent({ ...editingAgent, splitPropio: parseInt(e.target.value) || 0, splitAgent: 100 - (parseInt(e.target.value) || 0) })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Porcentaje AGENTE (%)</label>
                <input
                  type="number"
                  value={editingAgent.splitAgent}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-400 font-bold"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingAgent(null)}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setAgents(prev => prev.map(a => a.id === editingAgent.id ? editingAgent : a));
                  setEditingAgent(null);
                  alert('¡Split de comisiones modificado con éxito!');
                }}
                className="flex-1 py-2 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase"
              >
                Guardar Split
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlanProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Modificar Plan Inmueble</h3>
              <button onClick={() => setEditingPlanProperty(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold">
                Cambia el plan publicitario del cliente para: <strong>{editingPlanProperty.title}</strong>
              </p>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Plan Publicitario</label>
                <select
                  defaultValue={editingPlanProperty.isVerified ? 'Venta Pro' : 'Gratis'}
                  onChange={e => {
                    const isV = e.target.value === 'Venta Pro';
                    setEditingPlanProperty({ ...editingPlanProperty, isVerified: isV, verified: isV });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-[#04045E] font-black uppercase"
                >
                  <option value="Gratis">Plan Gratis</option>
                  <option value="Contenidos">Plan Contenidos</option>
                  <option value="Venta Pro">Plan Venta Pro</option>
                  <option value="Cierre Garantizado">Plan Cierre Garantizado</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingPlanProperty(null)}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setProperties(prev => prev.map(p => p.id === editingPlanProperty.id ? editingPlanProperty : p));
                  setEditingPlanProperty(null);
                  alert('¡Plan de publicidad modificado con éxito!');
                }}
                className="flex-1 py-2 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase"
              >
                Guardar Plan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
