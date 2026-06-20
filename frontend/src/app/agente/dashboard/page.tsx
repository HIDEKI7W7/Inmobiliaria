'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { leadsService, Lead, CommissionDeal } from '../../../services/leads.service';
import { propertiesService } from '../../../services/properties.service';
import { Property } from '../../../components/modules/properties/PropertyCard';
import { getCurrentUser } from '@/utils/session';

export default function AgentDashboard() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [misLeads, setMisLeads] = useState<Lead[]>([]);
  const [propiedadesAsignadas, setPropiedadesAsignadas] = useState<Property[]>([]);
  const [deals, setDeals] = useState<CommissionDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('seenAgentNotification');
    if (!hasSeen) {
      setShowUpdateModal(true);
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load leads
        const leadsData = await leadsService.getAgentLeads(token);
        setMisLeads(leadsData || []);

        // Load deals
        const dealsData = await leadsService.getAgentDeals(token);
        setDeals(dealsData || []);

        // Load properties
        const allProps = await propertiesService.getProperties();
        // Filter properties assigned to this agent (by agentId or agent_id matching user.userId)
        const agentProps = allProps.filter(
          p => (p as any).agentId === user?.userId || (p as any).agent_id === user?.userId
        );
        setPropiedadesAsignadas(agentProps || []);
      } catch (error) {
        console.error('Error loading Agent Dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleCloseModal = () => {
    sessionStorage.setItem('seenAgentNotification', 'true');
    setShowUpdateModal(false);
  };

  // KPIs Calculations
  const activeDeals = deals.filter(d => d.status === 'ACTIVO');
  const totalSales = activeDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalCommissions = activeDeals.reduce((sum, d) => sum + (d.commission || 0), 0);

  const salesLabel = totalSales > 0 ? `$${totalSales.toLocaleString()} USD` : '$0 USD';
  const commissionLabel = totalCommissions > 0 ? `$${totalCommissions.toLocaleString()} USD` : '$0 USD';
  const activePropertiesCount = propiedadesAsignadas.length;
  const leadsCount = misLeads.length;

  const metrics = [
    { 
      title: 'Mis ventas del mes', 
      value: salesLabel, 
      change: activeDeals.length > 0 ? `+${activeDeals.length} cierres` : 'Sin cierres', 
      color: totalSales > 0 ? 'text-emerald-600' : 'text-slate-400', 
      icon: '💰' 
    },
    { 
      title: 'Comisiones estimadas', 
      value: commissionLabel, 
      change: 'Tarifa promedio', 
      color: totalCommissions > 0 ? 'text-indigo-600' : 'text-slate-400', 
      icon: '📈' 
    },
    { 
      title: 'Propiedades activas', 
      value: String(activePropertiesCount), 
      change: 'En cartera', 
      color: activePropertiesCount > 0 ? 'text-amber-600' : 'text-slate-400', 
      icon: '🏠' 
    },
    { 
      title: 'Leads calificados', 
      value: String(leadsCount), 
      change: 'Activos', 
      color: leadsCount > 0 ? 'text-sky-600' : 'text-slate-400', 
      icon: '🎯' 
    },
  ];

  // Dynamic activities mapped from misLeads
  const dynamicActivities = misLeads.map((lead) => {
    let action = 'se registró como interesado';
    if (lead.status === 'LEAD_ENTRANTE') {
      action = `solicitó información sobre ${lead.property?.title || 'una propiedad'}`;
    } else if (lead.status === 'CONTACTADO') {
      action = `fue contactado para el inmueble ${lead.property?.title || 'una propiedad'}`;
    } else if (lead.status === 'CITA_AGENDADA' || lead.status === 'VISITA') {
      action = `agendó una visita para ${lead.property?.title || 'una propiedad'}`;
    } else if (lead.status === 'NEGOCIACION') {
      action = `realizó una oferta en ${lead.property?.title || 'una propiedad'}`;
    } else if (lead.status === 'RESERVADO') {
      action = `reservó la propiedad ${lead.property?.title || 'una propiedad'}`;
    } else if (lead.status === 'CERRADO') {
      action = `concretó la firma para ${lead.property?.title || 'una propiedad'}`;
    }

    const timeLabel = lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('es-BO') : 'Reciente';

    return {
      id: lead.id,
      user: lead.name,
      action,
      time: timeLabel,
      platform: lead.customerProfile?.whatsappPhone ? 'WhatsApp' : 'Web'
    };
  });

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Saludo y bienvenida */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#04045E] uppercase tracking-tight">
            ¡Hola, Asesor! 👋
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 font-sans">
            Aquí tienes un resumen en tiempo real de tus propiedades y prospectos para hoy.
          </p>
        </div>
        <Link 
          href="/propietario/nuevo"
          className="bg-[#b9fa3c] text-[#04045E] font-sans font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
        >
          Publicar Inmueble Nuevo
        </Link>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-350 hover:scale-[1.01]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl">{m.icon}</span>
              <span className={`text-[10px] font-sans font-black uppercase tracking-wider px-2.5 py-1 bg-slate-50 rounded-full ${m.color}`}>
                {m.change}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-sans font-black uppercase tracking-widest">
              {m.title}
            </p>
            <h3 className="text-3xl font-black text-[#04045E] mt-1 tracking-tight">
              {m.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Contenedores Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Izquierdo: Feed de Actividades Recientes / Estado Vacío */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-xs text-[#04045E] uppercase tracking-wider">
              Actividades Recientes
            </h3>
            {misLeads.length > 0 && (
              <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#0066ff] bg-blue-50 px-2.5 py-1 rounded-full animate-pulse">
                En Vivo
              </span>
            )}
          </div>
          
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04045E]" />
            </div>
          ) : misLeads.length === 0 ? (
            <div className="text-center py-12 px-6 space-y-5">
              <div className="w-16 h-16 mx-auto bg-[#ccff00]/20 text-[#04045E] rounded-full flex items-center justify-center text-3xl border border-[#ccff00]/35">
                👥
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-heading font-black text-[#04045E] uppercase tracking-wide">
                  Tu cartera está lista para crecer
                </h4>
                <p className="text-xs font-sans font-medium text-slate-550 max-w-sm mx-auto leading-relaxed">
                  No tienes leads asignados en este momento.
                </p>
              </div>
              <div>
                <Link
                  href="/agente/propiedades"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#b9fa3c] hover:bg-[#adf02c] text-[#04045E] font-sans font-black text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-md shadow-[#b9fa3c]/20"
                >
                  🔍 Revisar Stock de Propiedades
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {dynamicActivities.map((act) => (
                <div key={act.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-[#04045E]/5 flex items-center justify-center text-xs font-black shrink-0 text-[#04045E] border border-[#04045E]/10 font-sans">
                      {act.user.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed font-sans">
                        <strong className="text-[#04045E] font-black">{act.user}</strong> {act.action}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:self-center self-start pl-14 sm:pl-0 font-sans">
                    <span className="text-[8px] font-sans font-black uppercase text-slate-400">
                      {act.time}
                    </span>
                    <span className="text-[8px] font-sans font-black uppercase tracking-widest bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md border border-slate-200/50">
                      {act.platform}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lado Derecho: Acceso Rápido y Consejos de Venta */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-bold text-xs text-[#04045E] uppercase tracking-wider border-b border-slate-100 pb-4">
              Accesos Rápidos
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link 
                href="/agente/leads" 
                className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#04045E] border border-slate-200/70 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between hover:scale-[1.01] font-sans"
              >
                <span className="flex items-center gap-2">🎯 Abrir Radar de Cierre</span>
                <span>→</span>
              </Link>
              <Link 
                href="/agente/propiedades" 
                className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#04045E] border border-slate-200/70 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between hover:scale-[1.01] font-sans"
              >
                <span className="flex items-center gap-2">🏠 Mis Propiedades</span>
                <span>→</span>
              </Link>
              <Link 
                href="/agente/clientes" 
                className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#04045E] border border-slate-200/70 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between hover:scale-[1.01] font-sans"
              >
                <span className="flex items-center gap-2">👥 Mis Clientes Activos</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#b9fa3c]/10 border border-[#b9fa3c]/35 rounded-xl p-4 mt-6 font-sans">
            <p className="text-[9px] font-sans font-black uppercase tracking-widest text-[#04045E] mb-1.5 flex items-center gap-1.5">
              <span>💡</span> Consejo del día
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              Los inmuebles con el Sello Oro tienen una conversión de cierre hasta 3.4 veces más rápida. Asegúrate de verificar los folios reales de tus clientes.
            </p>
          </div>
        </div>

      </div>

      {/* SISTEMA DE NOTIFICACIONES GLOBALES: OVERLAY MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="text-center space-y-3 font-sans">
              <div className="h-12 w-12 rounded-full bg-[#b9fa3c]/10 border border-[#b9fa3c]/35 flex items-center justify-center mx-auto text-xl animate-pulse">
                💵
              </div>
              <h2 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                Esquema de Comisiones 2026
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mensaje Mandatorio para Asesores
              </p>
            </div>

            <div className="text-xs text-slate-650 leading-relaxed font-semibold space-y-4 bg-slate-50 border p-4 rounded-2xl font-sans">
              <div>
                <p className="text-[#04045E] font-black text-xs uppercase tracking-wider mb-1">📈 Estructura del Cierre:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Comisión General:</strong> 1.5% del valor total de la transacción.</li>
                  <li><strong>Distribución Estándar:</strong> 50% para PROPIO y 50% para el Asesor (0.75% c/u).</li>
                  <li><strong>Bono Especial:</strong> Captaciones verificadas con <strong>Sello Oro</strong> otorgan un <strong>+0.25% extra</strong> de comisión directa al Asesor.</li>
                </ul>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <p className="text-[#04045E] font-black text-xs uppercase tracking-wider mb-1">🛠️ Reglas de Registro:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Es obligatorio registrar el cliente en el módulo <strong>Mis Clientes</strong> antes del cierre.</li>
                  <li>El cierre debe asociar de forma directa la propiedad activa y cargar el respaldo en PDF (minuta o contrato).</li>
                  <li>El asesor tiene un límite de <strong>24 horas</strong> desde la firma para registrar o modificar los datos del cierre.</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              Entendido y Aceptado 🚀
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
