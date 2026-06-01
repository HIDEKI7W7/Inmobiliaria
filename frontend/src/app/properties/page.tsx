'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DaysOnMarketBadge } from '@/components/ui/DaysOnMarketBadge';
import { PriceTrendChart } from '@/components/ui/PriceTrendChart';
import { PropertyAlertForm } from '@/components/ui/PropertyAlertForm';
import dynamic from 'next/dynamic';
import { Property } from '@/components/modules/properties/PropertyCard';
import { LogoIcon } from '../page';
import { Footer } from '@/components/ui/Footer';
import { apiClient } from '@/services/api.client';

const t = (key: string) => key;

// Carga dinámica del mapa real con Leaflet (ssr: false para evitar errores de window/document)
const MapWrapper = dynamic(() => import('@/components/modules/properties/MapWrapper'), {
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
  offerType: 'VENTA' | 'ALQUILER' | 'ANTICRETICO';
  lotSize?: number;
}

// ─── Datos Geográficos Reales de Cochabamba ────────────────────────────────────────────────
const ALL_PROPERTIES: EnhancedProperty[] = [
  {
    id: 'prop-1-cala-cala',
    title: 'Casa Familiar en Cala Cala',
    description: 'Espléndida residencia de dos plantas ubicada en una de las zonas más exclusivas de Cochabamba. Cuenta con jardín interior privado, churrasquera cubierta y acabados de primera calidad.',
    price: 320000,
    priceBob: 3200000,
    area: 350,
    rooms: 5,
    bathrooms: 4,
    location: 'Cala Cala, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    lat: -17.3680,
    lng: -66.1590,
    type: 'casa',
    verified: true,
    priceLabel: '$320K',
    offerType: 'VENTA'
  },
  {
    id: 'prop-2-queru-queru',
    title: 'Penthouse de Lujo en Queru Queru',
    description: 'Espectacular penthouse de estreno ubicado en el último piso del Edificio Skyview. Terraza panorámica con jacuzzi, acabados europeos y domótica integrada.',
    price: 185000,
    priceBob: 1850000,
    area: 195,
    rooms: 4,
    bathrooms: 3,
    location: 'Queru Queru, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    lat: -17.3695,
    lng: -66.1480,
    type: 'departamento',
    verified: true,
    priceLabel: '$185K',
    offerType: 'VENTA'
  },
  {
    id: 'prop-3-el-prado',
    title: 'Departamento Moderno en El Prado',
    description: 'Departamento de 2 habitaciones recién remodelado en pleno Prado. Cocina americana integrada, balcón privado y portería 24h. Ideal para profesionales y ejecutivos.',
    price: 95000,
    priceBob: 950000,
    area: 85,
    rooms: 2,
    bathrooms: 2,
    location: 'El Prado, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    lat: -17.3820,
    lng: -66.1560,
    type: 'departamento',
    verified: false,
    priceLabel: '$95K',
    offerType: 'ALQUILER'
  },
  {
    id: 'prop-4-sarco',
    title: 'Terreno Comercial en Sarco',
    description: 'Excelente terreno comercial de alta plusvalía en zona de alto tráfico en Sarco. Ideal para proyectos corporativos o inmobiliarios multifamiliares.',
    price: 48000,
    priceBob: 480000,
    area: 400,
    rooms: 0,
    bathrooms: 0,
    location: 'Sarco, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
    lat: -17.3800,
    lng: -66.1750,
    type: 'terreno',
    verified: true,
    priceLabel: '$48K',
    offerType: 'VENTA'
  },
  {
    id: 'prop-5-mayorazgo',
    title: 'Oficina Premium en Mayorazgo',
    description: 'Oficina moderna corporativa con divisiones de vidrio templado, aire acondicionado y dos parqueos subterráneos. Seguridad 24 horas y sala de reuniones común.',
    price: 135000,
    priceBob: 1350000,
    area: 120,
    rooms: 0,
    bathrooms: 2,
    location: 'Mayorazgo, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    lat: -17.3650,
    lng: -66.1700,
    type: 'oficina',
    verified: true,
    priceLabel: '$135K',
    offerType: 'VENTA'
  },
  {
    id: 'prop-6-muyurina',
    title: 'Casa de Campo en Muyurina',
    description: 'Hermosa finca campestre con amplias áreas verdes, árboles frutales y piscina privada. Ideal para escapar de la rutina urbana o desarrollo turístico.',
    price: 220000,
    priceBob: 2200000,
    area: 480,
    rooms: 6,
    bathrooms: 4,
    location: 'Muyurina, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    lat: -17.3780,
    lng: -66.1380,
    type: 'casa',
    verified: false,
    priceLabel: '$220K',
    offerType: 'VENTA'
  }
];

// ─── Tarjeta de Listado del Inventario (Estilo Monocromático de Lujo) ─────────────────
function ListingCard({ prop, active, onClick, onHover }: {
  prop: EnhancedProperty;
  active: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <article
      onClick={onClick}
      className={`bg-white cursor-pointer overflow-hidden border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col ${active ? 'bg-neutral-50/50 ring-2 ring-black' : ''}`}
      onMouseEnter={() => onHover(prop.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 shrink-0">
        <img 
          src={prop.imageUrl} 
          alt={prop.title} 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-103" 
        />
        {prop.verified && (
          <span className="absolute top-4 left-4 bg-[#04045E] text-[#b9fa3c] text-[8px] font-black px-2.5 py-1.5 uppercase tracking-wider rounded-full shadow z-10">
            {t("VERIFICADO SELLO ORO")}
          </span>
        )}
        <span className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm text-[#04045E] text-[8px] font-black px-2.5 py-1.5 uppercase tracking-wider border border-slate-150 rounded-full shadow-sm z-10">
          {prop.offerType}
        </span>
      </div>
      
      <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline gap-2">
            <span className="font-serif text-2xl font-black text-black block">
              ${prop.price.toLocaleString()}
            </span>
          </div>
          <h3 className="font-sans text-sm font-bold text-[#04045E] tracking-tight group-hover:text-opacity-80 transition-all leading-snug line-clamp-1">
            {prop.title}
          </h3>
          <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate">{prop.location}</span>
          </p>
        </div>

        <div className="flex gap-4 pt-3 border-t border-neutral-100 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
          {prop.rooms > 0 && <span>{prop.rooms} {t("Dorms")}</span>}
          {prop.bathrooms > 0 && <span>{prop.bathrooms} {t("Baños")}</span>}
          <span>{prop.area} {t("m²")}</span>
        </div>
        
        <div className="pt-1 flex items-center justify-between">
          <DaysOnMarketBadge propertyId={prop.id} size="sm" />
        </div>
      </div>
    </article>
  );
}

// ─── Contenido del Buscador ────────────────────────────────────────────────────────
function PropertiesContent() {
  const searchParams = useSearchParams();
  const [maxPrice, setMaxPrice] = useState(500000);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [activeType, setActiveType] = useState<string>('');
  const [activeOffer, setActiveOffer] = useState<string>('');
  const [activeRooms, setActiveRooms] = useState<number | ''>('');
  const [isMapView, setIsMapView] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('default');

  // Estados del asistente de voz Google Speech
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'listening' | 'processing' | 'idle'>('idle');

  // ─── ESTADO GLOBAL DE FILTRADO ZILLOW (FiltrosState) ───────────────────────────
  const [filtros, setFiltros] = useState({
    tipoTransaccion: 'en_venta', // 'en_venta', 'en_alquiler', 'vendido'
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

  const [properties, setProperties] = useState<EnhancedProperty[]>(ALL_PROPERTIES);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Control de dropdowns activos
  const [activeDropdown, setActiveDropdown] = useState<'transaction' | 'price_range' | 'rooms_baths' | 'home_type' | 'more_filters' | null>(null);

  // Prefiltrar desde query params
  useEffect(() => {
    const type = searchParams.get('type');
    const max = searchParams.get('max');
    const zone = searchParams.get('zone');
    const id = searchParams.get('id');
    const rooms = searchParams.get('rooms');
    if (type) {
      setActiveType(type.toLowerCase());
      setFiltros(f => ({ ...f, tiposCasa: [type.toLowerCase()] }));
    }
    if (max) {
      setMaxPrice(Number(max));
      setFiltros(f => ({ ...f, precioMax: Number(max) }));
    }
    if (zone) setSearchQuery(zone);
    if (id) setSelectedPropertyId(id);
    if (rooms) {
      setActiveRooms(Number(rooms));
      setFiltros(f => ({ ...f, dormitorios: Number(rooms) }));
    }
  }, [searchParams]);

  // Sincronizaciones de estados locales con FiltrosState para compatibilidad total
  useEffect(() => {
    setFiltros(f => ({
      ...f,
      precioMax: maxPrice !== 500000 ? maxPrice : null,
      dormitorios: activeRooms || 'cualquiera',
      tiposCasa: activeType ? [activeType] : [],
      tipoTransaccion: activeOffer === 'ALQUILER' || activeOffer === 'ANTICRETICO' ? 'en_alquiler' : activeOffer === 'VENTA' ? 'en_venta' : f.tipoTransaccion
    }));
  }, [maxPrice, activeRooms, activeType, activeOffer]);

  // Petición HTTP al Backend NestJS con fallback local a prueba de fallos
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filtros.tipoTransaccion) queryParams.append('tipoTransaccion', filtros.tipoTransaccion);
        if (filtros.precioMin) queryParams.append('precioMin', String(filtros.precioMin));
        if (filtros.precioMax) queryParams.append('precioMax', String(filtros.precioMax));
        if (filtros.dormitorios !== 'cualquiera') {
          queryParams.append('dormitorios', String(filtros.dormitorios));
          if (filtros.coincidenciaExactaDorms) {
            queryParams.append('coincidenciaExactaDorms', 'true');
          }
        }
        if (filtros.banos !== 'cualquiera') queryParams.append('banos', String(filtros.banos));
        if (filtros.tiposCasa.length > 0) {
          queryParams.append('tiposCasa', filtros.tiposCasa.join(','));
        }
        if (filtros.piesCuadradosMin) queryParams.append('piesCuadradosMin', String(filtros.piesCuadradosMin));
        if (filtros.piesCuadradosMax) queryParams.append('piesCuadradosMax', String(filtros.piesCuadradosMax));
        if (searchQuery) queryParams.append('text', searchQuery);

        if (sortBy !== 'default') {
          if (sortBy === 'price_desc') {
            queryParams.append('sortBy', 'price');
            queryParams.append('sortDir', 'desc');
          } else if (sortBy === 'price_asc') {
            queryParams.append('sortBy', 'price');
            queryParams.append('sortDir', 'asc');
          } else if (sortBy === 'size') {
            queryParams.append('sortBy', 'area');
            queryParams.append('sortDir', 'desc');
          } else if (sortBy === 'newest') {
            queryParams.append('sortBy', 'createdAt');
            queryParams.append('sortDir', 'desc');
          }
        }

        const res = await apiClient.get<any>(`/properties?${queryParams.toString()}`);
        if (res && res.data) {
          setProperties(res.data);
        }
      } catch (err) {
        console.warn('Conexión con backend falló, usando filtrado reactivo local premium:', err);
        // Filtrado reactivo en local
        const localFiltered = ALL_PROPERTIES.filter(p => {
          if (onlyVerified && !p.verified) return false;
          if (filtros.tipoTransaccion === 'en_venta' && p.offerType !== 'VENTA') return false;
          if (filtros.tipoTransaccion === 'en_alquiler' && !['ALQUILER', 'ANTICRETICO'].includes(p.offerType)) return false;
          if (filtros.tipoTransaccion === 'vendido' && p.status !== 'VENDIDO') return false;

          if (filtros.precioMin && p.price < filtros.precioMin) return false;
          if (filtros.precioMax && p.price > filtros.precioMax) return false;

          if (filtros.dormitorios !== 'cualquiera') {
            const minRooms = Number(filtros.dormitorios);
            if (filtros.coincidenciaExactaDorms) {
              if (p.rooms !== minRooms) return false;
            } else {
              if (p.rooms < minRooms) return false;
            }
          }
          if (filtros.banos !== 'cualquiera' && p.bathrooms < Number(filtros.banos)) return false;
          if (filtros.tiposCasa.length > 0 && !filtros.tiposCasa.includes(p.type)) return false;

          if (searchQuery) {
            const match = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
            if (!match) return false;
          }
          return true;
        });

        // Ordenamiento local
        const sorted = [...localFiltered].sort((a, b) => {
          if (sortBy === 'price_desc') return b.price - a.price;
          if (sortBy === 'price_asc') return a.price - b.price;
          if (sortBy === 'rooms') return b.rooms - a.rooms;
          if (sortBy === 'bathrooms') return b.bathrooms - a.bathrooms;
          if (sortBy === 'size') return b.area - a.area;
          if (sortBy === 'lot_size') return (b.lotSize || b.area || 0) - (a.lotSize || a.area || 0);
          if (sortBy === 'newest') return b.id.localeCompare(a.id);
          return 0;
        });

        setProperties(sorted);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [filtros, searchQuery, sortBy, onlyVerified]);

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
  const filtered = properties;
  const sortedProperties = properties;

  const typeOptions = ['', 'casa', 'departamento', 'terreno', 'oficina'];
  const offerOptions = ['', 'VENTA', 'ALQUILER', 'ANTICRETICO'];
  const roomsOptions: (number | '')[] = ['', 1, 2, 3, 4, 5];

  const selectedProperty = ALL_PROPERTIES.find(p => p.id === selectedPropertyId);

  return (
    <div className="flex flex-col h-[calc(100vh-76px)] overflow-hidden bg-[#fbf9f9]">
      {/* ─── BARRA DE REFINAMIENTO PIXEL-PERFECT (ESTILO DE CLON DE TOOLBAR ZILLOW) ─── */}
      <div className="flex flex-wrap items-center gap-2.5 p-3 bg-white border-b border-gray-200 w-full z-20 relative font-sans">
        
        {/* Caja de Búsqueda inteligente con Lupa, Limpieza, Voz y Botón de Filtros en Móvil */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 md:flex-initial">
          <div className="relative w-full max-w-md flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("Buscar por Cochabamba, zona...")}
              className="w-full px-4 py-2.5 pr-24 border border-gray-300 rounded-lg text-sm font-normal text-neutral-800 focus:outline-none focus:border-[#006AFF] bg-white shadow-sm transition-all focus:ring-0"
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-neutral-400">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="p-1 hover:text-neutral-850 transition-colors"
                  title={t("Limpiar búsqueda")}
                >
                  <span className="text-[12px] font-bold">✕</span>
                </button>
              )}
              {/* Lupa de búsqueda Zillow style */}
              <button
                className="p-1 hover:text-[#006AFF] transition-colors"
                title={t("Buscar")}
              >
                <svg className="w-4 h-4 text-neutral-500 hover:text-[#006AFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              {/* Asistente de Voz */}
              <button
                onClick={startVoiceSearch}
                className="p-1 hover:text-[#006AFF] transition-colors"
                title={t("Búsqueda por voz inteligente")}
              >
                <svg className="h-4 w-4 fill-current text-neutral-500 hover:text-[#006AFF]" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Botón de Filtros en Móvil */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center justify-center gap-1.5 text-[11px] font-bold px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-neutral-800 hover:border-neutral-400 transition-all shrink-0"
          >
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span>{t("Filtros")}</span>
          </button>
        </div>

        {/* ─── FILTROS DE ESCRITORIO (hidden md:flex) ─── */}
        <div className="hidden md:flex items-center gap-2 z-20">
          
          {/* Píldora 1: Tipo de Transacción (venta, alquiler, vendido) */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'transaction' ? null : 'transaction')}
              className={
                filtros.tipoTransaccion !== 'en_venta'
                  ? "flex items-center gap-2 px-4 py-2.5 bg-[#e7f4ff] border-2 border-[#006AFF] rounded-lg text-sm font-medium text-[#006AFF] transition-all cursor-pointer"
                  : "flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-neutral-800 hover:border-neutral-400 transition-all cursor-pointer"
              }
            >
              <span>
                {filtros.tipoTransaccion === 'en_venta' ? t('En venta') :
                 filtros.tipoTransaccion === 'en_alquiler' ? t('En alquiler') : t('Vendido')}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'transaction' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            
            {activeDropdown === 'transaction' && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg p-4 z-30 min-w-[220px] flex flex-col gap-3 shadow-lg animate-fadeIn">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tipo transacción</span>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'en_venta', label: 'En venta' },
                      { value: 'en_alquiler', label: 'En alquiler' },
                      { value: 'vendido', label: 'Vendido' }
                    ].map((op) => (
                      <label key={op.value} className="flex items-center gap-2.5 cursor-pointer font-semibold text-xs text-neutral-800 select-none">
                        <input
                          type="radio"
                          name="tipoTransaccion"
                          value={op.value}
                          checked={filtros.tipoTransaccion === op.value}
                          onChange={() => setFiltros(f => ({ ...f, tipoTransaccion: op.value }))}
                          className="w-4 h-4 text-[#006AFF] focus:ring-blue-600 border-gray-300 rounded-full"
                        />
                        <span>{op.label}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="w-full bg-[#006AFF] hover:bg-blue-700 text-white font-sans font-bold py-2 text-xs rounded-lg transition-all mt-1 cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Píldora 2: Rango de Precios & Calculadora Financiera */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'price_range' ? null : 'price_range')}
              className={
                filtros.precioMin !== null || filtros.precioMax !== null
                  ? "flex items-center gap-2 px-4 py-2.5 bg-[#e7f4ff] border-2 border-[#006AFF] rounded-lg text-sm font-medium text-[#006AFF] transition-all cursor-pointer"
                  : "flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-neutral-800 hover:border-neutral-400 transition-all cursor-pointer"
              }
            >
              <span>
                {filtros.precioMin || filtros.precioMax
                  ? `${filtros.precioMin ? `$${(filtros.precioMin / 1000)}k` : '$0'} - ${filtros.precioMax ? `$${(filtros.precioMax / 1000)}k` : 'Any'}`
                  : t("Precio")}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'price_range' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {activeDropdown === 'price_range' && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg p-5 z-30 w-[340px] flex flex-col gap-4 shadow-lg animate-fadeIn">
                  {/* Tabs */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs font-bold text-center">
                    <button
                      onClick={() => setFiltros(f => ({ ...f, modoPrecio: 'list_price' }))}
                      className={`flex-1 py-2 cursor-pointer transition-all ${filtros.modoPrecio === 'list_price' ? 'bg-[#e7f4ff] text-[#006AFF] border-r border-[#006AFF] font-bold' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      Precio de lista
                    </button>
                    <button
                      onClick={() => setFiltros(f => ({ ...f, modoPrecio: 'monthly_payment' }))}
                      className={`flex-1 py-2 cursor-pointer transition-all ${filtros.modoPrecio === 'monthly_payment' ? 'bg-[#e7f4ff] text-[#006AFF] border-l border-[#006AFF] font-bold' : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'}`}
                    >
                      Pago mensual
                    </button>
                  </div>

                  {/* Inputs Min/Max */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">Mínimo</span>
                      <input
                        type="number"
                        placeholder="No Min"
                        value={filtros.precioMin || ''}
                        onChange={(e) => setFiltros(f => ({ ...f, precioMin: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                      />
                    </div>
                    <span className="text-gray-400 mt-4">-</span>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">Máximo</span>
                      <input
                        type="number"
                        placeholder="No Max"
                        value={filtros.precioMax || ''}
                        onChange={(e) => setFiltros(f => ({ ...f, precioMax: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Parámetros Financieros Avanzados */}
                  {filtros.modoPrecio === 'monthly_payment' && (
                    <div className="border-t border-gray-150 pt-3 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase">Cuota inicial</span>
                          <input
                            type="number"
                            placeholder="Down Payment ($)"
                            value={filtros.downPayment || ''}
                            onChange={(e) => setFiltros(f => ({ ...f, downPayment: e.target.value ? Number(e.target.value) : null }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase">Credit Score</span>
                          <select
                            value={filtros.creditScore || 700}
                            onChange={(e) => setFiltros(f => ({ ...f, creditScore: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:border-[#006AFF] bg-white cursor-pointer"
                          >
                            <option value={600}>600 (Bueno)</option>
                            <option value={650}>650 (Muy bueno)</option>
                            <option value={700}>700 (Excelente)</option>
                            <option value={750}>750 (Premium)</option>
                            <option value={800}>800 (Elite)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="w-full bg-[#006AFF] hover:bg-blue-700 text-white font-sans font-bold py-2 text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Aplicar precio
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Píldora 3: Dormitorios & Baños */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'rooms_baths' ? null : 'rooms_baths')}
              className={
                filtros.dormitorios !== 'cualquiera' || filtros.banos !== 'cualquiera'
                  ? "flex items-center gap-2 px-4 py-2.5 bg-[#e7f4ff] border-2 border-[#006AFF] rounded-lg text-sm font-medium text-[#006AFF] transition-all cursor-pointer"
                  : "flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-neutral-800 hover:border-neutral-400 transition-all cursor-pointer"
              }
            >
              <span>
                {filtros.dormitorios !== 'cualquiera' || filtros.banos !== 'cualquiera'
                  ? `${filtros.dormitorios !== 'cualquiera' ? `${filtros.dormitorios}d` : ''} ${filtros.banos !== 'cualquiera' ? `${filtros.banos}b` : ''}`
                  : t("Habitaciones & Baños")}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'rooms_baths' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {activeDropdown === 'rooms_baths' && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg p-5 z-30 w-80 flex flex-col gap-4 shadow-lg animate-fadeIn">
                  
                  {/* Dormitorios */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Dormitorios</span>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden text-xs font-bold text-center">
                      {['cualquiera', 1, 2, 3, 4].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setFiltros(f => ({ ...f, dormitorios: d }))}
                          className={`flex-1 py-2 border-r last:border-r-0 border-gray-300 cursor-pointer ${filtros.dormitorios === d ? 'bg-[#006AFF] text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
                        >
                          {d === 'cualquiera' ? 'Any' : `${d}+`}
                        </button>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-neutral-600 select-none">
                      <input
                        type="checkbox"
                        checked={filtros.coincidenciaExactaDorms}
                        onChange={(e) => setFiltros(f => ({ ...f, coincidenciaExactaDorms: e.target.checked }))}
                        className="rounded text-[#006AFF] focus:ring-[#006AFF] w-3.5 h-3.5"
                      />
                      <span>Utilice la coincidencia exacta</span>
                    </label>
                  </div>

                  {/* Baños */}
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Baños</span>
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden text-xs font-bold text-center">
                      {['cualquiera', 1, 2, 3, 4].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setFiltros(f => ({ ...f, banos: b }))}
                          className={`flex-1 py-2 border-r last:border-r-0 border-gray-300 cursor-pointer ${filtros.banos === b ? 'bg-[#006AFF] text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
                        >
                          {b === 'cualquiera' ? 'Any' : `${b}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="w-full bg-[#006AFF] hover:bg-blue-700 text-white font-sans font-bold py-2 text-xs rounded-lg transition-all mt-1 cursor-pointer"
                  >
                    Aplicar habitaciones
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Píldora 4: Tipo de casa */}
          <div className="relative">
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'home_type' ? null : 'home_type')}
              className={
                filtros.tiposCasa.length > 0
                  ? "flex items-center gap-2 px-4 py-2.5 bg-[#e7f4ff] border-2 border-[#006AFF] rounded-lg text-sm font-medium text-[#006AFF] transition-all cursor-pointer"
                  : "flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-neutral-800 hover:border-neutral-400 transition-all cursor-pointer"
              }
            >
              <span>
                {filtros.tiposCasa.length > 0
                  ? `${filtros.tiposCasa.length} ${t("Tipos")}`
                  : t("Tipo de casa")}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'home_type' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {activeDropdown === 'home_type' && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg p-5 z-30 w-80 flex flex-col gap-4 shadow-lg animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tipo de casa</span>
                    <button
                      onClick={() => setFiltros(f => ({ ...f, tiposCasa: [] }))}
                      className="text-[11px] font-semibold text-[#006AFF] hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Deseleccionar todo
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {[
                      { id: 'casa', label: 'Casas' },
                      { id: 'departamento', label: 'Apartamentos / Depas' },
                      { id: 'terreno', label: 'Lotes / Terrenos' },
                      { id: 'oficina', label: 'Oficinas / Comercial' }
                    ].map((item) => {
                      const isChecked = filtros.tiposCasa.includes(item.id);
                      return (
                        <label key={item.id} className="flex items-center gap-2.5 cursor-pointer py-1 select-none font-semibold text-xs text-neutral-800">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFiltros(f => {
                                const exist = f.tiposCasa.includes(item.id);
                                const updated = exist
                                  ? f.tiposCasa.filter(id => id !== item.id)
                                  : [...f.tiposCasa, item.id];
                                return { ...f, tiposCasa: updated };
                              });
                            }}
                            className="rounded text-[#006AFF] focus:ring-[#006AFF] w-4.5 h-4.5 border-gray-300 cursor-pointer"
                          />
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setActiveDropdown(null)}
                    className="w-full bg-[#006AFF] hover:bg-blue-700 text-white font-sans font-bold py-2 text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Aplicar tipos
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* Píldora 5: Más Filtros (Modal Slide-over Trigger) */}
          <button
            onClick={() => setShowMoreFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-neutral-800 hover:border-neutral-400 transition-all cursor-pointer"
          >
            <span>{t("Más filtros")}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-500"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {/* Píldora: Solo Verificadas Sello Oro */}
          <button
            onClick={() => setOnlyVerified(!onlyVerified)}
            className={
              onlyVerified
                ? "flex items-center gap-2 px-4 py-2.5 bg-[#e7f4ff] border-2 border-[#006AFF] rounded-lg text-sm font-medium text-[#006AFF] transition-all cursor-pointer"
                : "flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-neutral-800 hover:border-neutral-400 transition-all cursor-pointer"
            }
          >
            <span>{t("Sello Oro")}</span>
            {onlyVerified && <span className="w-1.5 h-1.5 bg-[#006AFF] rounded-full inline-block"></span>}
          </button>
        </div>

        {/* Botón Guardar Búsqueda (Estilo Zillow) */}
        <button
          onClick={() => {
            setShowAnalytics(true);
            alert(t("Búsqueda guardada con éxito en tu panel de alertas."));
          }}
          className="px-5 py-2.5 bg-[#006AFF] text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-all cursor-pointer whitespace-nowrap ml-auto hidden md:inline-block"
        >
          {t("Guardar búsqueda")}
        </button>

        {/* Contador */}
        <span className="text-[11px] font-bold text-neutral-450 uppercase tracking-widest hidden lg:inline-block">
          {filtered.length} {t("Resultados")}
        </span>
      </div>

      {/* ─── LAYOUT DE PANTALLA DIVIDIDA (MAPA IZQUIERDA / LISTADO DERECHA) ─── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── MAPA DINÁMICO LEAFLET REAL (IZQUIERDA - 50%) ── */}
        <div className={`${isMapView ? 'block w-full' : 'hidden'} md:block md:w-1/2 relative overflow-hidden h-full border-r border-neutral-200`}>
          <MapWrapper
            properties={filtered}
            activePropertyId={hoveredPin}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={(id) => setSelectedPropertyId(id)}
            currency="USD"
          />
        </div>

        {/* ── GRILLA DE RESULTADOS EDITORIAL (DERECHA - 50%) ── */}
        <div className={`${!isMapView ? 'block w-full' : 'hidden'} md:block md:w-1/2 overflow-y-auto bg-white no-scrollbar`}>

          {/* Listado de Propiedades */}
          <div className="p-4 sm:p-6 pb-20 space-y-6">
            <header className="flex flex-col gap-4 border-b border-neutral-100 pb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl font-light text-black uppercase tracking-tight">
                    {t("Catálogo de Propiedades")}
                  </h1>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                    {filtered.length} {t("PROPIEDADES ENCONTRADAS EN LA REGIÓN")}
                  </p>
                </div>
                
                {/* Botón de Estadísticas Colapsable */}
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="bg-neutral-50 hover:bg-neutral-100 text-[#04045E] border border-neutral-200 text-[9px] font-black px-3.5 py-2.5 uppercase tracking-widest transition-all rounded-none flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5M12 3v16.5m8.25-16.5v16.5" />
                  </svg>
                  {showAnalytics ? t("Ocultar Análisis") : t("Ver Análisis de Zona")}
                </button>
              </div>

              {/* Contenedor de Estadísticas (Analytics) Colapsable */}
              {showAnalytics && (
                <div className="p-4 border border-neutral-200 bg-[#fbf9f9] space-y-4 rounded-xl animate-fadeIn">
                  <div>
                    <p className="text-[9px] font-bold text-[#04045E] uppercase tracking-widest mb-3">{t("Tendencia de Precios en ")}{searchParams.get('zone') || 'Cala Cala'}</p>
                    <PriceTrendChart
                      zona={searchParams.get('zone') || 'Cala Cala'}
                      height={120}
                      showSummary={false}
                    />
                  </div>
                  
                  <details className="group border-t border-neutral-250 pt-3">
                    <summary className="flex items-center justify-between cursor-pointer text-[9px] font-bold text-[#04045E] py-1 list-none uppercase tracking-widest select-none">
                      <span>🔔 {t("Suscribirse a alertas de esta búsqueda")}</span>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-open:rotate-180 transition-transform"><polyline points="6 9 12 15 18 9"/></svg>
                    </summary>
                    <div className="pt-3 border-t border-neutral-100 mt-2">
                      <PropertyAlertForm
                        defaultZona={searchParams.get('zone') || ''}
                        defaultType={searchParams.get('type') || 'DEPARTAMENTO'}
                        defaultMaxPrice={maxPrice}
                      />
                    </div>
                  </details>
                </div>
              )}
            </header>

            {sortedProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-neutral-300 p-8">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="font-serif text-xl font-light text-black uppercase tracking-wider">Sin Resultados</h3>
                <p className="text-neutral-400 text-xs font-medium mt-2">{t("Intenta ampliar el presupuesto, modificar los términos o ajustar los filtros de búsqueda.")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                {sortedProperties.map(p => (
                  <ListingCard
                     key={p.id}
                     prop={p}
                     active={hoveredPin === p.id}
                     onClick={() => setSelectedPropertyId(p.id)}
                     onHover={setHoveredPin}
                  />
                ))}
              </div>
            )}
          </div>
          
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
                    <h4 className="font-serif text-2xl font-light text-black leading-tight mt-1 line-clamp-1">{selectedProperty.title}</h4>
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
                  {selectedProperty.verified && (
                    <span className="absolute top-4 left-4 bg-[#04045E] text-[#b9fa3c] text-[9px] font-black px-3 py-1.5 uppercase tracking-wider rounded-full">
                      {t("VERIFICADO SELLO ORO")}
                    </span>
                  )}
                  <span className="absolute bottom-4 right-4 bg-white/95 text-[#04045E] text-[9px] font-black px-3 py-1.5 border border-slate-150 rounded-full uppercase tracking-wider">
                    {selectedProperty.offerType}
                  </span>
                </div>

                {/* Info Text */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-serif text-3xl font-medium text-black">${selectedProperty.price.toLocaleString()}</span>
                    <span className="text-neutral-400 text-[10px] font-bold">{(selectedProperty.price / selectedProperty.area).toFixed(0)} {t("USD/m²")}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-neutral-500 bg-[#fbf9f9] p-4 border border-neutral-200 rounded-none">
                    {selectedProperty.rooms > 0 && <span className="flex items-center gap-1">🛏️ {selectedProperty.rooms} {t("dorms")}</span>}
                    {selectedProperty.bathrooms > 0 && <span className="flex items-center gap-1">🛁 {selectedProperty.bathrooms} {t("baños")}</span>}
                    <span className="flex items-center gap-1">📏 {selectedProperty.area} {t("m²")}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Detalles del Inmueble</span>
                    <p className="text-neutral-500 text-xs leading-relaxed font-medium">
                      {selectedProperty.description}
                    </p>
                  </div>

                  <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pt-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
                    {selectedProperty.location}
                  </p>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="flex flex-col gap-3 pt-6 border-t border-neutral-200 mt-8 shrink-0 bg-white z-10">
                <Link
                  href={`/properties/${selectedProperty.id}`}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-sans font-bold text-xs text-center py-4.5 uppercase tracking-widest transition-all cursor-pointer border border-black"
                >
                  {t("Ver Ficha Completa")}
                </Link>
                <button
                  onClick={() => alert(`Contactando de forma premium para: ${selectedProperty.title}`)}
                  className="w-full border border-neutral-300 hover:border-black text-black font-sans font-bold text-xs py-4.5 uppercase tracking-widest transition-all cursor-pointer bg-white"
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

      {/* ─── CÁPSULA FLOTANTE DE ALTERNANCIA (ESTILO ZILLOW CLON DE image_ee2142.png) ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white border border-neutral-200 rounded-full shadow-xl px-5 py-2.5 md:hidden select-none">
        <div 
          onClick={() => setIsMapView(!isMapView)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-900 cursor-pointer hover:opacity-80 transition-opacity pr-2"
        >
          {isMapView ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
              <span>List</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M15.817.113A.5.5 0 0 0 15.5 0H14.5a.5.5 0 0 0-.402.201L10.2 5.333 5.8.201A.5.5 0 0 0 5.4 0H4.5a.5.5 0 0 0-.402.201L.183 5.513A.5.5 0 0 0 0 5.817v9.5a.5.5 0 0 0 .5.5h.9a.5.5 0 0 0 .402-.201l3.998-5.132 4.4 5.132a.5.5 0 0 0 .402.201h.9a.5.5 0 0 0 .5-.5v-9.5a.5.5 0 0 0-.183-.304L15.817.113zM1 6.133l3-3.857v7.592l-3 3.857V6.133zm4 3.735l4 4.667v-7.592L5 3.076v6.792zm5 4.667l3-3.857V3.076l-3 3.857v7.592z"/></svg>
              <span>Map</span>
            </>
          )}
        </div>

        <div className="w-[1px] h-5 bg-neutral-300 mx-2"></div>

        <div 
          onClick={() => setIsSortOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-900 cursor-pointer hover:opacity-80 transition-opacity pl-2"
        >
          <svg xmlns="http://www.w3.org/2050/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8.5a.5.5 0 0 1 .5.5v4H14a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5zM13 1.5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V3.707L9.354 6.854a.5.5 0 1 1-.708-.708L11.793 3H10.5a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .5.5zm-11 1a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H3.707l3.147 3.146a.5.5 0 1 1-.708.708L3 3.707V5a.5.5 0 0 1-1 0v-2.5zM2 9.5a.5.5 0 0 1 .5-.5h2.5a.5.5 0 0 1 0 1H3.707l3.147 3.146a.5.5 0 0 1-.708.708L3 10.707V12a.5.5 0 0 1-1 0v-2.5z"/></svg>
          <span>Sort</span>
        </div>
      </div>

      {/* ─── MODAL DE FILTROS EN PANTALLA COMPLETA MÓVIL ─── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Búsqueda Avanzada</span>
              <h2 className="font-serif text-2xl font-light text-black uppercase tracking-tight">{t("Filtros")}</h2>
            </div>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-2 border border-neutral-200 hover:border-black text-neutral-400 hover:text-black transition-colors rounded-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* Búsqueda por Texto */}
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{t("Buscar por Zona o Palabra")}</label>
              <div className="relative flex items-center bg-neutral-50 border border-black py-3 px-4 w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej: Cala Cala, Prado..."
                  className="bg-transparent text-sm font-semibold text-black placeholder-neutral-350 focus:outline-none w-full border-none focus:ring-0 p-0"
                />
              </div>
            </div>

            {/* Tipo de Inmueble */}
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{t("Tipo de Inmueble")}</label>
              <div className="grid grid-cols-2 gap-2">
                {typeOptions.map(tOption => (
                  <button
                    key={tOption || 'all'}
                    type="button"
                    onClick={() => {
                      setActiveType(tOption);
                    }}
                    className={`py-3 text-xs font-bold border transition-all uppercase tracking-wider ${
                      activeType === tOption ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200'
                    }`}
                  >
                    {tOption ? tOption.charAt(0).toUpperCase() + tOption.slice(1).toLowerCase() : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Oferta */}
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{t("Tipo de Oferta")}</label>
              <div className="grid grid-cols-2 gap-2">
                {offerOptions.map(o => (
                  <button
                    key={o || 'all-offer'}
                    type="button"
                    onClick={() => {
                      setActiveOffer(o);
                    }}
                    className={`py-3 text-xs font-bold border transition-all uppercase tracking-wider ${
                      activeOffer === o ? 'bg-black text-white border-black' : 'bg-white text-black border-neutral-200'
                    }`}
                  >
                    {o ? o : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Presupuesto */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{t("Presupuesto Máximo")}</label>
                <span className="text-sm font-bold text-black">${maxPrice.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={40000}
                max={600000}
                step={5000}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-200 accent-black cursor-pointer rounded-none appearance-none"
              />
            </div>

            {/* Habitaciones */}
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{t("Habitaciones / Dormitorios")}</label>
              <div className="grid grid-cols-3 gap-2">
                {roomsOptions.map(rOption => (
                  <button
                    key={rOption || 'all-rooms-mob'}
                    type="button"
                    onClick={() => {
                      setActiveRooms(rOption);
                    }}
                    className={`py-3 text-xs font-bold border transition-all uppercase tracking-wider ${
                      activeRooms === rOption ? 'bg-[#006AFF] text-white border-[#006AFF]' : 'bg-white text-black border-neutral-200'
                    }`}
                  >
                    {rOption ? `${rOption}+` : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Verificado Sello Oro */}
            <div className="flex items-center justify-between py-2 border-t border-neutral-100">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                {t("Solo propiedades Verificadas")}
              </span>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setOnlyVerified(!onlyVerified)}
                  className={`relative w-12 h-6 transition-colors duration-200 border border-black p-0.5 rounded-none ${onlyVerified ? 'bg-black' : 'bg-white'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-neutral-200 transition-all rounded-none ${onlyVerified ? 'translate-x-6 bg-white' : 'translate-x-0'}`} />
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-neutral-200 pt-4 flex flex-col gap-2">
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full bg-[#006AFF] hover:bg-blue-700 text-white font-sans font-bold text-xs text-center py-4 uppercase tracking-widest transition-all"
            >
              {t("Ver ")}{filtered.length}{t(" Resultados")}
            </button>
            <button
              onClick={() => {
                setActiveType('');
                setActiveOffer('');
                setMaxPrice(500000);
                setActiveRooms('');
                setOnlyVerified(false);
                setSearchQuery('');
              }}
              className="w-full border border-neutral-200 hover:border-black text-black font-sans font-bold text-xs text-center py-4 uppercase tracking-widest transition-all bg-white"
            >
              {t("Restablecer Filtros")}
            </button>
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
