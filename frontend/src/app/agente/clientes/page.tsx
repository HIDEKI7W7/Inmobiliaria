'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '@/utils/session';
import { propertiesService } from '../../../services/properties.service';
import { Property } from '../../../components/modules/properties/PropertyCard';
import { leadsService } from '../../../services/leads.service';

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
  agentId: string;
  category: 'Propietario' | 'Prospecto';
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

const INITIAL_CLIENTS: Client[] = [
  // Clientes asignados a nuestro agente actual (agent-123)
  { id: 'cli-1', name: 'María Quispe', email: 'maria@ejemplo.com', phone: '+591 772 34567', interest: 'Casa de Campo en Muyurina', budget: 220000, source: 'WhatsApp', rating: 5, status: 'Activo (Negociación)', agentId: 'agent-123', category: 'Prospecto' },
  { id: 'cli-2', name: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', phone: '+591 601 98765', interest: 'Penthouse de Lujo en Queru Queru', budget: 128000, source: 'TikTok', rating: 4, status: 'Activo (Contactado)', agentId: 'agent-123', category: 'Prospecto' },
  { id: 'cli-3', name: 'Sofía Blanco', email: 'sofia@ejemplo.com', phone: '+591 717 44332', interest: 'Casa Familiar de Estilo Moderno', budget: 210000, source: 'Recomendado', rating: 3, status: 'Visita Programada', agentId: 'agent-123', category: 'Prospecto' },
  // Clientes de otros agentes (deben estar aislados y no ser visibles)
  { id: 'cli-4', name: 'Jorge Arandia', email: 'jorge@ejemplo.com', phone: '+591 707 11223', interest: 'Terreno Premium Comercial', budget: 185000, source: 'TikTok', rating: 4, status: 'Activo (Propuestas)', agentId: 'agent-456', category: 'Prospecto' },
  { id: 'cli-5', name: 'Patricia Vargas', email: 'patricia@ejemplo.com', phone: '+591 727 65432', interest: 'Galpón Industrial', budget: 340000, source: 'Instagram', rating: 5, status: 'Reservado (Seña)', agentId: 'agent-456', category: 'Prospecto' },
];

const INITIAL_DEALS: CommissionDeal[] = [
  { id: 'deal-1', propertyId: 'prop-1-muyurina', propertyTitle: 'Casa de Campo en Muyurina', clientName: 'María Quispe', amount: null, commission: null, status: 'CONGELADO' },
  { id: 'deal-2', propertyId: 'prop-3-queru-queru', propertyTitle: 'Penthouse de Lujo en Queru Queru', clientName: 'Carlos Rodríguez', amount: null, commission: null, status: 'CONGELADO' },
];

export default function AgentClients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [currentAgentId, setCurrentAgentId] = useState('agent-123');

  // Cargar clientes con aislamiento de datos
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<CommissionDeal[]>(INITIAL_DEALS);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Formulario "Registrar Cliente"
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSource, setFormSource] = useState('RED PROPIO');
  const [formCategory, setFormCategory] = useState<'Propietario' | 'Prospecto'>('Prospecto');
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formAmount, setFormAmount] = useState('');

  useEffect(() => {
    // Recuperar el ID del agente de la sesión activa
    const user = getCurrentUser();
    const id = (user as any)?.id || 'agent-123';
    setCurrentAgentId(id);

    // Filtrar clientes por agentId (Aislamiento de Datos)
    const myClients = INITIAL_CLIENTS.filter(cli => cli.agentId === id);
    setClients(myClients);

    // Cargar comisiones desde el backend
    const loadDeals = async () => {
      const dbDeals = await leadsService.getAgentDeals();
      setDeals(dbDeals);
    };
    loadDeals();
  }, []);

  const filteredClients = clients.filter((cli) => {
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

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPhone || !formPropertyId || !formAmount) {
      alert('Por favor, completa todos los campos del formulario.');
      return;
    }

    const transactionVal = parseFloat(formAmount);

    try {
      // 1. Llamar al backend para registrar la transacción y obtener cálculo de comisión del 3%
      const responseDeal = await leadsService.registerDeal(formPropertyId, formName, transactionVal);

      // 2. Agregar el cliente registrado a la lista
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        interest: responseDeal.propertyTitle,
        budget: transactionVal,
        source: formSource,
        rating: 5,
        status: 'Transacción Registrada',
        agentId: currentAgentId,
        category: formCategory,
      };

      setClients(prev => [newClient, ...prev]);

      // 3. Recargar la lista de comisiones/deals desde la base de datos de backend
      const updatedDeals = await leadsService.getAgentDeals();
      setDeals(updatedDeals);

      // Limpiar formulario y cerrar modal
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormSource('RED PROPIO');
      setFormCategory('Prospecto');
      setFormPropertyId('');
      setFormAmount('');
      setShowRegisterModal(false);

      alert('Cliente registrado con éxito y transacción guardada en la base de datos.');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al registrar la transacción.');
    }
  };

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Directorio Privado de Clientes
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            🔒 Cartera individual aislada. Solo visualizas tus propios leads y transacciones.
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-6 py-3.5 bg-[#b9fa3c] text-[#04045E] hover:brightness-95 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-wider rounded-xl shadow-md"
        >
          ➕ Registrar Cliente
        </button>
      </div>

      {/* PIPELINE DE COMISIONES */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-black text-xs text-[#04045E] uppercase tracking-wider">
            Pipeline de Comisiones del Mes
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Las comisiones permanecen congeladas hasta registrar el cliente, propiedad y monto final.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal) => (
            <div 
              key={deal.id}
              className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                deal.status === 'ACTIVO' 
                  ? 'bg-emerald-550/5 border-emerald-250' 
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[11px] font-black text-[#04045E] uppercase tracking-tight">{deal.propertyTitle}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Asociado a: {deal.clientName}</p>
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  deal.status === 'ACTIVO' 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200 animate-pulse'
                }`}>
                  {deal.status === 'ACTIVO' ? '💸 Activo' : '❄️ Congelado'}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Comisión estimada (3%)</span>
                  <p className="text-sm font-black text-[#04045E]">
                    {deal.commission ? `$${deal.commission.toLocaleString()} USD` : 'Falta información'}
                  </p>
                </div>
                {deal.amount && (
                  <span className="text-[10px] font-bold text-slate-500">Transacción: ${deal.amount.toLocaleString()} USD</span>
                )}
              </div>
            </div>
          ))}
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
            <option value="TikTok">TikTok</option>
            <option value="Instagram">Instagram</option>
            <option value="Recomendado">Recomendado</option>
            <option value="RED PROPIO">RED PROPIO</option>
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
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[7px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                      {cli.status}
                    </span>
                    <span className="text-[7px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                      {cli.category}
                    </span>
                  </div>
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
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presupuesto/Monto</span>
                  <span className="text-xs font-black text-[#04045E]">${cli.budget.toLocaleString()} USD</span>
                </div>
                <p className="text-[10px] font-bold text-slate-700 truncate">
                  {cli.interest}
                </p>
              </div>

              {/* Botón WhatsApp */}
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

      {/* MODAL: REGISTRAR CLIENTE */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-[#04045E]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">
                Registrar Cliente / Transacción
              </h3>
              <button 
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-650 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterClient} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ej. juan@correo.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">WhatsApp / Teléfono</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ej. +591 70000000"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                />
              </div>

              {/* Origen de Captación */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Origen de Captación</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                >
                  <option value="RED PROPIO">RED PROPIO</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Recomendado">Recomendado</option>
                </select>
              </div>

              {/* Categoría del Cliente */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                >
                  <option value="Prospecto">Prospecto</option>
                  <option value="Propietario">Propietario</option>
                </select>
              </div>

              {/* Propiedad Gestionada */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Vincular Propiedad</label>
                <select
                  required
                  value={formPropertyId}
                  onChange={(e) => setFormPropertyId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                >
                  <option value="">-- Seleccionar Propiedad --</option>
                  {deals.map(d => (
                    <option key={d.id} value={d.propertyId}>{d.propertyTitle}</option>
                  ))}
                </select>
              </div>

              {/* Monto de Transacción */}
              <div>
                <label className="block text-[9px] font-black uppercase text-[#04045E] mb-1">Monto de Transacción ($ USD)</label>
                <input
                  type="number"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="Ej. 150000"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#b9fa3c]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] mt-4"
              >
                Confirmar y Registrar Transacción 💸
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
