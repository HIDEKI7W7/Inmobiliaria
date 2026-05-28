'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { propertiesService } from '../../services/properties.service';
import { contractsService, Contract } from '../../services/contracts.service';
import { paymentsService, Payment } from '../../services/payments.service';
import { expensesService, Expense } from '../../services/expenses.service';
import { Property } from '../../components/modules/properties/PropertyCard';
import { AdminSidebar } from '../../components/ui/AdminSidebar';
import { removeToken } from '../../utils/session';

// Extending Tab states to support all requested sBienes modules
type Tab = 'dashboard' | 'properties' | 'clients' | 'owners' | 'developers' | 'contracts' | 'payments' | 'expenses' | 'reports';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertiesOwned: string[];
  earnings: number;
  status: string;
}

interface Developer {
  id: string;
  name: string;
  nit: string;
  projectsCount: number;
  contact: string;
  phone: string;
  email: string;
  status: string;
}

export default function AdminDashboard() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<Tab>('contracts'); // Starts in Contratos matching sBienes home

  useEffect(() => {
    if (!pathname) return;
    
    if (pathname.includes('/propiedades') || pathname.includes('/properties')) {
      setActiveTab('properties');
    } else if (pathname.includes('/clientes') || pathname.includes('/clients')) {
      setActiveTab('clients');
    } else if (pathname.includes('/propietarios') || pathname.includes('/owners')) {
      setActiveTab('owners');
    } else if (pathname.includes('/constructoras') || pathname.includes('/developers')) {
      setActiveTab('developers');
    } else if (pathname.includes('/contratos') || pathname.includes('/contracts')) {
      setActiveTab('contracts');
    } else if (pathname.includes('/pagos') || pathname.includes('/payments')) {
      setActiveTab('payments');
    } else if (pathname.includes('/gastos') || pathname.includes('/expenses')) {
      setActiveTab('expenses');
    } else if (pathname.includes('/reportes') || pathname.includes('/reports')) {
      setActiveTab('reports');
    } else if (pathname.includes('/dashboard')) {
      setActiveTab('dashboard');
    } else if (pathname === '/admin') {
      setActiveTab('dashboard');
    }
  }, [pathname]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // (Sidebar open state is now managed inside <AdminSidebar> component)

  // Property validation and revision states
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [observationNotes, setObservationNotes] = useState('');
  const [isObserveModalOpen, setIsObserveModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'NUEVA_PUBLICACION' | 'TODAS'>('TODAS');

  // Banner alert state for successful actions (e.g. Contract created)
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Forms open drawers states
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewPropertyOpen, setIsNewPropertyOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isNewOwnerOpen, setIsNewOwnerOpen] = useState(false);
  const [isNewDeveloperOpen, setIsNewDeveloperOpen] = useState(false);

  // Search states for tables
  const [searchQuery, setSearchQuery] = useState('');

  // ─── LOCAL STATE FOR CUSTOM MODULES ───
  const [clients, setClients] = useState<Client[]>([
    { id: 'tenant-1', name: 'Admin', email: 'admin@propio.com.bo', phone: '+591 71234567', status: 'Activo', createdAt: '2026-05-10' },
    { id: 'tenant-2', name: 'Marcelo Suarez', email: 'marcelo@inquilino.com', phone: '+591 79876543', status: 'Activo', createdAt: '2026-04-15' },
    { id: 'tenant-3', name: 'Ana Maria Mendez', email: 'anamaria@inquilino.com', phone: '+591 76543210', status: 'Activo', createdAt: '2026-03-22' },
    { id: 'tenant-4', name: 'Carlos Rocha', email: 'carlos@inquilino.com', phone: '+591 70123456', status: 'Pendiente', createdAt: '2026-05-20' }
  ]);

  const [owners, setOwners] = useState<Owner[]>([
    { id: 'owner-1', name: 'Juan', email: 'owner@propio.com.bo', phone: '+591 72345678', propertiesOwned: ['Apartaestudio moderno en Laureles'], earnings: 12000, status: 'Verificado' },
    { id: 'owner-2', name: 'Sofia Lopez', email: 'sofia@owner.com', phone: '+591 78901234', propertiesOwned: ['Penthouse de Lujo en Queru Queru'], earnings: 24000, status: 'Verificado' },
    { id: 'owner-3', name: 'Diego Torrico', email: 'diego@owner.com', phone: '+591 73456789', propertiesOwned: ['Hermosa Casa Familiar en Cala Cala'], earnings: 8500, status: 'Verificado' }
  ]);

  const [developers, setDevelopers] = useState<Developer[]>([
    { id: 'dev-1', name: 'Constructora Alianza', nit: '1029384021', projectsCount: 5, contact: 'Arq. Luis Mendez', phone: '+591 71239847', email: 'alianza@constructoras.bo', status: 'Acreditada' },
    { id: 'dev-2', name: 'Edificaciones del Sur', nit: '8765432190', projectsCount: 3, contact: 'Ing. Carmen Perez', phone: '+591 78901230', email: 'sur@constructoras.bo', status: 'Acreditada' },
    { id: 'dev-3', name: 'Torres del Norte', nit: '5432109876', projectsCount: 8, contact: 'Arq. Mario Gomez', phone: '+591 74561230', email: 'norte@constructoras.bo', status: 'Acreditada' }
  ]);

  // ─── FORM STATES ───
  const [contractForm, setContractForm] = useState({
    propertyId: '',
    tenantId: '',
    ownerId: '',
    startDate: '',
    endDate: '',
    monthlyAmount: '',
    observations: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    contractId: '',
    amount: '',
    paymentDate: '',
    paymentMethod: 'Transferencia',
    reference: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    concept: '',
    amount: '',
    date: '',
    propertyId: '',
    category: 'Mantenimiento',
  });

  const [propertyForm, setPropertyForm] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    rooms: '',
    bathrooms: '',
    location: '',
    address: '',
    type: 'departamento',
    ownerId: '',
    hasFolioReal: false,
    hasCatastro: false,
    hasTestimonio: false,
    hasImpuestosAlDia: false,
    hasPlanoUsoSuelo: false,
    hasCI: false,
  });

  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Activo',
  });

  const [ownerForm, setOwnerForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Verificado',
  });

  const [developerForm, setDeveloperForm] = useState({
    name: '',
    nit: '',
    contact: '',
    phone: '',
    email: '',
    status: 'Acreditada',
  });

  // Load all dashboard records from the server API (or fallback mock)
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [propsData, contractsData, paymentsData, expensesData] = await Promise.all([
        propertiesService.getProperties(),
        contractsService.getContracts(),
        paymentsService.getPayments(),
        expensesService.getExpenses()
      ]);
      
      setProperties(propsData);
      setContracts(contractsData);
      setPayments(paymentsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error al cargar datos del panel:', error);
      showToast('Error al conectar con la base de datos centralizada.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── FORM SUBMIT HANDLERS ───

  // Property Handlers
  const handleApprove = async (id: string) => {
    try {
      setActionLoadingId(id);
      await propertiesService.updatePropertyStatus(id, 'APROBADO', undefined, 'mock-admin-token');
      
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'APROBADO', verified: true, isVerified: true }
            : p
        )
      );
      showToast('Inmueble aprobado y publicado con sello Oro', 'success');
    } catch (error) {
      console.error('Error al aprobar propiedad:', error);
      showToast('No se pudo validar el inmueble.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openObserveModal = (property: Property) => {
    setSelectedProperty(property);
    setObservationNotes('');
    setIsObserveModalOpen(true);
  };

  const handleObserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    if (!observationNotes.trim()) {
      showToast('Debe ingresar un comentario técnico para observar la publicación', 'error');
      return;
    }

    try {
      const id = selectedProperty.id;
      setActionLoadingId(id);
      setIsObserveModalOpen(false);

      await propertiesService.updatePropertyStatus(id, 'OBSERVADO', observationNotes, 'mock-admin-token');

      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'OBSERVADO', observationNotes, verified: false, isVerified: false }
            : p
        )
      );
      showToast('Inmueble marcado como OBSERVADO con nota de corrección', 'success');
    } catch (error) {
      console.error('Error al observar propiedad:', error);
      showToast('No se pudo guardar la observación.', 'error');
    } finally {
      setActionLoadingId(null);
      setSelectedProperty(null);
    }
  };

  const handlePropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyForm.title || !propertyForm.price || !propertyForm.location || !propertyForm.area) {
      showToast('Rellene todos los campos obligatorios.', 'error');
      return;
    }

    try {
      const ownerObj = owners.find(o => o.id === propertyForm.ownerId);
      const dto = {
        title: propertyForm.title,
        description: propertyForm.description || 'Sin descripción.',
        price: parseFloat(propertyForm.price),
        area: parseFloat(propertyForm.area),
        rooms: parseInt(propertyForm.rooms || '0'),
        bathrooms: parseInt(propertyForm.bathrooms || '0'),
        location: propertyForm.location,
        address: propertyForm.address || propertyForm.location,
        type: propertyForm.type,
        ownerId: propertyForm.ownerId || undefined,
        ownerName: ownerObj ? ownerObj.name : 'Propietario Legítimo',
        hasFolioReal: propertyForm.hasFolioReal,
        hasCatastro: propertyForm.hasCatastro,
        hasTestimonio: propertyForm.hasTestimonio,
        hasImpuestosAlDia: propertyForm.hasImpuestosAlDia,
        hasPlanoUsoSuelo: propertyForm.hasPlanoUsoSuelo,
        hasCI: propertyForm.hasCI,
        status: 'NUEVA_PUBLICACION'
      };

      const res = await propertiesService.createPropertyAsPropietario(dto, 'mock-admin-token');
      
      const newProperty: Property = {
        ...res.data,
        verified: false,
        isVerified: false,
        priceBob: res.data.price * 7, // local conversion
        imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
        hasFolioReal: dto.hasFolioReal,
        hasCatastro: dto.hasCatastro,
        hasTestimonio: dto.hasTestimonio,
        hasImpuestosAlDia: dto.hasImpuestosAlDia,
        hasPlanoUsoSuelo: dto.hasPlanoUsoSuelo,
        hasCI: dto.hasCI,
        ownerName: dto.ownerName,
        createdAt: new Date().toISOString()
      };

      setProperties((prev) => [newProperty, ...prev]);
      setIsNewPropertyOpen(false);
      showToast('Propiedad creada en estado de validación legal.', 'success');

      // Clear property form
      setPropertyForm({
        title: '',
        description: '',
        price: '',
        area: '',
        rooms: '',
        bathrooms: '',
        location: '',
        address: '',
        type: 'departamento',
        ownerId: '',
        hasFolioReal: false,
        hasCatastro: false,
        hasTestimonio: false,
        hasImpuestosAlDia: false,
        hasPlanoUsoSuelo: false,
        hasCI: false,
      });
    } catch (error) {
      console.error('Error al registrar inmueble:', error);
      showToast('No se pudo guardar la propiedad.', 'error');
    }
  };

  // Contract Handlers
  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.propertyId || !contractForm.tenantId || !contractForm.ownerId || !contractForm.startDate || !contractForm.endDate || !contractForm.monthlyAmount) {
      showToast('Por favor, rellene todos los campos obligatorios.', 'error');
      return;
    }

    try {
      const selectedTenant = clients.find(c => c.id === contractForm.tenantId) || { name: 'Admin', email: 'admin@propio.com.bo' };
      const selectedOwner = owners.find(o => o.id === contractForm.ownerId) || { name: 'Juan', email: 'owner@propio.com.bo' };
      const selectedProp = properties.find(p => p.id === contractForm.propertyId);

      const dto = {
        propertyId: contractForm.propertyId,
        tenantId: contractForm.tenantId,
        ownerId: contractForm.ownerId,
        startDate: contractForm.startDate,
        endDate: contractForm.endDate,
        monthlyAmount: parseFloat(contractForm.monthlyAmount),
        observations: contractForm.observations || undefined,
        status: 'VIGENTE' as const
      };

      const res = await contractsService.createContract(dto);
      
      const enrichedContract: Contract = {
        ...res.data,
        property: selectedProp ? {
          id: selectedProp.id,
          title: selectedProp.title,
          location: selectedProp.location,
          address: (selectedProp as Property & { address?: string }).address || selectedProp.location
        } : res.data.property,
        tenant: {
          id: contractForm.tenantId,
          name: selectedTenant.name,
          email: selectedTenant.email
        },
        owner: {
          id: contractForm.ownerId,
          name: selectedOwner.name,
          email: selectedOwner.email
        }
      };

      // Update local state
      setContracts((prev) => [enrichedContract, ...prev]);
      
      // Update property status locally to RESERVADO
      setProperties((prev) =>
        prev.map((p) =>
          p.id === contractForm.propertyId ? { ...p, status: 'RESERVADO' } : p
        )
      );

      // Close Form and show Success alert banner
      setIsNewContractOpen(false);
      setSuccessBanner('Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente.');
      
      // Smooth scroll to top of workspace
      const workPanel = document.getElementById('workspace-panel');
      if (workPanel) {
        workPanel.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Clean form
      setContractForm({
        propertyId: '',
        tenantId: '',
        ownerId: '',
        startDate: '',
        endDate: '',
        monthlyAmount: '',
        observations: '',
      });
      
      // Clear banner after 8s
      setTimeout(() => setSuccessBanner(null), 8000);
    } catch (error) {
      console.error('Error al registrar contrato:', error);
      showToast('No se pudo registrar el contrato.', 'error');
    }
  };

  const handleContractDelete = async (id: string) => {
    if (!confirm('¿Está seguro de que desea rescindir y eliminar este contrato de alquiler?')) return;
    try {
      await contractsService.deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      showToast('Contrato rescindido y eliminado correctamente.', 'success');
    } catch (error) {
      console.error('Error al eliminar contrato:', error);
      showToast('No se pudo eliminar el contrato.', 'error');
    }
  };

  // Payment Handlers
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.contractId || !paymentForm.amount || !paymentForm.paymentDate || !paymentForm.paymentMethod) {
      showToast('Por favor, rellene todos los campos obligatorios.', 'error');
      return;
    }

    try {
      const selectedContract = contracts.find(c => c.id === paymentForm.contractId);
      const dto = {
        contractId: paymentForm.contractId,
        amount: parseFloat(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference || undefined,
      };

      const res = await paymentsService.createPayment(dto);
      
      const enrichedPayment: Payment = {
        ...res.data,
        contract: selectedContract ? {
          id: selectedContract.id,
          property: selectedContract.property ? {
            id: selectedContract.property.id,
            title: selectedContract.property.title
          } : undefined
        } : undefined
      };

      setPayments((prev) => [enrichedPayment, ...prev]);
      setIsNewPaymentOpen(false);
      showToast('Pago registrado y cargado al balance.', 'success');
      
      setPaymentForm({
        contractId: '',
        amount: '',
        paymentDate: '',
        paymentMethod: 'Transferencia',
        reference: '',
      });
    } catch (error) {
      console.error('Error al registrar pago:', error);
      showToast('No se pudo registrar el pago.', 'error');
    }
  };

  // Expense Handlers
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.concept || !expenseForm.amount || !expenseForm.date || !expenseForm.category) {
      showToast('Por favor, rellene todos los campos obligatorios.', 'error');
      return;
    }

    try {
      const selectedProp = properties.find(p => p.id === expenseForm.propertyId);
      const dto = {
        concept: expenseForm.concept,
        amount: parseFloat(expenseForm.amount),
        date: expenseForm.date,
        propertyId: expenseForm.propertyId || undefined,
        category: expenseForm.category,
      };

      const res = await expensesService.createExpense(dto);
      
      const enrichedExpense: Expense = {
        ...res.data,
        property: selectedProp ? {
          id: selectedProp.id,
          title: selectedProp.title
        } : undefined
      };

      setExpenses((prev) => [enrichedExpense, ...prev]);
      setIsNewExpenseOpen(false);
      showToast('Gasto registrado y restado de ingresos.', 'success');

      setExpenseForm({
        concept: '',
        amount: '',
        date: '',
        propertyId: '',
        category: 'Mantenimiento',
      });
    } catch (error) {
      console.error('Error al registrar gasto:', error);
      showToast('No se pudo registrar el gasto.', 'error');
    }
  };

  // Client Handlers
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.email || !clientForm.phone) {
      showToast('Complete todos los campos obligatorios.', 'error');
      return;
    }

    const newClient: Client = {
      id: 'tenant-' + Math.random().toString(36).substr(2, 9),
      name: clientForm.name,
      email: clientForm.email,
      phone: clientForm.phone,
      status: clientForm.status,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setClients((prev) => [newClient, ...prev]);
    setIsNewClientOpen(false);
    showToast('Cliente / Inquilino registrado de forma exitosa.', 'success');

    setClientForm({
      name: '',
      email: '',
      phone: '',
      status: 'Activo',
    });
  };

  // Owner Handlers
  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerForm.name || !ownerForm.email || !ownerForm.phone) {
      showToast('Complete todos los campos obligatorios.', 'error');
      return;
    }

    const newOwner: Owner = {
      id: 'owner-' + Math.random().toString(36).substr(2, 9),
      name: ownerForm.name,
      email: ownerForm.email,
      phone: ownerForm.phone,
      propertiesOwned: [],
      earnings: 0,
      status: ownerForm.status
    };

    setOwners((prev) => [newOwner, ...prev]);
    setIsNewOwnerOpen(false);
    showToast('Propietario registrado y acreditado en el sistema.', 'success');

    setOwnerForm({
      name: '',
      email: '',
      phone: '',
      status: 'Verificado',
    });
  };

  // Developer Handlers
  const handleDeveloperSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!developerForm.name || !developerForm.nit || !developerForm.contact) {
      showToast('Complete todos los campos obligatorios.', 'error');
      return;
    }

    const newDev: Developer = {
      id: 'dev-' + Math.random().toString(36).substr(2, 9),
      name: developerForm.name,
      nit: developerForm.nit,
      projectsCount: 0,
      contact: developerForm.contact,
      phone: developerForm.phone,
      email: developerForm.email || 'constructora@correo.com',
      status: developerForm.status
    };

    setDevelopers((prev) => [newDev, ...prev]);
    setIsNewDeveloperOpen(false);
    showToast('Constructora / Desarrollador agregado al padrón comercial.', 'success');

    setDeveloperForm({
      name: '',
      nit: '',
      contact: '',
      phone: '',
      email: '',
      status: 'Acreditada',
    });
  };

  // Export report animations
  const triggerExport = (format: 'pdf' | 'excel', name: string) => {
    showToast(`Generando reporte consolidado de ${name}...`, 'success');
    setTimeout(() => {
      showToast(`Archivo sBienes_${name}_2026.${format === 'pdf' ? 'pdf' : 'xlsx'} descargado con éxito.`, 'success');
    }, 2500);
  };

  // Document Checklist Badge mapper (Original checklist workflow preserved)
  const renderDocumentChecklist = (property: Property) => {
    const docs = [
      { label: 'FR', name: 'Folio Real', active: property.hasFolioReal },
      { label: 'CT', name: 'Catastro', active: property.hasCatastro },
      { label: 'TS', name: 'Testimonio', active: property.hasTestimonio },
      { label: 'IA', name: 'Impuestos', active: property.hasImpuestosAlDia },
      { label: 'US', name: 'Plano Suelo', active: property.hasPlanoUsoSuelo },
      { label: 'CI', name: 'Cédula Identidad', active: property.hasCI },
    ];

    return (
      <div className="flex flex-wrap gap-1">
        {docs.map((doc, idx) => (
          <div
            key={idx}
            title={`${doc.name}: ${doc.active ? 'Presentado' : 'Falta'}`}
            className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold tracking-wider transition-all duration-300 ${
              doc.active
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            {doc.label}
          </div>
        ))}
      </div>
    );
  };

  // Styled legal status badges mapping to Propio's brand
  const renderStatusBadge = (status?: string) => {
    const s = status || 'NUEVA_PUBLICACION';
    if (s === 'APROBADO' || s === 'LEGAL_VERDE') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          APROBADO
        </span>
      );
    }
    if (s === 'OBSERVADO' || s === 'LEGAL_AMARILLO') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
          OBSERVADO
        </span>
      );
    }
    if (s === 'RESERVADO') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
          RESERVADO
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse"></span>
        PENDIENTE
      </span>
    );
  };

  // Get active tab heading title
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard sBienes';
      case 'properties': return 'Validación de Inmuebles';
      case 'clients': return 'Gestión de Inquilinos';
      case 'owners': return 'Padrón de Propietarios';
      case 'developers': return 'Constructoras Homologadas';
      case 'contracts': return 'Gestión de Contratos';
      case 'payments': return 'Flujo de Pagos';
      case 'expenses': return 'Control de Gastos';
      case 'reports': return 'Reportes Financieros';
      default: return 'Panel Corporativo';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#475569] flex font-sans antialiased overflow-hidden">
      
      {/* Decorative Grid Line pattern on whole background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)] pointer-events-none z-0"></div>

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR — AdminSidebar Component (Premium Redesign) */}
      {/* ========================================================================= */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          setSuccessBanner(null);
        }}
        counts={{
          properties: properties.length,
          clients: clients.length,
          owners: owners.length,
          developers: developers.length,
          contracts: contracts.length,
          payments: payments.length,
          expenses: expenses.length,
        }}
      />


      {/* ========================================================================= */}
      {/* 2. RIGHT WORKSPACE PANEL */}
      {/* ========================================================================= */}
      <div id="workspace-panel" className="flex-grow flex flex-col h-screen overflow-y-auto relative z-10">
        
        {/* ── TOP HEADER BAR ──────────────────────────────────────────────────── */}
        <header className="bg-white border-b border-slate-100 h-14 shrink-0 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 pl-10 md:pl-0">
            <h2 className="text-[11px] font-black text-[#04045E] uppercase tracking-widest">
              {getTabTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4.5">
            {/* Notifications badge */}
            <div className="relative cursor-pointer group p-1.5 hover:bg-slate-100 rounded-lg transition-all" title="Notificaciones sBienes">
              <svg className="h-5 w-5 text-slate-500 group-hover:text-[#04045E] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 h-4 w-4 bg-rose-600 rounded-full text-[9px] font-black text-white flex items-center justify-center border border-white">
                3
              </span>
            </div>

            {/* Cerrar Sesión Button */}
            <button
              onClick={() => {
                removeToken();
                window.location.href = '/';
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-rose-200/50 hover:bg-rose-50 hover:border-rose-400/80 text-rose-500 font-sans font-black text-[10px] uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer select-none"
              title="Cerrar Sesión de Administrador"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xs:inline">Cerrar Sesión</span>
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2 cursor-pointer pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-[#b9fa3c] text-[#04045E] font-black text-xs flex items-center justify-center border border-[#04045E]/10 shadow-sm">
                AD
              </div>
              <span className="text-xs font-black text-[#04045E] uppercase tracking-wider hidden sm:inline">admin</span>
              <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-grow p-6 space-y-6 max-w-7xl w-full mx-auto relative z-10 pb-16">
          
          {/* ========================================================================= */}
          {/* SUCCESS BANNER ALERT (Legacy sBienes PHP visual replica) */}
          {/* ========================================================================= */}
          {successBanner && (
            <div className="bg-[#E8F5E9]/80 border-l-4 border-[#1B5E20] p-4.5 rounded-r-xl shadow-md animate-slide-in flex items-start gap-3.5 backdrop-blur-sm">
              <div className="bg-[#1B5E20] p-1.5 rounded-lg border border-[#b9fa3c]/20 shadow-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <div className="flex-grow">
                <h4 className="text-xs font-black text-[#1B5E20] uppercase tracking-wider">Acción Completada</h4>
                <p className="text-xs text-[#2E7D32] font-semibold mt-0.5">{successBanner}</p>
              </div>
              <button onClick={() => setSuccessBanner(null)} className="text-[#1B5E20]/60 hover:text-[#1B5E20] text-xs font-bold px-1.5">✕</button>
            </div>
          )}

          {/* Global statistics row (Except for reports/dashboard tabs) */}
          {activeTab !== 'dashboard' && activeTab !== 'reports' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Validación Legal</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-[#04045E]">{properties.filter((p) => p.status === 'NUEVA_PUBLICACION').length}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 uppercase font-black tracking-wider">
                    Pendientes
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contratos Vigentes</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600">
                    {contracts.filter((c) => c.status === 'VIGENTE').length}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase font-black tracking-wider">
                    Activos
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingresos por Cobros</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-[#04045E]">
                    ${payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#b9fa3c]/20 text-[#04045E] border border-[#b9fa3c]/40 uppercase font-black tracking-wider">
                    Total
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Egresos Operacionales</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-rose-600">
                    ${expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 uppercase font-black tracking-wider">
                    Gastos
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loader */}
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-[#04045E] mb-4"></div>
              <p className="text-xs uppercase font-black tracking-widest text-slate-400 animate-pulse">
                Cargando registros corporativos sBienes...
              </p>
            </div>
          ) : (
            <>
              {/* ========================================================================= */}
              {/* TAB: DASHBOARD */}
              {/* ========================================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Dashboard Metrics grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inmuebles Totales</span>
                        <h4 className="text-3xl font-black text-[#04045E] mt-1">{properties.length}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Inventario General</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border text-[#04045E] text-xl">🏢</div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contratos Totales</span>
                        <h4 className="text-3xl font-black text-emerald-600 mt-1">{contracts.length}</h4>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">{contracts.filter(c => c.status === 'VIGENTE').length} Vigentes</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border text-emerald-600 text-xl">📝</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clientes / Inquilinos</span>
                        <h4 className="text-3xl font-black text-indigo-600 mt-1">{clients.length}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Padrón Registrado</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border text-indigo-600 text-xl">👥</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Constructoras</span>
                        <h4 className="text-3xl font-black text-amber-600 mt-1">{developers.length}</h4>
                        <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Homologadas</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border text-amber-600 text-xl">🏗️</div>
                    </div>
                  </div>

                  {/* Financial Balance Overview with dynamic meters */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Financial balance card */}
                    <div className="bg-[#0A0E17] text-white p-6 rounded-3xl border border-slate-800/40 shadow-lg flex flex-col justify-between space-y-6 lg:col-span-1">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-[#b9fa3c] uppercase tracking-widest">Balance Neto sBienes</span>
                        <h2 className="text-4xl font-black tracking-tight mt-1">
                          ${(payments.reduce((a,c)=>a+c.amount,0) - expenses.reduce((a,c)=>a+c.amount,0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">USD acumulados</span>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-slate-800/60">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Ingresos Totales</span>
                          <span className="font-extrabold text-[#b9fa3c]">+${payments.reduce((a,c)=>a+c.amount,0).toLocaleString()} USD</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Egresos Totales</span>
                          <span className="font-extrabold text-rose-500">-${expenses.reduce((a,c)=>a+c.amount,0).toLocaleString()} USD</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">Tasa de Ocupación</span>
                          <span className="font-extrabold text-emerald-400">83.3%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => { setActiveTab('reports'); }}
                        className="w-full py-3 bg-[#b9fa3c] hover:bg-[#a6e033] text-[#04045E] font-black text-xs uppercase rounded-xl tracking-wider transition-all"
                      >
                        Ver Reportes Analíticos
                      </button>
                    </div>

                    {/* Chart Visualizer (CSS gradient bars representing cashflow) */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Flujo de Caja Mensual (Simulación sBienes)</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Comparación de rentabilidad y gastos</p>
                      </div>

                      {/* Pure CSS simulated bar chart */}
                      <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-slate-100">
                        {[
                          { month: 'Ene', income: 70, expense: 20 },
                          { month: 'Feb', income: 85, expense: 25 },
                          { month: 'Mar', income: 90, expense: 35 },
                          { month: 'Abr', income: 60, expense: 45 },
                          { month: 'May', income: 95, expense: 15 },
                          { month: 'Jun', income: 80, expense: 30 }
                        ].map((d, i) => (
                          <div key={i} className="flex-grow flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-full flex items-end gap-1.5 h-32 justify-center relative">
                              {/* Income bar */}
                              <div
                                style={{ height: `${d.income}%` }}
                                className="w-4 bg-[#04045E] rounded-t-md hover:bg-indigo-900 transition-all relative group-hover:scale-y-[1.03]"
                                title={`Ingresos: $${d.income * 100}`}
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-[8px] text-white font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  ${d.income * 100}
                                </span>
                              </div>
                              {/* Expense bar */}
                              <div
                                style={{ height: `${d.expense}%` }}
                                className="w-4 bg-rose-500 rounded-t-md hover:bg-rose-600 transition-all relative group-hover:scale-y-[1.03]"
                                title={`Gastos: $${d.expense * 100}`}
                              >
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-[8px] text-white font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  ${d.expense * 100}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.month}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 pt-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#04045E]"></span>
                          <span>Cobros Recibidos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                          <span>Egresos / Mantenimientos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit recent updates log */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Bitácora de Auditoría Reciente</h4>
                    
                    <div className="divide-y divide-slate-100 text-xs font-medium text-slate-600 space-y-3">
                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <p>Contrato firmado para <span className="font-bold text-[#04045E] uppercase">Apartaestudio moderno en Laureles</span></p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Hoy</span>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-[#b9fa3c]"></span>
                          <p>Cobro de arriendo mensual de <span className="font-bold text-[#04045E]">$1,000.00 USD</span> procesado</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ayer</span>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-[#04045E]"></span>
                          <p>Inmueble <span className="font-bold text-[#04045E] uppercase">Hermosa Casa en Cala Cala</span> acreditada y aprobada</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">22/05/2026</span>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-3">
                          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                          <p>Gasto registrado por mantenimiento eléctrico de <span className="font-bold text-rose-600">-$150.00 USD</span></p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">20/05/2026</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: PROPIEDADES (Validación de Inmuebles) */}
              {/* ========================================================================= */}
              {activeTab === 'properties' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top toolbar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Validación Legal de Solicitudes</h3>
                      
                      <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-inner">
                        <button
                          onClick={() => setFilterStatus('NUEVA_PUBLICACION')}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            filterStatus === 'NUEVA_PUBLICACION'
                              ? 'bg-[#04045E] text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Pendientes ({properties.filter((p) => p.status === 'NUEVA_PUBLICACION').length})
                        </button>
                        <button
                          onClick={() => setFilterStatus('TODAS')}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                            filterStatus === 'TODAS'
                              ? 'bg-[#04045E] text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Ver Todo ({properties.length})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Buscar por título, zona..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border text-xs text-[#04045E] rounded-xl px-4 py-2 w-full md:w-60 focus:outline-none focus:border-[#04045E]"
                      />
                      <button
                        onClick={() => setIsNewPropertyOpen(true)}
                        className="px-4 py-2.5 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider uppercase shrink-0"
                      >
                        + Nuevo Inmueble
                      </button>
                    </div>
                  </div>

                  {/* sliding drawer to register property */}
                  {isNewPropertyOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-up">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Registrar Propiedad de Propietario</h4>
                        <button onClick={() => setIsNewPropertyOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handlePropertySubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Título de la Publicación *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Apartaestudio moderno en Laureles"
                            value={propertyForm.title}
                            onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Precio Venta (USD) *</label>
                          <input
                            type="number"
                            required
                            placeholder="120000"
                            value={propertyForm.price}
                            onChange={(e) => setPropertyForm({ ...propertyForm, price: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tipo de Inmueble *</label>
                          <select
                            required
                            value={propertyForm.type}
                            onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="departamento">Departamento</option>
                            <option value="casa">Casa de Campo/Ciudad</option>
                            <option value="terreno">Terreno Agrícola/Urbano</option>
                            <option value="oficina">Oficina Comercial</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Área Construida (m²) *</label>
                          <input
                            type="number"
                            required
                            placeholder="150"
                            value={propertyForm.area}
                            onChange={(e) => setPropertyForm({ ...propertyForm, area: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Asociar Propietario *</label>
                          <select
                            required
                            value={propertyForm.ownerId}
                            onChange={(e) => setPropertyForm({ ...propertyForm, ownerId: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="">-- Seleccionar dueño --</option>
                            {owners.map(o => (
                              <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Zona / Ubicación *</label>
                          <input
                            type="text"
                            required
                            placeholder="Cala Cala, Cochabamba"
                            value={propertyForm.location}
                            onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Dirección Detallada (Opcional)</label>
                          <input
                            type="text"
                            placeholder="Calle 16 de Julio #123, Edif. Los Pinos"
                            value={propertyForm.address}
                            onChange={(e) => setPropertyForm({ ...propertyForm, address: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Descripción general del Inmueble</label>
                          <textarea
                            rows={2}
                            placeholder="Detalle características de valor del inmueble..."
                            value={propertyForm.description}
                            onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none resize-none"
                          />
                        </div>

                        {/* Checklist toggles */}
                        <div className="md:col-span-3 space-y-2.5">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Checklist Documental Legal:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={propertyForm.hasFolioReal}
                                onChange={(e) => setPropertyForm({ ...propertyForm, hasFolioReal: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                              />
                              <span>Folio Real (FR)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={propertyForm.hasCatastro}
                                onChange={(e) => setPropertyForm({ ...propertyForm, hasCatastro: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                              />
                              <span>Catastro (CT)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={propertyForm.hasTestimonio}
                                onChange={(e) => setPropertyForm({ ...propertyForm, hasTestimonio: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                              />
                              <span>Testimonio (TS)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={propertyForm.hasImpuestosAlDia}
                                onChange={(e) => setPropertyForm({ ...propertyForm, hasImpuestosAlDia: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                              />
                              <span>Impuestos (IA)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={propertyForm.hasPlanoUsoSuelo}
                                onChange={(e) => setPropertyForm({ ...propertyForm, hasPlanoUsoSuelo: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                              />
                              <span>Plano (US)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600">
                              <input
                                type="checkbox"
                                checked={propertyForm.hasCI}
                                onChange={(e) => setPropertyForm({ ...propertyForm, hasCI: e.target.checked })}
                                className="h-4 w-4 rounded border-slate-300 text-[#04045E]"
                              />
                              <span>Cédula (CI)</span>
                            </label>
                          </div>
                        </div>

                        <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewPropertyOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase shadow"
                          >
                            Guardar Propiedad
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Properties table */}
                  {properties.filter(p => (filterStatus === 'TODAS' || p.status === 'NUEVA_PUBLICACION') && (
                    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.location.toLowerCase().includes(searchQuery.toLowerCase())
                  )).length === 0 ? (
                    <div className="h-72 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm text-center p-8 space-y-3">
                      <span className="text-3xl">📋</span>
                      <h3 className="text-sm font-bold text-[#04045E] uppercase">Bandeja Vacía</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        No quedan solicitudes que coincidan con la búsqueda.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-4 px-6">Detalles Inmueble</th>
                              <th className="py-4 px-6">Propietario</th>
                              <th className="py-4 px-6">Precio de Lista</th>
                              <th className="py-4 px-6">Checklist Legal</th>
                              <th className="py-4 px-6">Estado</th>
                              <th className="py-4 px-6 text-right">Herramientas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {properties
                              .filter(p => (filterStatus === 'TODAS' || p.status === 'NUEVA_PUBLICACION') && (
                                p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                p.location.toLowerCase().includes(searchQuery.toLowerCase())
                              ))
                              .map((property) => (
                                <tr key={property.id} className="hover:bg-slate-50/50 transition-all">
                                  <td className="py-4 px-6 max-w-xs">
                                    <p className="font-extrabold text-[#04045E] uppercase truncate tracking-tight">{property.title}</p>
                                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                                      <span className="font-semibold uppercase">{property.type}</span>
                                      <span>•</span>
                                      <span>{property.area} m²</span>
                                      <span>•</span>
                                      <span>{property.rooms} Dorms</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6">
                                    <p className="font-bold text-slate-700">{property.ownerName || 'Juan'}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'Fecha Indefinida'}
                                    </p>
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black bg-[#b9fa3c]/20 text-[#04045E] border border-[#b9fa3c]/40 uppercase mb-0.5">
                                      {property.type === 'terreno' ? 'Terreno' : 'Venta'}
                                    </span>
                                    <p className="font-black text-[#04045E] text-sm">${property.price.toLocaleString()} USD</p>
                                  </td>
                                  <td className="py-4 px-6">{renderDocumentChecklist(property)}</td>
                                  <td className="py-4 px-6">
                                    <div className="space-y-1">
                                      {renderStatusBadge(property.status)}
                                      {property.observationNotes && (
                                        <p className="text-[10px] text-amber-600 font-medium italic truncate max-w-[160px]" title={property.observationNotes}>
                                          Nota: {property.observationNotes}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex justify-end gap-2 items-center">
                                      {property.status === 'NUEVA_PUBLICACION' ? (
                                        <>
                                          <button
                                            onClick={() => handleApprove(property.id)}
                                            disabled={actionLoadingId === property.id}
                                            className="px-3 py-1.5 bg-[#b9fa3c] hover:bg-[#a6e033] text-[#04045E] font-black text-[10px] rounded-lg tracking-wider transition-all transform active:scale-95 uppercase border border-[#04045E]/10"
                                          >
                                            {actionLoadingId === property.id ? '...' : 'Aprobar'}
                                          </button>
                                          <button
                                            onClick={() => openObserveModal(property)}
                                            disabled={actionLoadingId === property.id}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg tracking-wider transition-all transform active:scale-95 uppercase border"
                                          >
                                            Observar
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                          Evaluado
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: CLIENTES (Inquilinos) */}
              {/* ========================================================================= */}
              {activeTab === 'clients' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top toolbar */}
                  <div className="flex justify-between items-center py-1">
                    <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Historial de Clientes Activos</h3>
                    
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Buscar inquilino..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border text-xs text-[#04045E] rounded-xl px-4 py-2 w-60 focus:outline-none focus:border-[#04045E]"
                      />
                      <button
                        onClick={() => setIsNewClientOpen(true)}
                        className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider uppercase"
                      >
                        + Nuevo Cliente
                      </button>
                    </div>
                  </div>

                  {/* sliding client form drawer */}
                  {isNewClientOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-up">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Registrar Nuevo Inquilino / Arrendatario</h4>
                        <button onClick={() => setIsNewClientOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nombre Completo *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Marcelo Suarez"
                            value={clientForm.name}
                            onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Correo Electrónico *</label>
                          <input
                            type="email"
                            required
                            placeholder="marcelo@correo.com"
                            value={clientForm.email}
                            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Número Celular / WhatsApp *</label>
                          <input
                            type="text"
                            required
                            placeholder="+591 79876543"
                            value={clientForm.phone}
                            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Estado del Cliente *</label>
                          <select
                            required
                            value={clientForm.status}
                            onChange={(e) => setClientForm({ ...clientForm, status: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="Activo">Activo (Solvente)</option>
                            <option value="Pendiente">Pendiente de Aprobación</option>
                            <option value="Inactivo">Inactivo / Ex-inquilino</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewClientOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase shadow"
                          >
                            Registrar Cliente
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Client table view */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <th className="py-4 px-6">ID Cliente</th>
                            <th className="py-4 px-6">Nombre del Inquilino</th>
                            <th className="py-4 px-6">Email de Contacto</th>
                            <th className="py-4 px-6">Celular / WhatsApp</th>
                            <th className="py-4 px-6">Fecha Registro</th>
                            <th className="py-4 px-6 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {clients
                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((client) => (
                              <tr key={client.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-4 px-6 font-mono font-bold text-slate-400">
                                  #{client.id.toUpperCase()}
                                </td>
                                <td className="py-4 px-6 font-extrabold text-[#04045E]">
                                  {client.name}
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-600">
                                  {client.email}
                                </td>
                                <td className="py-4 px-6 font-semibold">
                                  {client.phone}
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-400">
                                  {client.createdAt}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    client.status === 'Activo'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {client.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: PROPIETARIOS */}
              {/* ========================================================================= */}
              {activeTab === 'owners' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top toolbar */}
                  <div className="flex justify-between items-center py-1">
                    <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Historial de Propietarios</h3>
                    
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Buscar propietario..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border text-xs text-[#04045E] rounded-xl px-4 py-2 w-60 focus:outline-none focus:border-[#04045E]"
                      />
                      <button
                        onClick={() => setIsNewOwnerOpen(true)}
                        className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider uppercase"
                      >
                        + Nuevo Propietario
                      </button>
                    </div>
                  </div>

                  {/* sliding owner drawer */}
                  {isNewOwnerOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-up">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Registrar Acreditación de Propietario</h4>
                        <button onClick={() => setIsNewOwnerOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handleOwnerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nombre Completo *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Juan de la Cruz"
                            value={ownerForm.name}
                            onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Correo Electrónico *</label>
                          <input
                            type="email"
                            required
                            placeholder="juan@propio.com.bo"
                            value={ownerForm.email}
                            onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Celular / WhatsApp de Contacto *</label>
                          <input
                            type="text"
                            required
                            placeholder="+591 72345678"
                            value={ownerForm.phone}
                            onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Sello de Acreditación *</label>
                          <select
                            required
                            value={ownerForm.status}
                            onChange={(e) => setOwnerForm({ ...ownerForm, status: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="Verificado">Verificado con Sello Oro</option>
                            <option value="En Verificación">En Espera de Validación</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewOwnerOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase shadow"
                          >
                            Registrar Propietario
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Owner list view */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <th className="py-4 px-6">ID Propietario</th>
                            <th className="py-4 px-6">Nombre Propietario</th>
                            <th className="py-4 px-6">Contacto Email</th>
                            <th className="py-4 px-6">Celular</th>
                            <th className="py-4 px-6">Inmuebles Vinculados</th>
                            <th className="py-4 px-6">Ganancias Totales (USD)</th>
                            <th className="py-4 px-6 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {owners
                            .filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.email.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((owner) => (
                              <tr key={owner.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-4 px-6 font-mono font-bold text-slate-400">
                                  #{owner.id.toUpperCase()}
                                </td>
                                <td className="py-4 px-6 font-extrabold text-[#04045E]">
                                  {owner.name}
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-600">
                                  {owner.email}
                                </td>
                                <td className="py-4 px-6 font-semibold">
                                  {owner.phone}
                                </td>
                                <td className="py-4 px-6 max-w-xs">
                                  {owner.propertiesOwned.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {owner.propertiesOwned.map((p, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-[#04045E] rounded text-[10px] font-bold border uppercase">
                                          {p.length > 18 ? p.substr(0,18) + '...' : p}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic font-medium">Sin propiedades asociadas</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 font-black text-[#04045E] text-sm">
                                  ${owner.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    owner.status === 'Verificado'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {owner.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: CONSTRUCTORAS */}
              {/* ========================================================================= */}
              {activeTab === 'developers' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top toolbar */}
                  <div className="flex justify-between items-center py-1">
                    <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Historial de Constructoras Homologadas</h3>
                    
                    <div className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Buscar constructora..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border text-xs text-[#04045E] rounded-xl px-4 py-2 w-60 focus:outline-none focus:border-[#04045E]"
                      />
                      <button
                        onClick={() => setIsNewDeveloperOpen(true)}
                        className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider uppercase"
                      >
                        + Nueva Constructora
                      </button>
                    </div>
                  </div>

                  {/* sliding developer drawer */}
                  {isNewDeveloperOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-up">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Registrar y Homologar Empresa Constructora</h4>
                        <button onClick={() => setIsNewDeveloperOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handleDeveloperSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Razón Social / Nombre *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Constructora Alianza S.R.L."
                            value={developerForm.name}
                            onChange={(e) => setDeveloperForm({ ...developerForm, name: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">NIT Comercial *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: 1029384021"
                            value={developerForm.nit}
                            onChange={(e) => setDeveloperForm({ ...developerForm, nit: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Representante Técnico *</label>
                          <input
                            type="text"
                            required
                            placeholder="Arq. Luis Mendez"
                            value={developerForm.contact}
                            onChange={(e) => setDeveloperForm({ ...developerForm, contact: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Número Celular *</label>
                          <input
                            type="text"
                            required
                            placeholder="+591 71239847"
                            value={developerForm.phone}
                            onChange={(e) => setDeveloperForm({ ...developerForm, phone: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Email Comercial</label>
                          <input
                            type="email"
                            placeholder="alianza@constructora.com"
                            value={developerForm.email}
                            onChange={(e) => setDeveloperForm({ ...developerForm, email: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Estado de Homologación *</label>
                          <select
                            required
                            value={developerForm.status}
                            onChange={(e) => setDeveloperForm({ ...developerForm, status: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="Acreditada">Acreditada para Proyectos Oro</option>
                            <option value="En Revisión">En Revisión de Licencia</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewDeveloperOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase shadow"
                          >
                            Homologar Constructora
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Developer table view */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <th className="py-4 px-6">ID Corporativo</th>
                            <th className="py-4 px-6">Empresa / Razón Social</th>
                            <th className="py-4 px-6">NIT Tributario</th>
                            <th className="py-4 px-6">Representante Legal</th>
                            <th className="py-4 px-6">Proyectos Acreditados</th>
                            <th className="py-4 px-6">Contacto Celular</th>
                            <th className="py-4 px-6 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {developers
                            .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.nit.includes(searchQuery))
                            .map((dev) => (
                              <tr key={dev.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-4 px-6 font-mono font-bold text-slate-400">
                                  #{dev.id.toUpperCase()}
                                </td>
                                <td className="py-4 px-6 font-extrabold text-[#04045E]">
                                  {dev.name}
                                </td>
                                <td className="py-4 px-6 font-mono font-semibold text-slate-600">
                                  {dev.nit}
                                </td>
                                <td className="py-4 px-6 font-bold text-slate-700">
                                  {dev.contact}
                                </td>
                                <td className="py-4 px-6 font-bold text-indigo-600">
                                  {dev.projectsCount} proyectos
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-600">
                                  {dev.phone}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    dev.status === 'Acreditada'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  }`}>
                                    {dev.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: CONTRATOS (Legacy sBienes visual exact replica) */}
              {/* ========================================================================= */}
              {activeTab === 'contracts' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Header Actions */}
                  <div className="flex justify-between items-center py-1">
                    <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Lista de Contratos Activos
                    </h3>
                    
                    <button
                      onClick={() => setIsNewContractOpen(true)}
                      className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider transition-all transform active:scale-95 uppercase flex items-center gap-1.5 shadow-md shadow-indigo-950/15"
                    >
                      <span>+ Nuevo Contrato</span>
                    </button>
                  </div>

                  {/* Sliding Drawer/Overlay for creating a new contract */}
                  {isNewContractOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg space-y-4 animate-scale-up backdrop-blur-md bg-white/95">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Crear Nuevo Contrato de Alquiler sBienes</h4>
                        <button onClick={() => setIsNewContractOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handleContractSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Seleccionar Inmueble Aprobado *</label>
                          <select
                            required
                            value={contractForm.propertyId}
                            onChange={(e) => setContractForm({ ...contractForm, propertyId: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          >
                            <option value="">-- Elija un inmueble --</option>
                            {properties.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{(p.status || 'PENDIENTE').toUpperCase()}] {p.title} - ${p.price.toLocaleString()} USD
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Inquilino Asociado *</label>
                          <select
                            required
                            value={contractForm.tenantId}
                            onChange={(e) => setContractForm({ ...contractForm, tenantId: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="">-- Vincular cliente inquilino --</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Propietario Asociado *</label>
                          <select
                            required
                            value={contractForm.ownerId}
                            onChange={(e) => setContractForm({ ...contractForm, ownerId: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="">-- Vincular dueño legal --</option>
                            {owners.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name} ({o.email})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Monto Mensual de Renta (USD) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="1000.00"
                            value={contractForm.monthlyAmount}
                            onChange={(e) => setContractForm({ ...contractForm, monthlyAmount: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Vigencia - Fecha Inicio *</label>
                          <input
                            type="date"
                            required
                            value={contractForm.startDate}
                            onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Vigencia - Fecha Fin *</label>
                          <input
                            type="date"
                            required
                            value={contractForm.endDate}
                            onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Observaciones del Contrato</label>
                          <textarea
                            rows={3}
                            placeholder="Ej: Contrato de 12 meses forzoso con depósito de garantía equivalente."
                            value={contractForm.observations}
                            onChange={(e) => setContractForm({ ...contractForm, observations: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none resize-none"
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewContractOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase tracking-wider transition-all shadow-md"
                          >
                            Guardar Contrato
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Contracts list table matches image_0 perfectly */}
                  {contracts.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm text-center p-8 space-y-3">
                      <span className="text-3xl">📝</span>
                      <h3 className="text-sm font-bold text-[#04045E] uppercase">Sin Contratos</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        No hay contratos de alquiler registrados todavía. Pulse "+ Nuevo Contrato" para iniciar.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-4 px-6">Propiedad</th>
                              <th className="py-4 px-6">Inquilino</th>
                              <th className="py-4 px-6">Propietario</th>
                              <th className="py-4 px-6">Vigencia</th>
                              <th className="py-4 px-6">Monto</th>
                              <th className="py-4 px-6">Estado</th>
                              <th className="py-4 px-6 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {contracts.map((contract) => (
                              <tr key={contract.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-4.5 px-6">
                                  <p className="font-extrabold text-[#04045E] uppercase tracking-tight truncate max-w-[240px]">
                                    {contract.property?.title || 'Inmueble Registrado'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {contract.property?.address || contract.property?.location || 'Dirección General'}
                                  </p>
                                </td>
                                <td className="py-4.5 px-6">
                                  <p className="font-bold text-slate-800">{contract.tenant?.name || 'Admin'}</p>
                                </td>
                                <td className="py-4.5 px-6">
                                  <p className="font-bold text-slate-800">{contract.owner?.name || 'Juan'}</p>
                                </td>
                                <td className="py-4.5 px-6">
                                  <p className="font-semibold text-slate-700">
                                    {new Date(contract.startDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    al {new Date(contract.endDate).toLocaleDateString()}
                                  </p>
                                </td>
                                <td className="py-4.5 px-6 font-black text-[#04045E] text-sm">
                                  ${contract.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-4.5 px-6">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                    contract.status === 'VIGENTE'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : contract.status === 'VENCIDO'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}>
                                    {contract.status}
                                  </span>
                                </td>
                                <td className="py-4.5 px-6 text-right">
                                  <div className="flex gap-2 justify-end">
                                    {contract.observations && (
                                      <button
                                        onClick={() => showToast(`Observación: ${contract.observations}`, 'success')}
                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg text-slate-600 transition-all"
                                        title="Ver Observaciones"
                                      >
                                        👁️
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleContractDelete(contract.id)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600 transition-all inline-flex items-center"
                                      title="Eliminar Contrato"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: FLUJO DE PAGOS */}
              {/* ========================================================================= */}
              {activeTab === 'payments' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top toolbar */}
                  <div className="flex justify-between items-center py-1">
                    <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Historial de Pagos Recibidos</h3>
                    
                    <button
                      onClick={() => setIsNewPaymentOpen(true)}
                      className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider transition-all transform active:scale-95 uppercase flex items-center gap-1.5 shadow-md"
                    >
                      <span>+ Registrar Pago</span>
                    </button>
                  </div>

                  {/* Form to Register Payment */}
                  {isNewPaymentOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-up">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Registrar Transacción de Alquiler</h4>
                        <button onClick={() => setIsNewPaymentOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contrato de Alquiler Asociado *</label>
                          <select
                            required
                            value={paymentForm.contractId}
                            onChange={(e) => setPaymentForm({ ...paymentForm, contractId: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          >
                            <option value="">-- Seleccionar contrato --</option>
                            {contracts.map((c) => (
                              <option key={c.id} value={c.id}>
                                Contrato #{c.id.substr(0,8)} - Inquilino: {c.tenant?.name || 'Inquilino'} (Renta: ${c.monthlyAmount.toLocaleString()} USD)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Monto Pagado (USD) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="1000.00"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Fecha de Pago *</label>
                          <input
                            type="date"
                            required
                            value={paymentForm.paymentDate}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Método de Pago *</label>
                          <select
                            required
                            value={paymentForm.paymentMethod}
                            onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          >
                            <option value="Transferencia">Transferencia Bancaria</option>
                            <option value="Depósito">Depósito en Cuenta</option>
                            <option value="Efectivo">Pago en Efectivo</option>
                            <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Referencia / Código de Operación</label>
                          <input
                            type="text"
                            placeholder="Ej: TRF-9023412"
                            value={paymentForm.reference}
                            onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewPaymentOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase tracking-wider transition-all"
                          >
                            Registrar Transacción
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Payments list table */}
                  {payments.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm text-center p-8 space-y-3">
                      <span className="text-3xl">💳</span>
                      <h3 className="text-sm font-bold text-[#04045E] uppercase">Sin Registro de Pagos</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        No hay transacciones registradas. Pulse "+ Registrar Pago" para añadir la primera.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-4 px-6">ID Pago</th>
                              <th className="py-4 px-6">Inmueble / Contrato</th>
                              <th className="py-4 px-6">Monto Recibido</th>
                              <th className="py-4 px-6">Fecha Pago</th>
                              <th className="py-4 px-6">Método de Pago</th>
                              <th className="py-4 px-6">Referencia Bancaria</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {payments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-4 px-6 font-mono font-bold text-slate-400">
                                  #{payment.id.substr(0, 12).toUpperCase()}
                                </td>
                                <td className="py-4 px-6">
                                  <p className="font-extrabold text-[#04045E] uppercase truncate max-w-[280px]">
                                    {payment.contract?.property?.title || 'Inmueble General'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Contrato Asociado: #{payment.contractId.substr(0, 8)}
                                  </p>
                                </td>
                                <td className="py-4 px-6">
                                  <p className="font-black text-emerald-600 text-sm">
                                    +${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </p>
                                </td>
                                <td className="py-4 px-6 font-medium">
                                  {new Date(payment.paymentDate).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="py-4 px-6">
                                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border rounded font-semibold text-[10px]">
                                    {payment.paymentMethod}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-mono text-[11px] text-slate-500">
                                  {payment.reference || '--'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: CONTROL DE GASTOS */}
              {/* ========================================================================= */}
              {activeTab === 'expenses' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top toolbar */}
                  <div className="flex justify-between items-center py-1">
                    <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Historial de Gastos Registrados</h3>
                    
                    <button
                      onClick={() => setIsNewExpenseOpen(true)}
                      className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-xs rounded-xl tracking-wider transition-all transform active:scale-95 uppercase flex items-center gap-1.5 shadow-md"
                    >
                      <span>+ Registrar Gasto</span>
                    </button>
                  </div>

                  {/* Form to Register Expense */}
                  {isNewExpenseOpen && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4 animate-scale-up">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-[#04045E]">Registrar Egreso / Gasto Operativo</h4>
                        <button onClick={() => setIsNewExpenseOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                      </div>

                      <form onSubmit={handleExpenseSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Concepto del Gasto *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Mantenimiento eléctrico, pago de impuestos, etc."
                            value={expenseForm.concept}
                            onChange={(e) => setExpenseForm({ ...expenseForm, concept: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Monto del Gasto (USD) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="150.00"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Fecha del Egreso *</label>
                          <input
                            type="date"
                            required
                            value={expenseForm.date}
                            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#04045E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Inmueble Asociado (Opcional)</label>
                          <select
                            value={expenseForm.propertyId}
                            onChange={(e) => setExpenseForm({ ...expenseForm, propertyId: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="">-- No asociar a un inmueble (Gasto general) --</option>
                            {properties.map((p) => (
                              <option key={p.id} value={p.id}>
                                [{p.type.toUpperCase()}] {p.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Categoría del Gasto *</label>
                          <select
                            required
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                            className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 rounded-xl p-3 focus:outline-none"
                          >
                            <option value="Mantenimiento">Mantenimiento y Reparación</option>
                            <option value="Impuestos">Impuestos Municipales / Tasas</option>
                            <option value="Administración">Honorarios y Administración</option>
                            <option value="Seguros">Seguros de Inmuebles</option>
                            <option value="Servicios">Servicios Básicos (Agua, Luz, Gas)</option>
                            <option value="Otros">Otros egresos</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsNewExpenseOpen(false)}
                            className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg uppercase tracking-wider transition-all border"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black rounded-lg uppercase tracking-wider transition-all"
                          >
                            Guardar Gasto
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Expenses list table */}
                  {expenses.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm text-center p-8 space-y-3">
                      <span className="text-3xl">💸</span>
                      <h3 className="text-sm font-bold text-[#04045E] uppercase">Sin Registro de Gastos</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        No hay gastos cargados en el sistema corporativo. Pulse "+ Registrar Gasto" para añadir uno.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                              <th className="py-4 px-6">ID Egreso</th>
                              <th className="py-4 px-6">Concepto Técnico</th>
                              <th className="py-4 px-6">Monto</th>
                              <th className="py-4 px-6">Fecha Registro</th>
                              <th className="py-4 px-6">Categoría</th>
                              <th className="py-4 px-6">Inmueble Vinculado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {expenses.map((expense) => (
                              <tr key={expense.id} className="hover:bg-slate-50/50 transition-all">
                                <td className="py-4 px-6 font-mono font-bold text-slate-400">
                                  #{expense.id.substr(0, 12).toUpperCase()}
                                </td>
                                <td className="py-4 px-6 font-bold text-slate-800">
                                  {expense.concept}
                                </td>
                                <td className="py-4 px-6">
                                  <p className="font-black text-rose-600 text-sm">
                                    -${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                                  </p>
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-600">
                                  {new Date(expense.date).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </td>
                                <td className="py-4 px-6">
                                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[10px] font-black uppercase">
                                    {expense.category}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-500">
                                  {expense.property?.title ? (
                                    <span className="uppercase text-[11px] font-extrabold text-[#04045E] truncate max-w-[180px] block" title={expense.property.title}>
                                      {expense.property.title}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Gasto General</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB: REPORTES */}
              {/* ========================================================================= */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rentabilidad Promedio</span>
                      <h3 className="text-3xl font-black text-emerald-600">8.4% anual</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Retorno de inversión (ROI)</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periodo Promedio Contrato</span>
                      <h3 className="text-3xl font-black text-[#04045E]">12.5 meses</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duración de arrendamientos</p>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingreso por Metro Cuadrado</span>
                      <h3 className="text-3xl font-black text-indigo-600">$8.50 / m²</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Promedio nacional de arriendo</p>
                    </div>
                  </div>

                  {/* Actions for exports */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                      <h4 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Consolidados Comerciales sBienes</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Exporte estados de cuenta para auditorías y propietarios</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <button
                        onClick={() => triggerExport('excel', 'Balance_General')}
                        className="p-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center justify-between group active:scale-[0.99]"
                      >
                        <div className="text-left space-y-1">
                          <h5 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Exportar en Excel (.xlsx)</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contratos, Pagos y Conciliaciones bancarias</p>
                        </div>
                        <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                      </button>

                      <button
                        onClick={() => triggerExport('pdf', 'Estado_Ocupacion')}
                        className="p-5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center justify-between group active:scale-[0.99]"
                      >
                        <div className="text-left space-y-1">
                          <h5 className="text-xs font-black text-rose-700 uppercase tracking-wider">Exportar en PDF (.pdf)</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Reporte visual de ocupación de inmuebles</p>
                        </div>
                        <span className="text-2xl group-hover:scale-110 transition-transform">📕</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Revision observation modal */}
        {isObserveModalOpen && selectedProperty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-xl animate-scale-up">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-heading font-black text-xs uppercase tracking-wider text-[#04045E]">
                  Observar Solicitud de Publicación
                </h3>
                <button onClick={() => setIsObserveModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
              </div>

              <form onSubmit={handleObserveSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inmueble Seleccionado</span>
                  <p className="text-xs font-black text-[#04045E] uppercase truncate">{selectedProperty.title}</p>
                  <p className="text-[10px] text-slate-400">Por {selectedProperty.ownerName || 'Propietario Legítimo'}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Comentario Técnico de Observación *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detalle los motivos específicos de la observación (ej: 'Falta Folio Real escaneado de forma legible.')"
                    value={observationNotes}
                    onChange={(e) => setObservationNotes(e.target.value)}
                    className="w-full bg-slate-50 text-xs text-[#04045E] border border-slate-200 focus:border-[#04045E] rounded-xl p-3 focus:outline-none transition-all placeholder:text-slate-400 resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsObserveModalOpen(false)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#04045E] hover:bg-indigo-900 text-white font-black text-[10px] rounded-lg uppercase tracking-wider transition-all shadow-md"
                  >
                    Confirmar Observación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg ${
                toast.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span className="text-sm">{toast.type === 'success' ? '🏆' : '⚠️'}</span>
              <span className="text-xs font-black uppercase tracking-tight">{toast.message}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 shrink-0 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-center sm:text-left">
              © 2026 sBienes • Sistema de Gestión Inmobiliaria Unificado • Propio
            </p>
            <div className="flex gap-4 text-[10px] font-black text-[#04045E] uppercase tracking-wider">
              <span className="cursor-pointer hover:underline">Soporte Técnico</span>
              <span className="text-slate-300">|</span>
              <span className="cursor-pointer hover:underline">Manual Corporativo</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
