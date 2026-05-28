'use client';

import React, { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'NUEVO' | 'CONTACTADO' | 'VISITA' | 'NEGOCIACION' | 'RESERVADO' | 'CERRADO';
  interest: string;
  budget: number;
  source: string;
  age: string;
}

const STAGES = [
  { id: 'NUEVO', label: 'Nuevos', subtitle: 'Prospectos Entrantes', color: 'border-t-blue-500' },
  { id: 'CONTACTADO', label: 'Contactados', subtitle: 'Contacto Inicial', color: 'border-t-indigo-500' },
  { id: 'VISITA', label: 'Visita Programada', subtitle: 'Citas y Demostraciones', color: 'border-t-purple-500' },
  { id: 'NEGOCIACION', label: 'Negociación', subtitle: 'Ofertas Activas', color: 'border-t-pink-500' },
  { id: 'RESERVADO', label: 'Reservados', subtitle: 'Seña y Bloqueo', color: 'border-t-amber-500' },
  { id: 'CERRADO', label: 'Cerrados', subtitle: 'Ventas Exitosas', color: 'border-t-emerald-500' },
];

const INITIAL_LEADS: Lead[] = [
  { id: 'lead-1', name: 'María Quispe', email: 'maria@ejemplo.com', phone: '+591 772 34567', status: 'NUEVO', interest: 'Casa en Cala Cala', budget: 320000, source: 'WhatsApp', age: 'Hace 2 horas' },
  { id: 'lead-2', name: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', phone: '+591 601 98765', status: 'CONTACTADO', interest: 'Penthouse en Queru Queru', budget: 185000, source: 'TikTok Lead', age: 'Hace 5 horas' },
  { id: 'lead-3', name: 'Sofía Blanco', email: 'sofia@ejemplo.com', phone: '+591 717 44332', status: 'VISITA', interest: 'Departamento en El Prado', budget: 95000, source: 'Recomendado', age: 'Ayer' },
  { id: 'lead-4', name: 'Jorge Arandia', email: 'jorge@ejemplo.com', phone: '+591 707 11223', status: 'NEGOCIACION', interest: 'Terreno en Queru Queru', budget: 140000, source: 'TikTok Lead', age: 'Hace 3 días' },
  { id: 'lead-5', name: 'Patricia Vargas', email: 'patricia@ejemplo.com', phone: '+591 727 65432', status: 'RESERVADO', interest: 'Casa de Lujo en Cala Cala', budget: 450000, source: 'Instagram Ads', age: 'Hace 5 días' },
  { id: 'lead-6', name: 'Alejandro Mercado', email: 'alejandro@ejemplo.com', phone: '+591 712 99887', status: 'CERRADO', interest: 'Oficina Comercial en Miraflores', budget: 120000, source: 'WhatsApp', age: 'Hace 1 semana' },
];

export default function RadarDeCierrePage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('NUEVO'); // Para navegación móvil
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // Movimiento de leads entre etapas (Botones)
  const moveLead = (id: string, currentStatus: Lead['status'], direction: 'forward' | 'backward') => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStatus);
    let newIndex = currentIndex;

    if (direction === 'forward' && currentIndex < STAGES.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex === currentIndex) return;

    const nextStatus = STAGES[newIndex].id as Lead['status'];
    updateLeadStatus(id, nextStatus);
  };

  const updateLeadStatus = (id: string, targetStatus: Lead['status']) => {
    setActionLoadingId(id);
    setTimeout(() => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: targetStatus } : l))
      );
      setActionLoadingId(null);
    }, 200);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Lead['status']) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      updateLeadStatus(id, targetStatus);
    }
  };

  const triggerWhatsApp = (lead: Lead) => {
    const rawPhone = lead.phone.replace(/[^0-9+]/g, '');
    const message = `Hola ${lead.name}, te saluda tu Asesor Comercial de Propio. Vi que te interesa la propiedad "${lead.interest}" (Presupuesto: $${lead.budget.toLocaleString()} USD). Me pongo a tu servicio por este canal privado.`;
    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full p-6 flex flex-col overflow-hidden bg-[#F8FAFC]">
      
      {/* Título y Filtros Superiores - flex-shrink-0 */}
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#04045E] uppercase tracking-tight font-sans">El Radar de Cierre</h1>
          <p className="text-slate-500 text-sm">Gestiona tu embudo de ventas en tiempo real sin límites de espacio.</p>
        </div>
        
        {/* Filtro / Stats */}
        <div className="flex gap-4 p-2.5 bg-white border border-slate-200/60 rounded-xl shadow-2xs text-xs">
          <div className="text-center px-3 border-r border-slate-100">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Prospectos</span>
            <span className="text-sm font-black text-[#04045E]">{leads.length}</span>
          </div>
          <div className="text-center px-3 border-r border-slate-100">
            <span className="block text-[8px] font-black text-amber-500 uppercase tracking-widest">Reservas</span>
            <span className="text-sm font-black text-amber-500">
              {leads.filter((l) => l.status === 'RESERVADO').length}
            </span>
          </div>
          <div className="text-center px-3">
            <span className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ventas</span>
            <span className="text-sm font-black text-emerald-500">
              {leads.filter((l) => l.status === 'CERRADO').length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Móviles (SÓLO VISIBLES EN SCREEN < LG) */}
      <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 border-b border-slate-100 scrollbar-none shrink-0 mb-4">
        {STAGES.map((s) => {
          const count = leads.filter((l) => l.status === s.id).length;
          const isActive = activeTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveTab(s.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                isActive
                  ? 'bg-[#04045E] text-white border-[#04045E]'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-[#04045E]'
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ZONA CRÍTICA: Contenedor con Scroll Horizontal Aislado */}
      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden flex gap-6 pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.id);
          const isColActiveMobile = activeTab === stage.id;
          const isDraggedOver = draggedOverStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`w-80 min-w-[320px] flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full overflow-hidden transition-all duration-300 ${
                isColActiveMobile ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Cabecera de Columna */}
              <div className={`flex justify-between items-center mb-4 flex-shrink-0 border-b pb-3 border-slate-200/50`}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-sm text-[#04045E] tracking-tight">{stage.label}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{stage.subtitle}</span>
                </div>
                <span className="bg-slate-100 text-[#04045E] px-2.5 py-0.5 rounded-full text-xs font-bold border border-slate-200">
                  {stageLeads.length}
                </span>
              </div>

              {/* Listado de Tarjetas con scroll vertical si exceden el alto de columna */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedOverStage !== stage.id) {
                    setDraggedOverStage(stage.id);
                  }
                }}
                onDragLeave={() => setDraggedOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.id as Lead['status'])}
                className={`space-y-4 flex-1 overflow-y-auto pr-1 pb-2 transition-colors duration-255 rounded-xl scrollbar-thin scrollbar-thumb-slate-100 ${
                  isDraggedOver ? 'bg-slate-50/70 border border-dashed border-[#b9fa3c]' : ''
                }`}
              >
                {stageLeads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 py-20 opacity-40 select-none">
                    <span className="text-3xl">📥</span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                      Sin Prospectos
                    </p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-5 shadow-2xs hover:shadow-md hover:scale-[1.01] hover:border-[#b9fa3c]/30 transition-all duration-300 cursor-grab active:cursor-grabbing flex flex-col gap-4"
                    >
                      {/* Línea 1: Nombre */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-sm text-[#04045E] uppercase tracking-tight leading-tight">
                            {lead.name}
                          </h4>
                          <span className="text-[8px] font-black text-slate-400 uppercase shrink-0 pt-0.5">
                            {lead.age}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold space-y-0.5">
                          <p className="truncate flex items-center gap-1.5">
                            <span className="opacity-60 text-xs">✉️</span> {lead.email}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="opacity-60 text-xs">📞</span> {lead.phone}
                          </p>
                        </div>
                      </div>

                      {/* Línea 2: Interés y Presupuesto */}
                      <div className="bg-white border border-slate-150 p-3.5 rounded-lg space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Interés</span>
                          <span className="text-xs font-black text-[#04045E]">${lead.budget.toLocaleString()} USD</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-snug">
                          {lead.interest}
                        </p>
                      </div>

                      {/* Línea 3: Etiquetas de origen */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                        <span className="bg-[#b9fa3c]/25 text-[#04045E] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          {lead.source}
                        </span>
                        <span className="bg-blue-50 text-[#0066ff] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-blue-100/55">
                          Sello Oro
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="space-y-2 pt-1.5">
                        <button
                          type="button"
                          onClick={() => triggerWhatsApp(lead)}
                          className="w-full py-2.5 bg-[#25D366] hover:bg-[#22c35e] text-white font-bold text-[9px] rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                        >
                          <span className="text-xs">💬</span> WhatsApp Asesor
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={stage.id === 'NUEVO' || actionLoadingId === lead.id}
                            onClick={() => moveLead(lead.id, lead.status, 'backward')}
                            className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-[#04045E] font-black text-[9px] rounded-md transition-all uppercase active:scale-95"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            disabled={stage.id === 'CERRADO' || actionLoadingId === lead.id}
                            onClick={() => moveLead(lead.id, lead.status, 'forward')}
                            className="flex-grow py-1.5 bg-[#04045E] hover:bg-opacity-95 text-white disabled:opacity-40 border border-[#04045E] font-black text-[9px] rounded-md transition-all uppercase active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span>Avanzar</span> ▶
                          </button>
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
