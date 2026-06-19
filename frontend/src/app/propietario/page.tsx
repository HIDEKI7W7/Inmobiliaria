'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { propertiesService } from '../../services/properties.service';
import { Property } from '../../components/modules/properties/PropertyCard';

interface ExtendedProperty extends Property {
  minPrice?: number;
  status: any;
  venceEnDias?: number; // Days until expiry (max 90 days / 3 months)
  currency?: string;
}

const INITIAL_PROPERTIES_PROPIETARIO: ExtendedProperty[] = [
  { 
    id: '1', 
    title: 'Casa Familiar en Cala Cala', 
    description: 'Espléndida residencia de dos plantas ubicada en Cala Cala con acabados de primera calidad.', 
    price: 320000, 
    minPrice: 300000, 
    currency: 'USD',
    location: 'Cala Cala, Cochabamba', 
    rooms: 4, 
    bathrooms: 3, 
    area: 350, 
    verified: true, 
    type: 'casa', 
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    status: 'APROBADO',
    venceEnDias: 78,
    lat: -17.37,
    lng: -66.15
  },
  { 
    id: '4', 
    title: 'Terreno Comercial en Cala Cala', 
    description: 'Terreno premium ideal para construcción de edificio corporativo o centro de comercio.', 
    price: 140000, 
    minPrice: 135000, 
    currency: 'USD',
    location: 'Cala Cala, Cochabamba', 
    rooms: 0,
    bathrooms: 0,
    area: 1500, 
    verified: false, 
    type: 'terreno', 
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    status: 'NUEVA_PUBLICACION',
    venceEnDias: 89,
    lat: -17.38,
    lng: -66.16
  },
];

