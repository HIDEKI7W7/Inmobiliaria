'use client';

import React, { useEffect, useState } from 'react';
import { leadsService, Lead } from '../../services/leads.service';

// Estructura de las 6 etapas del Mapa Maestro de Propio
const STAGES = [
  { id: 'LEAD_ENTRANTE', label: 'Lead Entrante', subtitle: 'Oportunidad', color: 'border-l-blue-400 bg-blue-500/5 text-blue-400' },
  { id: 'CITA_AGENDADA', label: 'Cita Agendada', subtitle: 'Reunión', color: 'border-l-indigo-400 bg-indigo-500/5 text-indigo-400' },
  { id: 'VISITA_REALIZADA', label: 'Visita Realizada', subtitle: 'Inspección', color: 'border-l-purple-400 bg-purple-500/5 text-purple-400' },
  { id: 'NEGOCIACION', label: 'Oferta / Negoc.', subtitle: 'Propuesta', color: 'border-l-pink-400 bg-pink-500/5 text-pink-400' },
  { id: 'RESERVA', label: 'Reserva', subtitle: 'Bloqueo Activo', color: 'border-l-amber-500 bg-amber-500/5 text-amber-400' },
  { id: 'CIERRE', label: 'Cierre / Liquid.', subtitle: 'Firma / Éxito', color: 'border-l-emerald-400 bg-emerald-500/5 text-emerald-400' },
];

