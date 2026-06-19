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
  appointment?: { date: string; time: string } | null;
}

const STAGES = [
  { id: 'NUEVO', label: 'Nuevos', subtitle: 'Prospectos Entrantes', color: 'border-t-[#EF4444]', textColor: 'text-[#EF4444]', bgColor: 'bg-[#EF4444]/10', borderStyle: 'border-t-4 border-t-[#EF4444]' },
  { id: 'CONTACTADO', label: 'Contactados', subtitle: 'Contacto Inicial', color: 'border-t-[#F97316]', textColor: 'text-[#F97316]', bgColor: 'bg-[#F97316]/10', borderStyle: 'border-t-4 border-t-[#F97316]' },
  { id: 'VISITA', label: 'Visita Programada', subtitle: 'Citas y Demostraciones', color: 'border-t-[#EAB308]', textColor: 'text-[#EAB308]', bgColor: 'bg-[#EAB308]/10', borderStyle: 'border-t-4 border-t-[#EAB308]' },
  { id: 'NEGOCIACION', label: 'Negociación', subtitle: 'Ofertas Activas', color: 'border-t-[#2563EB]', textColor: 'text-[#2563EB]', bgColor: 'bg-[#2563EB]/10', borderStyle: 'border-t-4 border-t-[#2563EB]' },
  { id: 'RESERVADO', label: 'Reservados', subtitle: 'Seña y Bloqueo', color: 'border-t-[#10B981]', textColor: 'text-[#10B981]', bgColor: 'bg-[#10B981]/10', borderStyle: 'border-t-4 border-t-[#10B981]' },
  { id: 'CERRADO', label: 'Cerrados', subtitle: 'Ventas Exitosas', color: 'border-t-[#A3FF33]', textColor: 'text-[#6ca818]', bgColor: 'bg-[#A3FF33]/15', borderStyle: 'border-t-4 border-t-[#A3FF33]' },
];

