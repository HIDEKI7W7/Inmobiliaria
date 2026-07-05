'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Property } from './PropertyCard';
import { WHATSAPP_LINK } from '../../../utils/whatsapp';

const formatMapPrice = (price: number, currency: 'USD' | 'BOB' = 'USD') => {
  if (currency === 'USD') {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1).replace('.0', '')}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(1).replace('.0', '')}k`;
    return `$${Math.round(price)}`;
  } else {
    if (price >= 1000000) return `Bs. ${(price / 1000000).toFixed(1).replace('.0', '')}M`;
    if (price >= 1000) return `Bs. ${(price / 1000).toFixed(1).replace('.0', '')}k`;
    return `Bs. ${Math.round(price)}`;
  }
};


interface MapViewProps {
  properties: Property[];
  activePropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  currency: 'USD' | 'BOB';
  center?: [number, number];
  zoom?: number;
  currentPropertyId?: string | null;
  onBoundsChange?: (bounds: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  }) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  activePropertyId,
  selectedPropertyId,
  onSelectProperty,
  currency,
  center,
  zoom: zoomProp,
  currentPropertyId,
  onBoundsChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [zoom, setZoom] = useState(13);
  const [L, setL] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    if (selectedPropertyId && !viewedIds.includes(selectedPropertyId)) {
      setViewedIds((prev) => [...prev, selectedPropertyId]);
    }
  }, [selectedPropertyId, viewedIds]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Carga de Leaflet únicamente en el cliente
  useEffect(() => {
    if (!isMounted) return;
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);

        // Fix Leaflet default marker icons bug in Next.js
        delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
        leaflet.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      });
    }
  }, [isMounted]);

  // Normalizar coordenadas soportando tanto lat/lng como latitude/longitude desde backend/base de datos
  const normalizedProperties = React.useMemo(() => {
    return properties
      .filter((p: any) => p && p.id && p.title && p.location && (Number(p.price || 0) > 0 || Number(p.priceBob || 0) > 0))
      .map((p) => {
        if (!p) return p;

      // Intentar extraer latitud y longitud por todos los nombres de propiedades comunes
      let latVal = p.lat ?? (p as any).latitude ?? (p as any).latitud;
      let lngVal = p.lng ?? (p as any).longitude ?? (p as any).longitud;

      let parsedLat = typeof latVal === 'string' ? parseFloat(latVal) : typeof latVal === 'number' ? latVal : null;
      let parsedLng = typeof lngVal === 'string' ? parseFloat(lngVal) : typeof lngVal === 'number' ? lngVal : null;

      // Si falta latitud o longitud, aplicar coordenadas de fallback basadas en la ubicación/ciudad
      let lat = parsedLat;
      let lng = parsedLng;
      if (lat === null || isNaN(lat) || lng === null || isNaN(lng)) {
        const locLower = String(p.location || '').toLowerCase();
        if (locLower.includes('la paz')) {
          lat = -16.5000 + (Math.random() - 0.5) * 0.01;
          lng = -68.1500 + (Math.random() - 0.5) * 0.01;
        } else if (locLower.includes('santa cruz') || locLower.includes('urubó') || locLower.includes('equipetrol')) {
          lat = -17.7862 + (Math.random() - 0.5) * 0.01;
          lng = -63.1812 + (Math.random() - 0.5) * 0.01;
        } else {
          // Cochabamba u otros fallbacks
          lat = -17.3895 + (Math.random() - 0.5) * 0.01;
          lng = -66.1568 + (Math.random() - 0.5) * 0.01;
        }
      }

      return {
        ...p,
        lat,
        lng,
      };
    });
  }, [properties]);



  // Algoritmo de clustering dinámico en tiempo real basado en el zoom con tolerancia a fallos
  const getClusters = (props: Property[], currentZoom: number) => {
    // Cláusula defensiva (Filtro Previo en Componente Padre): Omitir propiedades sin coordenadas válidas
    const validProps = props.filter(
      (prop) =>
        prop &&
        typeof prop.lat === 'number' &&
        typeof prop.lng === 'number' &&
        !isNaN(prop.lat) &&
        !isNaN(prop.lng)
    );

    let radius = 0.015;
    if (currentZoom > 12) radius = 0.01;
    if (currentZoom > 13) radius = 0.005;
    if (currentZoom > 14) radius = 0.003;
    if (currentZoom > 15) radius = 0.001;
    if (currentZoom > 16) radius = 0.0003;
    if (currentZoom > 17) radius = 0.0; // Desactivar clustering a alto zoom

    const clusters: {
      id: string;
      isCluster: boolean;
      lat: number;
      lng: number;
      properties: Property[];
    }[] = [];

    validProps.forEach((prop) => {
      const foundCluster = clusters.find((c) => {
        if (radius === 0) return false;
        const latDiff = Math.abs(c.lat - prop.lat);
        const lngDiff = Math.abs(c.lng - prop.lng);
        return latDiff < radius && lngDiff < radius;
      });

      if (foundCluster) {
        foundCluster.properties.push(prop);
        // Calcular promedio de coordenadas para centrar el grupo de forma segura
        foundCluster.lat =
          foundCluster.properties.reduce((sum, p) => sum + p.lat, 0) /
          foundCluster.properties.length;
        foundCluster.lng =
          foundCluster.properties.reduce((sum, p) => sum + p.lng, 0) /
          foundCluster.properties.length;
      } else {
        clusters.push({
          id: `cluster-${prop.id}`,
          isCluster: false,
          lat: prop.lat,
          lng: prop.lng,
          properties: [prop],
        });
      }
    });

    clusters.forEach((c) => {
      if (c.properties.length > 1) {
        c.isCluster = true;
      }
    });

    return clusters;
  };

  // Inicialización del Mapa
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;

    // Crear el mapa centrado en Cochabamba o la ciudad especificada
    const map = L.map(mapContainerRef.current, {
      center: center || [-17.3780, -66.1560],
      zoom: 13,
      zoomControl: false,
    });

    // Capa de mapa base premium y minimalista (CartoDB Positron) para resaltar los pines
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    // Escuchar el evento de zoom para recalcular los clústeres
    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });

    // Helper simple de debounce para evitar llamadas excesivas
    const debounce = (fn: Function, delay: number) => {
      let timer: any;
      return (...args: any[]) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    };

    const handleBoundsChange = debounce(() => {
      if (!mapRef.current) return;
      const b = mapRef.current.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      if (onBoundsChange) {
        onBoundsChange({
          swLat: sw.lat,
          swLng: sw.lng,
          neLat: ne.lat,
          neLng: ne.lng,
        });
      }
    }, 400);

    map.on('moveend', handleBoundsChange);

    // Disparar límites iniciales con retardo sutil para sincronizar carga
    const initialTimer = setTimeout(() => {
      if (mapRef.current) {
        const b = mapRef.current.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        if (onBoundsChange) {
          onBoundsChange({
            swLat: sw.lat,
            swLng: sw.lng,
            neLat: ne.lat,
            neLng: ne.lng,
          });
        }
      }
    }, 600);

    return () => {
      clearTimeout(initialTimer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // Efecto para centrar dinámicamente cuando el prop center cambia
  useEffect(() => {
    if (!L || !mapRef.current || !center) return;
    mapRef.current.flyTo(center, zoomProp || 13, {
      animate: true,
      duration: 1.5,
    });
  }, [center, zoomProp, L]);

  // Resize con debounce para no saturar el hilo principal en móviles
  // NOTA: separado de normalizedProperties para evitar re-disparos por cada cambio de filtro
  useEffect(() => {
    if (!L || !mapRef.current) return;

    let rafId: number;
    const forceResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });
    };

    // Boot reducido a 100ms para acelerar la carga de tiles en smartphones
    const boot = setTimeout(forceResize, 100);
    // Segunda pasada a 600ms para cubrir transiciones lentas de CSS en móviles de gama baja
    const boot2 = setTimeout(forceResize, 600);

    window.addEventListener('resize', forceResize, { passive: true });

    return () => {
      clearTimeout(boot);
      clearTimeout(boot2);
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', forceResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // Renderizado dinámico de Pines (Marcadores) y Clústeres
  useEffect(() => {
    if (!L || !mapRef.current) return;

    const map = mapRef.current;

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    // Fallback defensivo en el Componente Padre / Renderizador: filtrar propiedades con coordenadas válidas
    const validProperties = normalizedProperties.filter(
      (p) => p && typeof p.lat === 'number' && typeof p.lng === 'number' && !isNaN(p.lat) && !isNaN(p.lng)
    );

    const clusters = getClusters(validProperties, zoom);

    clusters.forEach((cluster) => {
      if (cluster.isCluster) {
        // Cláusula de guarda para el clúster
        if (typeof cluster.lat !== 'number' || typeof cluster.lng !== 'number' || isNaN(cluster.lat) || isNaN(cluster.lng)) {
          console.warn(`Clúster ${cluster.id} omitido por coordenadas promedio inválidas.`);
          return;
        }

        // Marcador de Clúster
        const count = cluster.properties.length;
        const verifiedCount = cluster.properties.filter(p => p.verified).length;
        
        const clusterHtml = `
          <div class="flex items-center justify-center w-10 h-10 rounded-full font-black text-xs shadow-lg border-2 transition-all duration-300 transform hover:scale-105 ${
            verifiedCount > 0 
              ? 'bg-amber-500 text-propio-blue border-amber-300' 
              : 'bg-propio-blue text-white border-white/20'
          }">
            ${count}
          </div>
        `;

        const clusterIcon = L.divIcon({
          html: clusterHtml,
          className: 'custom-cluster-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const clusterMarker = L.marker([cluster.lat, cluster.lng], {
          icon: clusterIcon,
        }).addTo(map);

        // Hacer zoom y centrar al hacer clic en un clúster
        clusterMarker.on('click', () => {
          map.setView([cluster.lat, cluster.lng], zoom + 2);
        });

        markersRef.current[cluster.id] = clusterMarker;
      } else {
        // Marcador Individual de Propiedad (Mostrar el precio directamente)
        const property = cluster.properties[0];
        
        // Cláusula de guarda estricta para propiedad individual (Validación Previa)
        if (!property || typeof property.lat !== 'number' || typeof property.lng !== 'number') {
          console.warn(`Propiedad con ID ${property?.id || 'Desconocido'} saltada por coordenadas inválidas.`);
          return;
        }

        const isCurrent = currentPropertyId && String(property.id) === String(currentPropertyId);
        const isHovered = activePropertyId === property.id || selectedPropertyId === property.id;
        const priceLabel = formatMapPrice(property.priceBob || (property.price * 10), 'BOB');
        const isViewed = viewedIds.includes(property.id);
        
        const markerHtml = isCurrent ? `
          <div class="bg-blue-600 border border-blue-400 text-white rounded-full px-3 py-1.5 text-[10px] font-black shadow-md flex items-center justify-center whitespace-nowrap cursor-default ring-4 ring-blue-600/30 select-none animate-pulse">
            📍 USTED ESTÁ AQUÍ
          </div>
        ` : `
          <div class="bg-white border border-slate-100 text-slate-900 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm flex items-center justify-center whitespace-nowrap cursor-pointer transition-all duration-200 ${
            isViewed ? 'text-emerald-500 font-extrabold' : ''
          } ${
            isHovered ? 'scale-115 ring-2 ring-[#0a1931]/20 shadow-md' : 'hover:scale-105'
          }">
            ${priceLabel}
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: isCurrent ? 'custom-main-minimap-marker' : 'custom-price-marker',
          iconSize: isCurrent ? [130, 32] : [70, 35],
          iconAnchor: isCurrent ? [65, 16] : [35, 17.5],
        });

        const marker = L.marker([property.lat, property.lng], {
          icon: markerIcon,
          opacity: isHovered ? 1.0 : 0.7,
        }).addTo(map);

        // Mini-Ficha Flotante (Popup) interactiva con botones de acción en español boliviano
        const formattedPriceFull = `Bs. ${(property.priceBob || property.price * 10).toLocaleString('es-BO')}`;
        const formattedPriceSecondary = `USD ${(property.price || 0).toLocaleString()}`;

        const popupContent = `
          <div class="font-sans w-56 rounded-2xl overflow-hidden bg-white">
            <div class="relative h-28 w-full overflow-hidden">
              <img src="${property.imageUrl}" alt="${property.title}" class="object-cover h-full w-full" />
              ${property.verified ? '<span class="absolute top-2 left-2 bg-amber-500 text-propio-blue font-black text-[8px] px-2 py-0.5 rounded-full border border-amber-300">👑 Oro</span>' : ''}
              <div class="absolute bottom-2 right-2 bg-[#000033] text-white p-2 rounded-lg border border-white/10 flex flex-col items-end">
                <span class="text-xs font-black leading-tight">${formattedPriceFull}</span>
                <span class="text-[8px] text-slate-300 font-bold mt-0.5 leading-none">${formattedPriceSecondary}</span>
              </div>
            </div>
            <div class="p-3.5 space-y-2">
              <h4 class="font-heading font-black text-[#000033] text-sm leading-tight m-0 line-clamp-1">${property.title}</h4>
              <p class="text-[10px] text-gray-500 font-bold m-0">📍 ${property.location}</p>
              <div class="grid grid-cols-2 gap-1.5 pt-1">
                <button class="bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-black text-[9px] py-2 px-1.5 rounded-lg border-0 cursor-pointer text-center w-full uppercase tracking-wider transition-colors" onclick="window.alert('Contactando para: ${property.title}')">
                  CONTACTAR
                </button>
                <button class="bg-[#000033] hover:bg-[#000044] text-white font-bold text-[9px] py-2 px-1.5 rounded-lg border-0 cursor-pointer text-center w-full uppercase tracking-wider transition-colors" onclick="window.alert('Agendando visita para: ${property.title}')">
                  AGENDAR
                </button>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          offset: L.point(0, -10),
          className: 'custom-leaflet-popup',
        });

        marker.on('click', () => {
          onSelectProperty(property.id);
        });

        markersRef.current[property.id] = marker;
      }
    });
  }, [normalizedProperties, zoom, activePropertyId, selectedPropertyId, currency, L, onSelectProperty, viewedIds]);

  useEffect(() => {
    if (!L || !mapRef.current || !selectedPropertyId) return;

    const property = normalizedProperties.find((p) => String(p.id) === String(selectedPropertyId));
    if (property) {
      if (typeof property.lat !== 'number' || typeof property.lng !== 'number' || isNaN(property.lat) || isNaN(property.lng)) {
        console.warn(`Propiedad con ID ${property.id} saltada por coordenadas inválidas.`);
        return;
      }
      mapRef.current.setView([property.lat, property.lng], 15, {
        animate: true,
        duration: 1.0,
      });

      // Abrir el popup del marcador seleccionado
      const marker = markersRef.current[selectedPropertyId];
      if (marker && marker.openPopup) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    }
  }, [selectedPropertyId, L, normalizedProperties]);

  return (
    <div className="relative w-full h-full overflow-hidden z-10" style={{ height: '100%', width: '100%' }}>
      {/* Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ height: '100%', width: '100%' }} />

      {/* ponytail: removed floating metric banner and geofencing buttons per image_800d1b.png design cleanup */}

      {/* ── CONTROLES DE ZOOM PERSONALIZADOS (top-right, style clones image_7ffe1b.png) ── */}
      <div className="absolute top-4 right-4 z-10 flex flex-col bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#0a1931] transition-colors cursor-pointer text-lg font-light border-b border-slate-100 bg-transparent border-0"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#0a1931] transition-colors cursor-pointer text-lg font-light bg-transparent border-0"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>


      {/* Estilos inyectados para formatear los Popups de Leaflet */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 25px -5px rgba(4, 4, 94, 0.15) !important;
          border: 1px solid rgba(4, 4, 94, 0.05) !important;
          overflow: hidden !important;
          font-family: var(--font-sans), system-ui, -apple-system, sans-serif !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 224px !important;
          font-family: var(--font-sans), system-ui, -apple-system, sans-serif !important;
        }
        .leaflet-popup-tip {
          background: white !important;
          box-shadow: 0 5px 10px rgba(4, 4, 94, 0.05) !important;
        }
        .custom-cluster-icon, .custom-price-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-control-zoom { display: none !important; }
      `}</style>
    </div>
  );
};

export default MapView;
