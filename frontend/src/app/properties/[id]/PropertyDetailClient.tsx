'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken, getCurrentUser } from '@/utils/session';
import { DaysOnMarketBadge } from '@/components/ui/DaysOnMarketBadge';
import { PriceTrendChart } from '@/components/ui/PriceTrendChart';
import { PropertyAlertForm } from '@/components/ui/PropertyAlertForm';
import { useFavorites } from '@/context/FavoritesContext';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';

// Importación dinámica del Mapa Core para evitar problemas de hidratación en Next.js
const MapWrapper = dynamic(() => import('@/components/modules/properties/MapWrapper'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-3 p-6 text-center animate-pulse border border-slate-200">
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#b9fa3c] animate-spin"></div>
      <p className="text-xs text-slate-400 font-sans tracking-wider uppercase">Cargando cartografía...</p>
    </div>
  )
});

interface PriceHistory {
  date: string;
  event: string;
  price: number;
}

interface Agent {
  id: string;
  name: string;
  agency: string;
  stars: number;
  phone: string;
  avatar: string;
  verified?: boolean;
  isVerified?: boolean;
}

// Catálogo simulado de inmuebles
const PROPERTIES_CATALOG: Record<string, any> = {};


const DEFAULT_PROPERTY = {
  id: 'prop-default',
  code: 'PRP-DFT-CBBA',
  title: 'Residencia Premium del Bosque',
  price: 320000,
  beds: 4,
  baths: 3,
  m2: 285,
  address: "Av. América Oeste #1420, Queru Queru Norte",
  city: "Cochabamba, Bolivia",
  verified: true,
  offerType: 'VENTA',
  description: 'Exclusivo inmueble de arquitectura contemporánea con orientación solar inmejorable. Destaca por sus acabados de lujo, cocina de diseño con isla central, climatización domotizada y amplios ventanales termoacústicos de piso a techo que expanden la iluminación natural.',
  amenities: ["COCINA REMODELADA", "LOTE PREMIUM", "PRIVACIDAD ABSOLUTA", "DOMÓTICA INTEGRADA", "PARQUEO DOBLE", "SEGURIDAD 24/7"],
  history: [
    { date: "15/05/2026", event: "Aprobado en Propio", price: 320000 },
    { date: "02/04/2026", event: "Cambio de precio", price: 335000 },
    { date: "10/03/2026", event: "Publicación Inicial", price: 350000 }
  ] as PriceHistory[],
  coordinates: { lat: -17.3680, lng: -66.1590 },
  docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
  images: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
  ]
};

const staffAgents: Agent[] = [];

interface PropertyDetailClientProps {
  propertyId: string;
  initialIsFavorited: boolean;
  initialToken: string | null;
}

// ── Helper: normaliza cualquier objeto de propiedad al shape que espera el JSX ──
function buildPropertyObject(p: any) {
  if (!p) return null;
  
  // Extraer ubicación polimórfica para comprobar si es corta o genérica
  let cityVal = p.city || (typeof p.location === 'object' && p.location ? (p.location.city || p.location.address || '') : String(p.location || ''));
  const cleanCity = String(cityVal).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const isShortOrNumeric = cityVal.trim().length < 4 || !isNaN(Number(cityVal.trim())) || cityVal.trim() === "1" || cityVal.trim() === "100";
  
  let finalCity = p.city || (typeof p.location === 'object' && p.location ? p.location.city : null);
  if (!finalCity || isShortOrNumeric || !cleanCity.includes("santa cruz")) {
    finalCity = "Santa Cruz, Bolivia";
  }

  let finalAddress = p.address || (typeof p.location === 'object' && p.location ? p.location.address : String(p.location || ''));
  if (finalAddress.trim().length < 4 || isShortOrNumeric) {
    finalAddress = "Santa Cruz de la Sierra, Bolivia";
  }

  // Coordenadas con fallback
  let lat = p.lat ?? p.latitude ?? p.latitud ?? p.coordinates?.lat ?? null;
  let lng = p.lng ?? p.longitude ?? p.longitud ?? p.coordinates?.lng ?? null;
  if (lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng)) || isShortOrNumeric) {
    lat = -17.78629;
    lng = -63.18117;
  }

  // Imágenes
  let images = (p.images && p.images.length > 0) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
  if (images.length === 0) {
    images = ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];
  }

  // Título y código
  const title = p.title || 'Propiedad Dinámica Aprobada';
  const code = p.code || (p.id ? `PRP-${String(p.id).toUpperCase()}` : 'PRP-SCZ-DYN');

  // Precio
  const price = typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price || p.priceBob / 10 || 0);
  const priceBob = typeof p.priceBob === 'string' ? parseFloat(p.priceBob) : Number(p.priceBob || price * 9.76 || 0);

  return {
    ...p,
    id: p.id,
    code,
    title,
    price,
    priceBob,
    beds:        p.beds || p.rooms || p.bedrooms || 3,
    baths:       p.baths || p.bathrooms || p.baths || 2,
    m2:          p.m2 || p.area || p.specs?.area || 150,
    address:     finalAddress,
    city:        finalCity,
    coordinates: { lat: Number(lat), lng: Number(lng) },
    images,
    description: p.description || 'Excelente propiedad con ubicación privilegiada en Santa Cruz de la Sierra. Amplios espacios, acabados de primera calidad, excelente iluminación natural y todos los servicios básicos garantizados. Cercana a transporte, centros comerciales y colegios.',
    amenities:   (p.amenities && p.amenities.length > 0) ? p.amenities : ["DOCUMENTACIÓN AL DÍA", "LOTE PREMIUM", "PRIVACIDAD ABSOLUTA", "SEGURIDAD 24/7", "PARQUEO PRIVADO"],
    docs:        p.docs || { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
    history:     (p.history && p.history.length > 0) ? p.history : [
      { date: "04/07/2026", event: "Publicación en Marketplace", price }
    ]
  };
}

