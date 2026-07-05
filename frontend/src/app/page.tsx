'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { propertiesService } from '../services/properties.service';
import { getCurrentUser } from '@/utils/session';
import { useFavorites } from '../context/FavoritesContext';

export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} stroke-current stroke-[2]`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M6 21V3h8a4 4 0 014 4v0a4 4 0 01-4 4H6M12 11l6 10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Fallback premium inicial para asegurar estética inmediata si el backend no responde
const INVERSIONES_MOCKS = [
  {
    id: 'prop-1-garsonier',
    title: '✨¡Increíble Garsonier en Av. América! Cocina equipada & área social✨',
    priceBob: 3000,
    location: 'Av. América, Cochabamba',
    area: 45,
    rooms: 1,
    baths: 1,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=85',
    verified: true,
    offerType: 'ALQUILER',
    isOffer: true,
    avenue: 'Av. América',
  },
  {
    id: 'prop-2-penthouse',
    title: '🏢Penthouse de Lujo de Estreno Amoblado en Queru Queru con domótica🏢',
    priceBob: 5500,
    location: 'Queru Queru, Cochabamba',
    area: 195,
    rooms: 4,
    baths: 3,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85',
    verified: true,
    offerType: 'ALQUILER',
    isOffer: true,
    avenue: 'Queru Queru',
  },
  {
    id: 'prop-3-smart',
    title: '🏡Hermosa Casa Smart Independiente con Domótica Avanzada🏡',
    priceBob: 12000,
    location: 'Cala Cala, Cochabamba',
    area: 280,
    rooms: 4,
    baths: 4,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=85',
    verified: true,
    offerType: 'VENTA',
    isOffer: false,
    avenue: 'Cala Cala',
  },
];

const DEPARTAMENTOS_BOLIVIA = [
  'Cochabamba',
  'La Paz',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Tarija',
  'Chuquisaca',
  'Beni',
  'Pando'
];

const CATEGORIAS_BUSQUEDA = [
  { value: 'VENTA', label: 'Venta' },
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'ANTICRETICO', label: 'Anticrético' },
  { value: 'PROYECTOS', label: 'Proyectos' }
];

const TIPOS_PROPIEDAD = [
  'Local Comercial',
  'Oficina',
  'Casa',
  'Casa en condominio',
  'Terreno',
  'Propiedad agrícola/ganadera',
  'Edificio',
  'Hotel',
  'Monoambiente',
  'Garzonier',
  'Departamento',
  'Penthouse',
  'Garaje/Baulera',
  'Galpón'
];

interface InversionCardProps {
  property: {
    id: string;
    title: string;
    priceBob: number;
    location: string;
    area: number;
    rooms: number;
    baths: number;
    image: string;
    verified: boolean;
    offerType: string;
    isOffer: boolean;
    avenue?: string;
  };
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
}

function PropertyInversionCard({ property, isFavorite, onFavoriteToggle }: InversionCardProps) {
  return (
    <div 
      className="group block w-[280px] sm:w-[350px] md:w-[380px] shrink-0 snap-start text-left relative"
    >
      <Link href={`/properties?id=${property.id}`} className="cursor-pointer block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900 rounded-3xl border border-slate-800 shadow-lg group-hover:border-slate-700 transition-all duration-300">
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Top-left: badge OFERTA */}
          {property.isOffer && (
            <span className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-wider rounded-full shadow-sm z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              OFERTA
            </span>
          )}

          {property.verified && (
            <span className="absolute top-4 right-4 bg-[#04045E] text-[#b9fa3c] text-[8px] font-black px-2.5 py-1.2 uppercase tracking-wider rounded-full shadow-sm z-10">
              DOCUMENTACION VERIFICADA
            </span>
          )}
          
          {/* Bottom-left: location and price */}
          <div className="absolute bottom-4 left-4 z-10">
            <p className="text-white text-[10px] font-bold uppercase tracking-wider drop-shadow-md">
              {property.location}
            </p>
            <p className="text-[#D4FF00] text-lg font-black tracking-tight mt-0.5 drop-shadow-md">
              Bs. {property.priceBob.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          {/* Overlay shadow to make text readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none" />
        </div>
      </Link>

      {/* Botón de favoritos desacoplado y posicionado de forma absoluta por encima del link */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFavoriteToggle(property.id);
        }}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95"
        title="Favorito"
      >
        <svg
          className={`w-4 h-4 transition-all duration-300 ${isFavorite ? 'fill-red-500 stroke-red-500' : 'stroke-white fill-none'}`}
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>
      
      {/* Below image content */}
      <Link href={`/properties?id=${property.id}`} className="cursor-pointer block mt-4 space-y-1">
        <h3 className="font-sans text-base font-bold text-white tracking-tight group-hover:text-[#D4FF00] transition-colors leading-snug">
          {property.title}
        </h3>
        
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
          <span>{property.rooms} Dorms</span>
          <span className="text-slate-600">&bull;</span>
          <span>{property.baths} Baños</span>
          <span className="text-slate-600">&bull;</span>
          <span>{property.area} m²</span>
        </div>

        {property.avenue && (
          <div className="pt-2">
            <span className="inline-block bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {property.avenue}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollTimeoutRef = useRef<any>(null);

  // ponytail: measure card width dynamically (+ gap-6 which is 24px) for perfect responsive scrolling
  const scrollLeft = () => {
    const el = carouselRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement;
    const cardWidth = firstChild ? firstChild.offsetWidth + 24 : 380;
    el.scrollBy({ left: -cardWidth, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const el = carouselRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement;
    const cardWidth = firstChild ? firstChild.offsetWidth + 24 : 380;
    el.scrollBy({ left: cardWidth, behavior: 'smooth' });
  };

  // ponytail: debounce scroll checks to instantly reset position between set boundaries for seamless loops
  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const singleSetWidth = el.scrollWidth / 3;
      if (el.scrollLeft >= singleSetWidth * 1.8) {
        el.scrollLeft = el.scrollLeft - singleSetWidth;
      }
      else if (el.scrollLeft <= singleSetWidth * 0.5) {
        el.scrollLeft = el.scrollLeft + singleSetWidth;
      }
    }, 150);
  };

  const [totalProperties, setTotalProperties] = useState<number | null>(null);
  const [inversiones, setInversiones] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // ponytail: duplicate array three times for virtual infinite looping in both directions
  const displayInversiones = React.useMemo(() => {
    if (inversiones.length === 0) return [];
    return [...inversiones, ...inversiones, ...inversiones];
  }, [inversiones]);

  // Hook de favoritos global
  const { favorites, toggleFavorite } = useFavorites();

  // ponytail: scroll to the middle set on mount / load so there's buffer in both directions
  useEffect(() => {
    if (inversiones.length > 0 && carouselRef.current) {
      const el = carouselRef.current;
      setTimeout(() => {
        const singleSetWidth = el.scrollWidth / 3;
        el.scrollLeft = singleSetWidth;
      }, 50);
    }
  }, [inversiones]);

  useEffect(() => {
    setIsMounted(true);
    const user = getCurrentUser() as any;
    const filters = user && user.id ? { userId: user.id } : undefined;
    
    // 1. Obtener total de propiedades registradas en producción
    propertiesService.getProperties(filters)
      .then((data) => {
        if (data && Array.isArray(data)) {
          setTotalProperties(data.length);
        }
      })
      .catch((err) => {
        console.error("Error fetching total properties:", err);
      });

    // 2. Cargar propiedades dinámicas unificadas para el carrusel de inversiones
    const loadInversiones = async () => {
      try {
        const [backendProps, localRes] = await Promise.all([
          propertiesService.getProperties({ verifiedOnly: false }).catch(() => []),
          fetch('/api/local/properties', { cache: 'no-store' })
            .then(res => res.json())
            .catch(() => ({ properties: [] }))
        ]);

        const localProps = localRes?.properties || [];
        const combinedMap = new Map<string, any>();

        // Incorporar elementos desde base de datos NestJS
        if (Array.isArray(backendProps)) {
          backendProps.forEach((p: any) => {
            if (p && p.id) combinedMap.set(p.id, p);
          });
        }

        // Incorporar y sobreescribir con db.json en caliente
        if (Array.isArray(localProps)) {
          localProps.forEach((p: any) => {
            if (p && p.id) combinedMap.set(p.id, p);
          });
        }

        // ponytail: filter properties that have all documents approved by the administrator
        const verifiedDocsProps = Array.from(combinedMap.values())
          .filter((p: any) => {
            if (!p || !p.id) return false;
            if (String(p.status || '').toUpperCase().trim() !== 'APROBADO') return false;
            const docs = p.documents || [];
            if (docs.length === 0) return false;
            return docs.every((d: any) => d && (d.status === 'APROBADO' || d.status === 'APPROVED'));
          });

        // Deterministic Weekly Seed (semana actual de 2026)
        const weekSeed = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        
        let selectedProps: any[] = [];
        const sourceList = verifiedDocsProps.length > 0 ? verifiedDocsProps : INVERSIONES_MOCKS;
        
        // Extract exactly 6 properties deterministically based on seed
        for (let i = 0; i < 6; i++) {
          const index = (weekSeed + i) % sourceList.length;
          selectedProps.push(sourceList[index]);
        }

        const finalInversiones = selectedProps.map((p: any) => {
          const price = Number(p.priceBob || p.price_bs || (p.price * 9.76)) || 3000;
          const images = p.images || (p.imageUrl ? [p.imageUrl] : []);
          const image = images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85';

          const cityStr = typeof p.location === 'object' && p.location 
            ? (p.location.city || p.location.address || 'Cochabamba') 
            : String(p.location || 'Cochabamba');

          return {
            id: p.id,
            title: p.title || 'Propiedad Aprobada',
            priceBob: price,
            location: cityStr,
            area: p.area || 0,
            rooms: p.rooms || 0,
            baths: p.bathrooms || p.baths || 0,
            image: image,
            verified: p.isVerified || p.verified || false,
            offerType: p.offerType || 'VENTA',
            isOffer: p.offerType === 'ALQUILER' || p.offerType === 'ANTICRETICO',
            avenue: p.address || ''
          };
        });

        setInversiones(finalInversiones);
      } catch (err) {
        console.error('Error cargando inversiones dinámicas:', err);
        setInversiones(INVERSIONES_MOCKS);
      }
    };

    loadInversiones();
  }, []);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Helper hook para sincronización directa de filtros en URL
  const getFilter = (key: string, defaultValue: string) => searchParams.get(key) || defaultValue;

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL' && value !== 'TODOS') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const ciudad = getFilter('city', 'Cochabamba');
  const categoria = getFilter('category', 'VENTA');
  const tipoPropiedad = getFilter('type', 'Casa');

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (ciudad) params.set('city', ciudad);
    if (categoria) params.set('category', categoria);
    if (tipoPropiedad) params.set('type', tipoPropiedad);
    router.push(`/properties?${params.toString()}`);
  };

  // Prevención robusta de Hydration Mismatches para usuarios anónimos
  if (!isMounted) return null;

  // Set en memoria O(1) de favoritos
  const favoriteIds = new Set(favorites.map((f: any) => String(f.id)));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 font-sans antialiased flex flex-col">
      
      {/* ─── HERO SECTION + FILTERS ABOVE THE FOLD ─── */}
      <section className="relative h-[calc(100vh-60px)] min-h-[620px] flex flex-col justify-between bg-[#000033] overflow-hidden pt-8 pb-12 lg:pt-10 lg:pb-16 z-10 shrink-0">
        <div className="absolute inset-0 opacity-40 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2200&q=85"
            alt="Hero Architecture"
            className="w-full h-full object-cover scale-102"
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#000033] via-[#000033]/40 to-[#000033]/70 z-5" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ccff00_1px,transparent_1px)] [background-size:16px_16px] z-5"></div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-8 lg:px-20 w-full flex-grow flex flex-col justify-between">
          
          <div className="flex flex-col gap-4 mt-auto mb-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md self-start shadow-[0_0_15px_rgba(204,255,0,0.05)] transition-all duration-300 hover:scale-[1.02]">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#ccff00]">
                Inmobiliaria 0% comisión
              </span>
            </div>

            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white font-black tracking-tight leading-[1.05] uppercase break-words hyphens-auto">
              Hazlo seguro,<br />
              <span className="text-[#ccff00]">hazlo tuyo</span><br />
              hazlo propio.
            </h1>
          </div>

          {/* Barra Horizontal de Filtros */}
          <div className="w-full translate-y-6 lg:translate-y-8">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-6 md:p-8 border border-slate-100 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 items-end shadow-2xl"
            >
              <div className="flex flex-col gap-2">
                <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">CIUDAD</label>
                <select
                  className="border-b border-[#000033] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#000033] text-sm font-semibold text-[#000033] cursor-pointer"
                  value={ciudad}
                  onChange={(e) => setFilter('city', e.target.value)}
                >
                  {DEPARTAMENTOS_BOLIVIA.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">CATEGORÍA</label>
                <select
                  className="border-b border-[#000033] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#000033] text-sm font-semibold text-[#000033] cursor-pointer"
                  value={categoria}
                  onChange={(e) => setFilter('category', e.target.value)}
                >
                  {CATEGORIAS_BUSQUEDA.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">TIPO DE PROPIEDAD</label>
                <select
                  className="border-b border-[#000033] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#000033] text-sm font-semibold text-[#000033] cursor-pointer"
                  value={tipoPropiedad}
                  onChange={(e) => setFilter('type', e.target.value)}
                >
                  {TIPOS_PROPIEDAD.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-[#b9fa3c] hover:bg-[#a5e12e] text-[#000033] py-4 font-sans text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl shadow-md cursor-pointer border-0"
              >
                explorar en el mapa
              </button>
            </form>
          </div>

        </div>
      </section>

      <div className="h-6 lg:h-8 bg-[#F8FAFC]"></div>

      {/* ─── SECCIÓN DE PILARES CORPORATIVOS ─── */}
      <section className="py-24 max-w-[1440px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          <div className="bg-white border border-slate-150 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <span className="font-sans text-5xl font-black text-[#000033]">0%</span>
            <h3 className="font-sans text-base font-black text-[#000033] uppercase tracking-wider">Cero Comisiones Ocultas</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Olvídate de las comisiones infladas. Con nuestra tecnología conectas directo con el dueño y ahorras miles de dólares.
            </p>
          </div>

          <div className="bg-white border border-slate-150 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <span className="font-sans text-5xl font-black text-[#000033]">⚖️</span>
            <h3 className="font-sans text-base font-black text-[#000033] uppercase tracking-wider">Filtro Legal y Seguro</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Cada propiedad pasa por una auditoría jurídica estricta. Información real, transparente y sin sorpresas.
            </p>
          </div>

          <div className="bg-white border border-slate-150 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <span className="font-sans text-5xl font-black text-[#000033]">⚡</span>
            <h3 className="font-sans text-base font-black text-[#000033] uppercase tracking-wider">transacciones a un clic</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Agenda visitas, oferta y cierra el trato de forma rápida, eficiente y digital.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN INVERSIONES INTELIGENTES ─── */}
      <section className="py-24 bg-slate-950 border-t border-slate-900">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 border-b border-slate-900 pb-8 gap-6">
            <div>
              <span className="font-sans text-[10px] font-bold text-white block mb-2 tracking-[0.25em] uppercase">SECCION EXCLUSIVA</span>
              <h2 className="font-sans text-4xl sm:text-5xl font-black text-[#D4FF00] uppercase tracking-tight leading-none">
                MAXIMIZA TU CAPITAL
              </h2>
              <p className="font-sans text-sm sm:text-base font-bold text-white mt-2 uppercase tracking-wider">
                INVERSIONES INTELIGENTES
              </p>
            </div>
            <Link
              href="/properties"
              className="font-sans text-xs font-black uppercase tracking-widest text-[#D4FF00] hover:text-opacity-80 transition-colors shrink-0 flex items-center gap-1.5"
            >
              VER TODAS LAS PROPIEDADES &rarr;
            </Link>
          </div>

          <div 
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 scroll-smooth px-8 lg:px-20 -mx-8 lg:-mx-20"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayInversiones.map((property: any, idx: number) => (
              <PropertyInversionCard 
                key={`${property.id}-${idx}`} 
                property={property} 
                isFavorite={favoriteIds.has(String(property.id))}
                onFavoriteToggle={toggleFavorite}
              />
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={scrollLeft}
              className="bg-slate-800 hover:bg-slate-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg border border-slate-700 cursor-pointer"
              aria-label="Anterior"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={scrollRight}
              className="bg-white hover:bg-slate-100 text-slate-950 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
              aria-label="Siguiente"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ─── BANNER FINAL COBERTURA NACIONAL (CTA) ─── */}
      <section className="bg-[#030712] py-16 px-4 md:px-8 w-full">
        <div className="max-w-6xl w-full mx-auto relative overflow-hidden bg-[#090D26] py-20 px-8 text-white text-center rounded-3xl border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#CCFF00_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>
          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm border border-white/10 px-4.5 py-2 rounded-full shadow-sm mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                COBERTURA NACIONAL
              </span>
            </div>

            <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl font-black leading-[1.15] uppercase tracking-tight max-w-2xl mb-4">
              ¿Deseas vender o alquilar <br className="hidden sm:inline" />
              <span className="text-[#CCFF00]">tu propiedad?</span>
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-lg leading-relaxed font-medium mb-6">
              Explora más de <span className="text-white font-extrabold">{totalProperties !== null ? totalProperties : '1532'}+</span> propiedades en todo el país. Publica o promociona tu hogar ideal hoy mismo.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <Link 
                href="/login?tab=register" 
                className="bg-white text-slate-900 px-6 py-3 font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-slate-100 transition-colors w-full sm:w-auto text-center"
              >
                PUBLICAR AHORA
              </Link>
              <Link 
                href="/servicios" 
                className="bg-[#CCFF00] text-slate-950 px-6 py-3 font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-opacity w-full sm:w-auto text-center"
              >
                PROMOCIONA TU PROPIEDAD
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-700 border-t-[#CCFF00]" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
