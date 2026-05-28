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
      className={`bg-white cursor-pointer overflow-hidden transition-all duration-300 group border-b border-neutral-200 pb-10 ${active ? 'bg-neutral-50/50' : ''}`}
      onMouseEnter={() => onHover(prop.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 border border-slate-100 rounded-2xl shadow-sm">
        <img 
          src={prop.imageUrl} 
          alt={prop.title} 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-103" 
        />
        {prop.verified && (
          <span className="absolute top-6 left-6 bg-[#04045E] text-[#b9fa3c] text-[9px] font-black px-3 py-1.5 uppercase tracking-wider rounded-full">
            {t("VERIFICADO SELLO ORO")}
          </span>
        )}
        <span className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm text-[#04045E] text-[9px] font-black px-3 py-1.5 uppercase tracking-wider border border-slate-150 rounded-full">
          {prop.offerType}
        </span>
      </div>
      <div className="mt-6 space-y-3">
        <div className="flex justify-between items-baseline">
          <h3 className="font-sans text-xl font-bold text-[#04045E] tracking-tight group-hover:text-opacity-80 transition-all leading-snug line-clamp-1">
            {prop.title}
          </h3>
          <span className="font-serif text-2xl font-medium text-black">
            ${prop.price.toLocaleString()}
          </span>
        </div>
        
        <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {prop.location}
        </p>

        <div className="flex gap-6 pt-3 border-t border-neutral-100 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          {prop.rooms > 0 && <span>{prop.rooms} {t("Dorms")}</span>}
          {prop.bathrooms > 0 && <span>{prop.bathrooms} {t("Baños")}</span>}
          <span>{prop.area} {t("m²")}</span>
        </div>
        
        <div className="pt-2">
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hoveredPin, setHoveredPin] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Estados del asistente de voz Google Speech
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [speechStatus, setSpeechStatus] = useState<'listening' | 'processing' | 'idle'>('idle');

  // Control de dropdowns activos
  const [activeDropdown, setActiveDropdown] = useState<'type' | 'offer' | 'price' | null>(null);

  // Prefiltrar desde query params
  useEffect(() => {
    const type = searchParams.get('type');
    const max = searchParams.get('max');
    const zone = searchParams.get('zone');
    const id = searchParams.get('id');
    if (type) setActiveType(type.toLowerCase());
    if (max) setMaxPrice(Number(max));
    if (zone) setSearchQuery(zone);
    if (id) setSelectedPropertyId(id);
  }, [searchParams]);

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

    // 4. Parser inteligente de Presupuesto / Precios
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

  // Filtrado reactivo de inventario
  const filtered = ALL_PROPERTIES.filter(p => {
    if (p.price > maxPrice) return false;
    if (onlyVerified && !p.verified) return false;
    if (activeType && p.type !== activeType) return false;
    if (activeOffer && p.offerType !== activeOffer) return false;
    if (searchQuery) {
      const matchQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.location.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchQuery) return false;
    }
    return true;
  });

  const typeOptions = ['', 'casa', 'departamento', 'terreno', 'oficina'];
  const offerOptions = ['', 'VENTA', 'ALQUILER', 'ANTICRETICO'];

  const selectedProperty = ALL_PROPERTIES.find(p => p.id === selectedPropertyId);

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] bg-[#fbf9f9] pt-[72px]">
      
      {/* ─── BARRA DE REFINAMIENTO DE ALTO CONTRASTE (ESTILO COMPASS / ZILLOW) ─── */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-wrap items-center gap-4 z-20 relative">
        
        {/* Caja de Búsqueda inteligente con Voz */}
        <div className="relative flex items-center bg-neutral-50 border border-black py-2 pl-4 pr-2 w-full max-w-xs transition-all duration-300">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por zona o palabras..."
            className="bg-transparent text-xs font-semibold text-black placeholder-neutral-300 focus:outline-none w-full border-none focus:ring-0 p-0"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-neutral-400 hover:text-black transition-colors mr-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
          <button
            onClick={startVoiceSearch}
            className="h-7 w-7 rounded-none bg-black hover:bg-neutral-800 flex items-center justify-center text-white transition-all active:scale-95 shrink-0"
            title="Búsqueda por voz inteligente"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
            </svg>
          </button>
        </div>

        {/* Píldora: Tipo de Inmueble */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
            className={`text-[10px] font-bold px-4 py-3 border transition-all flex items-center gap-2 uppercase tracking-widest rounded-none ${
              activeType
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-neutral-200 hover:border-black'
            }`}
          >
            <span>{t("Tipo: ")}{activeType ? t(activeType) : t("Todos")}</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'type' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          
          {activeDropdown === 'type' && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
              <div className="absolute top-full left-0 mt-2 bg-white border border-black p-3 z-30 min-w-[200px] flex flex-col gap-1 rounded-none shadow-xl animate-fadeIn">
                {typeOptions.map(tOption => (
                  <button
                    key={tOption || 'all'}
                    onClick={() => {
                      setActiveType(tOption);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left text-xs font-bold px-3 py-2.5 transition-all rounded-none ${
                      activeType === tOption
                        ? 'bg-black text-white'
                        : 'hover:bg-neutral-50 text-black'
                    }`}
                  >
                    {tOption ? tOption.charAt(0).toUpperCase() + tOption.slice(1).toLowerCase() : 'Todos los tipos'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Píldora: Tipo de Oferta */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'offer' ? null : 'offer')}
            className={`text-[10px] font-bold px-4 py-3 border transition-all flex items-center gap-2 uppercase tracking-widest rounded-none ${
              activeOffer
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-neutral-200 hover:border-black'
            }`}
          >
            <span>{t("Oferta: ")}{activeOffer ? t(activeOffer) : t("Todos")}</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'offer' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {activeDropdown === 'offer' && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
              <div className="absolute top-full left-0 mt-2 bg-white border border-black p-3 z-30 min-w-[200px] flex flex-col gap-1 rounded-none shadow-xl animate-fadeIn">
                {offerOptions.map(o => (
                  <button
                    key={o || 'all-offer'}
                    onClick={() => {
                      setActiveOffer(o);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left text-xs font-bold px-3 py-2.5 transition-all rounded-none ${
                      activeOffer === o
                        ? 'bg-black text-white'
                        : 'hover:bg-neutral-50 text-black'
                    }`}
                  >
                    {o ? o : 'Todos los esquemas'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Píldora: Presupuesto Máximo */}
        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'price' ? null : 'price')}
            className="bg-white text-black border border-neutral-200 hover:border-black text-[10px] font-bold px-4 py-3 transition-all flex items-center gap-2 uppercase tracking-widest rounded-none"
          >
            <span>{t("Precio: Hasta $")}{maxPrice.toLocaleString()}</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-200 ${activeDropdown === 'price' ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {activeDropdown === 'price' && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setActiveDropdown(null)} />
              <div className="absolute top-full left-0 mt-2 bg-white border border-black p-5 z-30 w-80 flex flex-col gap-4 rounded-none shadow-xl animate-fadeIn">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Límite de Compra</span>
                  <span className="text-sm font-bold text-black">${maxPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={40000}
                  max={600000}
                  step={5000}
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-200 accent-black cursor-pointer rounded-none appearance-none"
                />
                <button
                  onClick={() => setActiveDropdown(null)}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-sans font-bold py-3 text-[10px] uppercase tracking-widest transition-all rounded-none"
                >
                  Aplicar Presupuesto
                </button>
              </div>
            </>
          )}
        </div>

        <div className="w-px h-6 bg-neutral-200 hidden md:block" />

        {/* Toggle: Verificadas Sello Oro */}
        <label className="flex items-center gap-3 cursor-pointer group shrink-0 select-none">
          <div
            onClick={() => setOnlyVerified(!onlyVerified)}
            className={`relative w-12 h-6 transition-colors duration-200 border border-black p-0.5 rounded-none ${onlyVerified ? 'bg-black' : 'bg-white'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-neutral-200 group-hover:bg-neutral-400 transition-all rounded-none ${onlyVerified ? 'translate-x-6 bg-white' : 'translate-x-0'}`} />
          </div>
          <span className="text-[10px] font-bold text-neutral-400 group-hover:text-black transition-colors uppercase tracking-widest">
            {t("Solo propiedades ")}<span className="text-black font-bold">{t("Verificadas")}</span>
          </span>
        </label>

        {/* Contador */}
        <span className="ml-auto text-[10px] font-bold text-neutral-400 tracking-widest uppercase">{filtered.length} {t("Resultados")}</span>
      </div>

      {/* ─── LAYOUT DE PANTALLA DIVIDIDA (MAPA IZQUIERDA / LISTADO DERECHA) ─── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── MAPA DINÁMICO LEAFLET REAL (IZQUIERDA - 50%) ── */}
        <div className="hidden md:block w-1/2 relative overflow-hidden h-full border-r border-neutral-200">
          <MapWrapper
            properties={filtered}
            activePropertyId={hoveredPin}
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={(id) => setSelectedPropertyId(id)}
            currency="USD"
          />
        </div>

        {/* ── GRILLA DE RESULTADOS EDITORIAL (DERECHA - 50%) ── */}
        <div className="w-full md:w-1/2 overflow-y-auto bg-white no-scrollbar">

          {/* Panel de Tendencia y Analytics */}
          <div className="p-8 border-b border-neutral-200 bg-[#fbf9f9] space-y-6">
            <div>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-3">TENDENCIA INMOBILIARIA DE LA ZONA</p>
              <PriceTrendChart
                zona={searchParams.get('zone') || 'Cala Cala'}
                height={140}
                showSummary={false}
              />
            </div>
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-[10px] font-bold text-black py-2 list-none uppercase tracking-widest select-none border-t border-neutral-200 pt-4">
                <span>{t("🔔 Suscribirse a alertas de esta búsqueda")}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-open:rotate-180 transition-transform"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className="pt-4 border-t border-neutral-100 mt-2">
                <PropertyAlertForm
                  defaultZona={searchParams.get('zone') || ''}
                  defaultType={searchParams.get('type') || 'DEPARTAMENTO'}
                  defaultMaxPrice={maxPrice}
                />
              </div>
            </details>
          </div>

          {/* Listado de Propiedades */}
          <div className="p-8 pb-20 space-y-12">
            <header className="mb-4">
              <h1 className="font-serif text-3xl font-light text-black uppercase tracking-tight">
                {t("Catálogo de Propiedades")}
              </h1>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                {filtered.length} {t("PROPIEDADES ENCONTRADAS EN LA REGIÓN")}
              </p>
            </header>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center border border-dashed border-neutral-300 p-8">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="font-serif text-xl font-light text-black uppercase tracking-wider">Sin Resultados</h3>
                <p className="text-neutral-400 text-xs font-medium mt-2">{t("Intenta ampliar el presupuesto, modificar los términos o ajustar los filtros de búsqueda.")}</p>
              </div>
            ) : (
              <div className="space-y-16">
                {filtered.map(p => (
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
            <div className="h-full flex flex-col justify-between p-8 relative overflow-y-auto">
              
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
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12"/></svg>
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