export function PropertyDetailClient({
  propertyId,
  initialIsFavorited,
  initialToken,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isFavorited: isFavGlobal, toggleFavorite, favorites, loading, properties: contextProperties } = useFavorites();

  // ── REACTIVE PROPERTY STATE ────────────────────────────────────────────────
  const [currentProperty, setCurrentProperty] = useState<any>(() => {
    const found = ALL_REAL_PROPERTIES.find(
      p => String(p.id).toLowerCase() === String(propertyId).toLowerCase()
    );
    if (found) return buildPropertyObject(found);
    if (PROPERTIES_CATALOG[propertyId]) return PROPERTIES_CATALOG[propertyId];
    return null;
  });

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      // 1. Intentar resolver de inmediato desde ALL_REAL_PROPERTIES
      const realProp = ALL_REAL_PROPERTIES.find(
        p => String(p.id).toLowerCase() === String(propertyId).toLowerCase()
      );
      if (realProp) {
        if (active) setCurrentProperty(buildPropertyObject(realProp));
        return;
      }

      // 2. Intentar buscar en la base de datos real del backend (API real sin caché)
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBaseUrl}/properties/${propertyId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            if (active) {
              setCurrentProperty(buildPropertyObject(data));
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching property from backend:', err);
      }

      // 3. Intentar buscar en la base de datos local dinámica
      try {
        const res = await fetch(`/api/local/properties/${propertyId}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            if (active) {
              setCurrentProperty(buildPropertyObject(data));
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching property from local DB:', err);
      }

      // 4. Fallback de localStorage
      try {
        const cachedRaw = localStorage.getItem('propio_properties_data') || localStorage.getItem('propio_admin_properties');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          const found = Array.isArray(parsed) && parsed.find(p => p.id === propertyId || p.code === propertyId);
          if (found) {
            if (active) {
              setCurrentProperty(buildPropertyObject(found));
              return;
            }
          }
        }
      } catch (_) {}

      // 5. Fallback de search params
      const title = searchParams?.get('title');
      const priceStr = searchParams?.get('price') || searchParams?.get('price_usd');
      if (title || priceStr) {
        const price = priceStr ? Number(priceStr) : 0;
        if (active) setCurrentProperty({
          id: propertyId, code: `PRP-${propertyId.toUpperCase()}`,
          title: title || 'Inmueble Destacado', price,
          priceBob: price, beds: 3, baths: 2, m2: 150,
          address: searchParams?.get('location') || '', city: 'Santa Cruz, Bolivia',
          verified: false, offerType: 'VENTA',
          description: 'Excelente propiedad con ubicación privilegiada en Santa Cruz de la Sierra. Amplios espacios, acabados de primera calidad, excelente iluminación natural y todos los servicios básicos garantizados. Cercana a transporte, centros comerciales y colegios.',
          amenities: ["DOCUMENTACIÓN AL DÍA", "LOTE PREMIUM", "PRIVACIDAD ABSOLUTA", "SEGURIDAD 24/7", "PARQUEO PRIVADO"],
          coordinates: { lat: -17.78629, lng: -63.18117 },
          images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80']
        });
      } else {
        if (active) setCurrentProperty(null);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [propertyId, searchParams]);

  const nearbyPropertiesList = useMemo(() => {
    let allProps: any[] = [];

    // ponytail: consumir de la base de datos maestra unificada del ERP
    if (typeof window !== 'undefined') {
      const globalRaw = localStorage.getItem('propio_master_global_database') || 
                        localStorage.getItem('propio_properties_data') || 
                        localStorage.getItem('propio_admin_properties');
      if (globalRaw) {
        try {
          const parsed = JSON.parse(globalRaw);
          if (parsed && Array.isArray(parsed)) {
            allProps = parsed;
          }
        } catch (_) {}
      }
    }

    if (allProps.length === 0) {
      allProps = [...ALL_REAL_PROPERTIES];
    }

    if (contextProperties && contextProperties.length > 0) {
      contextProperties.forEach((p: any) => {
        if (p && p.id && !allProps.some(ap => String(ap.id) === String(p.id))) {
          allProps.push(p);
        }
      });
    }
    
    // Add catalog properties
    const catalogProps = Object.values(PROPERTIES_CATALOG);
    catalogProps.forEach((cp) => {
      if (!allProps.some(ap => String(ap.id) === String(cp.id))) {
        allProps.push(cp);
      }
    });

    if (!currentProperty) {
      return [];
    }

    // Filter current property (exclusión estricta)
    const others = allProps.filter(
      p => p && String(p.id) !== String(currentProperty?.id) && String(p.code) !== String(currentProperty?.id) && String(p.code) !== String(currentProperty?.code)
    );

    // ponytail: parseo numérico inline absoluto de coordenadas
    const parseNumber = (val: any) => {
      if (val === null || val === undefined) return NaN;
      const num = Number(String(val).trim());
      return isNaN(num) ? NaN : num;
    };

    const getCoords = (p: any) => {
      if (!p) return null;
      let lat = NaN;
      let lng = NaN;
      if (p.coordinates) {
        lat = parseNumber(p.coordinates.lat || p.coordinates.latitude);
        lng = parseNumber(p.coordinates.lng || p.coordinates.longitude);
      }
      if (isNaN(lat) || isNaN(lng)) {
        lat = parseNumber(p.latitude || p.lat);
        lng = parseNumber(p.longitude || p.lng);
      }
      return (!isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
    };

    const cleanStr = (str: any) => String(str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    const rawCenter = currentProperty?.coordinates || currentProperty || {};
    const centerLat = parseNumber(rawCenter.lat || rawCenter.latitude);
    const centerLng = parseNumber(rawCenter.lng || rawCenter.longitude);
    const center = (!isNaN(centerLat) && !isNaN(centerLng)) ? { lat: centerLat, lng: centerLng } : { lat: -17.7833, lng: -63.1833 };

    const mapped = others
      .map(p => {
        const coords = getCoords(p);
        // Si no tiene coordenadas válidas de origen, creamos una coordenada cercana básica con dispersión
        let finalLat = center.lat;
        let finalLng = center.lng;

        if (coords) {
          finalLat = coords.lat;
          finalLng = coords.lng;
        } else {
          // Dispersión básica fija no matemática compleja
          const seed = String(p.id).charCodeAt(0) || 1;
          const offsetLat = ((seed % 10) - 5) * 0.0015;
          const offsetLng = (((seed * 3) % 10) - 5) * 0.0015;
          finalLat = center.lat + offsetLat;
          finalLng = center.lng + offsetLng;
        }

        const isUsd = (p.offerType === 'VENTA' || !p.priceBob);
        let label = '';
        if (isUsd) {
          const priceVal = p.price || 0;
          if (priceVal >= 1000000) {
            label = `$ ${(priceVal / 1000000).toFixed(1).replace('.0', '')}M`;
          } else {
            label = `$ ${Math.round(priceVal / 1000)}K`;
          }
        } else {
          const priceVal = p.priceBob || (p.price * 10);
          if (priceVal >= 1000000) {
            label = `Bs. ${(priceVal / 1000000).toFixed(1).replace('.0', '')}M`;
          } else {
            label = `Bs. ${Math.round(priceVal / 1000)}K`;
          }
        }

        const priceFormatted = `Bs. ${(p.priceBob || p.price * 10).toLocaleString('es-BO')} / USD ${(p.price || 0).toLocaleString()}`;

        // ponytail: coincidencia de zona segura por texto puro
        const pLoc = cleanStr(p.location || p.zone || p.city || "");
        const cLoc = cleanStr(currentProperty.location || currentProperty.zone || currentProperty.city || "");
        
        // Buscar si comparten palabras clave como Equipetrol, Urubo, Norte, Sur, etc.
        const keywords = cLoc.split(/[\s,.-]+/).filter(w => w.length > 2);
        if (keywords.length === 0) keywords.push("santa cruz");

        const isMatch = keywords.some(kw => pLoc.includes(kw)) || pLoc.includes("santa cruz") || cLoc.includes(pLoc) || pLoc.includes(cLoc);
        if (!isMatch) return null;

        return {
          id: p.id,
          lat: finalLat,
          lng: finalLng,
          label,
          title: p.title,
          priceFormatted,
          imageUrl: p.imageUrl || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
          location: p.location || p.zone || 'Santa Cruz, Bolivia'
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // ponytail: límite estricto de 12 propiedades
    return mapped.slice(0, 12);
  }, [currentProperty, contextProperties]);

  const combinedMapProperties = useMemo(() => {
    if (!currentProperty) return [];
    
    // Element A: The property currently being viewed
    const mainPin = {
      id: currentProperty.id,
      lat: currentProperty.coordinates?.lat || currentProperty.lat || -17.7833,
      lng: currentProperty.coordinates?.lng || currentProperty.lng || -63.1833,
      label: `Bs. ${(currentProperty.priceBob || currentProperty.price * 10).toLocaleString('es-BO')}`,
      title: currentProperty.title,
      priceFormatted: `Bs. ${(currentProperty.priceBob || currentProperty.price * 10).toLocaleString('es-BO')} / USD ${(currentProperty.price || 0).toLocaleString()}`,
      imageUrl: currentProperty.imageUrl || (currentProperty.images && currentProperty.images[0]) || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
      location: currentProperty.location || currentProperty.zone || 'Propiedad Consultada',
      isMain: true
    };
    
    // Element B: The nearby properties
    const nearbyPins = nearbyPropertiesList.map(item => ({
      ...item,
      isMain: false
    }));
    
    return [mainPin, ...nearbyPins];
  }, [currentProperty, nearbyPropertiesList]);

  const [isFavorited, setIsFavorited] = useState<boolean>(initialIsFavorited);
  const [token, setToken] = useState<string | null>(initialToken);
  const [authLoaded, setAuthLoaded] = useState<boolean>(!!initialToken);

  // Efecto de ciclo de vida para cargar de forma reactiva la sesión
  useEffect(() => {
    const activeToken = getToken();
    if (activeToken) {
      setToken(activeToken);
    }
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (!authLoaded) return; // Esperar a que la autenticación se haya cargado del localStorage

    const recordPropertyView = async () => {
      if (!currentProperty || !currentProperty.id) return;
      const activeToken = token || getToken();
      
      // AUDITORÍA DE ID REAL: Extraemos explícitamente el identificador interno de base de datos
      // del objeto de propiedad (currentProperty.id) para evitar inconsistencias con slugs de URL.
      const propertyDbId = currentProperty.id;

      if (propertyDbId && activeToken) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

        // REGISTRO INMEDIATO EN HISTORIAL DE VISTAS (Al cargar la página y verificar sesión)
        fetch(`${apiBaseUrl}/historial-vistas/${propertyDbId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`,
          },
        }).catch(err => console.error("Error al registrar historial de vista:", err));
      }

      // Local storage fallback for view history
      try {
        const localViews = localStorage.getItem('propio_client_recently_viewed');
        let viewsArray: string[] = localViews ? JSON.parse(localViews) : [];
        if (!viewsArray.includes(propertyDbId)) {
          viewsArray.unshift(propertyDbId);
          localStorage.setItem('propio_client_recently_viewed', JSON.stringify(viewsArray.slice(0, 10)));
        }
      } catch (err) {
        console.error('Error writing to local recent views:', err);
      }
    };

    recordPropertyView();
  }, [currentProperty?.id, token, authLoaded]);

  // Sincronizar el estado de favoritos con el contexto global de favoritos
  useEffect(() => {
    if (!loading && currentProperty) {
      setIsFavorited(isFavGlobal(currentProperty.id));
    }
  }, [favorites, currentProperty?.id, isFavGlobal, loading]);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = getToken();
    const user = getCurrentUser();
    if (!token || !user) {
      router.push(`/login?redirect=/properties/${currentProperty.id}`);
      return;
    }

    // AUDITORÍA DE ID REAL: Extraemos y usamos el ID interno de la base de datos (currentProperty.id)
    // para realizar el toggle de favoritos de forma 100% persistente y evitar el cruce de slugs.
    const propertyDbId = currentProperty.id;
    if (!propertyDbId) {
      console.error('Error: Identificador interno de base de datos no definido.');
      return;
    }

    const newFavState = await toggleFavorite(propertyDbId);
    setIsFavorited(newFavState);
  };

  const [activeTab, setActiveTab] = useState<'fotos' | 'mapa' | '3d' | 'plano'>('fotos');
  const [selectedAgent, setSelectedAgent] = useState<string>('age_1');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showQR, setShowQR] = useState<boolean>(false);

  // Estados del Formulario de Agendamiento de Visitas
  const [showAppointmentModal, setShowAppointmentModal] = useState<boolean>(false);
  const [appointmentName, setAppointmentName] = useState<string>('');
  const [appointmentWhatsApp, setAppointmentWhatsApp] = useState<string>('');
  const [appointmentEmail, setAppointmentEmail] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentTime, setAppointmentTime] = useState<string>('');
  const [appointmentSuccessMsg, setAppointmentSuccessMsg] = useState<string>('');

  useEffect(() => {
    const user = getCurrentUser() as any;
    if (user) {
      setAppointmentName(user.name || '');
      setAppointmentEmail(user.email || '');
      setAppointmentWhatsApp(user.whatsappPhone || user.phone || '');
    }
  }, [showAppointmentModal]);

  // ─── Estados Interactivos de la Calculadora Hipotecaria Real ───
  const [downPayment, setDownPayment] = useState<number>(Math.round((currentProperty?.price || 0) * 0.2));
  const [interestRate, setInterestRate] = useState<number>(5.5); // Tasa anual en %
  const [loanTerm, setLoanTerm] = useState<number>(20); // Plazo en años

  // Sincronizador de enganche: reacciona cuando el precio real llega del backend
  useEffect(() => {
    if (currentProperty?.price) {
      setDownPayment(Math.round(currentProperty.price * 0.2));
    }
  }, [currentProperty?.price]);

  // Estados interactivos 3D y Plano
  const [active3DRoom, setActive3DRoom] = useState<'fachada' | 'cocina' | 'sala'>('fachada');
  const room3DImages = {
    fachada: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    cocina: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    sala: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
  };
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const currentAgent = staffAgents.find(a => a.id === selectedAgent) || staffAgents[0] || {
    id: 'default',
    name: 'Asesor Inmobiliario',
    phone: '59172345678',
    avatar: '👨‍💼',
    agency: 'Propio Inmobiliaria',
    email: 'contacto@propioinmuebles.com'
  };

  // Cálculo matemático en tiempo real para la calculadora hipotecaria
  const mortgageResults = useMemo(() => {
    if (!currentProperty?.price) return {
      monthlyPrincipalInterest: 0,
      monthlyTax: 0,
      monthlyInsurance: 0,
      totalMonthly: 0,
      percentages: { principalInterest: 0, tax: 0, insurance: 0 }
    };
    const principal = (currentProperty?.price || 0) - downPayment;
    if (principal <= 0) {
      return {
        monthlyPrincipalInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        totalMonthly: 0,
        percentages: { principalInterest: 0, tax: 0, insurance: 0 }
      };
    }

    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = loanTerm * 12;

    // Fórmula del amortizador estándar francés
    let monthlyPrincipalInterest = 0;
    if (monthlyRate === 0) {
      monthlyPrincipalInterest = principal / totalMonths;
    } else {
      monthlyPrincipalInterest = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // Impuesto predial anual simulado: 0.1% de la propiedad, mensualizado
    const monthlyTax = ((currentProperty?.price || 0) * 0.001) / 12;
    
    // Seguro de hogar anual simulado: 0.05% de la propiedad, mensualizado
    const monthlyInsurance = ((currentProperty?.price || 0) * 0.0005) / 12;

    const totalMonthly = monthlyPrincipalInterest + monthlyTax + monthlyInsurance;

    const pctPrincipalInterest = Math.round((monthlyPrincipalInterest / totalMonthly) * 100);
    const pctTax = Math.round((monthlyTax / totalMonthly) * 100);
    const pctInsurance = 100 - pctPrincipalInterest - pctTax;

    return {
      monthlyPrincipalInterest: Math.round(monthlyPrincipalInterest),
      monthlyTax: Math.round(monthlyTax),
      monthlyInsurance: Math.round(monthlyInsurance),
      totalMonthly: Math.round(totalMonthly),
      percentages: {
        principalInterest: pctPrincipalInterest,
        tax: pctTax,
        insurance: pctInsurance
      }
    };
  }, [currentProperty?.price, downPayment, interestRate, loanTerm]);

  // ── ESCUDO GLOBAL DEFINITIVO ─────────────────────────────────────────────
  // Todos los hooks de React ya han sido declarados. A partir de aquí es seguro
  // hacer un early return condicional sin violar las reglas de hooks.
  if (!currentProperty || !currentProperty.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b0b0f] gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-slate-700 border-t-emerald-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wide animate-pulse">
          Cargando detalles de la propiedad…
        </p>
      </div>
    );
  }

  const property = currentProperty as any;
  // ponytail: dual-status check — backend stores 'APPROVED', admin UI may persist either
  const isFullyVerified = (() => {
    const docs: any[] = Array.isArray(property.documents) ? property.documents : [];
    if (docs.length === 0) return !!(property.isVerified || property.verified);
    return docs.every((d: any) => ['APPROVED', 'APROBADO'].includes(String(d.status || '').toUpperCase().trim()));
  })();
  const nombreContacto = property.agente?.nombre || property.propietario?.nombre || property.agent?.name || property.owner?.name || currentAgent.name || "Asesor Inmobiliario";
  const telefonoContacto = property.agente?.telefono || property.propietario?.telefono || property.agent?.phone || property.owner?.phone || currentAgent.phone || "59172345678";
  const telefonoLimpio = telefonoContacto.replace(/\D/g, ''); // Deja solo los números

  // Construcción de la plantilla estricta requerida por el cliente
  const mensajeWhatsAppText = `Hola ${nombreContacto}, me comunico desde propioinmuebles.com Me interesa el inmueble "${property.title || ''}" (${property.code || property.id || ''}) ¿Podriamos coordinar una visita al inmueble?`;
  const urlWhatsAppFinal = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensajeWhatsAppText)}`;
  const whatsappUrl = urlWhatsAppFinal;
  const whatsappMsg = encodeURIComponent(mensajeWhatsAppText);

  const handleActionClick = async (e: React.MouseEvent, actionType: 'visita' | 'whatsapp' | 'oferta' | 'reserva') => {
    e.preventDefault();
    e.stopPropagation();

    if (actionType === 'visita' || actionType === 'reserva') {
      setShowAppointmentModal(true);
      return;
    }

    const tokenVal = getToken();
    const userVal = getCurrentUser();
    const isAuthenticated = !!(userVal && tokenVal);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    if (actionType === 'whatsapp') {
      if (isAuthenticated) {
        try {
          await fetch(`${apiBaseUrl}/dashboard/inquiries`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenVal}`,
            },
            body: JSON.stringify({
              propertyId: currentProperty.id,
              message: `Contacto de WhatsApp iniciado por el cliente. Mensaje enviado: ${decodeURIComponent(whatsappMsg)}`,
            }),
          });
        } catch (err) {
          console.error('Error saving WhatsApp inquiry:', err);
        }
      }
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Otras acciones requieren autenticación
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (actionType === 'oferta') {
      const amountStr = prompt('Ingrese el monto de su oferta en Bs.:', String(Math.round(currentProperty.price * 0.95)));
      if (!amountStr) return;
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        alert('Por favor ingrese un monto válido.');
        return;
      }
      try {
        const res = await fetch(`${apiBaseUrl}/dashboard/offers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenVal}`,
          },
          body: JSON.stringify({
            propertyId: currentProperty.id,
            amount,
          }),
        });
        if (res.ok) {
          alert('¡Oferta enviada con éxito! Podrás realizar el seguimiento en tu panel.');
        } else {
          console.error('Error recording offer on backend');
        }
      } catch (err) {
        console.error('Error saving offer:', err);
      }
    }
  };

  const resetAppointmentState = () => {
    setAppointmentName('');
    setAppointmentWhatsApp('');
    setAppointmentEmail('');
    setAppointmentDate('');
    setAppointmentTime('');
    setAppointmentSuccessMsg('');
    setShowAppointmentModal(false);
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tokenVal = getToken();
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const scheduledAt = `${appointmentDate}T${appointmentTime}:00`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (tokenVal) {
        headers['Authorization'] = `Bearer ${tokenVal}`;
      }

      const res = await fetch(`${apiBaseUrl}/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          propertyId: currentProperty.id,
          scheduledAt,
          clientName: appointmentName,
          clientPhone: appointmentWhatsApp,
          clientEmail: appointmentEmail,
          notes: 'Visita guiada agendada desde el detalle de la propiedad.',
          type: 'visita',
        }),
      });
      if (!res.ok) {
        console.error('Error recording meeting on backend');
      }
    } catch (err) {
      console.error('Error saving meeting:', err);
    }
    setAppointmentSuccessMsg(
      `¡Visita programada con éxito! Confirmación: Se agendó para el ${appointmentDate} a las ${appointmentTime}. Recibirás un mensaje automático al WhatsApp ${appointmentWhatsApp}.`
    );
  };

  if (!currentProperty) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md border border-slate-100 flex flex-col items-center gap-4 animate-scaleUp">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#0a1931] mb-2" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Cargando ficha técnica del inmueble...</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            Buscando los detalles y especificaciones del inmueble en el catálogo. Por favor espere.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-700 antialiased selection:bg-[#b9fa3c]/30">
      
      {/* ─── Breadcrumb de Navegación ─── */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#04045E] transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-[#04045E] transition-colors">Propiedades</Link>
            <span>/</span>
            <span className="text-[#04045E] font-black line-clamp-1">{currentProperty.title}</span>
          </div>
          <span className="font-mono text-[10px] tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            CÓD: {currentProperty.code}
          </span>
        </div>
      </div>

      {/* Layout Principal Asimétrico */}
      <main className="max-w-[1440px] mx-auto flex flex-col lg:flex-row w-full relative pb-24 lg:pb-0">
        
        {/* =================================================================
            COLUMNA IZQUIERDA: CONTENIDO SCROLLABLE (65% de Ancho)
            ================================================================= */}
        <div className="w-full lg:w-[65%] lg:pr-8 p-4 md:p-6 lg:border-r lg:border-slate-200/80 space-y-8 h-full">
          
          {/* 1. CABECERA MULTIMEDIA INTEGRADA CON TABS ZILLOW-STYLE */}
          <section className="space-y-4">
            <div className="w-full aspect-[16/9] bg-slate-900 rounded-3xl relative overflow-hidden shadow-md border border-slate-200/50 group">
              
              {/* Fotos Slider */}
              {activeTab === 'fotos' && (
                <div className="w-full h-full relative">
                  {/* Desktop slider (hidden on mobile, block on md:) */}
                  <div className="hidden md:block w-full h-full relative">
                    <img 
                      src={currentProperty.images[activeImageIndex]} 
                      alt={currentProperty.title}
                      className="w-full h-full object-cover transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                    
                    {currentProperty.images.length > 1 && (
                      <>
                        <button 
                          onClick={() => setActiveImageIndex((prev) => (prev === 0 ? currentProperty.images.length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-[#b9fa3c] text-[#04045E] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setActiveImageIndex((prev) => (prev === currentProperty.images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-[#b9fa3c] text-[#04045E] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </>
                    )}

                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Foto {activeImageIndex + 1} de {currentProperty.images.length}
                    </span>
                  </div>

                  {/* Mobile Táctil Carousel (block on mobile, hidden on md:) */}
                  <div className="flex md:hidden w-full h-full overflow-x-scroll snap-x scrollbar-none">
                    {currentProperty.images.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 snap-start relative">
                        <img 
                          src={imgUrl} 
                          alt={`${currentProperty.title} - ${idx + 1}`}
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          Foto {idx + 1} de {currentProperty.images.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matterport 3D Mockup */}
              {activeTab === '3d' && (
                <div className="w-full h-full relative bg-slate-950 flex flex-col justify-between overflow-hidden">
                  <img 
                    src={room3DImages[active3DRoom]} 
                    alt="Tour 3D" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 filter saturate-[0.8]"
                  />
                  <div className="absolute inset-0 bg-[#04045E]/10 backdrop-blur-[1px]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
                  
                  <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-[10px] text-white font-black uppercase tracking-wider">Tour Virtual Activo</span>
                    </div>
                    <span className="text-white font-mono text-[10px] font-bold bg-[#04045E]/85 border border-[#b9fa3c]/35 px-3 py-1 rounded-full uppercase">
                      Estancia: {active3DRoom}
                    </span>
                  </div>

                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    {active3DRoom === 'fachada' && (
                      <button onClick={() => setActive3DRoom('cocina')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Ingresar a Cocina</span>
                      </button>
                    )}
                    {active3DRoom === 'cocina' && (
                      <button onClick={() => setActive3DRoom('sala')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Pasar a Living</span>
                      </button>
                    )}
                    {active3DRoom === 'sala' && (
                      <button onClick={() => setActive3DRoom('fachada')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Salir al Exterior</span>
                      </button>
                    )}
                  </div>

                  <div className="relative z-10 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                    {(['fachada', 'cocina', 'sala'] as const).map((room) => (
                      <button
                        key={room}
                        onClick={() => setActive3DRoom(room)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          active3DRoom === room 
                            ? 'bg-[#b9fa3c] text-[#04045E]' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {room === 'fachada' ? 'Fachada' : room === 'cocina' ? 'Cocina' : 'Living'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Plano de Planta Vectorial */}
              {activeTab === 'plano' && (
                <div className="w-full h-full bg-[#050516] flex flex-col justify-between p-4 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-center">
                    <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">Plano Arquitectónico</span>
                    <span className="text-[#b9fa3c] font-mono text-[10px] font-black uppercase">
                      {hoveredRoom ? `Zona Activa: ${hoveredRoom}` : 'Pasa el cursor por las habitaciones'}
                    </span>
                  </div>

                  <div className="relative w-full flex-1 flex items-center justify-center p-4">
                    <svg viewBox="0 0 800 450" className="w-full h-full max-h-[260px] drop-shadow-2xl">
                      <rect x="50" y="30" width="700" height="390" fill="none" stroke="#161a4c" strokeWidth="4" />
                      <rect 
                        x="50" y="30" width="280" height="200" 
                        fill={hoveredRoom === 'Dormitorio Master' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Dormitorio Master')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="190" y="130" textAnchor="middle" fill={hoveredRoom === 'Dormitorio Master' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Dormitorio Master (28 m²)
                      </text>

                      <rect 
                        x="330" y="30" width="420" height="250" 
                        fill={hoveredRoom === 'Living Comedor' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Living Comedor')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="540" y="150" textAnchor="middle" fill={hoveredRoom === 'Living Comedor' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Living Comedor (72 m²)
                      </text>

                      <rect 
                        x="330" y="280" width="220" height="140" 
                        fill={hoveredRoom === 'Cocina Gourmet' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Cocina Gourmet')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="440" y="350" textAnchor="middle" fill={hoveredRoom === 'Cocina Gourmet' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Cocina / Isla (31 m²)
                      </text>
                    </svg>
                  </div>

                  <div className="relative z-10 flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-widest pt-2 border-t border-white/5">
                    <span>* Escala Real 1:50 · Láser Certificado</span>
                    <span>Plano Planta Baja</span>
                  </div>
                </div>
              )}

               {/* Mapa de Entorno */}
              {activeTab === 'mapa' && (
                <div className="w-full h-full bg-slate-200">
                  <MapWrapper
                    properties={ALL_REAL_PROPERTIES.filter((p: any) => p && p.offerType === currentProperty.offerType)}
                    activePropertyId={currentProperty.id}
                    selectedPropertyId={null}
                    onSelectProperty={(id) => router.push(`/properties/${id}`)}
                    currency="BOB"
                    center={[currentProperty.coordinates?.lat || -17.7833, currentProperty.coordinates?.lng || -63.1833]}
                    zoom={15}
                    currentPropertyId={currentProperty.id}
                  />
                </div>
              )}

              {/* Pestañas Redondeadas Integradas (Zillow Style) */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
                <div className="bg-white/90 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-lg border border-slate-200/50 max-w-full overflow-x-auto no-scrollbar">
                  {[
                    { key: 'fotos', label: 'Fotos' },
                    { key: 'mapa', label: 'Mapa' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
                        activeTab === tab.key 
                          ? 'bg-[#000033] text-white shadow' 
                          : 'text-[#000033] hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favoritos y Sticker de Verificación Flotante (Alineamiento Derecho Premium) */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
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
                  const docs = currentProperty.documents || [];
                  const allApproved = Array.isArray(docs) && requiredTypes.every(type => {
                    const prefix = rigidPrefixMap[type];
                    const doc = docs.find((d: any) => 
                      d.fileType?.toUpperCase() === type ||
                      (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
                    );
                    return doc?.status === 'APPROVED';
                  });

                  return allApproved ? (
                    <span className="bg-[#04045E] text-[#b9fa3c] text-[9px] font-black px-3.5 py-2.5 rounded-full tracking-wider uppercase shadow-sm border border-[#04045E]/10">
                      DOCUMENTACION VERIFICADA
                    </span>
                  ) : null;
                })()}
                <button 
                  onClick={handleFavoriteToggle}
                  className="p-3 rounded-full bg-white/95 backdrop-blur shadow hover:scale-110 active:scale-95 transition-all text-[#04045E] flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill={isFavorited ? '#b9fa3c' : 'none'} viewBox="0 0 24 24" stroke={isFavorited ? '#b9fa3c' : 'currentColor'} strokeWidth={2.5} className="w-5 h-5 transition-transform duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Cabecera Técnica de Datos en Texto Limpio */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#04045E] font-sans">
                    Bs. {(currentProperty.priceBob || currentProperty.price * 10).toLocaleString('es-BO')}
                  </h1>
                  <span className="text-slate-500 text-sm font-bold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    USD {currentProperty.price.toLocaleString()}
                  </span>
                  <span className="text-slate-450 text-xs font-semibold bg-neutral-50 px-2 py-1 rounded border border-slate-200">
                    {currentProperty.m2 > 0 ? `${((currentProperty.priceBob || currentProperty.price * 10) / currentProperty.m2).toFixed(0)} Bs./m²` : 'Precio total'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DaysOnMarketBadge propertyId={currentProperty.id} size="sm" />
                  {isFullyVerified && (
                    <span
                      className="inline-flex items-center gap-1.5 bg-emerald-700 text-white text-[9px] font-black px-3 py-1.5 rounded-full border border-emerald-500/40 shadow-md uppercase tracking-widest"
                      style={{ animation: 'seal-pulse 2.4s ease-in-out infinite' }}
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Documentación Verificada
                    </span>
                  )}
                </div>
              </div>

              {/* Habitaciones, Baños y metros cuadrados en Texto Limpio y Sobrio */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm w-full max-w-max">
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.beds}</strong> habitaciones</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.baths}</strong> baños</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.m2 || currentProperty.specs?.area || currentProperty.area || 0}</strong> m² construidos</span>
              </div>

              <p className="text-sm md:text-base text-slate-500 font-bold tracking-wide">
                {currentProperty.address || currentProperty.location} {currentProperty.city && currentProperty.city !== currentProperty.location && <span className="text-slate-400 font-semibold">• {currentProperty.city}</span>}
              </p>
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 2. DESCRIPCIÓN */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#04045E]/50">Resumen y descripción</h3>
            <p className="text-slate-600 font-medium leading-relaxed text-sm">
              {currentProperty.description}
            </p>
          </section>

          <hr className="border-slate-200/80" />

          {/* 3. SECCIÓN ¿QUÉ TIENE DE ESPECIAL? */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E]">¿Qué tiene de especial?</h3>
            <div className="flex flex-wrap gap-2.5">
              {(currentProperty.amenities || []).map((amenity: string, idx: number) => (
                <span 
                  key={idx} 
                  className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 font-sans font-bold text-[10px] px-4 py-2.5 rounded-full tracking-wider uppercase cursor-default transition-all duration-200 flex items-center gap-1.5"
                >
                  ✨ {amenity}
                </span>
              ))}
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {currentProperty.offerType === 'VENTA' && (
            <>
              {/* 5. CALCULADORA DE PAGO MENSUAL INTERACTIVA COMPLETA */}
              <section className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#000033]">Calculadora de Pago Mensual Interactiva</h3>
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Desglose visual en tiempo real */}
                  <div className="space-y-6 flex flex-col justify-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Cuota mensual estimada</span>
                      <h4 className="text-3xl font-black text-[#000033] font-sans pt-1">
                        Bs. {(mortgageResults.totalMonthly * 10).toLocaleString()} <span className="text-xs text-slate-400 font-semibold tracking-normal">/ mes</span>
                      </h4>
                    </div>
                    
                    {/* Barra de Porcentaje Dinámica */}
                    <div className="space-y-4">
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          className="h-full bg-[#000033] transition-all duration-300" 
                          style={{ width: `${mortgageResults.percentages.principalInterest}%` }} 
                          title="Capital e intereses"
                        />
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300" 
                          style={{ width: `${mortgageResults.percentages.tax}%` }} 
                          title="Impuestos"
                        />
                        <div 
                          className="h-full bg-[#ccff00] transition-all duration-300" 
                          style={{ width: `${mortgageResults.percentages.insurance}%` }} 
                          title="Seguro"
                        />
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-[#000033] rounded-full inline-block" />
                              Capital e intereses
                            </span>
                            <span className="text-[#000033]">Bs. {(mortgageResults.monthlyPrincipalInterest * 10).toLocaleString()} ({mortgageResults.percentages.principalInterest}%)</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                              Impuesto predial mensual
                            </span>
                            <span className="text-blue-500">Bs. {(mortgageResults.monthlyTax * 10).toLocaleString()} ({mortgageResults.percentages.tax}%)</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-[#ccff00] rounded-full inline-block" />
                              Seguro de hogar
                            </span>
                            <span className="text-[#000033] font-black">Bs. {(mortgageResults.monthlyInsurance * 10).toLocaleString()} ({mortgageResults.percentages.insurance}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formulario Interactivo */}
                  <div className="bg-[#F8FAFC] p-6 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cuota Inicial (Bs)</label>
                        <input 
                          type="number"
                          value={downPayment * 10}
                          onChange={(e) => setDownPayment(Math.min(currentProperty.price, Math.max(0, Math.round(Number(e.target.value) / 10))))}
                          className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#000033] text-[#000033] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tasa de interés (%)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#000033] text-[#000033] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Plazo (Años)</label>
                        <select 
                          value={loanTerm}
                          onChange={(e) => setLoanTerm(Number(e.target.value))}
                          className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                        >
                          <option value={10}>10 años</option>
                          <option value={15}>15 años</option>
                          <option value={20}>20 años</option>
                          <option value={30}>30 años</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-2 text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider select-none">
                      ⚡ Actualizado en tiempo real
                    </div>
                  </div>
                </div>
              </section>
              <hr className="border-slate-200/80" />
            </>
          )}

           {/* 7. MINI MAPA ENTORNO INFERIOR */}
          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#000033]">MÁS OPCIONES</h3>
            <div className="w-full h-80 bg-slate-100 border border-slate-200 rounded-3xl overflow-hidden relative shadow-inner">
              <MapWrapper
                properties={ALL_REAL_PROPERTIES.filter((p: any) => p && p.offerType === currentProperty.offerType)}
                activePropertyId={currentProperty.id}
                selectedPropertyId={null}
                onSelectProperty={(id) => router.push(`/properties/${id}`)}
                currency="BOB"
                center={[currentProperty.coordinates?.lat || -17.7833, currentProperty.coordinates?.lng || -63.1833]}
                zoom={15}
                currentPropertyId={currentProperty.id}
              />
            </div>

              {/* Insignias de Documentación con Hover Tooltips */}
              {currentProperty.documentsList && Array.isArray(currentProperty.documentsList) && currentProperty.documentsList.some((d: any) => d.isMarked) ? (
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {currentProperty.documentsList.map((doc: any) => {
                    const hasFile = !!doc.fileData;
                    const isMarked = doc.isMarked;
                    if (!isMarked) return null;

                    return (
                      <div key={doc.id} className="relative group inline-block">
                        <span
                          title={!hasFile ? "No subió ningún documento" : undefined}
                          className={`px-2.5 py-1 rounded-full border text-[9px] uppercase tracking-wider font-black select-none inline-flex items-center gap-1 ${
                            hasFile
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                              : 'text-rose-600 bg-rose-50 border-rose-100 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          {doc.name} {!hasFile && '⚠️'}
                        </span>
                        {!hasFile && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[8px] font-black uppercase py-1 px-2 rounded whitespace-nowrap shadow z-30">
                            No subió ningún documento
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Alerta de Documentos nulos */}
              {String(currentProperty.id).startsWith('PROP-CUSTOM-') && 
               (!currentProperty.documentsList || 
                currentProperty.documentsList.length === 0 || 
                currentProperty.documentsList.every((d: any) => !d.fileData)) && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-center p-3 rounded-2xl font-black text-[10px] uppercase tracking-wider mt-2">
                  No subió ningún documento
                </div>
              )}
          </section>

          <hr className="border-slate-200/80" />

          {/* Formulario de alertas integrado al final */}
          <section className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
            <PropertyAlertForm 
              defaultZona={currentProperty.address.split(',')[0]} 
              defaultType={currentProperty.type || 'CASA'} 
              defaultMaxPrice={currentProperty.price} 
            />
          </section>

        </div>

        {/* =================================================================
            COLUMNA DERECHA: STICKY SIDEBAR DE CONVERSIÓN (35% de Ancho)
            ================================================================= */}
        <div className="w-full lg:w-[35%] p-4 md:p-6 bg-slate-50/40 lg:bg-transparent">
          <div className="w-full lg:sticky lg:top-24 space-y-4">
            
            {/* CAJA 1: ELIMINADA JORNADA DE OPEN HOUSE */}
            
            {/* CAJA 2: TARJETA DE AGENTE RESPONSABLE (SELECTOR INHABILITADO) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#000033]/5 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center font-heading font-black text-[#000033] text-base">
                  {currentAgent.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-[#000033] leading-tight">{currentAgent.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{currentAgent.agency}</p>
                  
                  {/* Calificación */}
                  {(currentAgent.verified || currentAgent.isVerified) && (
                    <span className="inline-block bg-[#04045E] text-[#b9fa3c] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider mt-1">
                      DOCUMENTACION VERIFICADA
                    </span>
                  )}
                </div>
              </div>

              {/* Selector de agente inhabilitado */}
              <div className="pt-3.5 border-t border-slate-100">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Agente de Atención Asignado
                </label>
                <div className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl select-none">
                  Agente Asignado: {currentAgent.name}
                </div>
              </div>
            </div>

            {/* CAJA 3: BOTONES DE ACCIÓN PRINCIPALES - CONVERSIÓN QUIRÚRGICA */}
            <div className="space-y-2.5">
              
              {/* [SOLICITAR VISITA GUIADA] */}
              <button 
                onClick={(e) => handleActionClick(e, 'visita')}
                className="w-full bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-heading font-black py-4 px-6 rounded-2xl shadow-md text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-[#ccff00]/10 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                Solicitar visita guiada
              </button>

              <a
                href={urlWhatsAppFinal}
                onClick={(e) => handleActionClick(e, 'whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex flex-col items-center justify-center bg-[#000033] hover:bg-[#000044] text-white font-sans font-bold py-3 px-4 rounded-2xl transition-all duration-200 shadow-md uppercase tracking-wider text-center group active:scale-[0.99]"
              >
                <span className="text-xs tracking-wider">Contactar por WhatsApp</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-normal lowercase normal-case mt-0.5 group-hover:text-slate-300">
                  (Contactar ahora / Agendar una cita)
                </span>
              </a>

              <p className="text-xs text-slate-500 font-medium text-center mt-2.5">
                Chatea en WhatsApp con el <span className="font-bold text-slate-700">+{telefonoLimpio}</span>
              </p>

            </div>

          </div>
        </div>

      </main>

      {/* =========================================================
          MODAL DE VISITA / CÓDIGO QR SIMULADO (Zillow Style)
          ========================================================= */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl border border-slate-100">
            <div className="space-y-2">
              <h4 className="text-xl font-black text-[#04045E]">Escanea para Reservar</h4>
              <p className="text-xs text-slate-400 font-medium">Agenda tu visita guiada al instante con un asesor certificado de Propio.</p>
            </div>

            {/* Código QR Vectorial Estetizado */}
            <div className="w-44 h-44 bg-slate-50 rounded-2xl border border-slate-200 mx-auto flex items-center justify-center p-3 relative group">
              <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-sm transition-all duration-300 ${
                      [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35, 8, 9, 14, 15, 20, 21, 26, 27].includes(i) 
                        ? 'bg-[#b9fa3c]' 
                        : 'bg-[#04045E]'
                    }`} 
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
                  🏠
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[#04045E] font-black text-lg">Bs. {Math.round((currentProperty.priceBob || currentProperty.price * 10) * 0.01).toLocaleString('es-BO')}</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Reserva mínima del 1% · {currentProperty.code}</p>
            </div>

            <button 
              onClick={() => setShowQR(false)} 
              className="w-full bg-[#04045E] hover:bg-opacity-95 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Cerrar y Regresar
            </button>
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full text-left space-y-6 shadow-2xl border border-slate-100 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-[#000033] uppercase tracking-wide">Agendar Visita Guiada</h4>
              <button 
                onClick={resetAppointmentState}
                className="text-slate-400 hover:text-black font-bold text-lg cursor-pointer bg-transparent border-none"
              >
                ✕
              </button>
            </div>

            {appointmentSuccessMsg ? (
              <div className="space-y-4 py-4 text-center">
                <div className="text-4xl text-emerald-500">✓</div>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  {appointmentSuccessMsg}
                </p>
                <button
                  onClick={resetAppointmentState}
                  className="w-full bg-[#000033] hover:bg-[#000044] text-white font-sans font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={appointmentName}
                    onChange={(e) => setAppointmentName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Número de WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 71234567"
                    value={appointmentWhatsApp}
                    onChange={(e) => setAppointmentWhatsApp(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={appointmentEmail}
                    onChange={(e) => setAppointmentEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Hora de Visita</label>
                    <input
                      type="time"
                      required
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#000033] hover:bg-[#000044] text-white font-sans font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Agendar Cita de Visita
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Barra de Contacto Fija en la Base para Móviles (Zillow / Airbnb Style) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-fadeIn">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio</span>
          <span className="text-sm font-black text-[#000033]">Bs. {(currentProperty.priceBob || currentProperty.price * 10).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
        </div>
        <div className="flex gap-2 flex-1 max-w-[240px]">
          <button 
            onClick={(e) => handleActionClick(e, 'reserva')}
            className="flex-1 bg-[#D4FF00] hover:bg-[#c2eb00] text-[#000033] font-sans font-black py-3 rounded-xl text-[10px] uppercase tracking-wider text-center transition-all active:scale-[0.98] cursor-pointer"
          >
            RESERVAR
          </button>
          <button 
            onClick={(e) => handleActionClick(e, 'whatsapp')}
            className="flex-1 bg-[#0B1354] hover:bg-[#080d3b] text-white font-sans font-black py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-[0.98] text-center cursor-pointer"
          >
            WHATSAPP
          </button>
        </div>
      </div>

    </div>
  );
}