export default function PropietarioDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<ExtendedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing Property State
  const [editingProperty, setEditingProperty] = useState<ExtendedProperty | null>(null);

  // Load properties with localStorage fallback
  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        const local = localStorage.getItem('propio_propietario_properties');
        if (local) {
          setProperties(JSON.parse(local));
        } else {
          setProperties(INITIAL_PROPERTIES_PROPIETARIO);
          localStorage.setItem('propio_propietario_properties', JSON.stringify(INITIAL_PROPERTIES_PROPIETARIO));
        }
      } catch (error) {
        console.error('Error al cargar propiedades del propietario:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error al revocar la sesión del propietario en el servidor:', error);
    } finally {
      document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');
      router.replace('/login');
    }
  };

  // Inline editing handler
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    const updated = properties.map(p => p.id === editingProperty.id ? editingProperty : p);
    setProperties(updated);
    localStorage.setItem('propio_propietario_properties', JSON.stringify(updated));
    setEditingProperty(null);
  };

  // Unpublish handler (Dejar de publicar)
  const handleUnpublish = (id: string) => {
    const updated = properties.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'RECHAZADO', // Set as inactive/unpublished
        };
      }
      return p;
    });
    setProperties(updated);
    localStorage.setItem('propio_propietario_properties', JSON.stringify(updated));
    alert('El inmueble ha dejado de publicarse y ya no aparecerá en las búsquedas activas.');
  };

  // Republicar (reactive)
  const handlePublish = (id: string) => {
    const updated = properties.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'APROBADO',
          venceEnDias: 90 // Reset expiration to 90 days
        };
      }
      return p;
    });
    setProperties(updated);
    localStorage.setItem('propio_propietario_properties', JSON.stringify(updated));
    alert('El inmueble ha sido publicado de nuevo con vigencia extendida.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#04045E] font-sans antialiased flex flex-col selection:bg-[#b9fa3c]/30">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 sticky top-0 z-30 select-none shadow-sm">
        <div className="text-2xl font-bold tracking-tight text-[#04045E]">
          Propio<span className="text-[#b9fa3c] font-black">.</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-3 border-l border-slate-200 pl-3 hidden md:inline">
            Propietarios
          </span>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <Link 
            href="/propietario/nuevo" 
            className="bg-[#b9fa3c] text-[#04045E] px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:scale-[1.02] transition-all shadow-sm text-center"
          >
            + Publicar Nueva Propiedad
          </Link>
          
          <button 
            onClick={handleLogout}
            className="border border-slate-200 text-slate-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-650 hover:border-red-100 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Salir</span>
          </button>
        </div>
      </nav>

      {/* Contenido Central */}
      <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Banner de Bienvenida */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black tracking-widest text-[#04045E] uppercase">Área de Autoservicio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] uppercase tracking-tight">
              Mi Centro Operativo
            </h1>
            <p className="text-xs text-slate-500 font-semibold">
              Monitorea el rendimiento de tus inmuebles, controla el estado de tu carpeta legal y recibe ofertas directas.
            </p>
          </div>

          <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-center px-4 border-r border-slate-200">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Inmuebles</span>
              <span className="text-sm font-black text-[#04045E]">{(properties || []).length || 0}</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest">Sello Oro</span>
              <span className="text-sm font-black text-emerald-600">
                {(properties || []).filter((p) => p && p.verified).length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Sección 1: Analíticas */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            📊 Rendimiento de Tráfico e Impacto (Simulación en Vivo)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center group hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Visitas Totales</span>
                <span className="text-3xl font-black text-[#04045E] tracking-tight">1,420</span>
                <span className="block text-[9px] font-bold text-emerald-600">+18.5% esta semana</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl select-none">👁️‍QUrl</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center group hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Guardados en Favoritos</span>
                <span className="text-3xl font-black text-[#04045E] tracking-tight">84</span>
                <span className="block text-[9px] font-bold text-emerald-600">+4 nuevos interesados</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl select-none">❤️</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center group hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Clics Directos a mi WhatsApp</span>
                <span className="text-3xl font-black text-[#04045E] tracking-tight">39</span>
                <span className="block text-[9px] font-bold text-emerald-600">Conversión: 2.74%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl select-none">💬</div>
            </div>
          </div>
        </div>

        {/* Sección 2: Módulo Sello Oro */}
        <div id="sello-oro-auditoria" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xs text-[#04045E] uppercase tracking-wider">
                👑 Auditoría de Sello Oro Legal
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Estado de aprobación documental para tus propiedades en Venta</p>
            </div>
            <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[8px] font-black uppercase px-2.5 py-1 rounded">
              Validación Requerida
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative select-none">
            <div className="flex gap-3.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">✓</div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">1. Folio Real</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Libre Alodial Verificado</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">✓</div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">2. Testimonio</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Propiedad Acreditada</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">✓</div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">3. Impuestos</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Gestión 2025 al día</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3 bg-white border-2 border-[#b9fa3c] rounded-xl shadow-xs animate-pulse">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">⌛</div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">4. Catastro</h4>
                <p className="text-[9px] text-slate-550 font-bold mt-0.5">En Revisión Técnica</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start p-3 bg-slate-100/50 border border-dashed border-slate-200 rounded-xl opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black flex-shrink-0">5</div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight">5. Sello Oro</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Publicación Protegida</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Listado de Propiedades en Formato Horizontal */}
        <div id="catalogo-inmuebles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              🏠 Catálogo de Inmuebles en mi Cartera ({properties.length})
            </h2>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Cargando catálogo personal...</p>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
              <span className="text-4xl animate-bounce">🏡</span>
              <div className="space-y-1">
                <h3 className="font-bold text-[#04045E] text-base uppercase tracking-tight">¿Aún no has publicado ninguna propiedad?</h3>
                <p className="text-xs text-slate-500 max-w-sm font-semibold leading-relaxed">
                  Registra tu primera casa, departamento, terreno u oficina para conectar directamente con miles de compradores sin intermediarios.
                </p>
              </div>
              <Link href="/propietario/nuevo" className="px-6 py-3 bg-[#b9fa3c] text-[#04045E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-[1.02]">
                Comenzar Carga Asistida
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {properties.map((property) => {
                const unpublished = property.status === 'RECHAZADO';
                return (
                  <div
                    key={property.id}
                    className={`bg-white rounded-2xl border overflow-hidden flex flex-col lg:flex-row hover:border-[#b9fa3c]/50 hover:shadow-md transition-all duration-300 shadow-2xs ${
                      unpublished ? 'opacity-70 border-red-200 bg-red-50/10' : 'border-slate-200'
                    }`}
                  >
                    <div className="relative w-full lg:w-72 h-48 shrink-0 bg-slate-100">
                      <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                        {property.verified ? (
                          <div className="px-2.5 py-1 rounded bg-[#04045E] text-[#b9fa3c] text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md border border-[#b9fa3c]/35">
                            👑 Sello Oro
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                            ⚖️ En Validación
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-4 left-4 flex gap-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md border ${
                          unpublished 
                            ? 'bg-red-500 text-white border-red-400/35' 
                            : 'bg-[#b9fa3c] text-[#04045E] border-[#b9fa3c]/30'
                        }`}>
                          {unpublished ? 'Fuera de Línea' : 'Publicado'}
                        </span>
                        
                        {!unpublished && property.venceEnDias !== undefined && (
                          <span className="bg-[#04045E]/80 backdrop-blur-xs text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md border border-white/10">
                            ⏳ Vence en {property.venceEnDias} días
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">{property.type}</span>
                          <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">{property.area} M²</span>
                          {property.rooms && <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">{property.rooms} Dorm.</span>}
                          {property.bathrooms && <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">{property.bathrooms} Baños</span>}
                          <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-blue-50 text-[#0066ff] border border-blue-100">📍 {property.location}</span>
                        </div>
                        
                        <h3 className="text-lg font-black tracking-tight text-[#04045E] uppercase leading-tight hover:text-[#04045E]/90 transition-colors">
                          {property.title} {unpublished && <span className="text-red-500 font-bold text-xs">[DESPUBLICADO]</span>}
                        </h3>
                        <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                          {property.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[8px] uppercase font-black text-slate-400 tracking-wider">Precio pretendido</p>
                          <p className="text-xl font-black text-[#04045E] leading-none">
                            ${property.price.toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase">USD</span>
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          {unpublished ? (
                            <button
                              onClick={() => handlePublish(property.id)}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01]"
                            >
                              Publicar de Nuevo 🚀
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnpublish(property.id)}
                              className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-650 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01]"
                              title="Dar de baja el anuncio"
                            >
                              Dejar de Publicar ✕
                            </button>
                          )}
                          <button
                            onClick={() => setEditingProperty(property)}
                            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#04045E] border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01]"
                          >
                            Modificar Datos 📝
                          </button>
                          <Link
                            href={`/properties/${property.id}`}
                            className="px-4 py-2.5 bg-[#04045E] hover:bg-[#04045E]/95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] text-center"
                          >
                            Ficha Pública →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sección 4: PLANES DE PRECIOS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto border-b pb-4">
            <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#b9fa3c]/40">Planes de Venta</span>
            <h2 className="text-2xl font-black text-[#04045E] uppercase tracking-tight">Potencia el Alcance de tu Anuncio</h2>
            <p className="text-xs text-slate-550 font-semibold leading-relaxed">Mejora la velocidad de venta o alquiler activando paquetes promocionales verificados por abogados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Plan Gratis */}
            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow bg-slate-50/20">
              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">Gratis</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Carga Inicial de Prueba</p>
                </div>
                <h4 className="text-2xl font-black text-[#04045E]">$0 <span className="text-[10px] font-bold text-slate-400">USD</span></h4>
                <ul className="text-[10px] text-slate-500 font-bold space-y-2">
                  <li>• Publicación estándar</li>
                  <li>• Visible en listado general</li>
                  <li>• Duración limitada (3 meses)</li>
                </ul>
              </div>
              <button onClick={() => alert('Plan Gratis ya activo por defecto.')} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-550 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors">Activo por defecto</button>
            </div>

            {/* Plan Contenidos */}
            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">Contenidos</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fotografía Profesional</p>
                </div>
                <h4 className="text-2xl font-black text-[#04045E]">$29 <span className="text-[10px] font-bold text-slate-400">USD</span></h4>
                <ul className="text-[10px] text-slate-500 font-bold space-y-2">
                  <li>• Fotos HD tomadas por Propio</li>
                  <li>• Publicación destacada 30 días</li>
                  <li>• Difusión en TikTok / Redes</li>
                </ul>
              </div>
              <button onClick={() => alert('Contratando Plan Contenidos...')} className="w-full py-2.5 bg-[#04045E] text-white hover:brightness-110 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">Contratar Plan</button>
            </div>

            {/* Plan Venta Pro */}
            <div className="border-2 border-[#b9fa3c] rounded-2xl p-5 flex flex-col justify-between space-y-6 shadow-xs relative bg-white">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#b9fa3c] text-[#04045E] text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-lime-500">Popular</span>
              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">Venta Pro</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Validación Legal Completa</p>
                </div>
                <h4 className="text-2xl font-black text-[#04045E]">$99 <span className="text-[10px] font-bold text-slate-400">USD</span></h4>
                <ul className="text-[10px] text-slate-500 font-bold space-y-2">
                  <li>• <strong>Sello Oro</strong> de validación legal</li>
                  <li>• 3 veces más interesados en promedio</li>
                  <li>• Destacado en mapa superior</li>
                </ul>
              </div>
              <button onClick={() => alert('Contratando Plan Venta Pro...')} className="w-full py-2.5 bg-[#b9fa3c] text-[#04045E] hover:brightness-95 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all font-black">Adquirir Venta Pro</button>
            </div>

            {/* Plan Cierre Garantizado */}
            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide">Cierre Garantizado</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Asesoramiento Exclusivo</p>
                </div>
                <h4 className="text-2xl font-black text-[#04045E]">$249 <span className="text-[10px] font-bold text-slate-400">USD</span></h4>
                <ul className="text-[10px] text-slate-500 font-bold space-y-2">
                  <li>• Acompañamiento en notarías</li>
                  <li>• Asesor inmobiliario dedicado</li>
                  <li>• Cierre rápido de contratos</li>
                </ul>
              </div>
              <button onClick={() => alert('Contratando Plan Cierre Garantizado...')} className="w-full py-2.5 bg-[#04045E] text-white hover:brightness-110 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all">Contratar Plan</button>
            </div>

          </div>
        </div>

      </main>

      {/* MODAL EDICIÓN INLINE PROPIEDAD */}
      {editingProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                Editar Datos de Propiedad
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título de la Publicación *</label>
                <input 
                  type="text"
                  required
                  value={editingProperty.title}
                  onChange={e => setEditingProperty({ ...editingProperty, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descripción del Anuncio *</label>
                <textarea 
                  required
                  rows={3}
                  value={editingProperty.description}
                  onChange={e => setEditingProperty({ ...editingProperty, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Precio ($ USD) *</label>
                  <input 
                    type="number"
                    required
                    value={editingProperty.price}
                    onChange={e => setEditingProperty({ ...editingProperty, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Área (M²) *</label>
                  <input 
                    type="number"
                    required
                    value={editingProperty.area}
                    onChange={e => setEditingProperty({ ...editingProperty, area: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Dormitorios</label>
                  <input 
                    type="number"
                    value={editingProperty.rooms || ''}
                    onChange={e => setEditingProperty({ ...editingProperty, rooms: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Baños</label>
                  <input 
                    type="number"
                    value={editingProperty.bathrooms || ''}
                    onChange={e => setEditingProperty({ ...editingProperty, bathrooms: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01]"
              >
                Guardar Cambios 🚀
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
