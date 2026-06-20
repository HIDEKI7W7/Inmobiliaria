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
import { getCurrentUser } from '@/utils/session';

const ATTRIBUTES_BY_CATEGORY = {
  Interiores: ['Aire Acondicionado', 'Calefacción', 'Cocina Equipada', 'Roperos Empotrados', 'Amoblado', 'Termotanque', 'Suite Master', 'Dependencias de Servicio'],
  Exteriores: ['Jardín', 'Churrasquera/Parrillero', 'Terraza', 'Balcón', 'Patio', 'Piscina Privada'],
  Parqueos: ['Parqueo Techado', 'Parqueo de Visitas', 'Garaje con Portón Eléctrico', 'Baulera'],
  Seguridad: ['Seguridad 24/7', 'Cerco Eléctrico', 'Cámaras de Vigilancia', 'Alarma', 'Conserjería'],
  'Áreas Comunes': ['Salón de Eventos', 'Gimnasio', 'Piscina Común', 'Canchas Deportivas', 'Parque Infantil', 'Sauna'],
  Sostenibilidad: ['Calefón Solar', 'Paneles Solares', 'Iluminación LED', 'Sistema de Reciclaje de Agua']
};

const PLANS = [
  {
    id: 'basico',
    name: 'Plan Básico',
    price: 0,
    period: 'gratis',
    highlight: false,
    features: [
      { text: '1 publicación activa', included: true },
      { text: 'Fotos básicas (hasta 5)', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Verificación legal documental', included: false },
      { text: 'Posicionamiento destacado', included: false },
    ],
  },
  {
    id: 'estandar',
    name: 'Plan Estándar',
    price: 250,
    period: 'mes',
    highlight: false,
    features: [
      { text: '3 publicaciones activas', included: true },
      { text: 'Fotos y video estándar', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Sello de verificación documental', included: true },
      { text: 'Posicionamiento destacado', included: false },
    ],
  },
  {
    id: 'profesional',
    name: 'Plan Profesional',
    price: 490,
    period: 'mes',
    highlight: true,
    badge: 'Recomendado',
    features: [
      { text: '10 publicaciones activas', included: true },
      { text: 'Fotos HD + video premium', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Sello de verificación Sello Oro', included: true },
      { text: 'Posicionamiento destacado en mapa', included: true },
    ],
  },
  {
    id: 'elite',
    name: 'Plan Elite',
    price: 990,
    period: 'mes',
    highlight: false,
    badge: 'Todo incluido',
    features: [
      { text: 'Publicaciones ilimitadas', included: true },
      { text: 'Fotos, video + tour virtual 360°', included: true },
      { text: 'Contacto prioritario directo', included: true },
      { text: 'Sello de verificación Sello Oro', included: true },
      { text: 'Campañas de Marketing dedicadas', included: true },
    ],
  },
];

export default function PropietarioDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('owner');

  // Estados del modal de edición
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCurrency, setEditCurrency] = useState('BOB');
  const [editPriceBOB, setEditPriceBOB] = useState('');
  const [editPriceUSD, setEditPriceUSD] = useState('');
  const [editExchangeRate, setEditExchangeRate] = useState('6.96');
  const [editLandArea, setEditLandArea] = useState('');
  const [editBuiltArea, setEditBuiltArea] = useState('');
  const [editZona, setEditZona] = useState('');
  const [editAttributes, setEditAttributes] = useState<Record<string, boolean>>({});
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    // Guard de autenticación
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login?redirect=/propietario/dashboard');
      return;
    }
    if (user.role !== 'PROPIETARIO' && user.role !== 'ADMIN') {
      router.replace('/');
      return;
    }
    setUserName((user as any).name || (user as any).email?.split('@')[0] || 'owner');

    // Cargar propiedades
    const loadProperties = async () => {
      try {
        setLoading(true);
        const allProperties = await propertiesService.getProperties({ verifiedOnly: false });
        const ownerProperties = allProperties.filter(
          (p: any) =>
            p.ownerId === user.userId ||
            (user.userId === 'owner-1' &&
              (p.ownerId === 'owner-1' || p.id === '1' || p.id === '4' || String(p.id).startsWith('prop-')))
        );
        setProperties(ownerProperties);
      } catch (error) {
        console.error('Error al cargar propiedades del propietario:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [router]);

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
      await propertiesService.deleteProperty(id, token);
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
    setEditPriceBOB(String(prop.priceBob || (prop.price * 6.96)));
    setEditPriceUSD(String(prop.price || (prop.priceBob / 6.96)));
    setEditExchangeRate('6.96');
    setEditLandArea(parsed.landArea);
    setEditBuiltArea(parsed.builtArea);
    setEditZona(parsed.zona);
    setEditAttributes(attrsMap);
    setEditImages(prop.imageUrl ? [prop.imageUrl] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80']);
  };

  const handlePriceChange = (val: string, type: 'BOB' | 'USD' | 'RATE' | 'CURRENCY') => {
    const rate = parseFloat(editExchangeRate) || 6.96;
    if (type === 'BOB') {
      setEditPriceBOB(val);
      setEditPriceUSD(val ? (parseFloat(val) / rate).toFixed(2) : '');
    } else if (type === 'USD') {
      setEditPriceUSD(val);
      setEditPriceBOB(val ? (parseFloat(val) * rate).toFixed(2) : '');
    } else if (type === 'RATE') {
      setEditExchangeRate(val);
      const rateNum = parseFloat(val) || 6.96;
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
        priceBob: parseFloat(editPriceBOB) || 0,
        currency: editCurrency,
        area: parseFloat(editBuiltArea) || parseFloat(editLandArea) || 0,
        imageUrl: editImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      };

      const token = localStorage.getItem('propio_token') || '';
      await propertiesService.updateProperty(editingProperty.id, updatedFields, token);

      // Modificar en la lista local para reflejar el cambio de inmediato
      setProperties(prev =>
        prev.map(p =>
          p.id === editingProperty.id
            ? { ...p, ...updatedFields }
            : p
        )
      );

      setEditingProperty(null);
      alert('Anuncio actualizado con éxito.');
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
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
                    {property.verified ? (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        🏆 Sello Oro
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        ⚖️ En Validación
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
                          {(property.priceBob || (property.price * 6.96)).toLocaleString('es-BO')} Bs.
                          <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                            (~ ${(property.price || (property.priceBob / 6.96)).toLocaleString('en-US')} USD)
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
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-[11px] font-bold text-red-650 rounded-xl transition-all"
                          onClick={() => handleStopPublishing(property.id)}
                        >
                          dejar de publicar
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
          )}
        </div>

        {/* SECCIÓN DE MONETIZACIÓN: PLANES DE SUSCRIPCIÓN */}
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
            {PLANS.map((plan) => (
              <div 
                key={plan.id}
                className={`relative rounded-3xl flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 bg-white border ${
                  plan.highlight
                    ? 'border-2 border-[#b9fa3c] shadow-xl scale-[1.02] z-10'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-widest ${
                    plan.highlight ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-[#04045E] text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="font-bold text-sm text-[#04045E] uppercase tracking-wide mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-black text-[#04045E]">
                        {plan.price === 0 ? 'Gratis' : `Bs. ${plan.price}`}
                      </span>
                      {plan.price > 0 && <span className="text-[10px] text-slate-400">/{plan.period}</span>}
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-slate-100">
                      {plan.features.map((f, i) => (
                        <li key={i} className={`flex items-center gap-2 text-[10px] ${
                          f.included ? 'text-slate-800 font-semibold' : 'text-slate-350 line-through'
                        }`}>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[8px] ${
                            f.included ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-slate-50 text-slate-300'
                          }`}>
                            {f.included ? '✓' : '–'}
                          </span>
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const text = encodeURIComponent(`Hola Propio, me interesa contratar el ${plan.name} de la plataforma.`);
                        window.open(`https://wa.me/59171234567?text=${text}`, '_blank');
                      }}
                      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 shadow-sm ${
                        plan.highlight
                          ? 'bg-[#b9fa3c] text-[#04045E] hover:brightness-95'
                          : 'bg-[#04045E] text-white hover:bg-[#04045E]/90'
                      }`}
                    >
                      {plan.price === 0 ? 'Comenzar Gratis' : 'Contratar Plan'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
              {/* Título */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Título Comercial</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Descripción</label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors resize-none"
                />
              </div>

              {/* Precios y Conversión */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Moneda</label>
                    <select
                      value={editCurrency}
                      onChange={(e) => handlePriceChange(e.target.value, 'CURRENCY')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm"
                    >
                      <option value="BOB">Bolivianos (Bs.)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Tipo de Cambio</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editExchangeRate}
                      onChange={(e) => handlePriceChange(e.target.value, 'RATE')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Precio (Bs.)</label>
                    <input
                      type="number"
                      value={editPriceBOB}
                      onChange={(e) => handlePriceChange(e.target.value, 'BOB')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Precio (USD)</label>
                    <input
                      type="number"
                      value={editPriceUSD}
                      onChange={(e) => handlePriceChange(e.target.value, 'USD')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Superficies */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Sup. Terreno (m²)</label>
                  <input
                    type="number"
                    value={editLandArea}
                    onChange={(e) => setEditLandArea(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Sup. Construida (m²)</label>
                  <input
                    type="number"
                    value={editBuiltArea}
                    onChange={(e) => setEditBuiltArea(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-1.5">Zona / Barrio</label>
                  <input
                    type="text"
                    value={editZona}
                    onChange={(e) => setEditZona(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm text-center"
                  />
                </div>
              </div>

              {/* Atributos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#04045E] border-b pb-1">Modificar Atributos de Valor</h4>
                <div className="max-h-48 overflow-y-auto space-y-4 pr-2">
                  {Object.entries(ATTRIBUTES_BY_CATEGORY).map(([category, items]) => (
                    <div key={category} className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">{category}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map(item => {
                          const isChecked = !!editAttributes[item];
                          return (
                            <button
                              type="button"
                              key={item}
                              onClick={() => toggleAttribute(item)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left border transition-all flex items-center justify-between ${
                                isChecked
                                  ? 'bg-[#b9fa3c]/10 border-[#b9fa3c] text-[#04045E] font-bold'
                                  : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350 text-slate-650'
                              }`}
                            >
                              <span>{item}</span>
                              {isChecked && <span>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Galería y Fotos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#04045E]">Galería de Fotos del Anuncio</h4>
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#04045E] bg-slate-100 hover:bg-slate-200 border px-3 py-1.5 rounded-xl transition-all"
                  >
                    + Agregar Foto
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border">
                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative h-20 bg-slate-200 rounded-lg overflow-hidden group">
                      <img src={img} alt={`Anuncio ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-700 opacity-80 group-hover:opacity-100 transition-opacity"
                        title="Eliminar foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {editImages.length === 0 && (
                    <p className="col-span-full text-[10px] text-slate-400 font-bold uppercase text-center py-4">Sin fotos. Sube al menos una foto.</p>
                  )}
                </div>
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
