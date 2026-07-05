'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCurrentUser } from '@/utils/session';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PdfAdjunto {
  name: string;
  url: string;
}

interface Cierre {
  id: string;
  propiedadId: string;
  propiedadTitle?: string;
  propiedad?: { title: string; price: number };
  clientId: string;
  clientName?: string;
  client?: { name: string; phone: string };
  ownerId: string;
  tipoTransaccion: 'Venta' | 'Alquiler' | 'Anticresis';
  finalAmount: number;
  calculatedCommission: number;
  pdfAdjuntos: PdfAdjunto[];
  pdfEstado?: string | null;
  fechaCierre: string;
  createdAt: string;
  updatedAt: string;
}

interface PropertyOption {
  id: string;
  title: string;
  price: number;
  ownerId?: string;
}

interface ClientOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMISSION_RATE = 0.015; // 1.5%

const TIPO_OPTIONS = ['Venta', 'Alquiler', 'Anticresis'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  return `Bs. ${formatted}`;
};

const isEditable = (fechaCierreStr: string) =>
  Date.now() - new Date(fechaCierreStr).getTime() <= 86_400_000;

const getHoursLeft = (fechaCierreStr: string) => {
  const leftMs = 86_400_000 - (Date.now() - new Date(fechaCierreStr).getTime());
  return leftMs <= 0 ? 0 : (leftMs / 3_600_000).toFixed(1);
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CierresPage() {
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCierre, setEditingCierre] = useState<Cierre | null>(null);

  // Form fields
  const [selectedPropId, setSelectedPropId] = useState('');
  const [clienteProspectoId, setClienteProspectoId] = useState('');
  const [clientePropietarioId, setClientePropietarioId] = useState('');
  const [transactionType, setTransactionType] = useState<typeof TIPO_OPTIONS[number]>('Venta');
  const [montoFinalTransaccion, setMontoFinalTransaccion] = useState('');
  const [contratosFiles, setContratosFiles] = useState<File[]>([]);
  const [inventarioFiles, setInventarioFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // [RESOLUCION_Y_CARGA_DE_FUENTES_DE_DATOS]
  const listaPropiedadesCompleta = useMemo(() => {
    const user = getCurrentUser();
    const agentName = user?.name || '';
    
    let colabProps: { id: string; titulo: string; price: number; ownerId: string }[] = [];
    if (typeof window !== 'undefined') {
      const colabRaw = localStorage.getItem('propio_admin_collaborations');
      if (colabRaw) {
        try {
          const colabs = JSON.parse(colabRaw);
          if (Array.isArray(colabs)) {
            // Include active collaborations where agent participates and status is ACEPTADA
            const activeColabs = colabs.filter(c => {
              const name1 = c.agente1 || c.senderAgentName || '';
              const name2 = c.agente2 || c.receiverAgentName || '';
              const status = c.estado || c.status || '';
              const isParticipant = name1 === agentName || name2 === agentName || c.senderAgentId === 'local-agent' || c.receiverAgentId === 'local-agent';
              const isAccepted = status === 'ACEPTADA' || status === 'ACTIVO';
              return isParticipant && isAccepted;
            });
            
            colabProps = activeColabs.map(c => ({
              id: c.propertyId || c.propiedadId || '',
              titulo: `Colaboración: ${c.propertyTitle || c.propertyId || c.propiedadId || ''}`,
              price: 0,
              ownerId: c.receiverAgentId || '',
            }));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    let localProps: any[] = [];
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propio_properties_data') || localStorage.getItem('propio_admin_properties');
      if (stored) {
        try {
          localProps = JSON.parse(stored);
        } catch {}
      }
    }

    const sourceProps = localProps.length > 0 ? localProps : properties;
    const merged = sourceProps.map(p => ({
      id: p.id || p.codigo || '',
      titulo: p.title || p.titulo || '',
      price: p.price || p.precio || 0,
      ownerId: p.ownerId || p.propietarioId || '',
    }));

    for (const cp of colabProps) {
      if (cp.id && !merged.some(p => p.id === cp.id)) {
        merged.push(cp);
      }
    }
    return merged;
  }, [properties]);

  const rawClientsList = useMemo(() => {
    let localList: any[] = [];
    if (typeof window !== 'undefined') {
      const localRaw = localStorage.getItem('propio_admin_users_permissions') || localStorage.getItem('propio_clients_v2');
      if (localRaw) {
        try {
          localList = JSON.parse(localRaw);
        } catch {}
      }
    }
    
    const clientsOnly = localList.filter(c => c.category || c.categoria);
    const sourceList = clientsOnly.length > 0 ? clientsOnly : clients;
    const merged = [...sourceList];
    return merged.map(c => ({
      id: c.id,
      nombre: c.nombre || c.name || '',
      name: c.name || c.nombre || '',
      email: c.email || '',
      phone: c.phone || c.telefono || '',
      category: c.category || c.categoria || 'Prospecto',
      categoria: c.categoria || c.category || 'Prospecto',
    }));
  }, [clients]);

  const listaProspectos = useMemo(() => {
    return rawClientsList
      .filter(c => (c.category || c.categoria || '').toUpperCase() === 'PROSPECTO')
      .map(c => ({
        id: c.id,
        nombre: c.nombre || c.name || '',
        email: c.email || '',
      }));
  }, [rawClientsList]);

  const listaPropietarios = useMemo(() => {
    return rawClientsList
      .filter(c => (c.category || c.categoria || '').toUpperCase() === 'PROPIETARIO')
      .map(c => ({
        id: c.id,
        nombre: c.nombre || c.name || '',
        email: c.email || '',
      }));
  }, [rawClientsList]);

  // Legacy alias for compatibility
  const combinedProperties = listaPropiedadesCompleta;

  // Commission dynamic calculations
  const parsedAmount = parseFloat(montoFinalTransaccion.replace(/,/g, '')) || 0;

  const getCalculatedCommissionForForm = () => {
    let percentage = 1.5;
    if (typeof window !== 'undefined') {
      const colabRaw = localStorage.getItem('propio_admin_collaborations');
      if (colabRaw) {
        try {
          const colabs = JSON.parse(colabRaw);
          if (Array.isArray(colabs)) {
            const user = getCurrentUser();
            const agentName = user?.name || '';
            const colab = colabs.find(col => col.propiedadId === selectedPropId);
            if (colab) {
              if (colab.agente1 === agentName) {
                percentage = colab.porcentajeAgente1;
              } else if (colab.agente2 === agentName) {
                percentage = colab.porcentajeAgente2;
              }
            }
          }
        } catch {}
      }
    }
    return parsedAmount * (percentage / 100);
  };

  const calculatedCommission = parseFloat(getCalculatedCommissionForForm().toFixed(2));

  const getCalculatedCommissionForCierre = (cierre: Cierre) => {
    let percentage = 1.5;
    if (typeof window !== 'undefined') {
      const colabRaw = localStorage.getItem('propio_admin_collaborations');
      if (colabRaw) {
        try {
          const colabs = JSON.parse(colabRaw);
          if (Array.isArray(colabs)) {
            const user = getCurrentUser();
            const agentName = user?.name || '';
            const colab = colabs.find(col => col.propiedadId === cierre.propiedadId);
            if (colab) {
              if (colab.agente1 === agentName) {
                percentage = colab.porcentajeAgente1;
              } else if (colab.agente2 === agentName) {
                percentage = colab.porcentajeAgente2;
              }
            }
          }
        } catch {}
      }
    }
    return cierre.finalAmount * (percentage / 100);
  };

  // Auto-fill ownerId from selected property
  const selectedProp = combinedProperties.find((p) => p.id === selectedPropId);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cierresRes, propsRes, clientsRes] = await Promise.all([
        fetch('/api/cierres'),
        fetch('/api/cierres/available-properties'),
        fetch('/api/cierres/my-clients'),
      ]);

      if (cierresRes.ok) {
        const data = await cierresRes.json();
        setCierres(data);
        localStorage.setItem('propio_admin_transactions', JSON.stringify(data));
      } else throw new Error('cierres fetch failed');

      if (propsRes.ok) setProperties(await propsRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
    } catch {
      const local = localStorage.getItem('propio_admin_transactions') || localStorage.getItem('propio_cierres');
      if (local) setCierres(JSON.parse(local));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();

    const handleSync = () => {
      const local = localStorage.getItem('propio_admin_transactions') || localStorage.getItem('propio_cierres');
      if (local) {
        try {
          setCierres(JSON.parse(local));
        } catch {}
      }
    };
    window.addEventListener('local-storage', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('local-storage', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchAll]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  const resetForm = () => {
    setSelectedPropId('');
    setClienteProspectoId('');
    setClientePropietarioId('');
    setTransactionType('Venta');
    setMontoFinalTransaccion('');
    setContratosFiles([]);
    setInventarioFiles([]);
    setErrors({});
    setEditingCierre(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (c: Cierre) => {
    setEditingCierre(c);
    setSelectedPropId(c.propiedadId);
    setClienteProspectoId(c.clientId);
    setClientePropietarioId(c.ownerId);
    setTransactionType(c.tipoTransaccion);
    setMontoFinalTransaccion(String(c.finalAmount));
    setContratosFiles([]);
    setInventarioFiles([]);
    setErrors({});
    setShowModal(true);
  };

  const handleAddContratoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    setContratosFiles((prev) => [...prev, ...incoming]);
    if (errors.contratosFiles) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.contratosFiles;
        return next;
      });
    }
    e.target.value = '';
  };

  const removeContratoFile = (index: number) => {
    setContratosFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddInventarioFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    setInventarioFiles((prev) => [...prev, ...incoming]);
    e.target.value = '';
  };

  const removeInventarioFile = (index: number) => {
    setInventarioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmarCierreOficial = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPropId) {
      newErrors.propiedadId = 'La propiedad asociada es requerida';
    }
    if (!clienteProspectoId) {
      newErrors.clienteProspectoId = 'El cliente prospecto es requerido';
    }
    if (!clientePropietarioId) {
      newErrors.clientePropietarioId = 'El cliente propietario es requerido';
    }
    const amount = parseFloat(montoFinalTransaccion.replace(/,/g, '')) || 0;
    if (amount <= 0 || isNaN(amount)) {
      newErrors.montoFinalTransaccion = 'El monto final debe ser mayor a 0';
    }
    if (contratosFiles.length === 0 && (!editingCierre || editingCierre.pdfAdjuntos?.length === 0)) {
      newErrors.contratosFiles = 'Debe cargar al menos un contrato PDF';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!handleConfirmarCierreOficial()) {
      return;
    }

    const estadoFileNames = inventarioFiles.length > 0 
      ? inventarioFiles.map(f => f.name).join(', ') 
      : undefined;

    if (editingCierre) {
      // ── PATCH ────
      const payload: Record<string, any> = {
        tipoTransaccion: transactionType,
        finalAmount: parsedAmount,
        pdfEstado: estadoFileNames || editingCierre.pdfEstado || undefined,
      };

      // Append new PDFs to existing list
      if (contratosFiles.length > 0) {
        const newAdjuntos: PdfAdjunto[] = contratosFiles.map((f) => ({ name: f.name, url: f.name }));
        payload.pdfAdjuntos = [...(editingCierre.pdfAdjuntos || []), ...newAdjuntos];
      }

      try {
        const res = await fetch(`/api/cierres/${editingCierre.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setCierres((prev) => {
            const next = prev.map((c) => (c.id === editingCierre.id ? updated : c));
            localStorage.setItem('propio_admin_transactions', JSON.stringify(next));
            window.dispatchEvent(new Event('local-storage'));
            return next;
          });
        } else throw new Error('Patch failed');
      } catch {
        const updatedRecord: Cierre = {
          ...editingCierre,
          tipoTransaccion: transactionType,
          finalAmount: parsedAmount,
          calculatedCommission,
          pdfAdjuntos: payload.pdfAdjuntos ?? editingCierre.pdfAdjuntos,
          pdfEstado: payload.pdfEstado || null,
          updatedAt: new Date().toISOString(),
        };
        setCierres((prev) => {
          const next = prev.map((c) => (c.id === editingCierre.id ? updatedRecord : c));
          localStorage.setItem('propio_admin_transactions', JSON.stringify(next));
          window.dispatchEvent(new Event('local-storage'));
          return next;
        });
      }
    } else {
      // ── POST ─────
      const adjuntos: PdfAdjunto[] = contratosFiles.map((f) => ({ name: f.name, url: f.name }));
      const payload = {
        propiedadId: selectedPropId,
        clientId: clienteProspectoId,
        ownerId: clientePropietarioId,
        tipoTransaccion: transactionType,
        finalAmount: parsedAmount,
        pdfAdjuntos: adjuntos,
        pdfEstado: estadoFileNames || undefined,
      };

      try {
        const res = await fetch('/api/cierres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setCierres((prev) => {
            const next = [created, ...prev];
            localStorage.setItem('propio_admin_transactions', JSON.stringify(next));
            window.dispatchEvent(new Event('local-storage'));
            return next;
          });
        } else throw new Error('Post failed');
      } catch {
        const newRecord: Cierre = {
          id: `cierre-${Date.now()}`,
          propiedadId: selectedPropId,
          clientId: clienteProspectoId,
          ownerId: payload.ownerId,
          tipoTransaccion: transactionType,
          finalAmount: parsedAmount,
          calculatedCommission,
          pdfAdjuntos: adjuntos,
          pdfEstado: estadoFileNames || null,
          fechaCierre: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const updatedList = [newRecord, ...cierres];
        setCierres(updatedList);
        localStorage.setItem('propio_admin_transactions', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('local-storage'));
      }
    }

    resetForm();
    setShowModal(false);
  };

  // ── Resolvers ───────────────────────────────────────────────────────────────

  const getPropTitle = (c: Cierre) =>
    c.propiedad?.title || properties.find((p) => p.id === c.propiedadId)?.title || c.propiedadId.substring(0, 8);

  const getClientName = (c: Cierre) =>
    c.client?.name || clients.find((cl) => cl.id === c.clientId)?.name || c.clientId?.substring(0, 8) || '—';

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'Venta') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (tipo === 'Alquiler') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Mis Cierres Realizados
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Historial de ventas y alquileres cerrados. Comisión calculada automáticamente al 1.5%.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#b9fa3c] text-[#04045E] font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
        >
          ➕ Registrar Nuevo Cierre
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <h3 className="font-bold text-xs text-[#04045E] uppercase tracking-wider">Cierres Registrados</h3>
          <span className="bg-[#04045E]/5 border border-[#04045E]/10 text-[#04045E] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            {cierres.length} Transacciones
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-semibold">Cargando historial de cierres...</div>
        ) : cierres.length === 0 ? (
          <div className="p-12 text-center text-slate-400 py-20">
            <span className="block text-4xl mb-3">📁</span>
            <p className="text-xs font-semibold">No has registrado ningún cierre de propiedad todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">Propiedad</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">COMISIÓN CALCULADA</th>
                  <th className="p-4">Monto Final</th>
                  <th className="p-4">Adjuntos PDF</th>
                  <th className="p-4">Fecha Firma</th>
                  <th className="p-4 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {cierres.map((c) => {
                  const editable = isEditable(c.fechaCierre);
                  const hoursLeft = getHoursLeft(c.fechaCierre);
                  const adjuntos: PdfAdjunto[] = Array.isArray(c.pdfAdjuntos) ? c.pdfAdjuntos : [];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-400">{c.id.substring(0, 8).toUpperCase()}</td>
                      <td className="p-4 font-black text-[#04045E] uppercase max-w-[160px] truncate">{getPropTitle(c)}</td>
                      <td className="p-4 text-slate-600">{getClientName(c)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${getTipoBadge(c.tipoTransaccion)}`}>
                          {c.tipoTransaccion}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-emerald-700 font-black">{formatCurrency(c.finalAmount * 0.015)}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{formatCurrency(c.finalAmount)}</td>
                      <td className="p-4">
                        {adjuntos.length === 0 ? (
                          <span className="text-slate-400 italic">Sin PDF</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {adjuntos.map((pdf, i) => (
                              <a
                                key={i}
                                href={pdf.url.startsWith('http') ? pdf.url : `/api/uploads/${pdf.url}`}
                                download
                                className="text-[10px] text-[#0066ff] font-bold hover:underline cursor-pointer truncate max-w-[140px]"
                                title={pdf.name}
                              >
                                📄 {pdf.name}
                              </a>
                            ))}
                          </div>
                        )}
                        {c.pdfEstado && (
                          <div className="mt-1 pt-1 border-t border-slate-100 flex flex-col gap-0.5">
                            <span className="text-[8px] font-black uppercase text-slate-400">Inventario:</span>
                            {c.pdfEstado.split(',').map((name, idx) => {
                              const trimmedName = name.trim();
                              return (
                                <a
                                  key={idx}
                                  href={`/api/uploads/${trimmedName}`}
                                  download
                                  className="text-[10px] text-emerald-600 font-bold hover:underline cursor-pointer truncate max-w-[140px]"
                                  title={trimmedName}
                                >
                                  📦 {trimmedName}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-500 whitespace-nowrap">
                        {new Date(c.fechaCierre).toLocaleDateString()}{' '}
                        {new Date(c.fechaCierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 pr-6 text-right space-y-1">
                        {editable ? (
                          <div>
                            <button
                              onClick={() => openEdit(c)}
                              className="bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all"
                            >
                              Modificar
                            </button>
                            <span className="block text-[8px] text-amber-600 font-bold mt-1 uppercase tracking-widest animate-pulse">
                              ⏳ {hoursLeft}h restantes
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Bloqueado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                {editingCierre ? 'Modificar Cierre' : 'Registrar Nuevo Cierre'}
              </h3>
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">✕</button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              La comisión se calcula automáticamente al 1.5% del monto final declarado.
            </p>

            <div className="space-y-4">

              {/* Propiedad */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Propiedad Asociada *</label>
                <select
                  disabled={!!editingCierre}
                  value={selectedPropId}
                  onChange={(e) => {
                    setSelectedPropId(e.target.value);
                    if (errors.propiedadId) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.propiedadId;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-slate-50 border px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none transition-all ${
                    errors.propiedadId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-[#04045E]'
                  } disabled:opacity-60`}
                >
                  <option value="">-- Seleccionar Propiedad Activa --</option>
                  {listaPropiedadesCompleta.map((prop) => ( <option key={prop.id} value={prop.id}>{prop.titulo} ({prop.id})</option> ))}
                </select>
                {errors.propiedadId && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.propiedadId}</p>
                )}
              </div>

              {/* Cliente Prospecto */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cliente Prospecto (Comprador/Inquilino) *</label>
                <select
                  disabled={!!editingCierre}
                  value={clienteProspectoId}
                  onChange={(e) => {
                    setClienteProspectoId(e.target.value);
                    if (errors.clienteProspectoId) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.clienteProspectoId;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-slate-50 border px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none transition-all ${
                    errors.clienteProspectoId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-[#04045E]'
                  } disabled:opacity-60`}
                >
                  <option value="">-- Seleccionar Prospecto --</option>
                  {listaProspectos.map((pros) => ( <option key={pros.id} value={pros.id}>{pros.nombre} - {pros.email}</option> ))}
                </select>
                {errors.clienteProspectoId && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.clienteProspectoId}</p>
                )}
              </div>

              {/* Cliente Propietario */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cliente Propietario (Dueño del Inmueble) *</label>
                <select
                  disabled={!!editingCierre}
                  value={clientePropietarioId}
                  onChange={(e) => {
                    setClientePropietarioId(e.target.value);
                    if (errors.clientePropietarioId) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.clientePropietarioId;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-slate-50 border px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none transition-all ${
                    errors.clientePropietarioId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-[#04045E]'
                  } disabled:opacity-60`}
                >
                  <option value="">-- Seleccionar Propietario --</option>
                  {listaPropietarios.map((propio) => ( <option key={propio.id} value={propio.id}>{propio.nombre} - {propio.email}</option> ))}
                </select>
                {errors.clientePropietarioId && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.clientePropietarioId}</p>
                )}
              </div>

              {/* Tipo Transacción */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo de Transacción *</label>
                <select
                  required
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                >
                  {TIPO_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Monto Final */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Monto Final de la Transacción (Bs.) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="Ej: 1740000"
                  value={montoFinalTransaccion}
                  onChange={(e) => {
                    setMontoFinalTransaccion(e.target.value);
                    if (errors.montoFinalTransaccion) {
                      setErrors(prev => {
                        const next = { ...prev };
                        delete next.montoFinalTransaccion;
                        return next;
                      });
                    }
                  }}
                  className={`w-full bg-slate-50 border px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none transition-all ${
                    errors.montoFinalTransaccion
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-[#04045E]'
                  }`}
                />
                {errors.montoFinalTransaccion && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.montoFinalTransaccion}</p>
                )}
                {parsedAmount > 0 && (
                  <p className="text-[10px] mt-1 text-emerald-700 font-black pl-1">
                    💰 Comisión calculada: {formatCurrency(calculatedCommission)}
                  </p>
                )}
              </div>

              {/* PDFs Adjuntos (multi) */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Contratos / Minutas PDF *{editingCierre ? ' (añadir más)' : ''}
                </label>

                {/* Existing PDFs when editing */}
                {editingCierre && editingCierre.pdfAdjuntos?.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {editingCierre.pdfAdjuntos.map((pdf, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#0066ff] font-bold">
                        <span>📄 {pdf.name}</span>
                        <span className="text-slate-400 font-normal">(existente)</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* New file picker */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="contratos-files" className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-500 font-bold cursor-pointer text-center select-none transition-colors">
                    📎 Añadir Contratos PDF
                  </label>
                  <input type="file" accept=".pdf" id="contratos-files" multiple onChange={handleAddContratoFiles} className="hidden" />

                  {/* Staged files list */}
                  {contratosFiles.length > 0 && (
                    <div className="space-y-1">
                      {contratosFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] font-bold text-emerald-700 truncate max-w-[200px]">✅ {f.name}</span>
                          <button type="button" onClick={() => removeContratoFile(i)} className="text-red-400 hover:text-red-600 font-black text-xs ml-2 shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.contratosFiles && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.contratosFiles}</p>
                  )}
                </div>
              </div>

              {/* Estado Físico PDF (opcional) */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Estado Físico / Inventario (Opcional)</label>
                <div className="flex flex-col gap-2">
                  <label htmlFor="inventario-files" className="bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-500 font-bold cursor-pointer text-center select-none transition-colors">
                    📎 Añadir Inventarios PDF
                  </label>
                  <input type="file" accept=".pdf" id="inventario-files" multiple onChange={handleAddInventarioFiles} className="hidden" />

                  {/* Staged files list */}
                  {inventarioFiles.length > 0 && (
                    <div className="space-y-1">
                      {inventarioFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                          <span className="text-[10px] font-bold text-blue-700 truncate max-w-[200px]">✅ {f.name}</span>
                          <button type="button" onClick={() => removeInventarioFile(i)} className="text-red-400 hover:text-red-600 font-black text-xs ml-2 shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01]"
              >
                {editingCierre ? 'Confirmar Modificación 🚀' : 'Registrar Cierre Oficial 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
