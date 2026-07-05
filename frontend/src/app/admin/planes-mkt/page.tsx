'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, Tab } from '@/components/ui/AdminSidebar';
import { AgentProvider, useAgents } from '@/context/AgentContext';
import { getCurrentUser, getToken } from '@/utils/session';

interface Property {
  id: string;
  title: string;
  price: number;
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  media: {
    photos: string[];
    documents: string[];
  };
  owner: {
    name: string;
    phone: string;
    email: string;
  };
  plan?: string;
  isVerified?: boolean;
}

interface PedidoMKT {
  idTransaccionMark: string;
  inmuebleId: string;
  telefonoPropietario: string;
  contratosUrls: string[];
  montoPago: number;
  usuarioCaptador: string;
  etapaKanban: 'NUEVO' | 'CONTACTADO' | 'GRABADO' | 'PUBLICADO';
}

interface PreciosPlanes {
  gratis?: number;
  contenidos: number;
  venta_pro: number;
  cierre_garantizado: number;
}

export default function PlanesMktPage() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propio_admin_agents');
      if (stored) {
        try {
          setAgents(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  return (
    <AgentProvider value={{ agents, setAgents }}>
      <PlanesMktDashboard />
    </AgentProvider>
  );
}

function PlanesMktDashboard() {
  const router = useRouter();
  const { agents } = useAgents();

  // Load basic counts from localStorage to make sidebar consistent
  const [counts, setCounts] = useState({
    properties: 0,
    prospects: 0,
    owners: 0,
    developers: 0,
    contracts: 0,
    payments: 0,
    expenses: 0,
    agents: 0,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('admin');

  // Load parent counts & properties from localStorage
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setCurrentUserEmail(user.email.split('@')[0]);
    }

    const cachedProps = localStorage.getItem('propio_admin_properties');
    let loadedProps: Property[] = [];
    if (cachedProps) {
      try {
        loadedProps = JSON.parse(cachedProps);
        setProperties(loadedProps);
      } catch (e) {
        console.error('Error parsing properties:', e);
      }
    }

    const cachedProspects = localStorage.getItem('propio_admin_prospects');
    const cachedOwners = localStorage.getItem('propio_admin_owners');
    const cachedContracts = localStorage.getItem('propio_admin_contracts');
    const cachedPayments = localStorage.getItem('propio_admin_payments');
    const cachedExpenses = localStorage.getItem('propio_admin_expenses');

    setCounts({
      properties: loadedProps.length,
      prospects: cachedProspects ? JSON.parse(cachedProspects).length : 0,
      owners: cachedOwners ? JSON.parse(cachedOwners).length : 0,
      developers: 0,
      contracts: cachedContracts ? JSON.parse(cachedContracts).length : 0,
      payments: cachedPayments ? JSON.parse(cachedPayments).length : 0,
      expenses: cachedExpenses ? JSON.parse(cachedExpenses).length : 0,
      agents: agents.length,
    });
  }, [agents.length]);

  // ==========================================
  // [ESTADOS_REACTIVOS_HOOKS]
  // ==========================================
  const [pedidosMKT, setPedidosMKT] = useState<PedidoMKT[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_admin_pedidos_mkt');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  const [preciosPlanes, setPreciosPlanes] = useState<PreciosPlanes>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_global_plan_prices');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      gratis: 0,
      contenidos: 100,
      venta_pro: 299,
      cierre_garantizado: 799,
    };
  });

  const [savingPlans, setSavingPlans] = useState(false);
  const [editablePlans, setEditablePlans] = useState<{
    [id: string]: {
      name: string;
      price: string;
      billingCycle: string;
      featuresText: string;
    }
  }>({
    'plan-gratis': { name: 'Gratuito', price: '0', billingCycle: '', featuresText: '' },
    'plan-contenidos': { name: '', price: '', billingCycle: '', featuresText: '' },
    'plan-venta-pro': { name: '', price: '', billingCycle: '', featuresText: '' },
    'plan-cierre-garantizado': { name: '', price: '', billingCycle: '', featuresText: '' },
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBase}/marketing-plans`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const plansMap: any = {};
          data.forEach((p: any) => {
            if (p.id === 'plan-gratis' || p.id === 'plan-contenidos' || p.id === 'plan-venta-pro' || p.id === 'plan-cierre-garantizado') {
              const fText = Array.isArray(p.features) 
                ? p.features.map((f: any) => f.text).join('\n') 
                : '';
              plansMap[p.id] = {
                name: p.name || '',
                price: String(p.price || ''),
                billingCycle: p.billingCycle || '',
                featuresText: fText,
              };
            }
          });
          setEditablePlans(prev => ({ ...prev, ...plansMap }));
        }
      } catch (err) {
        console.error('Error fetching marketing plans:', err);
      }
    };
    fetchPlans();
  }, []);

  // Synchronize preciosPlanes with editablePlans so other local calculations are in-sync
  useEffect(() => {
    const gratisVal = parseFloat(editablePlans['plan-gratis']?.price) || 0;
    const contenidosVal = parseFloat(editablePlans['plan-contenidos']?.price) || 0;
    const ventaProVal = parseFloat(editablePlans['plan-venta-pro']?.price) || 0;
    const cierreVal = parseFloat(editablePlans['plan-cierre-garantizado']?.price) || 0;
    setPreciosPlanes({
      gratis: gratisVal,
      contenidos: contenidosVal,
      venta_pro: ventaProVal,
      cierre_garantizado: cierreVal,
    });
  }, [editablePlans]);

  // Local storage sync for orders and prices
  useEffect(() => {
    localStorage.setItem('propio_admin_pedidos_mkt', JSON.stringify(pedidosMKT));
  }, [pedidosMKT]);

  useEffect(() => {
    localStorage.setItem('propio_global_plan_prices', JSON.stringify(preciosPlanes));
  }, [preciosPlanes]);

  const [activeEditingPlanId, setActiveEditingPlanId] = useState<string | null>(null);

  const handleSaveSinglePlan = async (id: string) => {
    setSavingPlans(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = getToken();
      const plan = editablePlans[id];
      const features = plan.featuresText
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(text => ({ text, included: true }));
      
      const payload = {
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        features,
      };

      const res = await fetch(`${apiBase}/plans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert(`Plan ${plan.name} guardado exitosamente.`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al guardar: ${errorData.message || 'Error del servidor'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error de red: ${err.message}`);
    } finally {
      setSavingPlans(false);
    }
  };

  const handleSavePlans = async () => {
    setSavingPlans(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = getToken();
      
      const payloadPlans = Object.keys(editablePlans).map(id => {
        const p = editablePlans[id];
        const features = p.featuresText
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .map(text => ({ text, included: true }));
          
        return {
          id,
          name: p.name,
          price: p.price,
          billingCycle: p.billingCycle,
          features,
        };
      });

      const res = await fetch(`${apiBase}/admin/marketing-plans`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plans: payloadPlans }),
      });

      if (res.ok) {
        alert('Configuración de planes de marketing guardada exitosamente.');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Error al guardar: ${errorData.message || 'Error del servidor'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error de red: ${err.message}`);
    } finally {
      setSavingPlans(false);
    }
  };

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [selectedPropertyDetails, setSelectedPropertyDetails] = useState<Property | null>(null);

  // New Order Form States
  const [owners, setOwners] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // [ESTADOS_FORMULARIO_MODAL]
  const [accountType, setAccountType] = useState<'PROPIETARIO' | 'AGENTE_BROKER'>('AGENTE_BROKER');
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [propertySearch, setPropertySearch] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'GRATUITO' | 'CONTENIDOS' | 'VENTA_PRO' | 'CIERRE_GARANTIZADO'>('VENTA_PRO');
  const [precioPactado, setPrecioPactado] = useState<number>(298);

  // Load owners from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem('propio_admin_owners');
    if (cached) {
      try {
        setOwners(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    } else {
      setOwners([
        { id: 'OWN-201', name: 'René Vargas', email: 'rene@mail.com', phone: '+591 798 12345' },
        { id: 'OWN-202', name: 'Claudia Claure', email: 'clau@mail.com', phone: '+591 712 99887' },
        { id: 'OWN-203', name: 'Pedro Mendoza', email: 'pedro@mail.com', phone: '+591 700 44332' },
      ]);
    }
  }, []);

  // Filter accounts dynamically
  const filteredAccounts = useMemo(() => {
    const q = accountSearch.toLowerCase().trim();
    if (!q) return [];
    const list = accountType === 'PROPIETARIO' ? owners : agents;
    return list.filter((acc: any) =>
      acc.id.toLowerCase().includes(q) ||
      acc.name.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q)
    );
  }, [accountSearch, accountType, owners, agents]);

  // Filter properties dynamically
  const filteredProperties = useMemo(() => {
    const q = propertySearch.toLowerCase().trim();
    if (!q) return [];
    return properties.filter((p: any) =>
      p.id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q)
    );
  }, [propertySearch, properties]);

  // ==========================================
  // [ACCIONES_Y_MANEJADORES_LOGICA]
  // ==========================================
  // [LOGICA_AUTOCOMPLETE_Y_DRAG_DROP]
  const handlePlanChange = (plan: 'GRATUITO' | 'CONTENIDOS' | 'VENTA_PRO' | 'CIERRE_GARANTIZADO') => {
    let price = 298;
    if (plan === 'GRATUITO') price = 0;
    else if (plan === 'CONTENIDOS') price = preciosPlanes.contenidos;
    else if (plan === 'VENTA_PRO') price = preciosPlanes.venta_pro;
    else if (plan === 'CIERRE_GARANTIZADO') price = preciosPlanes.cierre_garantizado;

    setSelectedPlan(plan);
    setPrecioPactado(price);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setContractFile(file);
      } else {
        alert("Error: Solo se permiten archivos en formato PDF.");
      }
    }
  };

  // [MANEJADOR_SUBMIT_CIERRE_OFICIAL]
  const handleRegistrarCierreOficial = async () => {
    if (!selectedAccount) {
      alert("Por favor, selecciona una cuenta válida.");
      return;
    }
    if (!selectedProperty) {
      alert("Por favor, selecciona una propiedad válida.");
      return;
    }
    if (!contractFile) {
      alert("Por favor, adjunta el contrato firmado en formato PDF.");
      return;
    }
    if (!fechaInicio || !fechaFin) {
      alert("Por favor, especifica las fechas de vigencia.");
      return;
    }

    const txId = `MKT-TX-${1002 + pedidosMKT.length}`;
    const accountInfo = accountType === 'PROPIETARIO'
      ? owners.find((o: any) => o.id === selectedAccount)
      : agents.find((a: any) => a.id === selectedAccount);

    const nuevoPedido: PedidoMKT = {
      idTransaccionMark: txId,
      inmuebleId: selectedProperty,
      telefonoPropietario: accountInfo?.phone || '+59170000000',
      contratosUrls: [contractFile.name],
      montoPago: precioPactado,
      usuarioCaptador: accountInfo?.name || 'admin',
      etapaKanban: 'NUEVO',
    };

    // Inject at the beginning of the list
    setPedidosMKT(prev => [nuevoPedido, ...prev]);

    // Update LocalStorage for income/payments if needed
    const cachedPayments = localStorage.getItem('propio_admin_payments');
    if (cachedPayments) {
      try {
        const paymentsList = JSON.parse(cachedPayments);
        const newPayment = {
          id: `PAY-${Date.now()}`,
          propertyId: selectedProperty,
          amount: precioPactado,
          date: new Date().toISOString().split('T')[0],
          type: 'INGRESO',
          concept: `Pago Plan Marketing - ${selectedPlan}`,
          status: 'COMPLETADO',
        };
        localStorage.setItem('propio_admin_payments', JSON.stringify([newPayment, ...paymentsList]));
      } catch (e) {
        console.error(e);
      }
    }

    // Close modal
    setIsModalOpen(false);

    // Reset Form Fields
    setAccountType('AGENTE_BROKER');
    setAccountSearch('');
    setSelectedAccount(null);
    setPropertySearch('');
    setSelectedProperty(null);
    setContractFile(null);
    setFechaInicio('');
    setFechaFin('');
    setSelectedPlan('VENTA_PRO');
    setPrecioPactado(298);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegistrarCierreOficial();
  };

  const handleMoverEtapaKanban = (pedidoId: string, direccion: 'atras' | 'avanzar') => {
    const etapasOrder: PedidoMKT['etapaKanban'][] = ['NUEVO', 'CONTACTADO', 'GRABADO', 'PUBLICADO'];

    setPedidosMKT(prev =>
      prev.map(p => {
        if (p.idTransaccionMark !== pedidoId) return p;
        const currentIndex = etapasOrder.indexOf(p.etapaKanban);
        let nextIndex = currentIndex;
        if (direccion === 'avanzar' && currentIndex < etapasOrder.length - 1) {
          nextIndex = currentIndex + 1;
        } else if (direccion === 'atras' && currentIndex > 0) {
          nextIndex = currentIndex - 1;
        }
        return {
          ...p,
          etapaKanban: etapasOrder[nextIndex],
        };
      })
    );
  };

  const handleSubirContratoTrabajo = (pedidoId: string, files: FileList | null) => {
    if (!files) return;
    const fileNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
      fileNames.push(files[i].name);
    }

    setPedidosMKT(prev =>
      prev.map(p => {
        if (p.idTransaccionMark !== pedidoId) return p;
        return {
          ...p,
          contratosUrls: [...p.contratosUrls, ...fileNames],
        };
      })
    );
  };

  const handleExportarPedidos = () => {
    // Generate clean CSV representation of current pedidosMKT list
    const headers = [
      'Nro Transaccion Mark',
      'Inmueble ID',
      'Propiedad (Indexada)',
      'Propietario',
      'Telefono Propietario',
      'Contratos',
      'Monto Pago Realizado',
      'Usuario Captador',
      'Etapa Kanban',
    ];

    const rows = pedidosMKT.map(p => {
      const prop = properties.find(pr => pr.id === p.inmuebleId);
      const propTitle = prop ? prop.title : 'Desconocido';
      const ownerName = prop ? prop.owner.name : 'Desconocido';
      return [
        p.idTransaccionMark,
        p.inmuebleId,
        propTitle,
        ownerName,
        p.telefonoPropietario,
        p.contratosUrls.join('; '),
        `$${p.montoPago} USD`,
        p.usuarioCaptador,
        p.etapaKanban,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `REPORTE_PLANES_MKT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper mapping helper to locate property details
  const getPropInfo = (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (prop) {
      return {
        title: prop.title,
        ownerName: prop.owner.name,
        address: prop.location.address,
      };
    }
    // Fallback seed properties details if not found in store
    if (id === 'PROP-991') {
      return {
        title: 'Residencia Premium de 3 Plantas - Zona Norte Cala Cala',
        ownerName: 'René Vargas',
        address: 'Av. América Nro 123, Cochabamba',
      };
    }
    if (id === 'PROP-992') {
      return {
        title: 'Apartamento de Lujo en Queru Queru con Terraza',
        ownerName: 'Claudia Claure',
        address: 'Calle Queru Queru Nro 45, Cochabamba',
      };
    }
    if (id === 'PROP-993') {
      return {
        title: 'Hermosa Casa Quinta Vacacional en Sacaba',
        ownerName: 'Pedro Mendoza',
        address: 'Av. Circunvalación Km 4.5, Sacaba',
      };
    }
    return {
      title: `Propiedad no vinculada (${id})`,
      ownerName: 'Desconocido',
      address: 'Sin dirección',
    };
  };

  const handleOpenPropertyDetails = (id: string) => {
    const prop = properties.find(p => p.id === id);
    if (prop) {
      setSelectedPropertyDetails(prop);
    } else {
      // Create mock property mapping to show visual details modal
      const info = getPropInfo(id);
      setSelectedPropertyDetails({
        id,
        title: info.title,
        price: id === 'PROP-991' ? 285000 : id === 'PROP-992' ? 145000 : 95000,
        location: {
          address: info.address,
          city: 'Cochabamba',
          coordinates: { lat: -17.37, lng: -66.15 },
        },
        media: { photos: [], documents: [] },
        owner: {
          name: info.ownerName,
          phone: id === 'PROP-991' ? '+59170000123' : id === 'PROP-992' ? '+59168900456' : '+59172044888',
          email: `${info.ownerName.toLowerCase().replace(' ', '.')}@gmail.com`,
        },
      });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar
        activeTab="marketing_planes"
        onTabChange={(tab) => {
          if (tab === 'marketing_planes') return;
          router.push('/admin');
        }}
        counts={counts}
      />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center z-20 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <h1 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
              Control de Planes de Marketing
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> AÑADIR NUEVO PEDIDO
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Admin: {currentUserEmail}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow overflow-y-auto p-8 space-y-8 pb-32">
          {/* Top Panel: KPI Cards and configurator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* KPI CARD 1 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Total Pedidos MKT
                </span>
                <span className="block text-2xl font-black text-[#04045E] mt-2">
                  {pedidosMKT.length}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                  Activos en flujo comercial
                </span>
              </div>
              {/* KPI CARD 2 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Ingresos Proyectados
                </span>
                <span className="block text-2xl font-black text-emerald-600 mt-2">
                  ${pedidosMKT.reduce((acc, curr) => acc + curr.montoPago, 0)} USD
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                  Monto acumulado por planes
                </span>
              </div>
              {/* KPI CARD 3 */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  Contratos Cargados
                </span>
                <span className="block text-2xl font-black text-blue-600 mt-2">
                  {pedidosMKT.reduce((acc, curr) => acc + curr.contratosUrls.length, 0)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                  Archivos de trabajo subidos
                </span>
              </div>
            </div>

            {/* ========================================== */}
            {/* [JSX_CONFIGURADOR_PRECIOS] */}
            {/* ========================================== */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div>
                <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                  Configurador de Precios Globales
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Seleccione un plan en los minicuadros para editarlo directamente
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(editablePlans).map((id) => {
                    const plan = editablePlans[id];
                    const isEditing = activeEditingPlanId === id;
                    
                    const descMap: Record<string, string> = {
                      'plan-gratis': 'Publicación básica gratis de 1 propiedad',
                      'plan-contenidos': 'Fotos y video optimizado con radar',
                      'plan-venta-pro': 'Dron, fotos premium y publicidad prioritaria',
                      'plan-cierre-garantizado': 'Delegación completa a un agente experto'
                    };

                    const badgeColorMap: Record<string, string> = {
                      'plan-gratis': 'text-slate-400',
                      'plan-contenidos': 'text-blue-500',
                      'plan-venta-pro': 'text-emerald-500',
                      'plan-cierre-garantizado': 'text-rose-500'
                    };
                    
                    return (
                      <div 
                        key={id}
                        onClick={() => {
                          if (!isEditing) setActiveEditingPlanId(id);
                        }}
                        className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[96px] ${
                          isEditing 
                            ? 'border-blue-600 bg-blue-50/10 ring-1 ring-blue-600' 
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <div className="space-y-0.5 select-none">
                          <span className={`block text-[7px] font-black uppercase tracking-widest ${badgeColorMap[id] || 'text-slate-400'}`}>
                            {id.replace('plan-', '').toUpperCase()}
                          </span>
                          <h4 className="text-[11px] font-black text-[#04045E] uppercase truncate">{plan.name || 'Cargando...'}</h4>
                          <p className="text-[9px] text-slate-400 font-semibold line-clamp-2 leading-tight">{descMap[id]}</p>
                        </div>
                        <span className="block text-[10px] font-mono font-black text-slate-700 pt-1">
                          {id === 'plan-cierre-garantizado' && !plan.price.includes('%') ? 'Comisión: ' : ''}
                          {id === 'plan-gratis' ? 'Gratis' : plan.price}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {activeEditingPlanId && (() => {
                  const id = activeEditingPlanId;
                  const plan = editablePlans[id];
                  return (
                    <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/5 space-y-3 shadow-inner">
                      <span className="block text-[9px] font-black text-blue-600 uppercase tracking-widest">
                        Edición Rápida: {id.replace('plan-', '').toUpperCase()}
                      </span>
                      
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5">Título</label>
                            <input 
                              type="text" 
                              value={plan.name}
                              onChange={(e) => setEditablePlans(prev => ({
                                ...prev,
                                [id]: { ...prev[id], name: e.target.value }
                              }))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5">Precio</label>
                            <input 
                              type="text" 
                              value={plan.price}
                              onChange={(e) => setEditablePlans(prev => ({
                                ...prev,
                                [id]: { ...prev[id], price: e.target.value }
                              }))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] text-slate-800 font-black focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5">Subtítulo / Ciclo</label>
                          <input 
                            type="text" 
                            value={plan.billingCycle}
                            onChange={(e) => setEditablePlans(prev => ({
                              ...prev,
                              [id]: { ...prev[id], billingCycle: e.target.value }
                            }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[7px] font-black text-slate-400 uppercase mb-0.5">Beneficios (Uno por línea)</label>
                          <textarea 
                            rows={3}
                            value={plan.featuresText}
                            onChange={(e) => setEditablePlans(prev => ({
                              ...prev,
                              [id]: { ...prev[id], featuresText: e.target.value }
                            }))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[9px] text-slate-700 font-medium focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button 
                          type="button"
                          disabled={savingPlans}
                          onClick={async () => {
                            await handleSaveSinglePlan(id);
                            setActiveEditingPlanId(null);
                          }}
                          className="flex-1 bg-blue-950 hover:bg-blue-900 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-wider text-center cursor-pointer disabled:opacity-50"
                        >
                          {savingPlans ? 'Guardando...' : '💾 Guardar'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setActiveEditingPlanId(null)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider cursor-pointer border border-slate-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Repositorio de Contratos Digitales */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
              Repositorio de Contratos Digitales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#04045E]">Contrato_Planes_CalaCala.pdf</p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">24/05/2026</span>
                </div>
                <button
                  onClick={() => alert('Descargando contrato digital...')}
                  className="text-xs font-bold text-[#0066ff] cursor-pointer hover:underline"
                >
                  Descargar
                </button>
              </div>
              <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#04045E]">Contrato_Exclusividad_Queru.pdf</p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">10/06/2026</span>
                </div>
                <button
                  onClick={() => alert('Descargando contrato digital...')}
                  className="text-xs font-bold text-[#0066ff] cursor-pointer hover:underline"
                >
                  Descargar
                </button>
              </div>
            </div>

            {/* ========================================== */}
            {/* [JSX_TABLA_REPOSITORIO_PEDIDOS] */}
            {/* ========================================== */}
            <div className="pt-6 border-t mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                  Listado General de Pedidos de Marketing
                </h4>
                <button
                  onClick={handleExportarPedidos}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                >
                  📥 Exportar Grilla
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                      <th className="p-3">Nro Transacción Mark</th>
                      <th className="p-3">Inmueble Indexado</th>
                      <th className="p-3">Teléfono Propietario</th>
                      <th className="p-3">Contrato de Trabajo</th>
                      <th className="p-3">Monto Pago Realizado</th>
                      <th className="p-3">USUARIO que captó</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {pedidosMKT.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                          No existen pedidos registrados.
                        </td>
                      </tr>
                    ) : (
                      pedidosMKT.map((pedido) => {
                        const propInfo = getPropInfo(pedido.inmuebleId);
                        return (
                          <tr key={pedido.idTransaccionMark} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {pedido.idTransaccionMark}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-[#04045E]">{propInfo.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  ID: {pedido.inmuebleId} | Propietario: {propInfo.ownerName}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 font-mono">{pedido.telefonoPropietario}</td>
                            <td className="p-3">
                              <div className="flex flex-col gap-1.5">
                                {pedido.contratosUrls.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {pedido.contratosUrls.map((c, i) => (
                                      <span
                                        key={i}
                                        className="bg-blue-50 text-blue-600 border border-blue-100 rounded px-1.5 py-0.5 text-[9px] font-bold"
                                      >
                                        📄 {c}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Sin contratos adjuntos
                                  </span>
                                )}
                                <label className="inline-flex items-center gap-1 bg-[#0066ff]/8 hover:bg-[#0066ff]/15 text-[#0066ff] px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors w-max">
                                  <span>📎 Subir Archivos</span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) =>
                                      handleSubirContratoTrabajo(
                                        pedido.idTransaccionMark,
                                        e.target.files
                                      )
                                    }
                                  />
                                </label>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              ${pedido.montoPago} USD
                            </td>
                            <td className="p-3 font-semibold text-slate-500">
                              {pedido.usuarioCaptador}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* [JSX_REDISEÑO_TARJETA_KANBAN] */}
          {/* ========================================== */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-[#04045E] uppercase tracking-widest">
              Kanban de Producción (Marketing)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(['NUEVO', 'CONTACTADO', 'GRABADO', 'PUBLICADO'] as const).map((stage) => {
                const items = pedidosMKT.filter((p) => p.etapaKanban === stage);
                return (
                  <div
                    key={stage}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col min-h-[350px] border-t-4 border-t-[#04045E] shadow-2xs"
                  >
                    <div className="flex justify-between items-center mb-4 pb-2 border-b">
                      <span className="font-black text-xs text-[#04045E] uppercase tracking-wider">
                        {stage}
                      </span>
                      <span className="bg-slate-100 text-[#04045E] px-2 py-0.5 rounded text-[10px] font-black">
                        {items.length}
                      </span>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {items.map((pedido) => {
                        const propInfo = getPropInfo(pedido.inmuebleId);
                        return (
                          <div
                            key={pedido.idTransaccionMark}
                            className="p-3 border border-slate-150 rounded-xl bg-[#F8FAFC] space-y-3 relative group hover:border-[#b9fa3c] hover:shadow-xs transition-all duration-200"
                          >
                            {/* Cabecera */}
                            <h4 className="text-[11px] font-black text-[#04045E] uppercase tracking-tight leading-tight">
                              <strong>{propInfo.ownerName} / {propInfo.title}</strong>
                            </h4>

                            {/* Botones de acción */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <button
                                onClick={() => handleOpenPropertyDetails(pedido.inmuebleId)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[#04045E] text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                              >
                                Ver Ficha de Propiedad
                              </button>
                              <a
                                href={`https://wa.me/${pedido.telefonoPropietario.replace(
                                  /[+\s]/g,
                                  ''
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-6 h-6 bg-[#25D366] hover:brightness-105 text-white rounded-full flex items-center justify-center text-xs shadow-2xs shrink-0 font-bold"
                                title="Contactar por WhatsApp"
                              >
                                💬
                              </a>
                            </div>

                            {/* Controles Inferiores */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 mt-1">
                              <span className="text-[8px] font-mono text-slate-400 font-bold">
                                {pedido.idTransaccionMark}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleMoverEtapaKanban(pedido.idTransaccionMark, 'atras')
                                  }
                                  disabled={pedido.etapaKanban === 'NUEVO'}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 rounded text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                                >
                                  ◀
                                </button>
                                <button
                                  onClick={() =>
                                    handleMoverEtapaKanban(pedido.idTransaccionMark, 'avanzar')
                                  }
                                  disabled={pedido.etapaKanban === 'PUBLICADO'}
                                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 rounded text-xs text-slate-700 font-bold transition-colors cursor-pointer"
                                >
                                  ▶
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* MODAL: REGISTRAR NUEVO PEDIDO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn relative">
            {/* Accent Top Bar */}
            <div className="h-1.5 bg-rose-600 w-full" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                  Añadir Nuevo Pedido de Plan de Marketing
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-650 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {/* SECCIÓN 1 (Quién y Qué) */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Sección 1: Quién y Qué</h4>
                  
                  {/* Tabs for Account Type */}
                  {/* [JSX_VINCULACION_INPUTS_MODAL] */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType('PROPIETARIO');
                        setSelectedAccount(null);
                        setAccountSearch('');
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${accountType === 'PROPIETARIO' ? 'bg-white text-[#04045E] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Propietario
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountType('AGENTE_BROKER');
                        setSelectedAccount(null);
                        setAccountSearch('');
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${accountType === 'AGENTE_BROKER' ? 'bg-white text-[#04045E] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Agente / Broker
                    </button>
                  </div>

                  {/* Account Search Input */}
                  <div className="relative">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Buscar Cuenta (Nombre/Email/ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="Escribe para buscar..."
                      value={accountSearch}
                      onChange={(e) => {
                        setAccountSearch(e.target.value);
                        setSelectedAccount(null);
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                    />
                    {accountSearch && !selectedAccount && filteredAccounts.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-[60] divide-y divide-slate-100">
                        {filteredAccounts.map((acc: any) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => {
                              setSelectedAccount(acc.id);
                              setAccountSearch(`${acc.name} (${acc.id})`);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block"
                          >
                            {acc.name} <span className="text-slate-400 font-normal">({acc.email} - {acc.id})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property Combobox/Search */}
                  <div className="relative">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Seleccionar Propiedad Asociada</label>
                    <input
                      type="text"
                      required
                      placeholder="Buscar por código (ej. PROP-991) o título..."
                      value={propertySearch}
                      onChange={(e) => {
                        setPropertySearch(e.target.value);
                        setSelectedProperty(null);
                      }}
                      className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                    />
                    {propertySearch && !selectedProperty && filteredProperties.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-[60] divide-y divide-slate-100">
                        {filteredProperties.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedProperty(p.id);
                              setPropertySearch(`${p.title} (${p.id})`);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 font-semibold text-slate-700 block"
                          >
                            {p.title} <span className="text-slate-400 font-normal">({p.id})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN 2 (Documentación Legal y Vigencia) */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Sección 2: Documentación Legal y Vigencia</h4>
                  
                  {/* Drag and Drop Zone */}
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Contrato Firmado (MIME: PDF únicamente)</label>
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-dashed border-2 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragActive ? 'border-blue-400 bg-blue-50/20' : 'border-gray-300 bg-gray-50/50 hover:bg-gray-100/50'}`}
                    >
                      <input
                        type="file"
                        accept="application/pdf"
                        id="pdf-upload"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.type === "application/pdf") {
                              setContractFile(file);
                            } else {
                              alert("Error: Solo se permiten archivos en formato PDF.");
                            }
                          }
                        }}
                      />
                      <label htmlFor="pdf-upload" className="cursor-pointer space-y-1 block w-full">
                        {contractFile ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl text-emerald-500">📄</span>
                            <span className="text-xs font-bold text-emerald-600 truncate max-w-[220px]">{contractFile.name}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-black text-emerald-600">Cargado Exitosamente</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl text-slate-400">📥</span>
                            <span className="text-xs font-semibold text-slate-650">Arrastra tu PDF aquí o haz clic para explorar</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Solo formato PDF</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Validity dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Fecha de Inicio</label>
                      <input
                        type="date"
                        required
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Fecha de Finalización</label>
                      <input
                        type="date"
                        required
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3 (Plan Adquirido) */}
                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Sección 3: Plan Adquirido</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Plan de Marketing</label>
                      <select
                        value={selectedPlan}
                        onChange={(e) => handlePlanChange(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold uppercase text-[#04045E]"
                      >
                        <option value="GRATUITO">Plan Gratuito</option>
                        <option value="CONTENIDOS">Planes Contenidos</option>
                        <option value="VENTA_PRO">Venta Pro</option>
                        <option value="CIERRE_GARANTIZADO">Cierre Garantizado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Precio Pactado ($ USD)</label>
                      <input
                        type="number"
                        required
                        value={precioPactado}
                        onChange={(e) => setPrecioPactado(Number(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none font-black text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      // Clean form states
                      setAccountType('AGENTE_BROKER');
                      setAccountSearch('');
                      setSelectedAccount(null);
                      setPropertySearch('');
                      setSelectedProperty(null);
                      setContractFile(null);
                      setFechaInicio('');
                      setFechaFin('');
                      setSelectedPlan('VENTA_PRO');
                      setPrecioPactado(298);
                    }}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#04045E] text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center shadow-xs"
                  >
                    Registrar Cierre Oficial
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER FICHA DE PROPIEDAD */}
      {selectedPropertyDetails && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn relative">
            {/* Accent Top Bar */}
            <div className="h-1.5 bg-[#0066ff] w-full" />
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="bg-slate-100 border text-slate-500 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                    {selectedPropertyDetails.id}
                  </span>
                  <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider mt-1">
                    Ficha de Propiedad
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPropertyDetails(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">
                    Título Comercial
                  </h4>
                  <p className="font-black text-[#04045E] text-sm">
                    {selectedPropertyDetails.title}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">
                      Precio
                    </h4>
                    <p className="font-bold text-slate-800">
                      ${selectedPropertyDetails.price.toLocaleString()} USD
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">
                      Ciudad
                    </h4>
                    <p className="font-bold text-slate-800">
                      {selectedPropertyDetails.location.city}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-0.5">
                    Dirección
                  </h4>
                  <p className="font-bold text-slate-800">
                    {selectedPropertyDetails.location.address}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <h4 className="font-bold text-[#04045E] uppercase text-[10px] tracking-wider mb-2">
                    Información del Propietario
                  </h4>
                  <div className="space-y-1 bg-slate-50 border rounded-xl p-3">
                    <p className="font-bold text-[#04045E]">
                      Nombre: {selectedPropertyDetails.owner.name}
                    </p>
                    <p className="text-slate-600">Teléfono: {selectedPropertyDetails.owner.phone}</p>
                    <p className="text-slate-600">Email: {selectedPropertyDetails.owner.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t mt-4">
                <button
                  onClick={() => setSelectedPropertyDetails(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
