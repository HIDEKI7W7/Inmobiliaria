'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Property } from './PropertyCard';

interface MapViewProps {
  properties: Property[];
  activePropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  currency: 'USD' | 'BOB';
  center?: [number, number];
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  activePropertyId,
  selectedPropertyId,
  onSelectProperty,
  currency,
  center,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [zoom, setZoom] = useState(13);
  const [L, setL] = useState<any>(null);

  // Normalizar coordenadas soportando tanto lat/lng como latitude/longitude desde backend/base de datos
  const normalizedProperties = React.useMemo(() => {
    return properties.map((p) => {
      if (!p) return p;
      let latVal = p.lat;
      let lngVal = p.lng;
      if (latVal === undefined || latVal === null) {
        latVal = p.latitude as any;
      }
      if (lngVal === undefined || lngVal === null) {
        lngVal = p.longitude as any;
      }
      return {
        ...p,
        lat: typeof latVal === 'string' ? parseFloat(latVal) : latVal,
        lng: typeof lngVal === 'string' ? parseFloat(lngVal) : lngVal,
      };
    });
  }, [properties]);

  // Carga de Leaflet únicamente en el cliente
  useEffect(() => {
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
  }, []);

  // Formateador simplificado para los pines del mapa
  const formatShortPrice = (price: number) => {
    const value = currency === 'USD' ? price : price * 10;
    const prefix = currency === 'USD' ? '$' : 'Bs. ';

    if (value >= 1000000) {
      return `${prefix}${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${prefix}${Math.round(value / 1000)}k`;
    }
    return `${prefix}${value}`;
  };

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

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // Efecto para centrar dinámicamente cuando el prop center cambia
  useEffect(() => {
    if (!L || !mapRef.current || !center) return;
    mapRef.current.setView(center, 13, {
      animate: true,
      duration: 1.0,
    });
  }, [center, L]);

  // Efecto para corregir el Layout Glitch de Leaflet (Dimensiones colapsadas) recalculando en caliente
  useEffect(() => {
    if (!L || !mapRef.current) return;

    const forceResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    // Ráfagas repetidas para asegurar que el mapa se estira perfectamente después de que Tailwind complete sus transiciones
    const timer1 = setTimeout(forceResize, 50);
    const timer2 = setTimeout(forceResize, 150);
    const timer3 = setTimeout(forceResize, 400);

    // Escuchador de redimensionamiento de ventana
    window.addEventListener('resize', forceResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', forceResize);
    };
  }, [L, normalizedProperties]);

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

        const isHovered = activePropertyId === property.id || selectedPropertyId === property.id;
        const priceK = (property.price / 1000).toFixed(0);
        const priceLabel = currency === 'USD' ? `$${priceK}K` : `Bs. ${(property.priceBob || property.price * 10 / 1000).toFixed(0)}K`;
        
        const markerHtml = `
          <div class="font-sans font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-md border transition-all duration-300 whitespace-nowrap cursor-pointer ${
            isHovered
              ? 'bg-[#ccff00] text-[#000033] border-[#000033] scale-110 ring-4 ring-[#ccff00]/45 font-black'
              : 'bg-[#000033] text-[#ccff00] border-[#ccff00]/20 hover:scale-105'
          }">
            ${property.verified ? '👑 ' : ''}${priceLabel}
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-price-marker',
          iconSize: [70, 35],
          iconAnchor: [35, 17.5],
        });

        const marker = L.marker([property.lat, property.lng], {
          icon: markerIcon,
          opacity: isHovered ? 1.0 : 0.7,
        }).addTo(map);

        // Mini-Ficha Flotante (Popup) interactiva con botones de acción en español boliviano
        const formattedPriceFull =
          currency === 'USD'
            ? `$${property.price.toLocaleString()}`
            : `Bs. ${(property.priceBob || property.price * 10).toLocaleString()}`;

        const popupContent = `
          <div class="font-sans w-56 rounded-2xl overflow-hidden bg-white">
            <div class="relative h-28 w-full overflow-hidden">
              <img src="${property.imageUrl}" alt="${property.title}" class="object-cover h-full w-full" />
              ${property.verified ? '<span class="absolute top-2 left-2 bg-amber-500 text-propio-blue font-black text-[8px] px-2 py-0.5 rounded-full border border-amber-300">👑 Oro</span>' : ''}
              <span class="absolute bottom-2 right-2 bg-[#000033] text-white text-xs font-black px-2.5 py-1 rounded-lg border border-white/10">${formattedPriceFull}</span>
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
  }, [normalizedProperties, zoom, activePropertyId, selectedPropertyId, currency, L, onSelectProperty]);

  useEffect(() => {
    if (!L || !mapRef.current || !selectedPropertyId) return;

    const property = normalizedProperties.find((p) => p.id === selectedPropertyId);
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
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ height: '100%', width: '100%' }} />
      
      {/* Indicador Flotante Bolivia */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#000033] text-white px-4 py-2 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2 select-none">
        <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-[#ccff00]" />
        <span className="text-xs font-black font-sans uppercase tracking-wider">Bolivia Activo</span>
      </div>

      {/* Botón Flotante de WhatsApp para Contacto Directo - Integrado en el Canvas del Mapa */}
      <a
        href="https://wa.me/59171234567?text=Hola,%20quisiera%20hacer%20una%20consulta%20en%20Propio."
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 right-6 z-[1000] bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20"
        title="Contacto directo por WhatsApp"
        aria-label="Contactar por WhatsApp"
      >
        <svg className="w-7 h-7 fill-current" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
        </svg>
      </a>

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
      `}</style>
    </div>
  );
};

export default MapView;
