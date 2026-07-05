'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCurrentUser } from '@/utils/session';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
type CollabStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'porcentajes_modificados';

interface Collaboration {
  id: string;
  propertyId: string;
  propertyTitle: string;
  senderAgentId: string;
  senderAgentName: string;
  senderAgentPhone: string;
  receiverAgentId: string;
  receiverAgentName: string;
  receiverAgentPhone: string;
  platformPercentage: number;
  agent1Percentage: number;
  agent2Percentage: number;
  status: CollabStatus;
  createdAt: string;
}

interface CollabData {
  sent: Collaboration[];
  received: Collaboration[];
}

// ──────────────────────────────────────────────────────────
// Pie/circle chart helper (SVG semi-donut)
// ──────────────────────────────────────────────────────────
function CirclePercent({
  value,
  max = 100,
  color,
  label,
  editable = false,
  onChange,
}: {
  value: number;
  max?: number;
  color: string;
  label: string;
  editable?: boolean;
  onChange?: (val: number) => void;
}) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[70px]">
      <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider text-center leading-tight">
        {label}
      </span>
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
          {/* Track */}
          <circle cx="22" cy="22" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
          {/* Progress */}
          <circle
            cx="22" cy="22" r={r}
            fill="none"
            stroke={color}
            strokeWidth="4.5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {editable ? (
            <input
              type="number"
              min="0"
              max="100"
              value={value}
              onChange={(e) => onChange?.(Number(e.target.value))}
              className="w-full text-center bg-transparent border-none outline-none focus:ring-0 font-black text-[10px] text-slate-700 p-0"
              style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
            />
          ) : (
            <span className="text-[10px] font-black text-slate-700">{value}%</span>
          )}
        </div>
      </div>
      <span className="bg-white border border-gray-200 text-gray-700 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
        {editable ? (
          <input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="w-10 text-center bg-transparent border-none outline-none focus:ring-0 font-black text-[9px] p-0"
          />
        ) : (
          `${value}%`
        )}
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Collab Row [JSX_FILAS_REPOSITORIO_ALTA_FIDELIDAD]
// ──────────────────────────────────────────────────────────
function CollabRow({
  collab,
  mode,
  onAccept,
  onReject,
  onOpenWhatsApp,
  onSavePercentages,
  onAcceptModifiedPercentages,
  currentUserAgentId,
}: {
  collab: Collaboration;
  mode: 'RECIBIDAS' | 'ENVIADAS';
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onOpenWhatsApp: (phone: string) => void;
  onSavePercentages: (id: string, platform: number, a1: number, a2: number) => void;
  onAcceptModifiedPercentages: (id: string) => void;
  currentUserAgentId: string;
}) {
  const agentName = mode === 'RECIBIDAS' ? collab.senderAgentName : collab.receiverAgentName;
  const agentPhone = mode === 'RECIBIDAS' ? collab.senderAgentPhone : collab.receiverAgentPhone;
  const initials = agentName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  // Determine role based on specification
  let agentRole = 'Professional Agente';
  if (agentName.includes('Juan')) agentRole = 'Professional';
  if (agentName.includes('Diego')) agentRole = 'Professional Diego';

  const isAccepted = collab.status === 'ACEPTADA';
  const isRejected = collab.status === 'RECHAZADA';
  const isPending = collab.status === 'PENDIENTE';

  // ponytail: local percentage states with interactive auto-balancing
  const [platform, setPlatform] = useState(collab.platformPercentage);
  const [a1, setA1] = useState(collab.agent1Percentage);
  const [a2, setA2] = useState(collab.agent2Percentage);

  useEffect(() => {
    setPlatform(collab.platformPercentage);
    setA1(collab.agent1Percentage);
    setA2(collab.agent2Percentage);
  }, [collab.platformPercentage, collab.agent1Percentage, collab.agent2Percentage]);

  const handlePlatformChange = (val: number) => {
    const pVal = Math.min(Math.max(val, 0), 100);
    setPlatform(pVal);
    const remaining = 100 - pVal - a1;
    if (remaining >= 0) {
      setA2(remaining);
    } else {
      setA1(100 - pVal);
      setA2(0);
    }
  };

  const handleA1Change = (val: number) => {
    const a1Val = Math.min(Math.max(val, 0), 100 - platform);
    setA1(a1Val);
    setA2(100 - platform - a1Val);
  };

  const handleA2Change = (val: number) => {
    const a2Val = Math.min(Math.max(val, 0), 100 - platform);
    setA2(a2Val);
    setA1(100 - platform - a2Val);
  };

  const hasChanges = platform !== collab.platformPercentage || a1 !== collab.agent1Percentage || a2 !== collab.agent2Percentage;

  return (
    <div className="flex flex-col mb-2 w-full">
      {/* ponytail: accept alert banner for the other agent */}
      {collab.status === ('porcentajes_modificados' as any) && (collab as any).modifiedBy !== currentUserAgentId && (
        <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-lg flex justify-between items-center mb-1.5 w-full">
          <span className="text-xs font-bold">Se modificaron los porcentajes</span>
          <button
            onClick={() => onAcceptModifiedPercentages(collab.id)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      )}

      <div className={`border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between shadow-sm transition-all gap-4 ${
        isAccepted ? 'bg-green-50/60 border-green-200' : 'bg-white border-gray-200'
      }`}>
        
        {/* COLUMNA 1 (AGENTE) */}
        <div className="flex items-center gap-3 lg:w-1/5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#04045E] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{agentName}</p>
            <p className="text-xs text-gray-400 font-semibold">{agentRole}</p>
          </div>
        </div>

        {/* COLUMNA 2 (ID PROPIEDAD) */}
        <div className="flex items-center justify-start lg:justify-center lg:w-1/6">
          <span className="text-xs font-semibold text-[#04045E] bg-slate-100 px-2.5 py-1 rounded-lg">
            {collab.propertyId}
          </span>
        </div>

        {/* COLUMNA 3 (DISTRIBUCIÓN DE COMISIÓN - ANILLOS EDITABLES) */}
        <div className="flex flex-col items-center gap-2 lg:w-2/5">
          <div className="flex items-center gap-5 justify-start lg:justify-center flex-wrap">
            <CirclePercent
              value={platform}
              color="#94a3b8"
              label="(Plataforma)"
              editable={true}
              onChange={handlePlatformChange}
            />
            <CirclePercent
              value={a1}
              color="#2563eb"
              label="Agente 1"
              editable={true}
              onChange={handleA1Change}
            />
            <CirclePercent
              value={a2}
              color="#10b981"
              label="Agente 2"
              editable={true}
              onChange={handleA2Change}
            />
          </div>
          {hasChanges && (
            <button
              onClick={() => onSavePercentages(collab.id, platform, a1, a2)}
              className="mt-1 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-black text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              Guardar Cambios de Comisión 💾
            </button>
          )}
        </div>

        {/* COLUMNA 4 (ACCIONES DE ESTADO) */}
        <div className="flex items-center justify-start lg:justify-center gap-2 lg:w-1/4">
          {collab.status === ('porcentajes_modificados' as any) ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              PORCENTAJES MODIFICADOS
            </span>
          ) : isPending ? (
            <>
              <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                SOLICITUD ENVIADA - PENDIENTE
              </span>
              {mode === 'RECIBIDAS' && (
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onAccept(collab.id)}
                    className="bg-green-600 rounded-full p-2 text-white hover:scale-105 transition-all shadow-sm flex items-center justify-center w-8 h-8 font-bold cursor-pointer"
                    title="Aceptar"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => onReject(collab.id)}
                    className="bg-red-600 rounded-full p-2 text-white hover:scale-105 transition-all shadow-sm flex items-center justify-center w-8 h-8 font-bold cursor-pointer"
                    title="Rechazar"
                  >
                    ✕
                  </button>
                </div>
              )}
            </>
          ) : isAccepted ? (
            <span className="bg-green-600 text-white font-bold px-3 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              ACEPTADA
            </span>
          ) : (
            <span className="bg-red-600 text-white font-bold px-3 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-sm">
              RECHAZADA
            </span>
          )}
        </div>

        {/* COLUMNA 5 (CONTACTO) */}
        <div className="flex items-center justify-end lg:w-1/6 shrink-0">
          {isRejected ? (
            <button
              disabled
              className="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 text-xs cursor-not-allowed border border-gray-300"
            >
              WhatsApp
            </button>
          ) : (
            <button
              onClick={() => onOpenWhatsApp(agentPhone)}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 text-xs transition-all hover:scale-105 shadow-sm active:scale-95 cursor-pointer"
            >
              WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Form modal: nueva colaboración
// ──────────────────────────────────────────────────────────
function NewCollabModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (collab: Collaboration) => void;
}) {
  const [form, setForm] = useState({
    propertyId: '',
    propertyTitle: '',
    receiverAgentName: '',
    receiverAgentPhone: '',
    receiverAgentId: `agent-ext-${Date.now()}`,
    agent1Percentage: 25,
    agent2Percentage: 25,
  });
  const [saving, setSaving] = useState(false);

  const handleA1Change = (val: string) => {
    const a1 = Math.min(Math.max(Number(val), 0), 50);
    const a2 = 50 - a1;
    setForm(f => ({ ...f, agent1Percentage: a1, agent2Percentage: a2 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propertyId || !form.receiverAgentName || !form.receiverAgentPhone) {
      alert('Completa todos los campos obligatorios.');
      return;
    }
    setSaving(true);
    // Simulación de guardado
    const collab: Collaboration = {
        id: `COLAB-${Date.now()}`,
        propertyId: form.propertyId,
        propertyTitle: form.propertyTitle,
        senderAgentId: 'local-agent',
        senderAgentName: 'Tu Agente',
        senderAgentPhone: '',
        receiverAgentId: form.receiverAgentId,
        receiverAgentName: form.receiverAgentName,
        receiverAgentPhone: form.receiverAgentPhone,
        platformPercentage: 50,
        agent1Percentage: form.agent1Percentage,
        agent2Percentage: form.agent2Percentage,
        status: 'PENDIENTE',
        createdAt: new Date().toISOString(),
    };
    onSave(collab);
    onClose();
  };

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]';

  return (
    <div className="fixed inset-0 z-50 bg-[#04045E]/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative space-y-6 animate-fadeIn my-8">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">Nueva Solicitud de Colaboración</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">ID Propiedad *</label>
              <input type="text" required value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                placeholder="Ej. #PR-1024" className={inputCls} />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Título</label>
              <input type="text" value={form.propertyTitle} onChange={e => setForm(f => ({ ...f, propertyTitle: e.target.value }))}
                placeholder="Ej. Casa en Muyurina" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Nombre del Agente *</label>
              <input type="text" required value={form.receiverAgentName} onChange={e => setForm(f => ({ ...f, receiverAgentName: e.target.value }))}
                placeholder="Ej. Carlos Mendoza" className={inputCls} />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">WhatsApp del Agente *</label>
              <input type="text" required value={form.receiverAgentPhone} onChange={e => setForm(f => ({ ...f, receiverAgentPhone: e.target.value }))}
                placeholder="Ej. +591 77000000" className={inputCls} />
            </div>
          </div>

          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <p className="text-[9px] font-black text-[#04045E] uppercase tracking-widest">Distribución de Comisiones</p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600">🔒 Plataforma (Fijo)</span>
              <span className="text-xs font-black text-slate-700 bg-slate-200 px-3 py-1 rounded-lg">50%</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[9px] font-black uppercase text-[#04045E]">Tu Porcentaje (Ag. 1)</label>
                <span className="text-xs font-black text-emerald-600">{form.agent1Percentage}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="1"
                value={form.agent1Percentage}
                onChange={e => handleA1Change(e.target.value)}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2">
              <span className="text-[10px] font-bold text-slate-600">Porcentaje del Agente 2</span>
              <span className="text-xs font-black text-red-500">{form.agent2Percentage}%</span>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-[#04045E] hover:bg-[#04045E]/90 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]">
            {saving ? 'Enviando...' : 'Enviar Solicitud de Colaboración 🤝'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Seeds generator [ESTADOS_Y_SUB_PESTAÑAS_AGENTE]
// ──────────────────────────────────────────────────────────
const getDefaultSeeds = (): Collaboration[] => [];

// ──────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────
export default function AgentCollaboraciones() {
  const [agentColabs, setAgentColabs] = useState<Collaboration[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'RECIBIDAS' | 'ENVIADAS'>('RECIBIDAS');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentUserAgentId, setCurrentUserAgentId] = useState('local-agent');

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.userId) {
      setCurrentUserAgentId(user.userId);
    }
  }, []);

  useEffect(() => {
    const loadFromStorage = () => {
      const stored = localStorage.getItem('propio_admin_collaborations');
      let loaded: Collaboration[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            loaded = parsed.map((item: any) => ({
              ...item,
              id: item.id,
              propertyId: item.propertyId || item.propiedadId || '',
              propertyTitle: item.propertyTitle || item.propertyId || item.propiedadId || '',
              senderAgentId: item.senderAgentId || 'agent-ext',
              senderAgentName: item.senderAgentName || item.agente1 || '',
              senderAgentPhone: item.senderAgentPhone || '',
              receiverAgentId: item.receiverAgentId || 'local-agent',
              receiverAgentName: item.receiverAgentName || item.agente2 || '',
              receiverAgentPhone: item.receiverAgentPhone || '',
              platformPercentage: item.platformPercentage !== undefined ? item.platformPercentage : (item.porcentajePropio !== undefined ? item.porcentajePropio : 50),
              agent1Percentage: item.agent1Percentage !== undefined ? item.agent1Percentage : (item.porcentajeAgente1 !== undefined ? item.porcentajeAgente1 : 25),
              agent2Percentage: item.agent2Percentage !== undefined ? item.agent2Percentage : (item.porcentajeAgente2 !== undefined ? item.porcentajeAgente2 : 25),
              status: item.status || item.estado || 'PENDIENTE',
              modifiedBy: item.modifiedBy || '',
              createdAt: item.createdAt || new Date().toISOString(),
            }));
          }
        } catch {}
      }

      if (loaded.length > 0) {
        setAgentColabs(loaded);
      } else {
        const seeds = getDefaultSeeds();
        setAgentColabs(seeds);
        const adminSeeds = seeds.map(s => ({
          ...s,
          propiedadId: s.propertyId,
          agente1: s.senderAgentName,
          agente2: s.receiverAgentName,
          porcentajePropio: s.platformPercentage,
          porcentajeAgente1: s.agent1Percentage,
          porcentajeAgente2: s.agent2Percentage,
          estado: s.status,
        }));
        localStorage.setItem('propio_admin_collaborations', JSON.stringify(adminSeeds));
        window.dispatchEvent(new Event('local-storage'));
      }
      setLoading(false);
    };

    loadFromStorage();

    window.addEventListener('local-storage', loadFromStorage);
    window.addEventListener('storage', loadFromStorage);
    return () => {
      window.removeEventListener('local-storage', loadFromStorage);
      window.removeEventListener('storage', loadFromStorage);
    };
  }, []);

  const handleAceptarColaboracion = (id: string) => {
    setAgentColabs(prev => {
      const next = prev.map(c => c.id === id ? { ...c, status: 'ACEPTADA' as CollabStatus } : c);
      const adminNext = next.map(c => ({
        ...c,
        propiedadId: c.propertyId,
        agente1: c.senderAgentName,
        agente2: c.receiverAgentName,
        porcentajePropio: c.platformPercentage,
        porcentajeAgente1: c.agent1Percentage,
        porcentajeAgente2: c.agent2Percentage,
        estado: c.status,
      }));
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(adminNext));
      window.dispatchEvent(new Event('local-storage'));
      return next;
    });
  };

  const handleRechazarColaboracion = (id: string) => {
    setAgentColabs(prev => {
      const next = prev.map(c => c.id === id ? { ...c, status: 'RECHAZADA' as CollabStatus } : c);
      const adminNext = next.map(c => ({
        ...c,
        propiedadId: c.propertyId,
        agente1: c.senderAgentName,
        agente2: c.receiverAgentName,
        porcentajePropio: c.platformPercentage,
        porcentajeAgente1: c.agent1Percentage,
        porcentajeAgente2: c.agent2Percentage,
        estado: c.status,
      }));
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(adminNext));
      window.dispatchEvent(new Event('local-storage'));
      return next;
    });
  };

  const handleAbrirWhatsApp = (telefono: string) => {
    const raw = telefono.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${raw}`, '_blank', 'noopener,noreferrer');
  };

  const handleNewCollab = (collab: Collaboration) => {
    setAgentColabs(prev => {
      const next = [collab, ...prev];
      const adminNext = next.map(c => ({
        ...c,
        propiedadId: c.propertyId,
        agente1: c.senderAgentName,
        agente2: c.receiverAgentName,
        porcentajePropio: c.platformPercentage,
        porcentajeAgente1: c.agent1Percentage,
        porcentajeAgente2: c.agent2Percentage,
        estado: c.status,
      }));
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(adminNext));
      window.dispatchEvent(new Event('local-storage'));
      return next;
    });
  };

  const handleSavePercentages = (id: string, platformPct: number, a1Pct: number, a2Pct: number) => {
    const user = getCurrentUser();
    const currentUserId = user?.userId || 'local-agent';
    
    setAgentColabs(prev => {
      const next = prev.map(c => c.id === id ? { 
        ...c, 
        platformPercentage: platformPct,
        agent1Percentage: a1Pct,
        agent2Percentage: a2Pct,
        status: 'porcentajes_modificados' as any,
        modifiedBy: currentUserId,
      } : c);
      const adminNext = next.map(c => ({
        ...c,
        propiedadId: c.propertyId,
        agente1: c.senderAgentName,
        agente2: c.receiverAgentName,
        porcentajePropio: c.platformPercentage,
        porcentajeAgente1: c.agent1Percentage,
        porcentajeAgente2: c.agent2Percentage,
        estado: c.status,
        modifiedBy: (c as any).modifiedBy || '',
      }));
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(adminNext));
      window.dispatchEvent(new Event('local-storage'));
      return next;
    });
  };

  const handleAcceptModifiedPercentages = (id: string) => {
    setAgentColabs(prev => {
      const next = prev.map(c => c.id === id ? { 
        ...c, 
        status: 'ACEPTADA' as CollabStatus
      } : c);
      const adminNext = next.map(c => ({
        ...c,
        propiedadId: c.propertyId,
        agente1: c.senderAgentName,
        agente2: c.receiverAgentName,
        porcentajePropio: c.platformPercentage,
        porcentajeAgente1: c.agent1Percentage,
        porcentajeAgente2: c.agent2Percentage,
        estado: c.status,
        modifiedBy: (c as any).modifiedBy || '',
      }));
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(adminNext));
      window.dispatchEvent(new Event('local-storage'));
      return next;
    });
  };

  const activeList = activeSubTab === 'RECIBIDAS'
    ? agentColabs.filter(c => c.receiverAgentId === 'local-agent' || c.receiverAgentId === currentUserAgentId)
    : agentColabs.filter(c => c.senderAgentId === 'local-agent' || c.senderAgentId === currentUserAgentId);

  const pendingCount = agentColabs.filter(c => c.status === 'PENDIENTE' && (c.receiverAgentId === 'local-agent' || c.receiverAgentId === currentUserAgentId)).length;
  const recibidasCount = agentColabs.filter(c => c.receiverAgentId === 'local-agent' || c.receiverAgentId === currentUserAgentId).length;
  const aceptadasCount = agentColabs.filter(c => c.status === 'ACEPTADA').length;
  const enviadasCount = agentColabs.filter(c => c.senderAgentId === 'local-agent' || c.senderAgentId === currentUserAgentId).length;

  return (
    <div className="space-y-6 font-sans">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Solicitudes de Colaboración
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Sistema de comisiones compartidas entre agentes de la red Propio.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3.5 bg-[#b9fa3c] text-[#04045E] hover:brightness-95 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl shadow-md shrink-0"
        >
          🤝 Nueva Colaboración
        </button>
      </div>

      {/* ── Resumen Estadístico ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Recibidas',  value: recibidasCount, icon: '📥', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
          { label: 'Pendientes', value: pendingCount,    icon: '⏳', color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
          { label: 'Aceptadas',  value: aceptadasCount,   icon: '✅', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Enviadas',   value: enviadasCount,    icon: '📤', color: 'text-purple-600',  bg: 'bg-purple-50 border-purple-100' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4 flex items-center gap-3`}>
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bloque Principal ── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

        {/* Tabs [JSX_SUB_NAV_BARRA_SUPERIOR] */}
        <div className="flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveSubTab('RECIBIDAS')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-5 text-[11px] uppercase tracking-wider transition-all ${
              activeSubTab === 'RECIBIDAS'
                ? 'border-b-2 border-blue-700 font-bold text-blue-900 bg-blue-50/10'
                : 'text-gray-500 hover:text-gray-700 font-medium'
            }`}
          >
            Mis Solicitudes (Recibidas)
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black ${
              activeSubTab === 'RECIBIDAS' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {recibidasCount}
            </span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('ENVIADAS')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-5 text-[11px] uppercase tracking-wider transition-all ${
              activeSubTab === 'ENVIADAS'
                ? 'border-b-2 border-blue-700 font-bold text-blue-900 bg-blue-50/10'
                : 'text-gray-500 hover:text-gray-700 font-medium'
            }`}
          >
            Mis Solicitudes (Enviadas)
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black ${
              activeSubTab === 'ENVIADAS' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {enviadasCount}
            </span>
          </button>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm font-semibold animate-pulse">
            Cargando colaboraciones...
          </div>
        ) : activeList.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl">🤝</span>
            <h3 className="font-black text-[#04045E] text-sm uppercase tracking-tight mt-3">Sin solicitudes</h3>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {activeSubTab === 'RECIBIDAS' ? 'No tienes solicitudes recibidas aún.' : 'No has enviado solicitudes de colaboración.'}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/40 space-y-2">
            {activeList.map(collab => (
              <CollabRow
                key={collab.id}
                collab={collab}
                mode={activeSubTab}
                onAccept={handleAceptarColaboracion}
                onReject={handleRechazarColaboracion}
                onOpenWhatsApp={handleAbrirWhatsApp}
                onSavePercentages={handleSavePercentages}
                onAcceptModifiedPercentages={handleAcceptModifiedPercentages}
                currentUserAgentId={currentUserAgentId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Leyenda de comisiones ── */}
      <div className="bg-[#04045E]/3 border border-[#04045E]/10 rounded-2xl p-5">
        <p className="text-[9px] font-black text-[#04045E] uppercase tracking-widest mb-3">📊 Modelo de Comisiones Propio</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[10px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600/10 flex items-center justify-center text-slate-600 font-black text-xs">50%</div>
            <div>
              <p className="font-black text-slate-700">Plataforma Propio</p>
              <p className="text-slate-400 font-semibold text-[9px]">Comisión fija bloqueada. No negociable.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xs">Ag.1</div>
            <div>
              <p className="font-black text-slate-700">Agente Emisor</p>
              <p className="text-slate-400 font-semibold text-[9px]">Define su % en la negociación (0–50%).</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500 font-black text-xs">Ag.2</div>
            <div>
              <p className="font-black text-slate-700">Agente Receptor</p>
              <p className="text-slate-400 font-semibold text-[9px]">Recibe el sobrante automático del 50%.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <NewCollabModal onClose={() => setShowModal(false)} onSave={handleNewCollab} />}
    </div>
  );
}
