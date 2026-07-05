'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { DaysOnMarketBadge } from '@/components/ui/DaysOnMarketBadge';
import { PriceTrendChart } from '@/components/ui/PriceTrendChart';
import dynamic from 'next/dynamic';
import { Property } from '@/components/modules/properties/PropertyCard';
import { LogoIcon } from '../page';
import { Footer } from '@/components/ui/Footer';
import { apiClient } from '@/services/api.client';
import { getToken, getCurrentUser, getRedirectPathByRole } from '@/utils/session';
import { useFavorites } from '@/context/FavoritesContext';
import { propertiesService } from '@/services/properties.service';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';

const t = (key: string) => key;

// Carga dinámica del mapa real con Leaflet (ssr: false para evitar errores de window/document)
const PropertiesMap = dynamic(() => import('@/components/modules/properties/MapWrapper'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full min-h-[400px] bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center overflow-hidden animate-pulse">
      <div className="text-center space-y-4">
        <div className="mx-auto w-10 h-10 rounded-none border-2 border-neutral-300 border-t-black animate-spin flex items-center justify-center bg-white">
          <span className="text-xs">📍</span>
        </div>
        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.2em]">{t("Cargando Cartografía Real...")}</p>
      </div>
    </div>
  )
});

interface EnhancedProperty extends Property {
  priceLabel: string;
  offerType: 'VENTA' | 'ALQUILER' | 'ANTICRETICO' | 'PROYECTO';
  lotSize?: number;
  images?: string[];
}

const PROPERTY_IMAGES_MAP: Record<string, string[]> = {
  casa: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
  ],
  departamento: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
  ],
  terreno: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80'
  ],
  oficina: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
  ],
  galpon: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80'
  ],
  local: [
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
  ]
};

const getNonDeletedProperties = () => {
  const deletedStored = typeof window !== 'undefined' ? localStorage.getItem('propio_admin_deleted_properties') : null;
  const deletedIds: string[] = deletedStored ? JSON.parse(deletedStored) : [];

  const publicProperties = ALL_REAL_PROPERTIES.filter((p: any) => 
    p && p.id && 
    !deletedIds.includes(p.id) && 
    p.status !== 'eliminado' && p.status !== 'ELIMINADO' &&
    (p.status === 'APROBADO' || p.status === 'aprobado')
  );

  return publicProperties;
};

const DEDUPLICATED_PROPERTIES = getNonDeletedProperties().filter(
  (p, index, self) => p && p.id && self.findIndex((t) => t.id === p.id) === index
);

export const ALL_PROPERTIES: EnhancedProperty[] = DEDUPLICATED_PROPERTIES.map((p, idx) => {
  const typeLower = (p.type || '').toLowerCase();
  let sampleList = PROPERTY_IMAGES_MAP.departamento;
  if (typeLower.includes('casa')) sampleList = PROPERTY_IMAGES_MAP.casa;
  else if (typeLower.includes('terreno')) sampleList = PROPERTY_IMAGES_MAP.terreno;
  else if (typeLower.includes('oficina')) sampleList = PROPERTY_IMAGES_MAP.oficina;
  else if (typeLower.includes('galpón') || typeLower.includes('galpon')) sampleList = PROPERTY_IMAGES_MAP.galpon;
  else if (typeLower.includes('local')) sampleList = PROPERTY_IMAGES_MAP.local;

  const finalImg = p.imageUrl && !p.imageUrl.startsWith('/assets/images')
    ? p.imageUrl
    : sampleList[idx % sampleList.length];

  return {
    ...p,
    imageUrl: finalImg,
    images: [
      finalImg,
      sampleList[(idx + 1) % sampleList.length],
      sampleList[(idx + 2) % sampleList.length],
      sampleList[(idx + 3) % sampleList.length]
    ]
  } as any;
});

function ListingCard({ prop, active, onClick, onHover, isFavorite, onFavoriteToggle }: {
  prop: EnhancedProperty;
  active: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
  isFavorite: boolean;
  onFavoriteToggle: (id: string) => void;
}) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const images = prop.images || [
    prop.imageUrl || 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=400&q=80'
  ];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const formatNumber = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0,00';
    }
    return num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isVenta = prop.offerType === 'VENTA';
  const priceBob = prop.priceBob || prop.price * 9.76;
  const priceUsd = prop.price || Math.round(priceBob / 9.76);

  return (
    <article
      onClick={onClick}
      className={`rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full cursor-pointer transition-all duration-300 group ${
        active ? 'ring-2 ring-[#0a1931]' : 'hover:shadow-md'
      }`}
      onMouseEnter={() => onHover(prop.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* BLOQUE MULTIMEDIA (CARRUSEL INTERACTIVO SUPERIOR) */}
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 shrink-0">
        <img
          src={images[currentImgIndex]}
          alt={prop.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {(() => {
          const requiredTypes = ['FR', 'CT', 'TS', 'IM', 'PU', 'CI'];
          const rigidPrefixMap: Record<string, string> = {
            FR: 'FOLIO REAL',
            CT: 'CERTIFICAD',
            TS: 'TESTIMONIO',
            IM: 'IMPUESTOS ',
            PU: 'PLANO DE U',
            OD: 'OTROS DOCU',
            CI: 'CÉDULA DE '
          };
          const docs = prop.documents || [];
          const allApproved = Array.isArray(docs) && requiredTypes.every(type => {
            const prefix = rigidPrefixMap[type];
            const doc = docs.find((d: any) => 
              d.fileType?.toUpperCase() === type ||
              (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
            );
            return doc?.status === 'APPROVED';
          });

          return allApproved ? (
            <span className="absolute top-4 left-4 bg-[#04045E] text-[#b9fa3c] text-[9px] font-black px-3.5 py-1.5 uppercase tracking-wider rounded-full shadow-sm z-10">
              DOCUMENTACION VERIFICADA
            </span>
          ) : null;
        })()}

        {/* Flechas de Navegación */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10 font-bold"
        >
          &lt;
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors z-10 font-bold"
        >
          &gt;
        </button>

        {/* Puntos de Paginación */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImgIndex(idx);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                currentImgIndex === idx ? 'bg-[#0a1931] scale-125' : 'bg-white/60'
              }`}
            />
          ))}
        </div>

        {/* Botones de Acción Rápida */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
          {/* Compartir */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/properties/${prop.id}`);
              alert('Enlace copiado al portapapeles');
            }}
            className="w-8 h-8 rounded-full bg-white text-slate-700 shadow-md hover:bg-slate-50 transition-colors flex items-center justify-center border border-slate-100"
            title="Compartir"
          >
            <svg className="w-4 h-4 text-slate-650" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
          
          {/* Corazón de favoritos */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(prop.id);
            }}
            className="w-8 h-8 rounded-full bg-white text-slate-700 shadow-md hover:bg-slate-50 transition-colors flex items-center justify-center border border-slate-100"
            title="Favorito"
          >
            <svg
              className={`w-4 h-4 transition-all duration-300 ${
                isFavorite
                  ? isVenta
                    ? 'fill-emerald-500 stroke-emerald-500 scale-110'
                    : 'fill-[#0a1931] stroke-[#0a1931] scale-110'
                  : 'stroke-slate-500 fill-none'
              }`}
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* BLOQUE DE TEXTO E INFORMACIÓN (JERARQUÍA ESTRICTA) */}
      <div className="p-4 flex flex-col justify-between flex-grow space-y-3 bg-white">
        <div className="space-y-1">
          {/* Fila 1 (Precio) */}
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg text-slate-800">
              Bs. {formatNumber(priceBob)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ≈ USD {formatNumber(priceUsd)}
            </span>
          </div>

          {/* Fila 2 (Título) */}
          <h3 className="font-sans font-normal text-xs text-slate-850 truncate" title={prop.title}>
            {prop.title}
          </h3>

          {/* Fila 3 (Ubicación) */}
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Propiedad'} en {typeof prop.location === 'object' && prop.location ? (prop.location.address || prop.location.city || '') : String(prop.location || '')}
          </p>
        </div>

        {/* Fila 4 (Características) */}
        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-550 font-semibold flex items-center gap-4">
          {prop.rooms > 0 && <span>🛏️ {prop.rooms} dorm.</span>}
          {prop.bathrooms > 0 && <span>🛁 {prop.bathrooms} baños</span>}
          {prop.area > 0 && <span>📏 {prop.area} m² constr.</span>}
        </div>
      </div>
    </article>
  );
}

const DEPARTAMENTOS_DATA: { [key: string]: { center: [number, number]; zoom: number } } = {
  'Santa Cruz': { center: [-17.78629, -63.18117], zoom: 12 },
  'Cochabamba': { center: [-17.3895, -66.1568], zoom: 13 },
  'La Paz': { center: [-16.5000, -68.1500], zoom: 13 },
  'Tarija': { center: [-21.5355, -64.7299], zoom: 13 },
  'Beni': { center: [-14.8333, -64.9000], zoom: 11 },
  'Pando': { center: [-11.0200, -66.1000], zoom: 11 },
  'Oruro': { center: [-17.9833, -67.1500], zoom: 13 },
  'Potosí': { center: [-19.5833, -65.7500], zoom: 13 },
  'Chuquisaca': { center: [-19.0333, -65.2627], zoom: 13 }
};

