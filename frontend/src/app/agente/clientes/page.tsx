'use client';

import React, { useState } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  budget: number;
  source: string;
  rating: number;
  status: string;
}

const CLIENT_LIST: Client[] = [
  { id: 'cli-1', name: 'María Quispe', email: 'maria@ejemplo.com', phone: '+591 772 34567', interest: 'Casa en Cala Cala', budget: 320000, source: 'WhatsApp', rating: 5, status: 'Activo (Negociación)' },
  { id: 'cli-2', name: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', phone: '+591 601 98765', interest: 'Penthouse en Queru Queru', budget: 185000, source: 'TikTok Lead', rating: 4, status: 'Activo (Contactado)' },
  { id: 'cli-3', name: 'Sofía Blanco', email: 'sofia@ejemplo.com', phone: '+591 717 44332', interest: 'Departamento en El Prado', budget: 95000, source: 'Recomendado', rating: 3, status: 'Visita Programada' },
  { id: 'cli-4', name: 'Jorge Arandia', email: 'jorge@ejemplo.com', phone: '+591 707 11223', interest: 'Terreno en Queru Queru', budget: 140000, source: 'TikTok Lead', rating: 4, status: 'Activo (Propuestas)' },
  { id: 'cli-5', name: 'Patricia Vargas', email: 'patricia@ejemplo.com', phone: '+591 727 65432', interest: 'Casa de Lujo en Cala Cala', budget: 450000, source: 'Instagram Ads', rating: 5, status: 'Reservado (Seña)' },
  { id: 'cli-6', name: 'Alejandro Mercado', email: 'alejandro@ejemplo.com', phone: '+591 712 99887', interest: 'Oficina Comercial en Miraflores', budget: 120000, source: 'WhatsApp', rating: 4, status: 'Cerrado' },
];

export default function AgentClients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');

  const filteredClients = CLIENT_LIST.filter((cli) => {
    const matchesSearch = cli.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cli.interest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cli.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = filterSource === 'ALL' || cli.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const triggerWhatsApp = (cli: Client) => {
    const rawPhone = cli.phone.replace(/[^0-9+]/g, '');
    const message = `Hola ${cli.name}, te saluda tu Asesor Comercial de Propio. Quería hacer un seguimiento sobre la propiedad de tu interés "${cli.interest}" (Presupuesto: $${cli.budget.toLocaleString()} USD). Quedo a tu disposición para agendar cualquier visita.`;
    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Directorio de Clientes
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Revisa la información de contacto y haz un seguimiento oportuno a tus leads calificados.
          </p>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="md:col-span-2 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o interés de propiedad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-[#04045E] font-semibold focus:outline-none focus:border-[#b9fa3c] focus:ring-1 focus:ring-[#b9fa3c] placeholder-slate-400"
          />
        </div>
        <div>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs text-[#04045E] font-black uppercase tracking-wider focus:outline-none focus:border-[#b9fa3c]"
          >
            <option value="ALL">Todos los Orígenes</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="TikTok Lead">TikTok Lead</option>
            <option value="Recomendado">Recomendado</option>
            <option value="Instagram Ads">Instagram Ads</option>
          </select>
        </div>
      </div>

      {/* Directorio de Tarjetas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-100 shadow-2xs py-20">
            <span className="text-4xl animate-bounce">👥</span>
            <h3 className="font-black text-[#04045E] text-base uppercase tracking-tight mt-4">
              Sin Clientes Registrados
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Prueba modificando tus filtros o ingresando otro término de búsqueda.
            </p>
          </div>
        ) : (
          filteredClients.map((cli) => (
            <div key={cli.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs hover:shadow-sm hover:scale-[1.01] transition-all duration-300 flex flex-col gap-4">
              {/* Header de Tarjeta */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-black text-sm text-[#04045E] uppercase tracking-tight">
                    {cli.name}
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 mt-1 inline-block">
                    {cli.status}
                  </span>
                </div>
                <div className="flex text-amber-400 text-xs select-none">
                  {Array.from({ length: cli.rating }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>

              {/* Información */}
              <div className="text-[10px] text-slate-650 font-semibold space-y-1.5 border-y border-slate-100 py-3">
                <p className="flex items-center gap-1.5">
                  <span className="opacity-70 text-xs">📧</span> <span className="text-slate-800">{cli.email}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="opacity-70 text-xs">📞</span> <span className="text-slate-800">{cli.phone}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="opacity-70 text-xs">🏷️</span> Origen:{' '}
                  <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {cli.source}
                  </span>
                </p>
              </div>

              {/* Interés de Compra */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Interés Directo</span>
                  <span className="text-xs font-black text-[#04045E]">${cli.budget.toLocaleString()} USD</span>
                </div>
                <p className="text-[10px] font-bold text-slate-700 truncate">
                  {cli.interest}
                </p>
              </div>

              {/* Botón WhatsApp de alta conversión */}
              <button
                onClick={() => triggerWhatsApp(cli)}
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#22c35e] text-white font-bold text-[9px] rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm hover:scale-[1.01] active:scale-98"
              >
                <span className="text-xs">💬</span> Contactar WhatsApp
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
