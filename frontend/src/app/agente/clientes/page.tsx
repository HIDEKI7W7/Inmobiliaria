'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentUser } from '@/utils/session';
import { leadsService } from '../../../services/leads.service';

// ──────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────
interface Client {
  id: string;
  name: string;
  nombre?: string;
  email: string;
  phone: string;
  interest: string;
  budget: number;
  source: string;
  rating: number;
  stage: string;   // reemplaza "status"
  category: 'Propietario' | 'Prospecto';
  categoria?: 'Propietario' | 'Prospecto';
  priority: 'Alta' | 'Media' | 'Baja';
  notes: string;
  agentId: string;
  tipoOperacion?: string[];
  tipoInmueble?: string;
  zona?: string;
}

interface CommissionDeal {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  amount: number | null;
  commission: number | null;
  status: 'CONGELADO' | 'ACTIVO';
}

const SEED_CLIENTS: Client[] = [];

const INITIAL_DEALS: CommissionDeal[] = [];

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
const generateShortId = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return `CLI-${Math.abs(hash).toString(36).substring(0, 5).toUpperCase()}`;
};

const stageColor = (stage: string) => {
  const s = stage.toLowerCase();
  if (s.includes('nuevo'))        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30';
  if (s.includes('contactado'))   return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30';
  if (s.includes('visita'))       return 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/30';
  if (s.includes('negoci'))       return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30';
  if (s.includes('reserva'))      return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30';
  if (s.includes('cerrado'))      return 'bg-[#A3FF33]/15 text-[#6ca818] border-[#A3FF33]/30';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const priorityColor = (p: string) => {
  if (p === 'Alta')  return 'bg-red-50 text-red-600 border-red-100';
  if (p === 'Media') return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-slate-50 text-slate-500 border-slate-200';
};

// ──────────────────────────────────────────────────────────
// Form blank state
// ──────────────────────────────────────────────────────────
const TIPOS_PROPIEDAD_OPTIONS = [
  'Local Comercial',
  'Oficina',
  'Casa',
  'Casa en condominio',
  'Terreno',
  'Propiedad agrícola/ganadera',
  'Edificio',
  'Hotel',
  'Monoambiente',
  'Garzonier',
  'Departamento',
  'Penthouse',
  'Garaje/Baulera',
  'Galpón'
];

// ──────────────────────────────────────────────────────────
// Form blank state
// ──────────────────────────────────────────────────────────
const blankForm = () => ({
  name: '', email: '', phone: '', source: 'RED PROPIO', category: 'Prospecto' as 'Prospecto' | 'Propietario',
  interest: '', budget: '', priority: 'Media' as 'Alta' | 'Media' | 'Baja',
  stage: 'Nuevo' as string, notes: '', propertyId: '', amount: '',
  tipoOperacion: [] as string[],
  tipoInmueble: '',
  zona: '',
});

// ──────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────
export default function AgentClients() {
  const [currentAgentId, setCurrentAgentId] = useState('agent-123');
  const [clients, setClients]   = useState<Client[]>([]);
  const [deals, setDeals]       = useState<CommissionDeal[]>(INITIAL_DEALS);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

  // Filtros
  const [searchQuery, setSearchQuery]     = useState('');
  // [ESTADOS_FILTRADO_Y_BUSQUEDA_CLIENTES]
  const [filterPriority, setFilterPriority]       = useState<'TODOS' | 'ALTA' | 'MEDIA' | 'BAJA'>('TODOS');
  const [filterClientType, setFilterClientType]   = useState('TODOS');   // Tipo de cliente libre
  const [filterRole, setFilterRole]               = useState<'TODOS' | 'PROPIETARIO' | 'PROSPECTO'>('TODOS');
  const [filterTipoOperacion, setFilterTipoOperacion] = useState('TODOS');
  const [filterTipoInmueble, setFilterTipoInmueble]   = useState('TODOS');
  const [filterZona, setFilterZona]                   = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTipoOperacion = (op: string) => {
    const current = form.tipoOperacion || [];
    const next = current.includes(op)
      ? current.filter(o => o !== op)
      : [...current, op];
    setF('tipoOperacion', next);
  };

  // [LOGICA_FILTRO_CRUZADO_CARTERA]
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const zoneQuery = filterZona.toLowerCase().trim();
    return clients.filter((c) => {
      // Búsqueda global: nombre, email, ID o zona
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.zona && c.zona.toLowerCase().includes(q));
      // Prioridad (TODOS omite el filtro)
      const matchPriority =
        filterPriority === 'TODOS' ||
        c.priority.toUpperCase() === filterPriority;
      // Tipo de cliente (origen/source)
      const matchClientType =
        filterClientType === 'TODOS' ||
        c.source.toUpperCase() === filterClientType.toUpperCase();
      // Rol: Propietario / Prospecto
      const matchRole =
        filterRole === 'TODOS' ||
        c.category.toUpperCase() === filterRole;
      // Tipo de Operación
      const matchTipoOperacion =
        filterTipoOperacion === 'TODOS' ||
        (c.tipoOperacion && c.tipoOperacion.includes(filterTipoOperacion));
      // Tipo de Inmueble
      const matchTipoInmueble =
        filterTipoInmueble === 'TODOS' ||
        c.tipoInmueble === filterTipoInmueble;
      // Zona específica
      const matchZona =
        !zoneQuery ||
        (c.zona && c.zona.toLowerCase().includes(zoneQuery));

      return matchQ && matchPriority && matchClientType && matchRole && matchTipoOperacion && matchTipoInmueble && matchZona;
    });
  }, [clients, searchQuery, filterPriority, filterClientType, filterRole, filterTipoOperacion, filterTipoInmueble, filterZona]);

  // Legacy alias para el conteo visible
  const filtered = filteredClients;

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    const user = getCurrentUser();
    const id = (user as any)?.id || 'agent-123';
    setCurrentAgentId(id);

    leadsService.getAgentDeals().then(setDeals).catch(() => {});
  }, []);

  useEffect(() => {
    const loadFromStorage = () => {
      const local = localStorage.getItem('propio_admin_users_permissions');
      let loaded: Client[] = [];
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            loaded = parsed.map((item: any) => ({
              ...item,
              name: item.name || item.nombre || '',
              nombre: item.nombre || item.name || '',
              category: item.category || item.categoria || 'Prospecto',
              categoria: item.categoria || item.category || 'Prospecto',
            }));
          }
        } catch {}
      }

      const clientsOnly = loaded.filter(c => c.category || c.categoria);
      if (clientsOnly.length > 0) {
        setClients(clientsOnly);
      } else {
        const seed = SEED_CLIENTS.filter(c => c.agentId === currentAgentId).map(c => ({
          ...c,
          nombre: c.name,
          categoria: c.category,
        }));
        let fullList = [...loaded];
        seed.forEach(s => {
          if (!fullList.some(x => x.id === s.id)) {
            fullList.push(s);
          }
        });
        setClients(seed);
        localStorage.setItem('propio_admin_users_permissions', JSON.stringify(fullList));
        window.dispatchEvent(new Event('local-storage'));
      }
    };

    loadFromStorage();

    window.addEventListener('local-storage', loadFromStorage);
    window.addEventListener('storage', loadFromStorage);
    return () => {
      window.removeEventListener('local-storage', loadFromStorage);
      window.removeEventListener('storage', loadFromStorage);
    };
  }, [currentAgentId]);

  const persist = (next: Client[]) => {
    setClients(next);
    let fullList: any[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propio_admin_users_permissions');
      if (stored) {
        try {
          fullList = JSON.parse(stored);
        } catch {}
      }
    }
    const nonClients = fullList.filter(item => !(item.category || item.categoria));
    const clientsWithAliases = next.map(c => ({
      ...c,
      nombre: c.name,
      categoria: c.category,
    }));
    const merged = [...nonClients, ...clientsWithAliases];
    localStorage.setItem('propio_admin_users_permissions', JSON.stringify(merged));
    window.dispatchEvent(new Event('local-storage'));
  };



  // ── WhatsApp ──────────────────────────────────────────────
  const triggerWhatsApp = (cli: Client) => {
    const rawPhone = cli.phone.replace(/[^0-9+]/g, '');
    const custom   = customMessages[cli.id]?.trim();
    const text     = custom || `Hola ${cli.name}, te saluda tu Asesor Comercial de Propio. Quería dar seguimiento a tu interés en "${cli.interest}" (Presupuesto: $${cli.budget.toLocaleString()} USD).`;
    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // ── Registrar cliente ─────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones estrictas
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      newErrors.name = 'El campo Nombre es requerido';
    }
    if (!form.email.trim()) {
      newErrors.email = 'El campo Email es requerido';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'El campo Celular es requerido';
    }
    if (!form.category) {
      newErrors.category = 'El campo Categoría es requerido';
    }
    if (!form.tipoInmueble) {
      newErrors.tipoInmueble = 'El campo Tipo de Inmueble es requerido';
    }
    if (!form.zona.trim()) {
      newErrors.zona = 'El campo Zona es requerido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    // Intentar backend; si falla → local
    let linkedPropertyTitle = form.interest || 'Propiedad de cartera';
    try {
      if (form.propertyId && form.amount) {
        const responseDeal = await leadsService.registerDeal(form.propertyId, form.name, parseFloat(form.amount));
        linkedPropertyTitle = responseDeal.propertyTitle || linkedPropertyTitle;
        setDeals(prev => {
          const exists = prev.find(d => d.propertyId === form.propertyId);
          const updated: CommissionDeal = {
            id: responseDeal.id || `deal-${Date.now()}`,
            propertyId: form.propertyId,
            propertyTitle: linkedPropertyTitle,
            clientName: form.name,
            amount: parseFloat(form.amount),
            commission: parseFloat(form.amount) * 0.03,
            status: 'ACTIVO',
          };
          return exists ? prev.map(d => d.propertyId === form.propertyId ? updated : d) : [updated, ...prev];
        });
      }
    } catch {}

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      agentId: currentAgentId,
      name:    form.name,
      email:   form.email,
      phone:   form.phone,
      source:  form.source,
      category: form.category,
      interest: linkedPropertyTitle,
      budget:  parseFloat(form.amount) || parseFloat(form.budget as string) || 0,
      priority: form.priority,
      stage:   form.stage,
      notes:   form.notes,
      rating:  5,
      tipoOperacion: form.tipoOperacion,
      tipoInmueble: form.tipoInmueble,
      zona: form.zona,
    };

    // POST backend (no-op si falla, ya guardamos localmente)
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newClient.name, email: newClient.email, phone: newClient.phone,
          source: newClient.source, category: newClient.category,
          interest: newClient.interest, budget: newClient.budget,
          priority: newClient.priority, stage: newClient.stage, notes: newClient.notes,
        }),
      });
    } catch {}

    persist([newClient, ...clients]);
    setForm(blankForm());
    setErrors({});
    setShowModal(false);
    setSaving(false);
  };

  const setF = (key: string, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            MIS CLIENTES
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            🔒 Cartera individual aislada. Solo visualizas tus propios leads y transacciones.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(blankForm());
            setErrors({});
            setShowModal(true);
          }}
          className="px-6 py-3.5 bg-[#b9fa3c] text-[#04045E] hover:brightness-95 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl shadow-md"
        >
          ➕ Registrar Cliente
        </button>
      </div>

      {/* PIPELINE DE COMISIONES */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-black text-xs text-[#04045E] uppercase tracking-wider">Pipeline de Comisiones del Mes</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Las comisiones permanecen congeladas hasta registrar el cliente, propiedad y monto final.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal) => (
            <div key={deal.id} className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${deal.status === 'ACTIVO' ? 'bg-emerald-500/5 border-emerald-200' : 'bg-slate-50/50 border-slate-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[11px] font-black text-[#04045E] uppercase tracking-tight">{deal.propertyTitle}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Asociado a: {deal.clientName}</p>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${deal.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse'}`}>
                  {deal.status === 'ACTIVO' ? '💸 Activo' : '❄️ Congelado'}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Comisión estimada (3%)</span>
                  <p className="text-sm font-black text-[#04045E]">{deal.commission ? `$${deal.commission.toLocaleString()} USD` : 'Falta información'}</p>
                </div>
                {deal.amount && <span className="text-[10px] font-bold text-slate-500">Transacción: ${deal.amount.toLocaleString()} USD</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* [JSX_BARRA_CONTROLES_SUPERIOR] */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">

          {/* Lado Izquierdo — Buscador retenido */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              id="input-busqueda-clientes"
              type="text"
              placeholder="Buscar por nombre, email o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#04045E] font-semibold focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder-slate-400 transition-colors"
            />
          </div>

          {/* Lado Derecho — Filtros del formulario */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">

            {/* Prioridad */}
            <select
              id="select-filtro-prioridad"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as 'TODOS' | 'ALTA' | 'MEDIA' | 'BAJA')}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="TODOS">⚡ Prioridad</option>
              <option value="ALTA">🔴 Alta</option>
              <option value="MEDIA">🟡 Media</option>
              <option value="BAJA">⚪ Baja</option>
            </select>

            {/* Tipo de Cliente */}
            <select
              id="select-filtro-tipo-cliente"
              value={filterClientType}
              onChange={(e) => setFilterClientType(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="TODOS">🏷️ Tipo de Cliente</option>
              <option value="RED PROPIO">Red Propio</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="TIKTOK">TikTok</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="RECOMENDADO">Recomendado</option>
            </select>

            {/* Rol: Propietario / Prospecto */}
            <select
              id="select-filtro-rol"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'TODOS' | 'PROPIETARIO' | 'PROSPECTO')}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="TODOS">👤 Rol</option>
              <option value="PROPIETARIO">🏠 Propietario</option>
              <option value="PROSPECTO">🎯 Prospecto</option>
            </select>

            {/* Tipo de Operación */}
            <select
              id="select-filtro-tipo-operacion"
              value={filterTipoOperacion}
              onChange={(e) => setFilterTipoOperacion(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="TODOS">💼 Operación</option>
              <option value="Compra">Compra</option>
              <option value="Alquiler">Alquiler</option>
              <option value="Anticrético">Anticrético</option>
              <option value="Proyecto">Proyecto</option>
            </select>

            {/* Tipo de Inmueble */}
            <select
              id="select-filtro-tipo-inmueble"
              value={filterTipoInmueble}
              onChange={(e) => setFilterTipoInmueble(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors cursor-pointer max-w-[150px]"
            >
              <option value="TODOS">🏠 Tipo Inmueble</option>
              {TIPOS_PROPIEDAD_OPTIONS.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            {/* Zona */}
            <input
              id="input-filtro-zona"
              type="text"
              placeholder="📍 Zona / Ubicación..."
              value={filterZona}
              onChange={(e) => setFilterZona(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium focus:outline-none focus:border-blue-500 transition-colors w-32"
            />
          </div>
        </div>

        {/* Contador de resultados */}
        <p className="text-[10px] text-slate-400 font-semibold mt-2.5">
          {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado{filteredClients.length !== 1 ? 's' : ''}
          {(filterPriority !== 'TODOS' || filterClientType !== 'TODOS' || filterRole !== 'TODOS' || filterTipoOperacion !== 'TODOS' || filterTipoInmueble !== 'TODOS' || filterZona.trim() !== '' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterPriority('TODOS');
                setFilterClientType('TODOS');
                setFilterRole('TODOS');
                setFilterTipoOperacion('TODOS');
                setFilterTipoInmueble('TODOS');
                setFilterZona('');
              }}
              className="ml-3 text-blue-500 hover:text-blue-700 font-black underline-offset-2 hover:underline transition-colors cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </p>
      </div>

      {/* [JSX_VINCULACION_GRID_O_LISTADO] — Directorio de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-sm py-20">
            <span className="text-4xl">🔍</span>
            <h3 className="font-black text-[#04045E] text-base uppercase tracking-tight mt-4">No se encontraron clientes</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">No se encontraron clientes con los filtros aplicados.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterPriority('TODOS'); setFilterClientType('TODOS'); setFilterRole('TODOS'); }}
              className="mt-4 px-5 py-2 bg-slate-100 hover:bg-slate-200 text-[#04045E] text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Limpiar filtros
            </button>
          </div>
        ) : filteredClients.map((cli) => {
          const shortId = generateShortId(cli.email);
          return (
            <div key={cli.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col gap-4">
              {/* Header */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-[#04045E] uppercase tracking-tight">{cli.name}</h3>
                    <span className="text-[8px] font-black text-slate-400 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">{shortId}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${stageColor(cli.stage)}`}>{cli.stage}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">{cli.category}</span>
                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${priorityColor(cli.priority)}`}>⚡ {cli.priority}</span>
                  </div>
                </div>
                <div className="flex text-amber-400 text-xs select-none">
                  {Array.from({ length: cli.rating }).map((_, i) => <span key={i}>★</span>)}
                </div>
              </div>

              {/* Info */}
              <div className="text-[10px] text-slate-650 font-semibold space-y-1.5 border-y border-slate-100 py-3">
                <p className="flex items-center gap-1.5"><span className="opacity-70 text-xs">📧</span><span className="text-slate-800">{cli.email}</span></p>
                <p className="flex items-center gap-1.5"><span className="opacity-70 text-xs">📞</span><span className="text-slate-800">{cli.phone}</span></p>
                <p className="flex items-center gap-1.5">
                  <span className="opacity-70 text-xs">🏷️</span> Origen:{' '}
                  <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">{cli.source}</span>
                </p>
              </div>

              {/* Interés / Presupuesto */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presupuesto/Monto</span>
                  <span className="text-xs font-black text-[#04045E]">${cli.budget.toLocaleString()} USD</span>
                </div>

                {/* Zona & Tipo de Inmueble */}
                {(cli.tipoInmueble || cli.zona) && (
                  <div className="text-[9px] font-black text-[#04045E] uppercase tracking-tight flex flex-wrap gap-1 items-center mt-1">
                    {cli.tipoInmueble && <span className="bg-blue-50 text-blue-800 border border-blue-100 px-1 rounded">🏠 {cli.tipoInmueble}</span>}
                    {cli.zona && <span className="text-slate-500 font-semibold">en <span className="font-bold text-slate-700 capitalize">📍 {cli.zona}</span></span>}
                  </div>
                )}

                {/* Tipo de Operación badges */}
                {cli.tipoOperacion && cli.tipoOperacion.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cli.tipoOperacion.map(op => (
                      <span key={op} className="bg-slate-200/70 text-slate-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        {op}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[10px] font-bold text-slate-700 truncate mt-1.5">{cli.interest}</p>
                {cli.notes && <p className="text-[9px] text-slate-500 italic border-t border-slate-100 pt-1 mt-1">{cli.notes}</p>}
              </div>

              {/* WhatsApp */}
              <div className="flex gap-2 items-center mt-auto">
                <input
                  type="text"
                  placeholder="Escribe mensaje personalizado..."
                  value={customMessages[cli.id] || ''}
                  onChange={(e) => setCustomMessages(prev => ({ ...prev, [cli.id]: e.target.value }))}
                  className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] text-slate-700 font-bold focus:outline-none focus:border-[#b9fa3c]"
                />
                <button
                  onClick={() => triggerWhatsApp(cli)}
                  className="w-9 h-9 shrink-0 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-full transition-all flex items-center justify-center active:scale-90 shadow-md shadow-emerald-500/20"
                  title="Enviar por WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL: REGISTRAR CLIENTE (3 bloques) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#04045E]/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative space-y-6 animate-fadeIn my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">Registrar Prospecto / Cliente</h3>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── BLOQUE 1: Datos Básicos ── */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-[#04045E] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#04045E] text-white flex items-center justify-center text-[8px]">1</span>
                  Datos Básicos
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Nombre Completo *', key: 'name',  type: 'text',  placeholder: 'Ej. Juan Pérez' },
                    { label: 'Email *',           key: 'email', type: 'email', placeholder: 'Ej. juan@correo.com' },
                    { label: 'WhatsApp / Tel. *', key: 'phone', type: 'text',  placeholder: 'Ej. +591 70000000' },
                  ].map(({ label, key, type, placeholder }) => {
                    const hasError = !!errors[key];
                    return (
                      <div key={key}>
                        <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">{label}</label>
                        <input
                          type={type}
                          value={(form as any)[key]}
                          onChange={e => setF(key, e.target.value)}
                          placeholder={placeholder}
                          className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all ${
                            hasError
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-200 focus:border-[#b9fa3c]'
                          }`}
                        />
                        {hasError && (
                          <p className="text-xs text-red-500 mt-1 font-semibold">{errors[key]}</p>
                        )}
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Origen</label>
                      <select value={form.source} onChange={e => setF('source', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]">
                        {['RED PROPIO','WhatsApp','TikTok','Instagram','Recomendado'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Categoría *</label>
                      <select
                        value={form.category}
                        onChange={e => setF('category', e.target.value)}
                        className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all ${
                          errors.category
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-200 focus:border-[#b9fa3c]'
                        }`}
                      >
                        <option value="">-- Seleccionar --</option>
                        <option value="Prospecto">Prospecto</option>
                        <option value="Propietario">Propietario</option>
                      </select>
                      {errors.category && (
                        <p className="text-xs text-red-500 mt-1 font-semibold">{errors.category}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── BLOQUE 2: Campos de Intención ── */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <p className="text-[9px] font-black text-[#04045E] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#04045E] text-white flex items-center justify-center text-[8px]">2</span>
                  Campos de Intención
                </p>

                {/* Tipo de Operación (Selección Múltiple) */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-[#04045E] mb-2">Tipo de Operación</label>
                  <div className="flex flex-wrap gap-2">
                    {['Compra', 'Alquiler', 'Anticrético', 'Proyecto'].map(op => {
                      const selected = (form.tipoOperacion || []).includes(op);
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => toggleTipoOperacion(op)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-300 ${
                            selected
                              ? 'bg-[#04045E] text-white border-[#04045E] scale-[1.03] shadow-sm shadow-[#04045E]/20'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {op}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tipo de Inmueble */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Tipo de Inmueble *</label>
                  <select
                    value={form.tipoInmueble}
                    onChange={e => setF('tipoInmueble', e.target.value)}
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all ${
                      errors.tipoInmueble
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-[#b9fa3c]'
                    }`}
                  >
                    <option value="">-- Seleccionar --</option>
                    {TIPOS_PROPIEDAD_OPTIONS.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  {errors.tipoInmueble && (
                    <p className="text-xs text-red-500 mt-1 font-semibold">{errors.tipoInmueble}</p>
                  )}
                </div>

                {/* Zona */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Zona / Ubicación *</label>
                  <input
                    type="text"
                    value={form.zona}
                    onChange={e => setF('zona', e.target.value)}
                    placeholder="Ej. Cala Cala, Cochabamba"
                    className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none transition-all ${
                      errors.zona
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-[#b9fa3c]'
                    }`}
                  />
                  {errors.zona && (
                    <p className="text-xs text-red-500 mt-1 font-semibold">{errors.zona}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Interés / Propiedad (Detalle Opcional)</label>
                  <input type="text" value={form.interest} onChange={e => setF('interest', e.target.value)}
                    placeholder="Ej. Penthouse en Queru Queru..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Presupuesto ($ USD)</label>
                    <input type="number" value={form.budget} onChange={e => setF('budget', e.target.value)}
                      placeholder="Ej. 150000" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Prioridad</label>
                    <select value={form.priority} onChange={e => setF('priority', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]">
                      <option>Alta</option><option>Media</option><option>Baja</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── BLOQUE 3: Pipeline / Estado ── */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-[9px] font-black text-[#04045E] uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#04045E] text-white flex items-center justify-center text-[8px]">3</span>
                  Pipeline / Estado
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Etapa Actual</label>
                    <select value={form.stage} onChange={e => setF('stage', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]">
                      {['Nuevo','Contactado','Visita Programada','Negociación','Reservado','Cerrado'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Vincular Propiedad</label>
                    <select value={form.propertyId} onChange={e => setF('propertyId', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]">
                      <option value="">-- Opcional --</option>
                      {deals.map(d => <option key={d.id} value={d.propertyId}>{d.propertyTitle}</option>)}
                    </select>
                  </div>
                </div>
                {form.propertyId && (
                  <div>
                    <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Monto de Transacción ($ USD)</label>
                    <input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)}
                      placeholder="Ej. 220000" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]" />
                  </div>
                )}
                <div>
                  <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Notas Internas</label>
                  <textarea value={form.notes} onChange={e => setF('notes', e.target.value)} rows={2}
                    placeholder="Ej. Prefiere propiedades al sur de la ciudad..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c] resize-none" />
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 bg-[#04045E] hover:bg-[#04045E]/90 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]">
                {saving ? 'Guardando...' : 'CONFIRMAR Y REGISTRAR TRANSACCIÓN 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