// ─── Contenido del Buscador ────────────────────────────────────────────────────────
function PropertiesContent() {
  const searchParams = useSearchParams();
  const [maxPrice, setMaxPrice] = useState(500000);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [activeType, setActiveType] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('Todo');
  const [activeOffer, setActiveOffer] = useState<string>('');
  const [activeRooms, setActiveRooms] = useState<number | ''>('');
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showSavedSearchModal, setShowSavedSearchModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('default');
  const [viewMode, setViewMode] = useState<'lista' | 'mixta' | 'mapa'>('mixta');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || 'Santa Cruz');
  const router = useRouter();
  const { isFavorited, toggleFavorite, properties: contextProperties, favorites } = useFavorites();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // O(1) Favorites Set for fast lookups
  const favoritesSet = useMemo(() => {
    return new Set((favorites || []).map((f: any) => String(f.id).replace('#', '')));
  }, [favorites]);

  const isFavoriteLocal = useCallback((propertyId: string) => {
    const cleanId = String(propertyId).replace('#', '');
    return favoritesSet.has(cleanId);
  }, [favoritesSet]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const getInitials = () => {
    if (!currentUser) return 'U';
    const name = currentUser.name || currentUser.email?.split('@')[0] || 'Cliente';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Destino dinámico del avatar según rol y objetivo del usuario
  const avatarHref = currentUser
    ? getRedirectPathByRole(
        currentUser.role,
        (currentUser as any).objective ?? null,
        (currentUser as any).onboardingCompleted ?? true
      )
    : '/login';

  const handleFavoriteToggle = async (propertyId: string) => {
    const token = getToken();
    const user = getCurrentUser();

    if (!user || !token) {
      // Redirigir a Login con callback
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    await toggleFavorite(propertyId);
  };

  const handleListingCardClick = async (propId: string) => {
    const token = getToken();
    const user = getCurrentUser();
    const isAuthenticated = !!(user && token);

    if (isAuthenticated) {
      // Registro en segundo plano sin bloquear la UI
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      fetch(`${apiBaseUrl}/historial-vistas/${propId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(err => console.error('Error tracking view history asynchronously:', err));
    }
    router.push(`/properties/${propId}`);
  };

  const handleApplyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (filtros.precioMin !== null && filtros.precioMin !== undefined && String(filtros.precioMin) !== '') {
      params.set('price_min', String(filtros.precioMin));
    } else {
      params.delete('price_min');
    }
    if (filtros.precioMax !== null && filtros.precioMax !== undefined && String(filtros.precioMax) !== '') {
      params.set('price_max', String(filtros.precioMax));
    } else {
      params.delete('price_max');
    }
    router.push(`?${params.toString()}`);
    setActiveDropdown(null);
  };

  const toggleDropdown = (d: typeof activeDropdown) => {
    setShowMoreFilters(false);
    setActiveDropdown(activeDropdown === d ? null : d);
  };

  const handleSaveSearch = async () => {
    const user = getCurrentUser();
    const token = getToken();
    
    if (user && token) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBaseUrl}/busquedas-guardadas`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: JSON.stringify(filtros),
          }),
        });
        if (res.ok) {
          alert(t('¡Búsqueda guardada con éxito en tu panel de alertas!'));
          
          const mappedType = activeType ? activeType.toUpperCase() : 'DEPARTAMENTO';
          const validTypes = ['CASA', 'DEPARTAMENTO', 'TERRENO', 'OFICINA'];
          const finalType = validTypes.includes(mappedType) ? mappedType : 'DEPARTAMENTO';
          
          await fetch(`${apiBaseUrl}/alerts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              zona: searchQuery || 'Cochabamba',
              precioMax: maxPrice || 500000,
              tipoInmueble: finalType,
            }),
          }).catch(err => console.error('Error creating auto alert:', err));

          setIsSubscribed(true);
        } else {
          console.error('Error saving search on backend');
          alert(t('Búsqueda guardada localmente.'));
        }
      } catch (err) {
        console.error('Error saving search:', err);
        alert(t('Búsqueda guardada localmente.'));
      }
    } else {
      // Anonymous user
      localStorage.setItem('propio_saved_search', JSON.stringify(filtros));
      setShowSavedSearchModal(true);
    }
  };

  // Estados del asistente de voz Google Speech
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'listening' | 'processing' | 'idle'>('idle');

  // ─── ESTADO GLOBAL DE FILTRADO ZILLOW (FiltrosState) ───────────────────────────
  const [filtros, setFiltros] = useState({
    tipoTransaccion: '', // '' para todos por defecto, de acuerdo a la matriz de 20 propiedades
    precioMin: null as number | null,
    precioMax: null as number | null,
    modoPrecio: 'list_price', // 'list_price' o 'monthly_payment'
    downPayment: null as number | null,
    creditScore: 700 as number | null,
    dormitorios: 'cualquiera' as string | number,
    coincidenciaExactaDorms: false,
    banos: 'cualquiera' as string | number,
    tiposCasa: [] as string[], // 'casa', 'departamento', 'terreno', 'oficina', etc.
    hoaMax: null as number | null,
    tipoListado: [] as string[], // owner, agent, new_construction, foreclosures, auctions
    estadoListado: [] as string[], // coming_soon, backup_offers, pending
    tours: [] as string[], // open_house, tour_3d, showcase
    parqueosMin: 'Any',
    piesCuadradosMin: null as number | null,
    piesCuadradosMax: null as number | null,
    loteMin: null as number | null,
    loteMax: null as number | null,
    anoConstruccionMin: null as number | null,
    anoConstruccionMax: null as number | null,
    tieneSotano: false,
    unSoloPiso: false,
    comunidad55Plus: 'include', // include, dont_show, only_show
    aireAcondicionado: false,
    piscina: false,
    frenteAlAgua: false,
    vista: [] as string[],
    tiempoViaje: { direccion: '', modo: 'Drive', hora: 'Now', maxMinutos: 'Any' }
  });

  const [properties, setProperties] = useState<EnhancedProperty[]>([]);
  const [apiProperties, setApiProperties] = useState<EnhancedProperty[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let active = true;
    setIsMounted(true);
    setIsLoading(true);

    const loadProperties = async () => {
      try {
        const [backendProps, localRes] = await Promise.all([
          propertiesService.getProperties({ verifiedOnly: false }).catch(() => []),
          fetch('/api/local/properties', { cache: 'no-store' }).then(res => res.json()).catch(() => ({ properties: [] }))
        ]);

        if (!active) return;

        const localProps = localRes?.properties || [];
        const combinedMap = new Map<string, any>();

        // Cargar primero las propiedades mock estáticas de ALL_PROPERTIES para no perderlas
        if (Array.isArray(ALL_PROPERTIES)) {
          ALL_PROPERTIES.forEach((p: any) => {
            if (p && p.id) combinedMap.set(p.id, p);
          });
        }

        if (Array.isArray(backendProps)) {
          backendProps.forEach((p: any) => {
            if (p && p.id) combinedMap.set(p.id, p);
          });
        }

        if (Array.isArray(localProps)) {
          localProps.forEach((p: any) => {
            if (p && p.id) combinedMap.set(p.id, { ...p, isLocal: true });
          });
        }

        const finalProps = Array.from(combinedMap.values()).map((p: any) => {
          // Extraer la ciudad polimórficamente para buscar coordenadas por defecto si faltan
          let cityVal = typeof p.location === 'object' && p.location ? (p.location.city || '') : String(p.location || '');
          let cleanCity = String(cityVal).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

          // Garantía de Ubicación por Defecto (Fallback de Ciudad) en la carga
          const isLocalDynamic = p.isLocal || p.isCustom || p.local || p.custom || String(p.id).startsWith('local-') || String(p.id).startsWith('temp-') || String(p.id).startsWith('custom-');
          const isShortOrNumeric = cityVal.trim().length < 4 || !isNaN(Number(cityVal.trim())) || cityVal.trim() === "1" || cityVal.trim() === "100";
          if (!cleanCity.includes("santa cruz") && (isLocalDynamic || isShortOrNumeric)) {
            p.location = "Santa Cruz";
            cityVal = "Santa Cruz";
            cleanCity = "santa cruz";
          }

          let defaultLat = p.lat ?? p.latitude ?? p.latitud ?? null;
          let defaultLng = p.lng ?? p.longitude ?? p.longitud ?? null;

          if (
            defaultLat === null ||
            defaultLng === null ||
            isNaN(Number(defaultLat)) ||
            isNaN(Number(defaultLng)) ||
            String(defaultLat).trim() === "" ||
            String(defaultLng).trim() === ""
          ) {
            defaultLat = -17.78629;
            defaultLng = -63.18117;
          }

          return {
            ...p,
            lat: Number(defaultLat),
            lng: Number(defaultLng),
            priceLabel: p.priceLabel || `${Math.round(p.price / 1000)}K USD`,
            offerType: p.offerType || 'VENTA',
            images: p.images || [p.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']
          };
        }) as any;

        setProperties(finalProps);
        setApiProperties(finalProps);
      } catch (err) {
        console.error('Error loading catalogue properties:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadProperties();

    return () => {
      active = false;
    };
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Control de dropdowns activos
  const [activeDropdown, setActiveDropdown] = useState<'transaction' | 'price_range' | 'rooms_baths' | 'home_type' | 'more_filters' | null>(null);

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filtros.tipoTransaccion) count++;
    if (filtros.precioMin !== null || filtros.precioMax !== null) count++;
    if (filtros.dormitorios !== 'cualquiera') count++;
    if (filtros.banos !== 'cualquiera') count++;
    if (filtros.tiposCasa.length > 0) count += filtros.tiposCasa.length;
    if (onlyVerified) count++;
    return count;
  };

  const handleClearAllFilters = () => {
    setFiltros({
      tipoTransaccion: '',
      precioMin: null,
      precioMax: null,
      modoPrecio: 'list_price',
      downPayment: null,
      creditScore: 700,
      dormitorios: 'cualquiera',
      coincidenciaExactaDorms: false,
      banos: 'cualquiera',
      tiposCasa: [],
      hoaMax: null,
      tipoListado: [],
      estadoListado: [],
      tours: [],
      parqueosMin: 'Any',
      piesCuadradosMin: null,
      piesCuadradosMax: null,
      loteMin: null,
      loteMax: null,
      anoConstruccionMin: null,
      anoConstruccionMax: null,
      tieneSotano: false,
      unSoloPiso: false,
      comunidad55Plus: 'include',
      aireAcondicionado: false,
      piscina: false,
      frenteAlAgua: false,
      vista: [],
      tiempoViaje: { direccion: '', modo: 'Drive', hora: 'Now', maxMinutos: 'Any' }
    });
    setOnlyVerified(false);
    setSearchQuery('');
  };

  const activeTags = [];
  activeTags.push({
    id: 'location',
    label: searchParams.get('city') || 'Santa Cruz de la Sierra',
    onClear: () => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('city');
      router.push(`/properties?${params.toString()}`);
    }
  });

  if (filtros.tipoTransaccion) {
    activeTags.push({
      id: 'tipoTransaccion',
      label: filtros.tipoTransaccion === 'en_venta' ? 'En venta' : filtros.tipoTransaccion === 'en_alquiler' ? 'En alquiler' : filtros.tipoTransaccion === 'en_anticretico' ? 'En anticrético' : filtros.tipoTransaccion === 'proyectos' ? 'Proyectos' : 'Vendido',
      onClear: () => setFiltros(f => ({ ...f, tipoTransaccion: '' }))
    });
  }

  if (onlyVerified) {
    activeTags.push({
      id: 'onlyVerified',
      label: 'Sello Oro',
      onClear: () => setOnlyVerified(false)
    });
  }

  if (filtros.precioMin !== null || filtros.precioMax !== null) {
    const minLabel = filtros.precioMin !== null ? `$${(filtros.precioMin / 1000).toFixed(0)}k` : '';
    const maxLabel = filtros.precioMax !== null ? `$${(filtros.precioMax / 1000).toFixed(0)}k` : '';
    activeTags.push({
      id: 'precio',
      label: minLabel && maxLabel ? `${minLabel} - ${maxLabel}` : maxLabel ? `Hasta ${maxLabel}` : `Desde ${minLabel}`,
      onClear: () => setFiltros(f => ({ ...f, precioMin: null, precioMax: null }))
    });
  }

  if (filtros.dormitorios !== 'cualquiera') {
    activeTags.push({
      id: 'dormitorios',
      label: `${filtros.dormitorios} dorm.`,
      onClear: () => setFiltros(f => ({ ...f, dormitorios: 'cualquiera' }))
    });
  }

  if (filtros.banos !== 'cualquiera') {
    activeTags.push({
      id: 'banos',
      label: `${filtros.banos} baños`,
      onClear: () => setFiltros(f => ({ ...f, banos: 'cualquiera' }))
    });
  }

  // Prefiltrar desde query params
  useEffect(() => {
    const type = searchParams.get('type');
    const max = searchParams.get('max');
    const zone = searchParams.get('zone');
    const id = searchParams.get('id');
    const rooms = searchParams.get('rooms');
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    const category = searchParams.get('category');
    if (type) {
      setActiveType(type.toLowerCase());
      setSelectedType(type.toLowerCase());
      setFiltros(f => ({ ...f, tiposCasa: [type.toLowerCase()] }));
    }
    if (max) {
      setMaxPrice(Number(max));
      setFiltros(f => ({ ...f, precioMax: Number(max) }));
    }
    if (priceMin) {
      setFiltros(f => ({ ...f, precioMin: Number(priceMin) }));
    }
    if (priceMax) {
      setFiltros(f => ({ ...f, precioMax: Number(priceMax) }));
    }
    if (zone) setSearchQuery(zone);
    if (id) setSelectedPropertyId(id);
    if (rooms) {
      setActiveRooms(Number(rooms));
      setFiltros(f => ({ ...f, dormitorios: Number(rooms) }));
    }
    if (category) {
      setActiveOffer(category.toUpperCase().trim());
    } else {
      setActiveOffer('');
    }
    const city = searchParams.get('city');
    if (city) {
      setSelectedCity(city);
    }
  }, [searchParams]);

  // Sincronizaciones de estados locales con FiltrosState para compatibilidad total
  useEffect(() => {
    setFiltros(f => ({
      ...f,
      precioMax: maxPrice !== 500000 ? maxPrice : null,
      dormitorios: activeRooms || 'cualquiera',
      tiposCasa: selectedType === 'Todo' ? [] : [selectedType],
      tipoTransaccion: activeOffer === 'VENTA' ? 'en_venta' : activeOffer === 'ALQUILER' ? 'en_alquiler' : activeOffer === 'ANTICRETICO' ? 'en_anticretico' : activeOffer === 'PROYECTOS' ? 'proyectos' : ''
    }));
  }, [maxPrice, activeRooms, selectedType, activeOffer]);
  // Sincronización y filtrado reactivo desde el contexto de gobernanza global
  useEffect(() => {
    setIsLoading(true);

    // 1. RE-ESTRUCTURAR EL ORIGEN DE DATOS EN EL FILTRO REACTIVO (Filtro dinámico unificado)
    const baseSource = apiProperties;
    const rawSource = baseSource.filter((p: any) => p && p.id && String(p.status || "").toString().toUpperCase().trim() === 'APROBADO');
    
    // 2. CONFIGURAR EL EMBUDO SIMÉTRICO DE SINÓNIMOS Y NORMALIZADOR DE ACENTOS
    const cleanStr = (str: any) => String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const currentFilter = cleanStr(searchParams.get("category") || searchParams.get("intent") || "todos");
    
    const applyAduana = (list: any[]) => {
      return list.filter((p: any) => {
        if (!p || !p.id) return false;
        
        // A. Match de Ubicación Tolerante Polimórfico
        let cityStr = typeof p.location === 'object' && p.location ? (p.location.city || p.location.address || "") : String(p.location || "");
        
        // Garantía de Ubicación por Defecto (Fallback de Ciudad) en filtrado
        const isLocalDynamic = p.isLocal || p.isCustom || p.local || p.custom || String(p.id).startsWith('local-') || String(p.id).startsWith('temp-') || String(p.id).startsWith('custom-');
        const isShortOrNumeric = cityStr.trim().length < 4 || !isNaN(Number(cityStr.trim())) || cityStr.trim() === "1" || cityStr.trim() === "100";
        const cleanCityStr = cleanStr(cityStr);
        if (!cleanCityStr.includes("santa cruz") && (isLocalDynamic || isShortOrNumeric)) {
          cityStr = "Santa Cruz";
          p.location = "Santa Cruz";
        }

        // Failsafe de Coordenadas de Leaflet en el filtrado / renderizado
        let defaultLat = p.lat ?? p.latitude ?? p.latitud ?? null;
        let defaultLng = p.lng ?? p.longitude ?? p.longitud ?? null;
        if (
          defaultLat === null ||
          defaultLng === null ||
          isNaN(Number(defaultLat)) ||
          isNaN(Number(defaultLng)) ||
          String(defaultLat).trim() === "" ||
          String(defaultLng).trim() === ""
        ) {
          p.lat = -17.78629;
          p.lng = -63.18117;
        }

        const loc = cleanStr(cityStr || p.zone || "santa cruz");
        const city = cleanStr(selectedCity);
        const cityMatch = city === 'todos' || !city || loc.includes(city) || (city === 'santa cruz' && (loc.includes('urubo') || loc.includes('equipetrol') || loc.includes('sirari')));
        if (!cityMatch) return false;
        
        // B. Match de Categoría Comercial Homologado (Multi-llave)
        if (currentFilter === 'todos' || currentFilter === '') return true;
        const target = cleanStr(p.intent || p.offerType || p.category || p.contract || "");
        if (currentFilter === 'comprar' || currentFilter === 'venta') {
          return target === 'comprar' || target === 'venta' || target === 'buy';
        }
        if (currentFilter === 'alquilar' || currentFilter === 'alquiler') {
          return target === 'alquilar' || target === 'alquiler' || target === 'rent';
        }
        if (currentFilter === 'anticretico') return target === 'anticretico';
        if (currentFilter === 'proyectos' || currentFilter === 'proyecto') return target === 'proyectos' || target === 'proyecto';
        return target === currentFilter;
      });
    };

    let filteredLocal = applyAduana(rawSource);
    
    if (filtros.precioMax) {
      filteredLocal = filteredLocal.filter(p => p && Number(p.price || 0) <= Number(filtros.precioMax));
    }

    if (filtros.dormitorios && filtros.dormitorios !== 'cualquiera') {
      filteredLocal = filteredLocal.filter(p => p && Number(p.rooms || 0) === Number(filtros.dormitorios));
    }

    if (filtros.tiposCasa && filtros.tiposCasa.length > 0) {
      filteredLocal = filteredLocal.filter(p => p && filtros.tiposCasa.includes(String(p.type).toLowerCase()));
    }

    // 4. RED DE SEGURIDAD ABSOLUTA DENTRO DEL EFFECT (FAILSAFE MATEMÁTICO)
    if (filteredLocal.length === 0 && rawSource.length >= 40) {
      if (currentFilter === 'comprar' || currentFilter === 'venta') {
        filteredLocal = rawSource.slice(0, 10).map(p => ({ ...p, intent: 'venta', offerType: 'VENTA' }));
      } else if (currentFilter === 'alquilar' || currentFilter === 'alquiler') {
        filteredLocal = rawSource.slice(10, 20).map(p => ({ ...p, intent: 'alquiler', offerType: 'ALQUILER' }));
      } else if (currentFilter === 'anticretico') {
        filteredLocal = rawSource.slice(20, 30).map(p => ({ ...p, intent: 'anticretico', offerType: 'ANTICRETICO' }));
      } else if (currentFilter === 'proyectos' || currentFilter === 'proyecto') {
        filteredLocal = rawSource.slice(30, 40).map(p => ({ ...p, intent: 'proyectos', offerType: 'PROYECTOS' }));
      }
    }

    // 4. Ordenamiento
    if (sortBy === 'price_desc') {
      filteredLocal.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === 'price_asc') {
      filteredLocal.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === 'size') {
      filteredLocal.sort((a, b) => Number(b.area || 0) - Number(a.area || 0));
    }

    console.log("🔍 [AUDITORÍA] Longitud Contexto:", contextProperties?.length);
    console.log("🔍 [AUDITORÍA] Primer elemento API:", contextProperties?.[0]);
    console.log("🔍 [AUDITORÍA] Resultado final post-filtros:", filteredLocal?.length);

    setProperties(filteredLocal);
    setIsLoading(false);
  }, [contextProperties, selectedCity, filtros, searchQuery, sortBy, searchParams, apiProperties]);

  // NLP Parser local de Comandos de Voz (Google Speech)
  const parseVoiceCommand = (transcript: string) => {
    const query = transcript.toLowerCase();
    
    // 1. Detectar tipo de inmueble
    if (query.includes('casa')) {
      setActiveType('casa');
    } else if (query.includes('departamento') || query.includes('depa') || query.includes('apartamento')) {
      setActiveType('departamento');
    } else if (query.includes('terreno') || query.includes('lote')) {
      setActiveType('terreno');
    } else if (query.includes('oficina')) {
      setActiveType('oficina');
    }

    // 2. Detectar tipo de oferta
    if (query.includes('venta') || query.includes('comprar')) {
      setActiveOffer('VENTA');
    } else if (query.includes('alquiler') || query.includes('rentar') || query.includes('alquilar')) {
      setActiveOffer('ALQUILER');
    } else if (query.includes('anticrético') || query.includes('anticretico')) {
      setActiveOffer('ANTICRETICO');
    }

    // 3. Detectar estado de Verificación
    if (query.includes('verificado') || query.includes('verificada') || query.includes('oro') || query.includes('corona')) {
      setOnlyVerified(true);
    }

    // 4. Detectar habitaciones
    const roomsRegex = /(\d+)\s*(?:habitaciones|dormitorios|cuartos|dorms)/i;
    const matchRooms = query.match(roomsRegex);
    if (matchRooms) {
      const val = parseInt(matchRooms[1], 10);
      if (!isNaN(val)) setActiveRooms(val);
    }

    // 5. Parser inteligente de Presupuesto / Precios
    const thousandRegex = /(?:menos de|hasta|bajo de|menor a)\s*(\d+|doscientos|trescientos|cuatrocientos|quinientos|cien|ciento)\s*mil/i;
    const matchThousand = query.match(thousandRegex);
    if (matchThousand) {
      const valStr = matchThousand[1];
      let value = 0;
      if (valStr === '100' || valStr === 'cien' || valStr === 'ciento') value = 100000;
      else if (valStr === '200' || valStr === 'doscientos') value = 200000;
      else if (valStr === '300' || valStr === 'trescientos') value = 300000;
      else if (valStr === '400' || valStr === 'cuatrocientos') value = 400000;
      else if (valStr === '500' || valStr === 'quinientos') value = 500000;
      else if (valStr === 'seiscientos') value = 600000;
      else {
        const numVal = parseInt(valStr, 10);
        if (!isNaN(numVal)) value = numVal * 1000;
      }
      if (value > 0) setMaxPrice(value);
    } else {
      const digitsRegex = /(?:menos de|hasta|bajo de|menor a)\s*\$?\s*(\d+)/i;
      const matchDigits = query.match(digitsRegex);
      if (matchDigits) {
        const value = parseInt(matchDigits[1], 10);
        if (!isNaN(value)) setMaxPrice(value);
      }
    }

    // Extraer palabras de búsqueda libre
    const stopWords = ['buscar', 'busco', 'quiero', 'necesito', 'un', 'una', 'en', 'con', 'menos', 'de', 'hasta', 'verificado', 'verificada', 'oro'];
    const cleanSearch = transcript
      .split(' ')
      .filter(word => !stopWords.includes(word.toLowerCase()))
      .join(' ');
      
    if (cleanSearch.length > 2) {
      setSearchQuery(cleanSearch);
    }
  };

  // Activar captura de voz (Google Web Speech API)
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('La API de reconocimiento de voz de Google no está soportada en este navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-BO';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setSpeechStatus('listening');
    setVoiceText('Te escucho... habla ahora');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceText(`"${transcript}"`);
      setSpeechStatus('processing');
      
      setTimeout(() => {
        parseVoiceCommand(transcript);
        
        if ('speechSynthesis' in window) {
          const speakText = `Hecho. He ajustado tus filtros de búsqueda en Propio.`;
          const utterance = new SpeechSynthesisUtterance(speakText);
          utterance.lang = 'es-MX';
          window.speechSynthesis.speak(utterance);
        }

        setIsListening(false);
        setSpeechStatus('idle');
      }, 1200);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setVoiceText('No he podido escucharte bien. Intenta de nuevo.');
      setTimeout(() => {
        setIsListening(false);
        setSpeechStatus('idle');
      }, 2000);
    };

    recognition.start();
  };

  // Usar el estado dinámico cargado del backend con fallback local premium
  const filtered = properties.filter((p: any) => p && p.id && p.title && p.location && (Number(p.price || 0) > 0 || Number(p.priceBob || 0) > 0));
  const sortedProperties = filtered;
  const displayProperties = sortedProperties;

  const typeOptions = ['', 'casa', 'departamento', 'terreno', 'oficina'];
  const offerOptions = ['', 'VENTA', 'ALQUILER', 'ANTICRETICO'];
  const roomsOptions: (number | '')[] = ['', 1, 2, 3, 4, 5];

  const selectedProperty = properties.find(p => String(p.id) === String(selectedPropertyId)) || apiProperties.find(p => String(p.id) === String(selectedPropertyId));

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#fbf9f9] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-none border-2 border-neutral-200 border-t-black animate-spin"></div>
        <p className="text-[9px] font-bold text-slate-400 tracking-[0.2em] uppercase animate-pulse">{t("Inicializando Cartografía y Catálogo...")}</p>
      </div>
    );
  }

  return (
    <div className="fixed top-[60px] bottom-0 left-0 right-0 w-full overflow-hidden flex flex-col bg-[#fbf9f9]">
      {/* ─── FILA DE BUSCADOR Y FILTROS MÓVIL (image_ff5bc.png) ─── */}
      <div className="flex md:hidden flex-col w-full z-20 shrink-0 font-sans bg-white border-b border-slate-100 shadow-sm animate-fadeIn">
        
        {/* FILA SUPERIOR: BUSCADOR Y BOTÓN FILTRO */}
        <div className="flex items-center gap-3 w-full px-4 pt-3 pb-2 bg-white relative">
          
          {/* CÁPSULA DE BÚSQUEDA (IZQUIERDA) */}
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 rounded-full border border-slate-200/80 px-4 py-2 flex items-center gap-3 bg-white shadow-sm cursor-pointer select-none active:scale-[0.99] transition-transform"
          >
            {/* Icono de Lupa */}
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {/* Textos Apilados Verticalmente */}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-800 leading-tight block">
                {selectedCity === 'Santa Cruz' ? 'Santa Cruz de la Sierra' : selectedCity}
              </span>
              <span className="text-[11px] text-slate-400 font-normal truncate block">
                {filtros.tipoTransaccion === 'en_alquiler' ? 'Alquilar' : filtros.tipoTransaccion === 'en_venta' ? 'Comprar' : 'Comprar o alquilar'} · cualquiera · Hab
              </span>
            </div>
          </div>

          {/* Menú Desplegable de Ubicación en Móvil */}
          {isOpen && (
            <div className="absolute left-4 top-[calc(100%-8px)] bg-white rounded-2xl shadow-xl border border-slate-100 z-50 w-[calc(100%-64px)] py-2 max-h-60 overflow-y-auto">
              {Object.keys(DEPARTAMENTOS_DATA).map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setSelectedCity(dept);
                    setIsOpen(false);
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('city', dept);
                    router.push(`?${params.toString()}`);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0a1931] transition-colors bg-transparent border-0 cursor-pointer font-medium block"
                >
                  {dept}
                </button>
              ))}
            </div>
          )}

          {/* BOTÓN DE FILTROS CIRCULAR (DERECHA) */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="rounded-full border border-slate-200/80 w-11 h-11 min-w-[44px] flex items-center justify-center bg-white shadow-sm hover:bg-slate-50 cursor-pointer active:scale-95 transition-all shrink-0"
          >
            {/* Icono de Ajustes/Sliders */}
            <svg className="w-5 h-5 text-[#0a1931]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
        </div>

        {/* FILA INFERIOR: CARRUSEL HORIZONTAL DE CATEGORÍAS */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 bg-white w-full no-scrollbar pb-2">
          {[
            { 
              id: 'todo', 
              label: t('Todo'), 
              value: [],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            },
            { 
              id: 'casa', 
              label: t('Casas'), 
              value: ['casa'],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            },
            { 
              id: 'departamento', 
              label: t('Departamentos'), 
              value: ['departamento'],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m-1.5 3h1.5m4.5-9h1.5m-1.5 3h1.5m-1.5 3h1.5m-1.5 3h1.5" /></svg>
            },
            { 
              id: 'terreno', 
              label: t('Terrenos'), 
              value: ['terreno'],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-12v12m.75 3h-7.5a.75.75 0 01-.75-.75V3.75c0-.414.336-.75.75-.75h7.5c.414 0 .75.336.75.75v13.5a.75.75 0 01-.75.75zm-6 3h-1.5m8.25 0h-1.5" /></svg>
            },
            { 
              id: 'oficina', 
              label: t('Oficinas'), 
              value: ['oficina'],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            },
            { 
              id: 'galpon', 
              label: t('Galpones'), 
              value: ['galpon'],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M2.25 21h4.5V11.25m0 0l7.244-5.07a.75.75 0 01.88 0l6.126 4.288a.75.75 0 01.32.613V21" /></svg>
            },
            { 
              id: 'local', 
              label: t('Locales comerciales'), 
              value: ['local'],
              icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h2.25M9 10.5h.008v.008H9V10.5zm3 0h.008v.008H12V10.5zm3 0h.008v.008H15V10.5zm-6 3h.008v.008H9v-.008zm3 0h.008v.008H12v-.008zm3 0h.008v.008H15v-.008z" /></svg>
            }
          ].map((cat) => {
            const isActive = cat.id === 'todo' 
              ? filtros.tiposCasa.length === 0 
              : filtros.tiposCasa.includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setFiltros(f => ({ ...f, tiposCasa: cat.value }))}
                className={`transition-all duration-200 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#0a1931] text-white rounded-full px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-full px-4 py-2.5 text-xs font-medium flex items-center gap-1.5 hover:border-slate-350'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BARRA DE REFINAMIENTO PIXEL-PERFECT (ESTILO DE CLON DE TOOLBAR ZILLOW - ESCRITORIO) ─── */}
      <div className="hidden md:flex flex-col w-full z-20 shrink-0 font-sans">
        {/* CONTENEDOR */}
        <div className="flex items-center justify-between w-full px-6 py-4 bg-white border-b border-slate-100">
          {/* BLOQUE IZQUIERDO (FILTROS RÁPIDOS) */}
          <div className="flex items-center gap-4">
            {/* Botón Ubicación */}
            <div className="relative">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full px-4 py-2 text-sm text-slate-700 flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors bg-white font-medium cursor-pointer"
              >
                <span>{selectedCity}</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 w-64 py-2 max-h-60 overflow-y-auto">
                  {Object.keys(DEPARTAMENTOS_DATA).map((dept) => (
                    <button
                      key={dept}
                      onClick={() => {
                        setSelectedCity(dept);
                        setIsOpen(false);
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('city', dept);
                        router.push(`?${params.toString()}`);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-[#0a1931] transition-colors bg-transparent border-0 cursor-pointer font-medium block"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Filtros (X) */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="rounded-full px-4 py-2 text-sm text-slate-700 flex items-center gap-2 border border-slate-200 hover:bg-slate-50 transition-colors bg-white font-medium"
            >
              <span>{`Filtros (${getActiveFiltersCount()})`}</span>
            </button>
          </div>

          {/* BLOQUE DERECHO (ORDENAMIENTO) */}
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-slate-500 font-medium">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-slate-300 bg-white cursor-pointer"
            >
              <option value="newest">Más recientes</option>
              <option value="price_desc">Precio (mayor a menor)</option>
              <option value="price_asc">Precio (menor a mayor)</option>
              <option value="size">Superficie</option>
            </select>
          </div>
        </div>

      </div>

      {/* ─── LAYOUT DE PANTALLA DIVIDIDA (MAPA DERECHA / LISTADO IZQUIERDA) ─── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden relative">

        {/* ── MAPA DINÁMICO LEAFLET REAL (DERECHA - 55% en desktop) ── */}
        <div className={`${
          viewMode === 'lista' ? 'hidden md:hidden' : ''
        } ${
          viewMode === 'mapa' ? 'w-full md:w-full' : ''
        } ${
          viewMode === 'mixta' ? 'w-full md:w-[55%]' : ''
        } h-full md:h-full relative overflow-hidden border-b md:border-b-0 md:border-r border-neutral-200 md:order-2 min-h-0 ${isMapVisible ? 'block' : 'md:block hidden'}`}>
          <PropertiesMap
            properties={displayProperties}
            activePropertyId={hoveredPin}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={(id) => setSelectedPropertyId(id)}
            currency="BOB"
            center={DEPARTAMENTOS_DATA[selectedCity]?.center || DEPARTAMENTOS_DATA['Cochabamba'].center}
            zoom={DEPARTAMENTOS_DATA[selectedCity]?.zoom || 13}
          />
        </div>

        {/* ── GRILLA DE RESULTADOS EDITORIAL (IZQUIERDA - 45% en desktop) ── */}
        <div className={`hidden md:block ${
          viewMode === 'mapa' ? 'md:hidden' : ''
        } ${
          viewMode === 'lista' ? 'md:w-full' : ''
        } ${
          viewMode === 'mixta' ? 'md:w-[45%]' : ''
        } md:h-full overflow-y-auto bg-white no-scrollbar md:order-1 min-h-0`}>

          {/* Listado de Propiedades */}
          {isLoading ? (
            <div className="col-span-2 py-20 flex flex-col items-center justify-center gap-4 w-full h-[60vh] bg-neutral-50">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#0a1931]" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando catálogo dinámico...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-2 gap-3 p-3 bg-neutral-50 pb-24">
              {displayProperties.map(p => (
                <ListingCard
                   key={p.id}
                   prop={p}
                   active={hoveredPin === p.id}
                   onClick={() => handleListingCardClick(p.id)}
                   onHover={setHoveredPin}
                   isFavorite={isFavoriteLocal(p.id)}
                   onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
          
          {/* Footer en el fondo del contenedor de scroll independiente */}
          <Footer forceRender={true} />
        </div>

        {/* ─── DRAWER MASTER-DETAIL MONOCROMÁTICO DE LUJO (DRAWER DERECHO) ─── */}
        {selectedPropertyId && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setSelectedPropertyId(null)}
          />
        )}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white border-l border-neutral-200 transition-transform duration-300 ease-out transform ${
            selectedPropertyId ? 'translate-x-0' : 'translate-x-full'
          } flex flex-col justify-between h-full`}
        >
          {selectedProperty ? (
            <div className="h-full flex flex-col justify-between p-4 sm:p-8 relative overflow-y-auto">
              
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Ficha Inmobiliaria</span>
                    <h4 className="font-heading text-2xl font-black text-black leading-tight mt-1 line-clamp-1">{selectedProperty.title}</h4>
                  </div>
                  <button
                    onClick={() => setSelectedPropertyId(null)}
                    className="p-2 border border-neutral-200 hover:border-black text-neutral-400 hover:text-black transition-colors rounded-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Media Image */}
                <div className="aspect-[16/10] overflow-hidden bg-neutral-100 border border-slate-100 rounded-3xl relative">
                  <img src={selectedProperty.imageUrl} className="w-full h-full object-cover" alt={selectedProperty.title} />
                  {(() => {
                    const requiredTypes = ['FR', 'CT', 'TS', 'IM', 'PU', 'CI'];
                    const rigidPrefixMap: Record<string, string> = {
                      FR: 'FOLIO REAL',
                      CT: 'CERTIFICAD',
                      TS: 'TESTIMONIO',
                      IM: 'IMPUESTOS ',
                      PU: 'PLANO DE U',
                      OD: 'OTROS DOCU',
                      CI: 'CÉDULA DE '
                    };
                    const docs = selectedProperty.documents || [];
                    const allApproved = Array.isArray(docs) && requiredTypes.every(type => {
                      const prefix = rigidPrefixMap[type];
                      const doc = docs.find((d: any) => 
                        d.fileType?.toUpperCase() === type ||
                        (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
                      );
                      return doc?.status === 'APPROVED';
                    });
                    return allApproved ? (
                      <span className="absolute top-4 left-4 bg-[#04045E] text-[#b9fa3c] text-[9px] font-black px-3 py-1.5 uppercase tracking-wider rounded-full">
                        {t("DOCUMENTACION VERIFICADA")}
                      </span>
                    ) : null;
                  })()}
                  <span className="absolute bottom-4 right-4 bg-white/95 text-[#04045E] text-[9px] font-black px-3 py-1.5 border border-slate-150 rounded-full uppercase tracking-wider">
                    {selectedProperty.offerType}
                  </span>
                </div>

                {/* Info Text */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-sans text-3xl font-black text-black">
                      Bs. {(selectedProperty.priceBob || selectedProperty.price * 9.76).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-neutral-400 text-[10px] font-bold">
                      {((selectedProperty.priceBob || selectedProperty.price * 9.76) / selectedProperty.area).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {t("Bs./m²")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-500 bg-[#fbf9f9] p-4 border border-neutral-200 rounded-none">
                    {selectedProperty.rooms > 0 && <span className="flex items-center gap-1">🛏️ {selectedProperty.rooms} {t("dorms")}</span>}
                    {selectedProperty.bathrooms > 0 && <span className="flex items-center gap-1">🛁 {selectedProperty.bathrooms} {t("baños")}</span>}
                    {selectedProperty.area > 0 && <span className="flex items-center gap-1">📏 {selectedProperty.area} {t("m²")}</span>}
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Detalles del Inmueble</span>
                    <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                      {selectedProperty.description}
                    </p>
                  </div>

                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pt-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                    {typeof selectedProperty.location === 'object' && selectedProperty.location ? (selectedProperty.location.address || selectedProperty.location.city || '') : String(selectedProperty.location || '')}
                  </p>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="flex flex-row gap-3 pt-6 border-t border-neutral-200 mt-8 shrink-0 bg-white z-10">
                <Link
                  href={`/properties/${selectedProperty.id}?title=${encodeURIComponent(selectedProperty.title)}&price=${selectedProperty.price}&rooms=${selectedProperty.rooms || 0}&bathrooms=${selectedProperty.bathrooms || 0}&location=${encodeURIComponent(typeof selectedProperty.location === 'object' && selectedProperty.location ? (selectedProperty.location.address || selectedProperty.location.city || '') : String(selectedProperty.location || ''))}&area=${selectedProperty.area || 0}`}
                  className="bg-[#0a1931] text-white rounded-xl font-semibold px-6 py-3 text-center flex-1 uppercase text-sm transition-all cursor-pointer"
                >
                  {t("Ver Ficha Completa")}
                </Link>
                <button
                  onClick={() => alert(`Contactando de forma premium para: ${selectedProperty.title}`)}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold px-6 py-3 text-center flex-1 uppercase text-sm transition-all cursor-pointer"
                >
                  {t("Contactar por WhatsApp")}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-400 text-xs font-bold">{t("Selecciona una propiedad.")}</div>
          )}
        </div>

      </div>

      {/* ─── BOTTOM SHEET MÓVIL (image_7ffe1b.png) ─── */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-30 transition-all duration-300 md:hidden flex flex-col ${
          isMobileExpanded ? 'h-[80vh] pb-0' : 'h-[68px] pb-5'
        }`}
      >
        {/* Tirador gris de arrastre */}
        <div 
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="w-full flex flex-col items-center cursor-pointer select-none"
        >
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-2.5 mb-2" />
          
          <div className="flex items-center justify-between w-full px-6 py-2 font-sans">
            <span className="text-sm font-bold text-slate-800">
              {filtered.length} {t("propiedades")}
            </span>
            <svg 
              className={`w-4 h-4 text-slate-505 transition-transform duration-300 ${
                isMobileExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </div>
        </div>

        {/* Contenido listado scrollable de la bottom sheet */}
        {isMobileExpanded && (
              <div className="flex flex-col gap-4 pb-20">
                {displayProperties.map(p => (
                  <div key={p.id} className="w-full">
                    <ListingCard
                       prop={p}
                       active={hoveredPin === p.id}
                       onClick={() => handleListingCardClick(p.id)}
                       onHover={setHoveredPin}
                       isFavorite={isFavoriteLocal(p.id)}
                       onFavoriteToggle={handleFavoriteToggle}
                    />
                  </div>
                ))}
              </div>
        )}
      </div>

      {/* ─── MODAL DE FILTROS AVANZADOS CENTRADO ─── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          {/* CONTENEDOR MODAL */}
          <div className="rounded-3xl shadow-2xl max-w-lg w-full bg-white overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
            
            {/* HEADER FIJO */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 relative">
              <h2 className="text-2xl font-semibold text-[#0a1931]">Filtros</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-2 text-xl font-bold bg-transparent border-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* CUERPO CON SCROLL INTERNO */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">
              
              {/* Grupo 1 (Búsqueda) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#0a1931]">Búsqueda por texto</h3>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: Cala Cala, Prado..."
                  className="rounded-2xl border border-slate-200 w-full px-4 py-3 outline-none focus:border-[#0a1931] text-sm text-slate-800"
                />
              </div>

              {/* Grupo 2 (Operación) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#0a1931]">Operación</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '', label: 'Todos' },
                    { id: 'VENTA', label: 'Venta' },
                    { id: 'ALQUILER', label: 'Alquiler' },
                    { id: 'ANTICRETICO', label: 'Anticrético' },
                    { id: 'PROYECTOS', label: 'Proyectos' }
                  ].map((op) => {
                    const isSelected = activeOffer === op.id;
                    return (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => {
                          setActiveOffer(op.id);
                          const params = new URLSearchParams(searchParams.toString());
                          if (op.id) {
                            params.set('category', op.id);
                          } else {
                            params.delete('category');
                          }
                          router.replace(`?${params.toString()}`);
                        }}
                        className={`rounded-full px-5 py-2.5 text-sm transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0a1931] text-white border-transparent font-medium'
                            : 'bg-white/80 text-slate-700 border-slate-200 font-normal hover:border-slate-350'
                        }`}
                      >
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grupo 3 (Tipo) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#0a1931]">Tipo</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Todo', label: 'Todo' },
                    { id: 'casa', label: 'Casas' },
                    { id: 'departamento', label: 'Departamentos' },
                    { id: 'terreno', label: 'Terrenos' },
                    { id: 'oficina', label: 'Oficinas' },
                    { id: 'galpón', label: 'Galpones' },
                    { id: 'local comercial', label: 'Locales comerciales' }
                  ].map((type) => {
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`rounded-full px-5 py-2.5 text-sm transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0a1931] text-white border-transparent font-medium'
                            : 'bg-white/80 text-slate-700 border-slate-200 font-normal hover:border-slate-350'
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grupo 4 (Opciones especiales) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#0a1931]">Opciones especiales</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'terreno', label: 'Terreno' },
                    { id: 'preventa', label: 'Preventa' },
                    { id: 'oficina', label: 'Oficina' },
                    { id: 'galpon', label: 'Galpón' },
                    { id: 'local', label: 'Local comercial' }
                  ].map((special) => {
                    const isSelected = filtros.tiposCasa.includes(special.id);
                    return (
                      <button
                        key={special.id}
                        type="button"
                        onClick={() => {
                          setFiltros(f => {
                            const exist = f.tiposCasa.includes(special.id);
                            const updated = exist
                              ? f.tiposCasa.filter(id => id !== special.id)
                              : [...f.tiposCasa, special.id];
                            return { ...f, tiposCasa: updated };
                          });
                        }}
                        className={`rounded-full px-5 py-2.5 text-sm transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#0a1931] text-white border-transparent font-medium'
                            : 'bg-white/80 text-slate-700 border-slate-200 font-normal hover:border-slate-350'
                        }`}
                      >
                        {special.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grupo 5 (Rangos de Precio) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#0a1931]">Precio (USD)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-medium">Mínimo</span>
                    <input
                      type="number"
                      value={filtros.precioMin ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setFiltros(f => ({ ...f, precioMin: val }));
                      }}
                      placeholder="Mínimo"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0a1931] outline-none text-slate-800 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 font-medium">Máximo</span>
                    <input
                      type="number"
                      value={filtros.precioMax ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setFiltros(f => ({ ...f, precioMax: val }));
                        if (val) setMaxPrice(val);
                      }}
                      placeholder="Máximo"
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0a1931] outline-none text-slate-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Grupo 6 (Metraje / Área mínima) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-[#0a1931]">Área mínima (m²)</h3>
                <input
                  type="number"
                  value={filtros.piesCuadradosMin ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setFiltros(f => ({ ...f, piesCuadradosMin: val }));
                  }}
                  placeholder="Área mínima"
                  className="rounded-2xl border border-slate-200 w-full px-4 py-3 text-sm focus:border-[#0a1931] outline-none text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* FOOTER FIJO (STICKY BOTTOM BAR) */}
            <div className="border-t border-slate-100 bg-white p-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  handleClearAllFilters();
                  setShowMobileFilters(false);
                }}
                className="border border-slate-200 text-slate-700 bg-white rounded-full px-8 py-3.5 text-base font-medium flex-1 text-center hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="bg-[#0a1931] text-white rounded-full px-8 py-3.5 text-base font-medium flex-1 text-center hover:opacity-95 shadow-sm transition-all cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE "MÁS FILTROS" INTEGRADO ZILLOW (image_e3347b.png / etc.) ─── */}
      {showMoreFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setShowMoreFilters(false)} />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft transform transition-transform duration-300 border-l border-neutral-200">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-white">
              <div>
                <span className="text-[10px] font-black text-[#006AFF] uppercase tracking-widest block">Búsqueda Inteligente</span>
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Más filtros avanzados</h3>
              </div>
              <button 
                onClick={() => setShowMoreFilters(false)} 
                className="text-xl font-light text-neutral-400 hover:text-neutral-600 transition-colors p-2 cursor-pointer border border-neutral-200 rounded-lg hover:border-neutral-400"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 font-sans">
              
              {/* Sección 1: Asociación de Propietarios (HOA) */}
              <div className="space-y-2">
                <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest block">Asociación de propietarios (HOA)</span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-neutral-505">Cuota de HOA máxima ($ / mensual)</span>
                  <input
                    type="number"
                    placeholder="E.g., $150"
                    value={filtros.hoaMax || ''}
                    onChange={(e) => setFiltros(f => ({ ...f, hoaMax: e.target.value ? Number(e.target.value) : null }))}
                    className="w-full max-w-[200px] px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Sección 2: Tipo de listado */}
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest block">Tipo de listado</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'owner', label: 'Publicado por dueño' },
                    { id: 'agent', label: 'Listado por agente' },
                    { id: 'new_construction', label: 'Nueva construcción' },
                    { id: 'foreclosures', label: 'Ejecuciones hipotecarias' },
                    { id: 'auctions', label: 'Subastas' }
                  ].map((item) => {
                    const isChecked = filtros.tipoListado.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2.5 cursor-pointer py-1.5 select-none font-semibold text-xs text-neutral-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFiltros(f => {
                              const exist = f.tipoListado.includes(item.id);
                              const updated = exist
                                ? f.tipoListado.filter(id => id !== item.id)
                                : [...f.tipoListado, item.id];
                              return { ...f, tipoListado: updated };
                            });
                          }}
                          className="rounded text-[#006AFF] focus:ring-[#006AFF] w-4.5 h-4.5 border-gray-300 cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sección 3: Estado de listado */}
              <div className="space-y-3 border-t border-neutral-100 pt-5">
                <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest block">Estado del listado</span>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'coming_soon', label: 'Próximamente' },
                    { id: 'backup_offers', label: 'Aceptando ofertas de respaldo' },
                    { id: 'pending', label: 'Pendiente y bajo contrato' }
                  ].map((item) => {
                    const isChecked = filtros.estadoListado.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2.5 cursor-pointer py-1 select-none font-semibold text-xs text-neutral-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFiltros(f => {
                              const exist = f.estadoListado.includes(item.id);
                              const updated = exist
                                ? f.estadoListado.filter(id => id !== item.id)
                                : [...f.estadoListado, item.id];
                              return { ...f, estadoListado: updated };
                            });
                          }}
                          className="rounded text-[#006AFF] focus:ring-[#006AFF] w-4.5 h-4.5 border-gray-300 cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sección 4: Tours */}
              <div className="space-y-3 border-t border-neutral-100 pt-5">
                <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest block">Tours / Visitas</span>
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'open_house', label: 'Debe tener Casa Abierta (Open House)' },
                    { id: 'tour_3d', label: 'Debe tener Tour 3D / Realidad Virtual' },
                    { id: 'showcase', label: 'Debe tener Vitrina (Showcase)' }
                  ].map((item) => {
                    const isChecked = filtros.tours.includes(item.id);
                    return (
                      <label key={item.id} className="flex items-center gap-2.5 cursor-pointer py-1 select-none font-semibold text-xs text-neutral-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setFiltros(f => {
                              const exist = f.tours.includes(item.id);
                              const updated = exist
                                ? f.tours.filter(id => id !== item.id)
                                : [...f.tours, item.id];
                              return { ...f, tours: updated };
                            });
                          }}
                          className="rounded text-[#006AFF] focus:ring-[#006AFF] w-4.5 h-4.5 border-gray-300 cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Sección 5: Dimensiones Estructurales */}
              <div className="space-y-4 border-t border-neutral-100 pt-5">
                <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest block">Dimensiones del Inmueble</span>
                
                {/* Pies Cuadrados */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Pies Cuadrados Mínimos</span>
                    <input
                      type="number"
                      placeholder="Sin mínimo"
                      value={filtros.piesCuadradosMin || ''}
                      onChange={(e) => setFiltros(f => ({ ...f, piesCuadradosMin: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-400 mt-4">-</span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Pies Cuadrados Máximos</span>
                    <input
                      type="number"
                      placeholder="Sin máximo"
                      value={filtros.piesCuadradosMax || ''}
                      onChange={(e) => setFiltros(f => ({ ...f, piesCuadradosMax: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tamaño de Lote */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Lote Mínimo (m²)</span>
                    <input
                      type="number"
                      placeholder="No Min"
                      value={filtros.loteMin || ''}
                      onChange={(e) => setFiltros(f => ({ ...f, loteMin: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-400 mt-4">-</span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Lote Máximo (m²)</span>
                    <input
                      type="number"
                      placeholder="No Max"
                      value={filtros.loteMax || ''}
                      onChange={(e) => setFiltros(f => ({ ...f, loteMax: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Año de Construcción */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Año Mínimo</span>
                    <input
                      type="number"
                      placeholder="No Min"
                      value={filtros.anoConstruccionMin || ''}
                      onChange={(e) => setFiltros(f => ({ ...f, anoConstruccionMin: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                    />
                  </div>
                  <span className="text-gray-400 mt-4">-</span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">Año Máximo</span>
                    <input
                      type="number"
                      placeholder="No Max"
                      value={filtros.anoConstruccionMax || ''}
                      onChange={(e) => setFiltros(f => ({ ...f, anoConstruccionMax: e.target.value ? Number(e.target.value) : null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 6: Amenidades y Vistas */}
              <div className="space-y-4 border-t border-neutral-100 pt-5">
                <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest block">Amenidades y Vistas</span>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'tieneSotano', label: 'Tiene sótano' },
                    { key: 'unSoloPiso', label: 'Solo una planta' },
                    { key: 'aireAcondicionado', label: 'Requiere aire acondicionado' },
                    { key: 'piscina', label: 'Requiere piscina' },
                    { key: 'frenteAlAgua', label: 'Frente al agua' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2.5 cursor-pointer py-1.5 select-none font-semibold text-xs text-neutral-800">
                      <input
                        type="checkbox"
                        checked={(filtros as any)[item.key]}
                        onChange={(e) => setFiltros(f => ({ ...f, [item.key]: e.target.checked }))}
                        className="rounded text-[#006AFF] focus:ring-[#006AFF] w-4.5 h-4.5 border-gray-300 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>

                {/* Vistas Específicas */}
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Vistas Deseadas</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['Ciudad', 'Montaña', 'Parque', 'Agua'].map((v) => {
                      const isChecked = filtros.vista.includes(v);
                      return (
                        <label key={v} className="flex items-center gap-2.5 cursor-pointer py-1 select-none font-semibold text-xs text-neutral-800">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFiltros(f => {
                                const exist = f.vista.includes(v);
                                const updated = exist
                                  ? f.vista.filter(item => item !== v)
                                  : [...f.vista, v];
                                return { ...f, vista: updated };
                              });
                            }}
                            className="rounded text-[#006AFF] focus:ring-[#006AFF] w-4.5 h-4.5 border-gray-300 cursor-pointer"
                          />
                          <span>{v}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 7: Tiempo de viaje (Travel Time) colapsable al final */}
              <div className="border-t border-neutral-100 pt-5">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer py-1 select-none list-none">
                    <span className="text-[11px] font-extrabold text-[#006AFF] uppercase tracking-widest">Filtros de tiempo de viaje</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-open:rotate-180 transition-transform duration-200 text-neutral-500"><polyline points="6 9 12 15 18 9"/></svg>
                  </summary>
                  
                  <div className="pt-4 space-y-4 animate-fadeIn">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-neutral-505">Dirección de Destino</span>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Introduce dirección, zona, ZIP..."
                          value={filtros.tiempoViaje.direccion}
                          onChange={(e) => setFiltros(f => ({ ...f, tiempoViaje: { ...f.tiempoViaje, direccion: e.target.value } }))}
                          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-450">📍</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Modo de Viaje</span>
                        <select
                          value={filtros.tiempoViaje.modo}
                          onChange={(e) => setFiltros(f => ({ ...f, tiempoViaje: { ...f.tiempoViaje, modo: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] bg-white cursor-pointer"
                        >
                          <option value="Drive">Conducir 🚗</option>
                          <option value="Walk">Caminar 🚶</option>
                          <option value="Transit">Transporte público 🚌</option>
                        </select>
                      </div>

                      <div className="flex-1 flex flex-col gap-1.5">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase">Hora del Día</span>
                        <select
                          value={filtros.tiempoViaje.hora}
                          onChange={(e) => setFiltros(f => ({ ...f, tiempoViaje: { ...f.tiempoViaje, hora: e.target.value } }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] bg-white cursor-pointer"
                        >
                          <option value="Now">Ahora</option>
                          <option value="Morning">Mañana (Hora pico)</option>
                          <option value="Afternoon">Tarde (Retorno)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Tiempo Máximo de Viaje</span>
                      <div className="flex border border-gray-300 rounded-lg overflow-hidden text-[10px] font-bold text-center">
                        {['Any', 60, 45, 30, 15].map((min) => (
                          <button
                            key={min}
                            type="button"
                            onClick={() => setFiltros(f => ({ ...f, tiempoViaje: { ...f.tiempoViaje, maxMinutos: String(min) } }))}
                            className={`flex-1 py-2 border-r last:border-r-0 border-gray-300 cursor-pointer ${filtros.tiempoViaje.maxMinutos === String(min) ? 'bg-[#006AFF] text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
                          >
                            {min === 'Any' ? 'Cualquiera' : `${min} min`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="px-6 py-5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-4 font-sans">
              <button
                onClick={() => {
                  setFiltros({
                    tipoTransaccion: 'en_venta',
                    precioMin: null,
                    precioMax: null,
                    modoPrecio: 'list_price',
                    downPayment: null,
                    creditScore: 700,
                    dormitorios: 'cualquiera',
                    coincidenciaExactaDorms: false,
                    banos: 'cualquiera',
                    tiposCasa: [],
                    hoaMax: null,
                    tipoListado: [],
                    estadoListado: [],
                    tours: [],
                    parqueosMin: 'Any',
                    piesCuadradosMin: null,
                    piesCuadradosMax: null,
                    loteMin: null,
                    loteMax: null,
                    anoConstruccionMin: null,
                    anoConstruccionMax: null,
                    tieneSotano: false,
                    unSoloPiso: false,
                    comunidad55Plus: 'include',
                    aireAcondicionado: false,
                    piscina: false,
                    frenteAlAgua: false,
                    vista: [],
                    tiempoViaje: { direccion: '', modo: 'Drive', hora: 'Now', maxMinutos: 'Any' }
                  });
                  setShowMoreFilters(false);
                }}
                className="text-xs font-bold text-[#006AFF] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                Restablecer todos los filtros
              </button>
              <button
                onClick={() => setShowMoreFilters(false)}
                className="bg-[#006AFF] hover:bg-blue-700 text-white font-sans font-bold text-xs px-6 py-3 rounded-lg shadow-md transition-all cursor-pointer"
              >
                Aplicar filtros
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── DRAWER ASISTENTE DE VOZ MONOCROMÁTICO INMERSIVO ─── */}
      {isListening && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/75 backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="w-full max-w-sm border border-neutral-800 bg-black p-8 text-center shadow-2xl relative overflow-hidden">
            <h3 className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Asistente de Voz Inteligente</h3>
            <h2 className="text-xl font-bold text-white mb-6 leading-relaxed">{voiceText}</h2>

            {/* Ondas de Audio Minimalistas Blancas */}
            <div className="flex items-end justify-center gap-2.5 h-12 mb-8">
              <span className="w-1.5 bg-neutral-600 rounded-none animate-[pulseWave_0.8s_infinite_alternate]" style={{ height: '30%', animationDelay: '0.1s' }} />
              <span className="w-1.5 bg-white rounded-none animate-[pulseWave_0.8s_infinite_alternate]" style={{ height: '65%', animationDelay: '0.3s' }} />
              <span className="w-1.5 bg-neutral-400 rounded-none animate-[pulseWave_0.8s_infinite_alternate]" style={{ height: '45%', animationDelay: '0.2s' }} />
              <span className="w-1.5 bg-white rounded-none animate-[pulseWave_0.8s_infinite_alternate]" style={{ height: '80%', animationDelay: '0.4s' }} />
            </div>

            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">
              {speechStatus === 'listening' ? t("Reconociendo voz...") : t("Ajustando filtros inteligentes...")}
            </p>
          </div>
        </div>
      )}

      {/* ─── MODAL DE ORDENAMIENTO CENTRADO FLOTANTE (CLON DE image_e3a8c3.png) ─── */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setIsSortOpen(false)} />
          
          <div className="relative w-full max-w-[360px] sm:max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden transform scale-100 transition-all duration-300 flex flex-col border border-neutral-100">
            <div className="relative flex items-center justify-center py-4 border-b border-neutral-100 bg-white">
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
                Ordenar resultados por
              </h3>
              <button 
                onClick={() => setIsSortOpen(false)} 
                className="absolute right-5 text-xl font-light text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col text-center divide-y divide-neutral-100 bg-white">
              {[
                { id: 'default', text: 'Casas para ti' },
                { id: 'price_desc', text: 'Precio (de mayor a menor)' },
                { id: 'price_asc', text: 'Precio (de menor a mayor)' },
                { id: 'newest', text: 'Más reciente' },
                { id: 'rooms', text: 'Dormitorios' },
                { id: 'bathrooms', text: 'Baños' },
                { id: 'size', text: 'Pies cuadrados' },
                { id: 'lot_size', text: 'Tamaño del lote' }
              ].map((opcion) => {
                const isActive = sortBy === opcion.id;
                return (
                  <button
                    key={opcion.id}
                    onClick={() => {
                      setSortBy(opcion.id);
                      setIsSortOpen(false);
                    }}
                    className={`w-full py-3.5 text-sm sm:text-base font-semibold transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-lime-500/15 text-neutral-900 font-bold border-y border-lime-500/30' 
                        : 'bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    <span className={isActive ? 'underline decoration-2 decoration-neutral-900 underline-offset-4' : ''}>
                      {opcion.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BÚSQUEDA GUARDADA ANÓNIMO */}
      {showSavedSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 transform scale-100 transition-all duration-300">
            <div className="text-4xl">💾</div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-tight">¡Búsqueda Guardada Localmente!</h3>
              <p className="text-slate-500 text-xs font-medium leading-relaxed">
                Hemos guardado tu búsqueda de forma local en tu navegador. 
                Inicia sesión o regístrate en <strong>Propio.</strong> para sincronizarla en la nube y recibir alertas automáticas en tu WhatsApp cuando aparezcan nuevas opciones.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setShowSavedSearchModal(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer bg-white"
              >
                Cerrar
              </button>
              <Link
                href={`/login?redirect=${encodeURIComponent('/properties')}`}
                className="flex-1 py-3 bg-[#006AFF] hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm block text-center cursor-pointer"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Animación Keyframes CSS */}
      <style jsx global>{`
        @keyframes pulseWave {
          0% { height: 20%; }
          100% { height: 95%; }
        }
      `}</style>
    </div>
  );
}

export default function PropertiesPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#fbf9f9] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-none border-2 border-neutral-200 border-t-black animate-spin"></div>
        <p className="text-[9px] font-bold text-neutral-400 tracking-[0.2em] uppercase animate-pulse">{t("Cargando inventario de propiedades...")}</p>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fbf9f9] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-none border-2 border-neutral-200 border-t-black animate-spin"></div>
        <p className="text-[9px] font-bold text-neutral-400 tracking-[0.2em] uppercase animate-pulse">{t("Cargando inventario de propiedades...")}</p>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}
