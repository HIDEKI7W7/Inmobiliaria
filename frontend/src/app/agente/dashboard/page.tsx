'use client';

import React from 'react';
import Link from 'next/link';

export default function AgentDashboard() {
  const metrics = [
    { title: 'Mis ventas del mes', value: '$452,000 USD', change: '+12.4%', color: 'text-emerald-600', icon: '💰' },
    { title: 'Comisiones estimadas', value: '$13,560 USD', change: '+3% tarifa', color: 'text-indigo-600', icon: '📈' },
    { title: 'Propiedades activas', value: '18', change: '5 destacadas', color: 'text-amber-600', icon: '🏠' },
    { title: 'Leads calificados', value: '42', change: '+8 esta semana', color: 'text-sky-600', icon: '🎯' },
  ];

  const recentActivities = [
    { id: 1, user: 'María Quispe', action: 'solicitó información sobre Casa en Cala Cala', time: 'Hace 10 min', platform: 'WhatsApp' },
    { id: 2, user: 'Carlos Rodríguez', action: 'agendó una visita para el Penthouse en Queru Queru', time: 'Hace 1 hora', platform: 'Calendario' },
    { id: 3, user: 'Sofía Blanco', action: 'realizó una oferta de compra en El Prado', time: 'Hace 3 horas', platform: 'TikTok Lead' },
    { id: 4, user: 'Sistema', action: 'Sello Oro verificado para Casa en Cala Cala exitosamente', time: 'Hace 6 horas', platform: 'Legal' },
  ];

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Saludo y bienvenida */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#04045E] uppercase tracking-tight">
            ¡Hola, Asesor!
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Aquí tienes un resumen en tiempo real de tus propiedades y prospectos para hoy.
          </p>
        </div>
        <Link 
          href="/propietario/nuevo"
          className="bg-[#b9fa3c] text-[#04045E] font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
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
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-50 rounded-full ${m.color}`}>
                {m.change}
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
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
        
        {/* Lado Izquierdo: Feed de Actividades Recientes */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-xs text-[#04045E] uppercase tracking-wider">
              Actividades Recientes
            </h3>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#0066ff] bg-blue-50 px-2.5 py-1 rounded-full animate-pulse">
              En Vivo
            </span>
          </div>
          <div className="space-y-5">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#04045E]/5 flex items-center justify-center text-xs font-black shrink-0 text-[#04045E] border border-[#04045E]/10">
                    {act.user.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                      <strong className="text-[#04045E] font-black">{act.user}</strong> {act.action}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:self-center self-start pl-14 sm:pl-0">
                  <span className="text-[8px] font-black uppercase text-slate-400">
                    {act.time}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md border border-slate-200/50 font-sans">
                    {act.platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
                className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#04045E] border border-slate-200/70 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between hover:scale-[1.01]"
              >
                <span className="flex items-center gap-2">🎯 Abrir Radar de Cierre</span>
                <span>→</span>
              </Link>
              <Link 
                href="/agente/propiedades" 
                className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#04045E] border border-slate-200/70 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between hover:scale-[1.01]"
              >
                <span className="flex items-center gap-2">🏠 Mis Propiedades</span>
                <span>→</span>
              </Link>
              <Link 
                href="/agente/clientes" 
                className="w-full bg-[#F8FAFC] hover:bg-slate-100 text-[#04045E] border border-slate-200/70 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-between hover:scale-[1.01]"
              >
                <span className="flex items-center gap-2">👥 Mis Clientes Activos</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-[#b9fa3c]/10 border border-[#b9fa3c]/35 rounded-xl p-4 mt-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#04045E] mb-1.5 flex items-center gap-1.5">
              <span>💡</span> Consejo del día
            </p>
            <p className="text-xs text-slate-700 leading-relaxed font-semibold">
              Los inmuebles con el Sello Oro tienen una conversión de cierre hasta 3.4 veces más rápida. Asegúrate de verificar los folios reales de tus clientes.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
