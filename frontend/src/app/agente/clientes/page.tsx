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
  { id: 'cli-1', name: 'María Quispe', email: 'maria@ejemplo.com', phone: '+591 772 34567', interest: 'Casa de Campo en Muyurina', budget: 220000, source: 'WhatsApp', rating: 5, status: 'Activo (Negociación)', agentId: 'agent-123', category: 'Prospecto' },
  { id: 'cli-2', name: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', phone: '+591 601 98765', interest: 'Penthouse de Lujo en Queru Queru', budget: 128000, source: 'TikTok', rating: 4, status: 'Activo (Contactado)', agentId: 'agent-123', category: 'Prospecto' },
  { id: 'cli-3', name: 'Sofía Blanco', email: 'sofia@ejemplo.com', phone: '+591 717 44332', interest: 'Casa Familiar de Estilo Moderno', budget: 210000, source: 'Recomendado', rating: 3, status: 'Visita Programada', agentId: 'agent-123', category: 'Prospecto' },
  { id: 'cli-4', name: 'Jorge Arandia', email: 'jorge@ejemplo.com', phone: '+591 707 11223', interest: 'Terreno Premium Comercial', budget: 185000, source: 'TikTok', rating: 4, status: 'Activo (Propuestas)', agentId: 'agent-456', category: 'Prospecto' },
  { id: 'cli-5', name: 'Patricia Vargas', email: 'patricia@ejemplo.com', phone: '+591 727 65432', interest: 'Galpón Industrial', budget: 340000, source: 'Instagram', rating: 5, status: 'Reservado (Seña)', agentId: 'agent-456', category: 'Prospecto' },
];

const INITIAL_DEALS: CommissionDeal[] = [
  { id: 'deal-1', propertyId: 'prop-1-muyurina', propertyTitle: 'Casa de Campo en Muyurina', clientName: 'María Quispe', amount: null, commission: null, status: 'CONGELADO' },
  { id: 'deal-2', propertyId: 'prop-3-queru-queru', propertyTitle: 'Penthouse de Lujo en Queru Queru', clientName: 'Carlos Rodríguez', amount: null, commission: null, status: 'CONGELADO' },
];

// Hash function to generate a short ID from email
const generateShortId = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `CLI-${Math.abs(hash).toString(36).substring(0, 5).toUpperCase()}`;
};

