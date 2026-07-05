'use client';

/**
 * /propietario/dashboard
 *
 * Dashboard principal del Propietario.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesService } from '../../../services/properties.service';
import { Property } from '../../../components/modules/properties/PropertyCard';
import { getCurrentUser, getToken } from '@/utils/session';
import { WHATSAPP_LINK } from '@/utils/whatsapp';
import PropertyFormFields, { ATTRIBUTES_BY_CATEGORY } from '../../../components/modules/properties/PropertyFormFields';

const PLANS = [
  {
    id: 'basico',
    name: 'PLAN GRATUITO',
    priceLabel: 'Gratis /MES',
    period: '',
    highlight: false,
    badge: '',
    badgeDark: false,
    features: [
      { text: '1 publicación activa', included: true },
      { text: 'Fotos básicas (hasta 5)', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
    ],
  },
  {
    id: 'contenidos',
    name: 'PLAN CONTENIDOS',
    priceLabel: '', // Will be rendered dynamically from planPrices.contenidos
    period: '',
    highlight: false,
    badge: 'MAS RECOMENDADO PARA RENTAS',
    badgeDark: false,
    features: [
      { text: '1 propiedad', included: true },
      { text: 'Fotos + Video optimizado', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Mapa interactivo con radar', included: true },
      { text: 'Alquiler de letrero físico', included: true },
    ],
  },
  {
    id: 'venta_pro',
    name: 'PLAN VENTA PRO',
    priceLabel: '', // Will be rendered dynamically from planPrices.venta_pro
    period: '',
    highlight: true,
    badge: 'MAS RECOMENDADO PARA VENTA',
    badgeDark: false,
    features: [
      { text: '1 propiedad', included: true },
      { text: 'Dron + Fotos Profesionales', included: true },
      { text: 'Sello Oro + Mapa Premium', included: true },
      { text: 'Alquiler de letrero físico', included: true },
      { text: 'Estadísticas Avanzadas de Visitas', included: true },
      { text: 'PUBLICIDAD PRIORITARIA', included: true },
    ],
  },
  {
    id: 'cierre_garantizado',
    name: 'CIERRE GARANTIZADO',
    priceLabel: '', // Will be rendered dynamically from planPrices.cierre_garantizado
    period: '',
    highlight: false,
    badge: 'TODO INCLUIDO',
    badgeDark: true,
    features: [
      { text: 'Gestión completa por Agente Experto', included: true },
      { text: 'Visitas y Negociación delegadas', included: true },
      { text: 'Alquiler de letrero físico', included: true },
      { text: 'Auditoría Legal y Notarial', included: true },
    ],
  },
];

export default function PropietarioDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('owner');

  // Paginación y Rol
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const [commissionRate, setCommissionRate] = useState(1.5);

  const [planPrices, setPlanPrices] = useState({
    gratis: 0,
    contenidos: 69,
    venta_pro: 199,
    cierre_garantizado: 1.5
  });

  useEffect(() => {
    // 1. Intentar cargar desde localStorage para rapidez
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_global_plan_prices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setPlanPrices(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    
    // 2. Fetch fresco desde la API
    const fetchFreshPrices = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBaseUrl}/marketing-plans`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        if (res.ok) {
          const data = await res.json();
          const pricesMap: any = {};
          data.forEach((p: any) => {
            const numPrice = parseFloat(p.price);
            if (!isNaN(numPrice)) {
              if (p.id === 'plan-gratis' || p.id === 'basico') pricesMap.gratis = numPrice;
              else if (p.id === 'plan-contenidos' || p.id === 'contenidos') pricesMap.contenidos = numPrice;
              else if (p.id === 'plan-venta-pro' || p.id === 'venta_pro') pricesMap.venta_pro = numPrice;
              else if (p.id === 'plan-cierre-garantizado' || p.id === 'cierre_garantizado') pricesMap.cierre_garantizado = numPrice;
            }
          });
          setPlanPrices(prev => {
            const updated = { ...prev, ...pricesMap };
            if (typeof window !== 'undefined') {
              localStorage.setItem('propio_global_plan_prices', JSON.stringify(updated));
            }
            return updated;
          });
        }
      } catch (err) {
        console.error('Error fetching dynamic plan prices:', err);
      }
    };
    fetchFreshPrices();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeAnnRaw = localStorage.getItem('propio_active_announcement');
      if (activeAnnRaw) {
        try {
          const ann = JSON.parse(activeAnnRaw);
          const sec = ann.secciones?.find((s: any) => s.titulo.toLowerCase().includes('comisión') || s.titulo.toLowerCase().includes('comision') || s.titulo.toLowerCase().includes('comisión base'));
          if (sec && sec.vinetas && sec.vinetas[0]) {
            const match = sec.vinetas[0].match(/(\d+(\.\d+)?)\s*%/);
            if (match && match[1]) {
              setCommissionRate(parseFloat(match[1]));
            }
          }
        } catch (e) {
          console.error('Error parsing active announcement for commission rate:', e);
        }
      }
    }
  }, []);

  // Estados del modal de edición
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCurrency, setEditCurrency] = useState('BOB');
  const [editPriceBOB, setEditPriceBOB] = useState('');
  const [editPriceUSD, setEditPriceUSD] = useState('');
  const [editExchangeRate, setEditExchangeRate] = useState('9.76');
  const [editLandArea, setEditLandArea] = useState('');
  const [editBuiltArea, setEditBuiltArea] = useState('');
  const [editZona, setEditZona] = useState('');
  const [editAttributes, setEditAttributes] = useState<Record<string, boolean>>({});
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editDocuments, setEditDocuments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const packagedFormData = {
    title: editTitle,
    description: editDescription,
    currency: editCurrency,
    exchangeRate: editExchangeRate,
    priceBOB: editPriceBOB,
    priceUSD: editPriceUSD,
    minPrice: editingProperty?.minPrice ? String(editingProperty.minPrice) : '',
    offerType: editingProperty?.offerType || 'VENTA',
    type: editingProperty?.type || 'DEPARTAMENTO',
    landArea: editLandArea,
    builtArea: editBuiltArea,
    rooms: editingProperty?.rooms ? String(editingProperty.rooms) : '3',
    bathrooms: editingProperty?.bathrooms ? String(editingProperty.bathrooms) : '2',
    location: editingProperty?.location || 'Cochabamba',
    zona: editZona,
    address: editingProperty?.address || '',
    latitude: editingProperty?.latitude || -17.3895,
    longitude: editingProperty?.longitude || -66.1568,
  };

  const handleFormFieldsChange = (updates: Partial<typeof packagedFormData>) => {
    if (updates.title !== undefined) setEditTitle(updates.title);
    if (updates.description !== undefined) setEditDescription(updates.description);
    if (updates.currency !== undefined) setEditCurrency(updates.currency);
    if (updates.exchangeRate !== undefined) setEditExchangeRate(String(updates.exchangeRate));
    if (updates.priceBOB !== undefined) setEditPriceBOB(String(updates.priceBOB));
    if (updates.priceUSD !== undefined) setEditPriceUSD(String(updates.priceUSD));
    if (updates.landArea !== undefined) setEditLandArea(String(updates.landArea));
    if (updates.builtArea !== undefined) setEditBuiltArea(String(updates.builtArea));
    if (updates.zona !== undefined) setEditZona(updates.zona);
    
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        ...updates
      } as any);
    }
  };

  const documentsChecklist = {
    hasFolioReal: !!editingProperty?.hasFolioReal,
    hasCatastro: !!editingProperty?.hasCatastro,
    hasTestimonio: !!editingProperty?.hasTestimonio,
    hasImpuestosAlDia: !!editingProperty?.hasImpuestosAlDia,
    hasPlanoUsoSuelo: !!editingProperty?.hasPlanoUsoSuelo,
    hasCI: !!editingProperty?.hasCI,
  };

  const handleUpdateDocuments = (updates: Partial<typeof documentsChecklist>) => {
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        ...updates
      });
    }
  };

  const loadProperties = async (targetPage: number, append = false) => {
    const token = getToken();
    if (!token) return;
    try {
      if (append) {
        setIsMoreLoading(true);
      } else {
        setLoading(true);
      }
      
      // 1. Obtener del backend de la API (si corresponde)
      let backendProps: any[] = [];
      try {
        const res = await propertiesService.getOwnerProperties(token, targetPage, 6);
        backendProps = res.data || [];
      } catch (_) {}

      // 2. Obtener de la API central local (db.json)
      let localCreated: any[] = [];
      try {
        const localPropsRes = await fetch('/api/local/properties').then(r => r.json());
        localCreated = localPropsRes?.properties || [];
      } catch (err) {
        console.warn('Error fetching local properties from central DB:', err);
        // Fallback a localStorage
        try {
          const raw = localStorage.getItem('propio_custom_created_properties');
          if (raw) {
            localCreated = JSON.parse(raw) || [];
          }
        } catch (_) {}
      }

      // Filtrar de forma estricta por el id del propietario actual y excluir eliminadas
      const currentUser = getCurrentUser();
      const currentOwnerId = currentUser?.userId || currentUser?.name || currentUser?.email?.split('@')[0] || 'owner';
      const filteredLocal = localCreated.filter((p: any) => 
        p && p.ownerId === currentOwnerId && p.status !== 'borrada_por_propietario'
      );

      // Combinar los datos
      const combined = [...filteredLocal, ...backendProps].filter(p => p.status !== 'borrada_por_propietario');
      
      // Eliminar duplicados
      const uniqueMap = new Map();
      combined.forEach(p => {
        if (p && p.id) {
          uniqueMap.set(p.id, p);
        }
      });
      const uniqueProps = Array.from(uniqueMap.values());

      if (append) {
        setProperties(prev => {
          const unique = new Map();
          [...prev, ...uniqueProps].forEach(p => unique.set(p.id, p));
          return Array.from(unique.values());
        });
      } else {
        setProperties(uniqueProps);
      }
      setHasNextPage(false);
      setPage(targetPage);
    } catch (error) {
      console.error('Error al cargar propiedades del propietario:', error);
    } finally {
      setLoading(false);
      setIsMoreLoading(false);
    }
  };

  // Hook de montaje obligatorio para forzar re-hidratación en el ciclo de vida inicial
  useEffect(() => {
    const rehydrateFromCentralDb = async () => {
      try {
        const res = await fetch('/api/local/properties');
        if (!res.ok) return;
        const data = await res.json();
        const centralProps = data?.properties || [];
        
        const currentUser = getCurrentUser();
        const currentOwnerId = currentUser?.userId || currentUser?.name || currentUser?.email?.split('@')[0] || 'owner';
        
        // Filtrar de forma estricta por el id del propietario actual y excluir eliminadas
        const ownerProps = centralProps.filter((p: any) => 
          p && p.ownerId === currentOwnerId && p.status !== 'borrada_por_propietario'
        );
        
        setProperties(ownerProps);
      } catch (err) {
        console.error('[Lifecycle] Error re-hydrating dashboard from central DB:', err);
      } finally {
        setLoading(false);
      }
    };
    rehydrateFromCentralDb();
  }, []);

  useEffect(() => {
    // Guard de autenticación
    const user = getCurrentUser();
    if (!user) {
      const timer = setTimeout(() => {
        if (!getCurrentUser()) {
          router.replace('/login?redirect=/propietario/dashboard');
        } else {
          const u = getCurrentUser();
          if (u) {
            setUserName((u as any).name || (u as any).email?.split('@')[0] || 'owner');
            setUserRole(u.role);
            loadProperties(1, false);
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
    if (user.role !== 'PROPIETARIO' && user.role !== 'ADMIN') {
      router.replace('/');
      return;
    }
    setUserName((user as any).name || (user as any).email?.split('@')[0] || 'owner');
    setUserRole(user.role);

    loadProperties(1, false);
  }, [router]);

  const handleLoadMore = () => {
    loadProperties(page + 1, true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');
      router.replace('/');
    }
  };

  const handleStopPublishing = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas retirar y dejar de publicar este anuncio? Se ocultará del catálogo público de inmediato.')) {
      return;
    }
    try {
      const token = localStorage.getItem('propio_token') || '';
      await propertiesService.deleteProperty(id, token).catch(() => {});

      // Persistir soft-delete si es una propiedad personalizada del usuario
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('propio_custom_created_properties');
        if (raw) {
          try {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const updatedList = list.map(p => 
                p.id === id ? { ...p, status: 'borrada_por_propietario' } : p
              );
              localStorage.setItem('propio_custom_created_properties', JSON.stringify(updatedList));
            }
          } catch (_) {}
        }
      }

      setProperties(prev => prev.filter(p => p.id !== id));
      alert('Anuncio retirado del catálogo público con éxito.');
    } catch (error) {
      console.error('Error al dejar de publicar:', error);
      alert('Ocurrió un error al retirar el anuncio.');
    }
  };

  const parseDescription = (desc: string) => {
    const landMatch = desc.match(/Superficie Terreno:\s*(\d+)/);
    const builtMatch = desc.match(/Superficie Construida:\s*(\d+)/);
    const zonaMatch = desc.match(/Zona:\s*([^\n]+)/);
    const attrsMatch = desc.match(/Atributos:\s*([^\n]+)/);

    const landArea = landMatch ? landMatch[1] : '';
    const builtArea = builtMatch ? builtMatch[1] : '';
    const zona = zonaMatch ? zonaMatch[1] : '';
    const attrsList = attrsMatch ? attrsMatch[1].split(',').map(s => s.trim()) : [];

    // Limpiar descripción original
    const cleanDesc = desc
      .replace(/Atributos: [^\n]+/g, '')
      .replace(/Superficie Terreno: [^\n]+/g, '')
      .replace(/Superficie Construida: [^\n]+/g, '')
      .replace(/Zona: [^\n]+/g, '')
      .trim();

    return { landArea, builtArea, zona, cleanDesc, attrsList };
  };

  const handleStartEdit = (prop: any) => {
    const parsed = parseDescription(prop.description || '');
    const attrsMap: Record<string, boolean> = {};
    parsed.attrsList.forEach(a => {
      attrsMap[a] = true;
    });

    setEditingProperty(prop);
    setEditTitle(prop.title || '');
    setEditDescription(parsed.cleanDesc || '');
    setEditCurrency(prop.currency || 'BOB');
    setEditPriceBOB(String(prop.priceBob || (prop.price * 9.76)));
    setEditPriceUSD(String(prop.price || (prop.priceBob / 9.76)));
    setEditExchangeRate('9.76');
    setEditLandArea(parsed.landArea);
    setEditBuiltArea(parsed.builtArea);
    setEditZona(parsed.zona);
    setEditAttributes(attrsMap);
    setEditImages(prop.imageUrl ? [prop.imageUrl] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80']);
    setEditDocuments(prop.documents || []);
  };

  const handlePriceChange = (val: string, type: 'BOB' | 'USD' | 'RATE' | 'CURRENCY') => {
    const rate = parseFloat(editExchangeRate) || 9.76;
    if (type === 'BOB') {
      setEditPriceBOB(val);
      setEditPriceUSD(val ? (parseFloat(val) / rate).toFixed(2) : '');
    } else if (type === 'USD') {
      setEditPriceUSD(val);
      setEditPriceBOB(val ? (parseFloat(val) * rate).toFixed(2) : '');
    } else if (type === 'RATE') {
      setEditExchangeRate(val);
      const rateNum = parseFloat(val) || 9.76;
      if (editCurrency === 'USD' && editPriceUSD) {
        setEditPriceBOB((parseFloat(editPriceUSD) * rateNum).toFixed(2));
      }
    } else if (type === 'CURRENCY') {
      setEditCurrency(val);
    }
  };

  const toggleAttribute = (attr: string) => {
    setEditAttributes(prev => ({
      ...prev,
      [attr]: !prev[attr]
    }));
  };

  const handleAddImage = () => {
    const newImg = prompt('Ingresa la URL de la nueva fotografía:');
    if (newImg && newImg.startsWith('http')) {
      setEditImages(prev => [...prev, newImg]);
    } else if (newImg) {
      alert('Por favor ingresa una URL válida que empiece con http/https');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProperty || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato no soportado. Por favor sube archivos PDF, Word (.doc/.docx) o imágenes (JPG/PNG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el tamaño máximo de 10 MB.');
      return;
    }

    try {
      setIsUploadingDoc(true);
      const token = localStorage.getItem('propio_token') || '';
      const doc = await propertiesService.uploadPropertyDocument(editingProperty.id, file, token);
      setEditDocuments(prev => [...prev, doc]);
      
      setProperties(prev =>
        prev.map(p =>
          p.id === editingProperty.id
            ? { ...p, documents: [...(p.documents || []), doc] }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(`Error al subir el archivo: ${err.message || 'Error de red'}`);
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!editingProperty) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      const token = localStorage.getItem('propio_token') || '';
      await propertiesService.deletePropertyDocument(docId, token);
      setEditDocuments(prev => prev.filter(d => d.id !== docId));
      
      setProperties(prev =>
        prev.map(p =>
          p.id === editingProperty.id
            ? { ...p, documents: (p.documents || []).filter((d: any) => d.id !== docId) }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al eliminar el documento.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    setIsSavingEdit(true);

    try {
      const activeAttrs = Object.keys(editAttributes).filter(k => editAttributes[k]);
      const attrsText = activeAttrs.length > 0 ? `\n\nAtributos: ${activeAttrs.join(', ')}` : '';
      const areaText = `\nSuperficie Terreno: ${editLandArea || 0} m²\nSuperficie Construida: ${editBuiltArea || 0} m²`;
      const zonaText = editZona ? `\nZona: ${editZona}` : '';

      const updatedFields = {
        title: editTitle,
        description: editDescription + attrsText + areaText + zonaText,
        price: parseFloat(editPriceUSD) || 0,
        currency: editCurrency,
        area: parseFloat(editBuiltArea) || parseFloat(editLandArea) || 0,
        imageUrl: editImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        rooms: editingProperty.rooms ? parseInt(editingProperty.rooms) : 3,
        bathrooms: editingProperty.bathrooms ? parseInt(editingProperty.bathrooms) : 2,
        location: editingProperty.location,
        address: editingProperty.address,
        offerType: editingProperty.offerType,
        type: editingProperty.type,
        latitude: parseFloat(editingProperty.latitude as any) || -17.3895,
        longitude: parseFloat(editingProperty.longitude as any) || -66.1568,
        hasFolioReal: !!editingProperty.hasFolioReal,
        hasCatastro: !!editingProperty.hasCatastro,
        hasTestimonio: !!editingProperty.hasTestimonio,
        hasImpuestosAlDia: !!editingProperty.hasImpuestosAlDia,
        hasPlanoUsoSuelo: !!editingProperty.hasPlanoUsoSuelo,
        hasCI: !!editingProperty.hasCI,
        minPrice: editingProperty.minPrice ? parseFloat(editingProperty.minPrice as any) : null,
        status: 'pendiente', // Bloqueo de auto-publicación: degradar a pendiente al editar
        verified: false,
        isVerified: false,
        documentsList: editingProperty.documentsList || [],
        documents: editingProperty.documents || []
      };

      const token = localStorage.getItem('propio_token') || '';
      await propertiesService.updateProperty(editingProperty.id, updatedFields, token);

      // Persistir el cambio y estado degradado en propio_custom_created_properties
      try {
        const raw = localStorage.getItem('propio_custom_created_properties');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const updatedList = list.map(p => 
              p.id === editingProperty.id ? { ...p, ...updatedFields } : p
            );
            localStorage.setItem('propio_custom_created_properties', JSON.stringify(updatedList));
          }
        }
      } catch (_) {}

      // Modificar en la lista local para reflejar el cambio de inmediato
      setProperties(prev =>
        prev.map(p =>
          p.id === editingProperty.id
            ? { ...p, ...updatedFields }
            : p
        )
      );

      setEditingProperty(null);
      alert('Anuncio actualizado con éxito. Pasará a revisión del administrador.');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar los cambios.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const pendingDocs = (properties || []).filter((p) => p && !p.verified).length || 0;
  const verified = (properties || []).filter((p) => p && p.verified).length || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans antialiased">

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 space-y-10">

        {/* ENCABEZADO BIENVENIDA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#04045E]/60">
              Portal del Propietario
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] tracking-tight">
              Bienvenido, {userName === 'Propietario' ? 'owner' : userName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Gestiona tus propiedades, revisa solicitudes de clientes y publica nuevos inmuebles
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <Link
              href="/propietario/nuevo"
              className="inline-flex items-center gap-2 px-5 py-2.5 !bg-[#D4FF00] hover:!bg-[#c2eb00] !text-slate-900 font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              + Publicar Inmueble
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Salir
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOTAL INMUEBLES</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#04045E]">{(properties || []).length || 0}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border font-bold uppercase">ACTIVOS</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SELLO ORO</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">{verified}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase">VERIFICADOS</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">EN VALIDACIÓN</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-500">{pendingDocs}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase">PENDIENTES</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LEADS INTERESADOS</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-indigo-600">{((properties || []).length || 0) * 3}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase">POTENCIALES</span>
            </div>
          </div>
        </div>

        {/* LISTADO DE PROPIEDADES */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
              Mis Propiedades Publicadas
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              {properties.length} inmueble{properties.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  Cargando propiedades...
                </p>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4">
              <span className="text-4xl">🏡</span>
              <div className="space-y-1">
                <h3 className="font-black text-[#04045E] text-sm uppercase">Aún no tienes propiedades publicadas</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Registra tu primer inmueble para conectar con miles de compradores sin intermediarios.
                </p>
              </div>
              <Link
                href="/propietario/nuevo"
                className="px-5 py-2 bg-[#04045E] hover:bg-[#04045E]/90 text-white text-xs font-black uppercase rounded-xl tracking-wider transition-all"
              >
                Publicar mi primera propiedad
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property: any) => (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200"
                >
                  <div className="relative h-48 w-full bg-slate-100">
                    <img
                      src={property.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.status === 'APROBADO' && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        ✨ APROBADO
                      </span>
                    )}
                    {property.status === 'RECHAZADO' && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        ❌ RECHAZADO
                      </span>
                    )}
                    {property.status === 'OBSERVADO' && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        ⚠️ OBSERVADO
                      </span>
                    )}
                    {(!property.status || property.status === 'PENDIENTE' || property.status === 'NUEVA_PUBLICACION') && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        ⏳ PENDIENTE
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          {property.type}
                        </span>
                        <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          {property.area} m²
                        </span>
                      </div>
                      <h3 className="text-sm font-sans font-black text-[#04045E] tracking-tight leading-snug">
                        {property.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-2">
                        {property.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Precio</p>
                        <p className="text-base font-black text-[#04045E]">
                          {(property.priceBob || (property.price * 9.76)).toLocaleString('es-BO')} Bs.
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                            (~ USD {Math.round((property.price || property.priceBob || 0) / 9.76).toLocaleString()})
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1.5 bg-[#b9fa3c] text-[#04045E] hover:bg-opacity-95 text-[11px] font-black uppercase rounded-xl transition-all"
                          onClick={() => handleStartEdit(property)}
                        >
                          Editar Anuncio
                        </button>
                        <button
                          className="px-3 py-1.5 !bg-red-50 hover:!bg-red-100 border border-red-200 text-[11px] font-bold !text-red-600 rounded-xl transition-all"
                          onClick={() => handleStopPublishing(property.id)}
                        >
                          DEJAR DE PUBLICAR
                        </button>
                        <button
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-650 rounded-xl transition-all"
                          onClick={() => alert(`Leads de interés para: ${property.title}`)}
                        >
                          Ver Leads
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={isMoreLoading}
                  className="px-6 py-3 bg-[#b9fa3c] text-[#04045E] hover:brightness-95 hover:scale-[1.02] active:scale-95 text-xs font-black uppercase rounded-xl transition-all disabled:opacity-50"
                >
                  {isMoreLoading ? 'Cargando...' : 'Cargar más inmuebles 🔄'}
                </button>
              </div>
            )}
          </>
        )}
        </div>

        {/* SECCIÓN DE MONETIZACIÓN: PLANES DE SUSCRIPCIÓN */}
        {userRole === 'PROPIETARIO' && (
          <section className="pt-16 border-t border-slate-200 mt-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-[#04045E] uppercase tracking-wide">
              Elige tu plan ideal
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-lg mx-auto">
              Contrata un plan de difusión para obtener el Sello Oro, posicionamiento destacado en el mapa y mayor número de publicaciones activas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {PLANS.map((plan) => {
              const isCierre = plan.id === 'cierre_garantizado';
              const isHighlighted = plan.id === 'contenidos' || plan.id === 'venta_pro';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 bg-white ${
                    isCierre
                      ? 'border-2 border-[#04045E] shadow-md'
                      : isHighlighted
                        ? 'border-2 border-[#b9fa3c] shadow-xl' + (plan.id === 'venta_pro' ? ' scale-[1.02] z-10' : '')
                        : 'border border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Badge flotante */}
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                      plan.badgeDark
                        ? 'bg-[#04045E] text-white'
                        : 'bg-[#b9fa3c] text-[#04045E]'
                    }`}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between space-y-6 mt-2">
                    <div>
                      <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide mb-2">
                        {plan.name}
                      </h3>

                      <div className="mb-4">
                        <span className={`font-black text-[#04045E] leading-tight ${
                          isCierre ? 'text-sm' : 'text-2xl'
                        }`}>
                          {isCierre
                            ? `Comisión: ${planPrices.cierre_garantizado}% DEL VALOR DE VENTA (TODO INCLUIDO)`
                            : plan.id === 'basico'
                              ? 'Gratis /MES'
                              : plan.id === 'contenidos'
                                ? `Bs. ${planPrices.contenidos} /MES`
                                : plan.id === 'venta_pro'
                                  ? `Bs. ${planPrices.venta_pro} /MES`
                                  : plan.priceLabel}
                        </span>
                      </div>

                      <ul className="space-y-2 pt-3 border-t border-slate-100">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-[10px] text-slate-800 font-semibold">
                            <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[8px] bg-emerald-50 text-emerald-600 font-bold">
                              ✓
                            </span>
                            {f.text}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => { window.open(WHATSAPP_LINK, '_blank'); }}
                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 shadow-sm ${
                          plan.id === 'basico'
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : isCierre
                              ? 'bg-[#04045E] text-white hover:bg-[#04045E]/90'
                              : 'bg-[#b9fa3c] text-[#04045E] hover:brightness-95'
                        }`}
                      >
                        {plan.id === 'basico'
                          ? 'COMENZAR GRATIS'
                          : isCierre
                            ? 'CONTRATAR CIERRE GARANTIZADO'
                            : 'CONTRATAR PLAN'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        )}

      </main>

      {/* MODAL DE EDICIÓN FLUIDO Y COMPLETO */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 bg-[#04045E]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-sans font-black text-[#04045E] uppercase">Editar Anuncio Activo</h2>
              <button 
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="overflow-y-auto max-h-[65vh] pr-2 space-y-6">
                <PropertyFormFields
                  formData={packagedFormData}
                  onChange={handleFormFieldsChange}
                  selectedAttributes={editAttributes}
                  onToggleAttribute={toggleAttribute}
                  documents={documentsChecklist}
                  onUpdateDocuments={handleUpdateDocuments}
                  isEditMode={true}
                  uploadedDocuments={editDocuments}
                  onUploadDocument={handleUploadDocument}
                  onDeleteDocument={handleDeleteDocument}
                  isUploadingDoc={isUploadingDoc}
                  images={editImages}
                  onAddImage={handleAddImage}
                  onRemoveImage={handleRemoveImage}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-250 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-[#b9fa3c] hover:bg-opacity-90 text-[#04045E] font-bold rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-2"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios 🚀'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