const INITIAL_LEADS: Lead[] = [
  { id: 'lead-1', name: 'María Quispe', email: 'maria@ejemplo.com', phone: '+591 772 34567', status: 'NUEVO', interest: 'Casa en Cala Cala', budget: 320000, source: 'WhatsApp', age: 'Hace 2 horas', appointment: null },
  { id: 'lead-2', name: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', phone: '+591 601 98765', status: 'CONTACTADO', interest: 'Penthouse en Queru Queru', budget: 185000, source: 'TikTok Lead', age: 'Hace 5 horas', appointment: { date: '2026-06-19', time: '15:30' } },
  { id: 'lead-3', name: 'Sofía Blanco', email: 'sofia@ejemplo.com', phone: '+591 717 44332', status: 'VISITA', interest: 'Departamento en El Prado', budget: 95000, source: 'Recomendado', age: 'Ayer', appointment: { date: '2026-06-22', time: '11:00' } },
  { id: 'lead-4', name: 'Jorge Arandia', email: 'jorge@ejemplo.com', phone: '+591 707 11223', status: 'NEGOCIACION', interest: 'Terreno en Queru Queru', budget: 140000, source: 'TikTok Lead', age: 'Hace 3 días', appointment: null },
  { id: 'lead-5', name: 'Patricia Vargas', email: 'patricia@ejemplo.com', phone: '+591 727 65432', status: 'RESERVADO', interest: 'Casa de Lujo en Cala Cala', budget: 450000, source: 'Instagram Ads', age: 'Hace 5 días', appointment: null },
  { id: 'lead-6', name: 'Alejandro Mercado', email: 'alejandro@ejemplo.com', phone: '+591 712 99887', status: 'CERRADO', interest: 'Oficina Comercial en Miraflores', budget: 120000, source: 'WhatsApp', age: 'Hace 1 semana', appointment: null },
];

const DEFAULT_TEMPLATES: Record<string, string> = {
  NUEVO: 'Hola {name}, te saluda tu Asesor Comercial de Propio. Vi que te interesa la propiedad "{interest}" (Presupuesto: {budget}). Me pongo a tu servicio por este canal privado.',
  CONTACTADO: 'Hola {name}, un gusto volver a saludarte. Quería saber si tuviste alguna duda sobre la propiedad "{interest}". ¿Agendamos una llamada corta hoy?',
  VISITA: 'Hola {name}, ¿cómo estás? Te escribo para confirmar nuestra visita programada a la propiedad "{interest}" para el día {date} a las {time}. ¿Sigue todo en pie?',
  NEGOCIACION: 'Hola {name}, excelente reunión. Te comparto los detalles para formalizar la propuesta por "{interest}" con el propietario.',
  RESERVADO: 'Hola {name}, felicitaciones por reservar la propiedad "{interest}". Te adjunto el borrador del contrato de compra-venta para tu revisión.',
  CERRADO: 'Hola {name}, ¡felicidades por tu nueva adquisición de "{interest}"! Fue un placer asesorarte en todo el proceso.'
};

export default function RadarDeCierrePage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('NUEVO'); // Para navegación móvil
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // Template editor state
  const [templates, setTemplates] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [editingTemplateStage, setEditingTemplateStage] = useState<string | null>(null);
  const [tempTemplateText, setTempTemplateText] = useState('');

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

  const updateLeadAppointment = (id: string, date: string, time: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          return {
            ...l,
            appointment: date ? { date, time: time || '12:00' } : null
          };
        }
        return l;
      })
    );
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
    let template = templates[lead.status] || templates.NUEVO;
    
    // Replace place holders
    const formattedBudget = `$${lead.budget.toLocaleString()} USD`;
    const appointmentDate = lead.appointment?.date || '[Sin fecha]';
    const appointmentTime = lead.appointment?.time || '[Sin hora]';

    const finalMessage = template
      .replace(/{name}/g, lead.name)
      .replace(/{interest}/g, lead.interest)
      .replace(/{budget}/g, formattedBudget)
      .replace(/{date}/g, appointmentDate)
      .replace(/{time}/g, appointmentTime);

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(finalMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const openTemplateEditor = (stageId: string) => {
    setEditingTemplateStage(stageId);
    setTempTemplateText(templates[stageId] || '');
  };

  const saveTemplate = () => {
    if (editingTemplateStage) {
      setTemplates(prev => ({
        ...prev,
        [editingTemplateStage]: tempTemplateText
      }));
      setEditingTemplateStage(null);
    }
  };

  return (
    <div className="w-full h-full p-6 flex flex-col overflow-hidden bg-[#F8FAFC]">
      
      {/* Título y Filtros Superiores - flex-shrink-0 */}
      <div className="flex-shrink-0 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#04045E] uppercase tracking-tight font-sans">El Radar de Cierre</h1>
          <p className="text-slate-500 text-sm font-medium">Gestiona tu embudo de ventas en tiempo real sin límites de espacio.</p>
        </div>
        
        <div className="flex items-center gap-3">
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

          {/* Botón Salir */}
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
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-200/50 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Cerrar Sesión"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
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
              className={`w-80 min-w-[320px] flex-shrink-0 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full overflow-hidden transition-all duration-300 ${stage.borderStyle} ${
                isColActiveMobile ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Cabecera de Columna */}
              <div className="flex justify-between items-center mb-4 flex-shrink-0 border-b pb-3 border-slate-200/50">
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-sm text-[#04045E] tracking-tight flex items-center gap-1.5">
                    {stage.label}
                    <button
                      onClick={() => openTemplateEditor(stage.id)}
                      className="text-slate-400 hover:text-[#04045E] p-0.5 rounded transition-all"
                      title="Editar plantilla WhatsApp"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">{stage.subtitle}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${stage.textColor} ${stage.bgColor} border-current`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Listado de Tarjetas */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedOverStage !== stage.id) {
                    setDraggedOverStage(stage.id);
                  }
                }}
                onDragLeave={() => setDraggedOverStage(null)}
                onDrop={(e) => handleDrop(e, stage.id as Lead['status'])}
                className={`space-y-4 flex-1 overflow-y-auto pr-1 pb-2 transition-colors duration-250 rounded-xl scrollbar-thin scrollbar-thumb-slate-100 ${
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
                      className="bg-[#F8FAFC] border border-slate-100 rounded-xl p-4 shadow-2xs hover:shadow-md hover:scale-[1.01] hover:border-[#b9fa3c]/30 transition-all duration-300 cursor-grab active:cursor-grabbing flex flex-col gap-3.5"
                    >
                      {/* Nombre & Age */}
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

                      {/* Interés y Presupuesto */}
                      <div className="bg-white border border-slate-150 p-2.5 rounded-lg space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Interés</span>
                          <span className="text-xs font-black text-[#04045E]">${lead.budget.toLocaleString()} USD</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700 leading-snug">
                          {lead.interest}
                        </p>
                      </div>

                      {/* Agendamiento de Cita */}
                      <div className="bg-white border border-slate-150 p-2.5 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cita Programada</span>
                          {lead.appointment ? (
                            <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">Activa</span>
                          ) : (
                            <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">Sin agendar</span>
                          )}
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="date"
                            value={lead.appointment?.date || ''}
                            onChange={(e) => updateLeadAppointment(lead.id, e.target.value, lead.appointment?.time || '12:00')}
                            className="flex-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[9px] text-slate-700 font-bold focus:outline-none focus:border-[#04045E]"
                          />
                          <input
                            type="time"
                            value={lead.appointment?.time || ''}
                            onChange={(e) => updateLeadAppointment(lead.id, lead.appointment?.date || '', e.target.value)}
                            className="w-18 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg text-[9px] text-slate-700 font-bold focus:outline-none focus:border-[#04045E]"
                          />
                        </div>
                      </div>

                      {/* Origen & Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                        <span className="bg-[#b9fa3c]/25 text-[#04045E] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          {lead.source}
                        </span>
                        <span className="bg-blue-50 text-[#0066ff] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-blue-100/55">
                          Sello Oro
                        </span>
                      </div>

                      {/* Acciones de Columna y WhatsApp */}
                      <div className="flex gap-2 items-center pt-1 border-t border-slate-100/60">
                        <button
                          type="button"
                          disabled={stage.id === 'NUEVO' || actionLoadingId === lead.id}
                          onClick={() => moveLead(lead.id, lead.status, 'backward')}
                          className="w-9 h-9 shrink-0 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 text-[#04045E] font-black text-xs rounded-xl transition-all flex items-center justify-center active:scale-95 shadow-sm"
                          title="Retroceder columna"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          disabled={stage.id === 'CERRADO' || actionLoadingId === lead.id}
                          onClick={() => moveLead(lead.id, lead.status, 'forward')}
                          className="flex-1 h-9 bg-[#04045E] hover:bg-[#04045E]/90 text-white disabled:opacity-40 border border-[#04045E] font-black text-[9px] uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                        >
                          <span>Avanzar</span> ▶
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerWhatsApp(lead)}
                          className="w-9 h-9 shrink-0 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-full transition-all flex items-center justify-center active:scale-90 shadow-md shadow-emerald-500/20"
                          title="Enviar WhatsApp"
                        >
                          <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                          </svg>
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* MODAL EDICIÓN PLANTILLA */}
      {editingTemplateStage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                Editar Plantilla WhatsApp
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingTemplateStage(null)}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Personaliza el mensaje automático de WhatsApp para la columna: <strong>{editingTemplateStage}</strong>.
              </p>
              
              <div className="bg-slate-100 p-3.5 rounded-xl border space-y-1 text-[10px] text-slate-500 font-bold">
                <span className="block text-[#04045E] uppercase tracking-wider mb-1">Variables Disponibles:</span>
                <p>• <code className="bg-white border px-1 rounded text-emerald-600">{`{name}`}</code> : Nombre del Lead</p>
                <p>• <code className="bg-white border px-1 rounded text-emerald-600">{`{interest}`}</code> : Propiedad de interés</p>
                <p>• <code className="bg-white border px-1 rounded text-emerald-600">{`{budget}`}</code> : Presupuesto del Lead</p>
                <p>• <code className="bg-white border px-1 rounded text-emerald-600">{`{date}`}</code> : Fecha de la cita programada</p>
                <p>• <code className="bg-white border px-1 rounded text-emerald-600">{`{time}`}</code> : Hora de la cita programada</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Texto del Mensaje</label>
                <textarea
                  value={tempTemplateText}
                  onChange={e => setTempTemplateText(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E] resize-none"
                  placeholder="Escribe la plantilla de mensaje aquí..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingTemplateStage(null)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveTemplate}
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01]"
              >
                Guardar Plantilla 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