export default function AgentClients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [currentAgentId, setCurrentAgentId] = useState('agent-123');

  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<CommissionDeal[]>(INITIAL_DEALS);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Custom messages for WhatsApp per client ID
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});

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

    // Cargar comisiones desde el backend
    const loadDeals = async () => {
      try {
        const dbDeals = await leadsService.getAgentDeals();
        setDeals(dbDeals);
      } catch (err) {
        console.warn('Backend offline or not reachable, using mock deals.');
      }
    };
    loadDeals();
  }, []);

  // Load clients with local persistence falling back to mock data
  useEffect(() => {
    const local = localStorage.getItem('propio_clients');
    if (local) {
      try {
        setClients(JSON.parse(local));
      } catch (err) {
        console.error('Error parsing local clients, resetting.', err);
        const myClients = INITIAL_CLIENTS.filter(cli => cli.agentId === currentAgentId);
        setClients(myClients);
        localStorage.setItem('propio_clients', JSON.stringify(myClients));
      }
    } else {
      const myClients = INITIAL_CLIENTS.filter(cli => cli.agentId === currentAgentId);
      setClients(myClients);
      localStorage.setItem('propio_clients', JSON.stringify(myClients));
    }
  }, [currentAgentId]);

  const filteredClients = clients.filter((cli) => {
    const matchesSearch = cli.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cli.interest.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cli.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSource = filterSource === 'ALL' || cli.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const handleCustomMessageChange = (clientId: string, val: string) => {
    setCustomMessages(prev => ({
      ...prev,
      [clientId]: val
    }));
  };

  const triggerWhatsApp = (cli: Client) => {
    const rawPhone = cli.phone.replace(/[^0-9+]/g, '');
    const customText = customMessages[cli.id]?.trim();
    
    const defaultText = `Hola ${cli.name}, te saluda tu Asesor Comercial de Propio. Quería hacer un seguimiento sobre la propiedad de tu interés "${cli.interest}" (Presupuesto: $${cli.budget.toLocaleString()} USD). Quedo a tu disposición para agendar cualquier visita.`;
    const messageText = customText || defaultText;

    const whatsappUrl = `https://wa.me/${rawPhone}?text=${encodeURIComponent(messageText)}`;
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
      let linkedPropertyTitle = 'Propiedad vinculada';
      try {
        // 1. Llamar al backend para registrar la transacción
        const responseDeal = await leadsService.registerDeal(formPropertyId, formName, transactionVal);
        linkedPropertyTitle = responseDeal.propertyTitle;
      } catch (backendError) {
        console.warn('Backend call failed, registering locally/offline.', backendError);
        const matchProp = deals.find(d => d.propertyId === formPropertyId);
        if (matchProp) {
          linkedPropertyTitle = matchProp.propertyTitle;
        }
      }

      // 2. Agregar el cliente registrado a la lista
      const newClient: Client = {
        id: `cli-${Date.now()}`,
        name: formName,
        email: formEmail,
        phone: formPhone,
        interest: linkedPropertyTitle,
        budget: transactionVal,
        source: formSource,
        rating: 5,
        status: 'Transacción Registrada',
        agentId: currentAgentId,
        category: formCategory,
      };

      const updatedClients = [newClient, ...clients];
      setClients(updatedClients);
      localStorage.setItem('propio_clients', JSON.stringify(updatedClients));

      // 3. Actualizar deals localmente como fallback
      const newDeal: CommissionDeal = {
        id: `deal-${Date.now()}`,
        propertyId: formPropertyId,
        propertyTitle: linkedPropertyTitle,
        clientName: formName,
        amount: transactionVal,
        commission: transactionVal * 0.03, // 3%
        status: 'ACTIVO'
      };
      setDeals(prev => [newDeal, ...prev]);

      // Limpiar formulario y cerrar modal
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormSource('RED PROPIO');
      setFormCategory('Prospecto');
      setFormPropertyId('');
      setFormAmount('');
      setShowRegisterModal(false);

      alert('Cliente registrado con éxito y transacción guardada localmente.');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al registrar la transacción.');
    }
  };

  const getStatusColorClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('nuevo')) return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/35';
    if (s.includes('contactado')) return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/35';
    if (s.includes('visita')) return 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/35';
    if (s.includes('negociación') || s.includes('negociacion')) return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/35';
    if (s.includes('reserva') || s.includes('seña')) return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/35';
    if (s.includes('cerrado') || s.includes('registrada') || s.includes('éxito')) return 'bg-[#A3FF33]/15 text-[#6ca818] border-[#A3FF33]/35';
    return 'bg-slate-100 text-slate-600 border-slate-200';
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
                  ? 'bg-emerald-500/5 border-emerald-250' 
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
          filteredClients.map((cli) => {
            const shortId = generateShortId(cli.email);
            return (
              <div key={cli.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs hover:shadow-sm hover:scale-[1.01] transition-all duration-300 flex flex-col gap-4">
                {/* Header de Tarjeta */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-[#04045E] uppercase tracking-tight">
                        {cli.name}
                      </h3>
                      <span className="text-[8px] font-black text-slate-400 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                        {shortId}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${getStatusColorClass(cli.status)}`}>
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

                {/* Custom WhatsApp Input & Round Logo Button */}
                <div className="flex gap-2 items-center mt-auto">
                  <input
                    type="text"
                    placeholder="Escribe mensaje personalizado..."
                    value={customMessages[cli.id] || ''}
                    onChange={(e) => handleCustomMessageChange(cli.id, e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] text-slate-700 font-bold focus:outline-none focus:border-[#b9fa3c]"
                  />
                  <button
                    onClick={() => triggerWhatsApp(cli)}
                    className="w-9 h-9 shrink-0 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-full transition-all flex items-center justify-center active:scale-90 shadow-md shadow-emerald-500/20 animate-fadeIn"
                    title="Enviar por WhatsApp"
                  >
                    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 16 16">
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
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