export default function AgentCRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('LEAD_ENTRANTE'); // Para navegación móvil por columnas
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [blackoutAnimation, setBlackoutAnimation] = useState<string | null>(null); // Id del lead reservado

  useEffect(() => {
    async function loadCRMLeads() {
      try {
        setLoading(true);
        // Usamos el token del agente logueado para seguridad (mock-agent-token)
        const data = await leadsService.getAgentLeads('mock-agent-token');
        setLeads(data);
      } catch (error) {
        console.error('Error al cargar leads del CRM:', error);
        showToast('Error al conectar con la bandeja de leads', 'info');
      } finally {
        setLoading(false);
      }
    }
    loadCRMLeads();
  }, []);

  const showToast = (message: string, type: 'success' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Movimiento de leads entre etapas
  const moveLead = async (id: string, currentStatus: string, direction: 'forward' | 'backward') => {
    const currentIndex = STAGES.findIndex((s) => s.id === currentStatus);
    let newIndex = currentIndex;

    if (direction === 'forward' && currentIndex < STAGES.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex === currentIndex) return;

    const nextStatus = STAGES[newIndex].id;

    try {
      setActionLoadingId(id);
      
      // Llamar al API con token mock de agente
      await leadsService.updateLeadStatus(id, nextStatus, 'mock-agent-token');

      // Animación de Blackout Automático si se mueve a RESERVA (Etapa 5)
      if (nextStatus === 'RESERVA') {
        const leadObj = leads.find((l) => l.id === id);
        setBlackoutAnimation(leadObj?.property?.title || 'Propiedad Reservada');
        setTimeout(() => setBlackoutAnimation(null), 4000);
      }

      // Actualizar estado local
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === id) {
            const updatedLead = { ...l, status: nextStatus };
            if (nextStatus === 'RESERVA' && updatedLead.property) {
              updatedLead.property = {
                ...updatedLead.property,
                // Mapear el blackout en la propiedad simulada
                price: updatedLead.property.price,
                title: updatedLead.property.title,
                imageUrl: updatedLead.property.imageUrl,
              };
            }
            return updatedLead;
          }
          return l;
        })
      );

      showToast(`Prospecto movido con éxito a la etapa: ${STAGES[newIndex].label}`, 'success');
    } catch (error) {
      console.error('Error al mover prospecto en el CRM:', error);
      showToast('Error de autenticación. Se requiere perfil AGENTE.', 'info');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Construye la URL de WhatsApp Web pre-formateada
  const triggerWhatsApp = (lead: Lead) => {
    const rawPhone = lead.phone.replace(/[^0-9+]/g, '');
    const propertyTitle = lead.property?.title || 'Inmueble de tu interés';
    const propertyPrice = lead.property?.price?.toLocaleString() || '---';

    const message = `Hola ${lead.name}, te saluda tu Asesor Comercial de la inmobiliaria tecnológica Propio 🚀. Te escribo en relación a tu consulta sobre el inmueble "${propertyTitle}" con precio de $${propertyPrice} USD. ¿Cuándo tendrías 5 minutos para coordinar los detalles o agendar una cita?`;
    
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodedText}`;

    // Abrimos en una pestaña nueva
    window.open(whatsappUrl, '_blank');
    showToast('Abriendo enlace de WhatsApp con plantilla personalizada...', 'success');
  };

  return (
    <div className="min-h-screen bg-[#02020e] text-[#f1f5f9] flex flex-col font-sans relative overflow-hidden">
      
      {/* Grilla Holográfica y Acento Radial en Azul Profundo (#04045E) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#070929_1px,transparent_1px),linear-gradient(to_bottom,#070929_1px,transparent_1px)] bg-[mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_80%,transparent_100%)] bg-[size:5rem_5rem] pointer-events-none z-0"></div>
      
      <div className="flex-grow w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Encabezado del CRM */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#0f1137]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#050516] border border-[#161a4c]">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-[10px] font-sans font-black tracking-widest text-slate-400 uppercase">
                Panel del Asesor Comercial
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white uppercase leading-none">
              El Radar de Cierre
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl font-medium">
              Gestiona tu embudo de ventas en tiempo real. Mueve tus prospectos a lo largo de las 6 etapas estratégicas del Mapa Maestro de Propio.
            </p>
          </div>

          {/* Estadísticas Compactas del Asesor */}
          <div className="flex gap-4 p-3 bg-[#06061c]/90 rounded-2xl border border-[#161a4c] backdrop-blur-md">
            <div className="text-center px-4.5 border-r border-[#161a4c]">
              <span className="block text-[8px] font-black text-slate-500 uppercase">Total Cartera</span>
              <span className="text-lg font-black text-white">{leads.length}</span>
            </div>
            <div className="text-center px-4.5 border-r border-[#161a4c]">
              <span className="block text-[8px] font-black text-amber-500 uppercase">Reservados</span>
              <span className="text-lg font-black text-amber-400">
                {leads.filter((l) => l.status === 'RESERVA').length}
              </span>
            </div>
            <div className="text-center px-4.5">
              <span className="block text-[8px] font-black text-emerald-400 uppercase">Cerrados</span>
              <span className="text-lg font-black text-emerald-400">
                {leads.filter((l) => l.status === 'CIERRE').length}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN MÓVIL POR ETAPAS (Tabs - Mobile-First) */}
        <div className="lg:hidden flex overflow-x-auto gap-2 py-2 no-scrollbar border-b border-[#0f1137] pb-4">
          {STAGES.map((stage) => {
            const count = leads.filter((l) => l.status === stage.id).length;
            const isActive = activeTab === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveTab(stage.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-sans font-black uppercase tracking-wider border transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                    : 'bg-[#06061c] text-slate-400 border-[#161a4c] hover:text-white'
                }`}
              >
                {stage.label} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center bg-[#050516]/80 backdrop-blur-md rounded-2xl border border-[#161a4c]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#161a4c] border-t-indigo-500 mb-4"></div>
            <p className="text-xs uppercase font-black tracking-widest text-slate-400 animate-pulse">
              Conectando con tu radar de conversión...
            </p>
          </div>
        ) : (
          /* CONTENEDOR DEL TABLERO KANBAN */
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
            {STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.status === stage.id);
              const isColActiveMobile = activeTab === stage.id;

              return (
                <div
                  key={stage.id}
                  className={`flex flex-col space-y-4 transition-all duration-300 ${
                    isColActiveMobile ? 'block' : 'hidden lg:flex'
                  }`}
                >
                  
                  {/* Encabezado de la Columna */}
                  <div className={`p-4.5 rounded-2xl border-l-4 border border-[#161a4c] backdrop-blur-md ${stage.color} flex flex-col gap-1`}>
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-xs uppercase tracking-wider text-white">
                        {stage.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-black tracking-widest bg-slate-900 border border-slate-800 text-slate-400">
                        {stageLeads.length}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                      {stage.subtitle}
                    </span>
                  </div>

                  {/* Tarjetas de Prospectos */}
                  <div className="flex-grow min-h-[400px] lg:min-h-[550px] bg-[#030312]/30 rounded-2xl border border-[#0f1137]/60 p-3 space-y-4 overflow-y-auto">
                    {stageLeads.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-[#161a4c]/30 rounded-xl py-12">
                        <span className="text-xl opacity-30 mb-2">📁</span>
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-500">
                          Sin Prospectos
                        </p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-[#050516]/90 border border-[#161a4c] rounded-2xl overflow-hidden shadow-lg p-4 flex flex-col justify-between space-y-4 hover:border-indigo-500/50 hover:bg-[#080824]/90 transition-all duration-300 group"
                        >
                          {/* Datos del Cliente */}
                          <div className="space-y-1">
                            <h4 className="font-heading font-black text-sm text-white uppercase leading-snug group-hover:text-indigo-400 transition-colors">
                              {lead.name}
                            </h4>
                            <div className="text-[10px] text-slate-400 space-y-0.5">
                              <p className="flex items-center gap-1.5 truncate">
                                📧 {lead.email}
                              </p>
                              <p className="flex items-center gap-1.5 font-mono">
                                📞 {lead.phone}
                              </p>
                            </div>
                          </div>

                          {/* Miniatura de Propiedad por la que preguntó */}
                          {lead.property && (
                            <div className="flex items-center gap-3 bg-[#080822] p-2 rounded-xl border border-[#161a4c]/50 relative overflow-hidden">
                              <div className="h-11 w-11 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                                <img
                                  src={lead.property.imageUrl}
                                  alt={lead.property.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-grow">
                                <p className="text-[10px] text-white font-extrabold uppercase truncate tracking-tight">
                                  {lead.property.title}
                                </p>
                                <p className="text-[11px] font-sans font-black text-indigo-400">
                                  ${lead.property.price.toLocaleString()} <span className="text-[9px] text-slate-400 font-bold">USD</span>
                                </p>
                              </div>

                              {/* Indicador visual de blackout en miniatura */}
                              {lead.status === 'RESERVA' && (
                                <div className="absolute inset-0 bg-[#78350f]/80 backdrop-blur-xs flex items-center justify-center">
                                  <span className="text-[9px] font-sans font-black tracking-widest text-amber-300 uppercase animate-pulse">
                                    🔒 RESERVADA (Blackout)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Acciones del Lead */}
                          <div className="pt-2 border-t border-[#0f1137] space-y-3">
                            
                            {/* Enviar WhatsApp */}
                            <button
                              type="button"
                              onClick={() => triggerWhatsApp(lead)}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-900 font-sans font-black tracking-widest text-[9px] rounded-xl transition-all uppercase flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                            >
                              💬 Enviar por WhatsApp
                            </button>

                            {/* Controles de Movimiento Táctil (Mobile-First) */}
                            <div className="flex justify-between gap-2">
                              <button
                                type="button"
                                disabled={stage.id === 'LEAD_ENTRANTE' || actionLoadingId === lead.id}
                                onClick={() => moveLead(lead.id, lead.status, 'backward')}
                                className="flex-1 py-1.5 bg-[#080820] hover:bg-[#0f113c] disabled:opacity-30 disabled:hover:bg-[#080820] border border-[#161a4c] text-white font-black text-[9px] rounded-lg transition-all uppercase text-center flex items-center justify-center gap-0.5"
                                title="Retroceder Etapa"
                              >
                                ◀ Regresar
                              </button>
                              <button
                                type="button"
                                disabled={stage.id === 'CIERRE' || actionLoadingId === lead.id}
                                onClick={() => moveLead(lead.id, lead.status, 'forward')}
                                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 border border-indigo-500 text-white font-black text-[9px] rounded-lg transition-all uppercase text-center flex items-center justify-center gap-0.5"
                                title="Avanzar Etapa"
                              >
                                Avanzar ▶
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
        )}
      </div>

      {/* Alerta de Animación de Blackout Automática */}
      {blackoutAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010106]/95 backdrop-blur-md animate-fade-in">
          <div className="bg-[#050516] border-2 border-amber-500 rounded-3xl w-full max-w-md p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] space-y-6 transform animate-scale-up">
            <span className="text-5xl block animate-bounce">🔒</span>
            <div className="space-y-2">
              <h2 className="text-xl font-heading font-black text-amber-400 uppercase tracking-wide">
                ¡Blackout Comercial Activado!
              </h2>
              <p className="text-xs text-slate-300 font-bold uppercase tracking-tight">
                Inmueble Bloqueado Simultáneamente
              </p>
              <p className="text-sm text-white font-extrabold italic bg-[#0f1133] p-3.5 rounded-2xl border border-[#161a4c] mt-2">
                "{blackoutAnimation}"
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-3">
                El inmueble ha sido retirado automáticamente del catálogo público del marketplace. El estado en la base de datos se ha actualizado a <span className="text-amber-400 font-bold">RESERVADO</span>.
              </p>
            </div>
            <button
              onClick={() => setBlackoutAnimation(null)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-sans font-black text-[10px] rounded-xl uppercase tracking-wider transition-all"
            >
              Entendido, Continuar CRM
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl ${
              toast.type === 'success'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <span className="text-sm">🎯</span>
            <span className="text-xs font-sans font-bold tracking-tight text-white">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
