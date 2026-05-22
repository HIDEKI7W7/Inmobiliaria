'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Property } from './PropertyCard';

interface MapViewProps {
  properties: Property[];
  activePropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  currency: 'USD' | 'BOB';
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  activePropertyId,
  selectedPropertyId,
  onSelectProperty,
  currency,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [zoom, setZoom] = useState(13);
  const [L, setL] = useState<any>(null);

  // Carga de Leaflet únicamente en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
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

    // Crear el mapa centrado en Cochabamba
    const map = L.map(mapContainerRef.current, {
      center: [-17.3780, -66.1560],
      zoom: 14,
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
  }, [L]);

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
  }, [L, properties]);

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
    const validProperties = properties.filter(
      (p) => p && typeof p.lat === 'number' && typeof p.lng === 'number'
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
        const priceLabel = currency === 'USD' ? `$${priceK}K` : `Bs. ${(property.price * 10 / 1000).toFixed(0)}K`;
        
        const markerHtml = `
          <div class="font-sans font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-md border transition-all duration-300 whitespace-nowrap cursor-pointer ${
            isHovered
              ? 'bg-[#b9fa3c] text-[#04045E] border-[#04045E] scale-110 ring-4 ring-[#b9fa3c]/45 font-black'
              : 'bg-[#04045E] text-[#b9fa3c] border-[#b9fa3c]/20 hover:scale-105'
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
              <span class="absolute bottom-2 right-2 bg-propio-blue text-white text-xs font-black px-2.5 py-1 rounded-lg border border-white/10">${formattedPriceFull}</span>
            </div>
            <div class="p-3.5 space-y-2">
              <h4 class="font-heading font-black text-propio-blue text-sm leading-tight m-0 line-clamp-1">${property.title}</h4>
              <p class="text-[10px] text-gray-500 font-bold m-0">📍 ${property.location}</p>
              <div class="grid grid-cols-2 gap-1.5 pt-1">
                <button class="bg-propio-green hover:bg-propio-green/90 text-propio-blue font-black text-[9px] py-2 px-1.5 rounded-lg border-0 cursor-pointer text-center w-full uppercase tracking-wider transition-colors" onclick="window.alert('Contactando para: ${property.title}')">
                  CONTACTAR
                </button>
                <button class="bg-white hover:bg-slate-100 text-propio-blue font-bold text-[9px] py-2 px-1.5 rounded-lg border border-slate-200 cursor-pointer text-center w-full uppercase tracking-wider transition-colors" onclick="window.alert('Agendando visita para: ${property.title}')">
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
  }, [properties, zoom, activePropertyId, selectedPropertyId, currency, L]);

  // Centrar el mapa al seleccionar una propiedad
  useEffect(() => {
    if (!L || !mapRef.current || !selectedPropertyId) return;

    const property = properties.find((p) => p.id === selectedPropertyId);
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
  }, [selectedPropertyId, L, properties]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ height: '100%', width: '100%' }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ height: '100%', width: '100%' }} />
      
      {/* Indicador Flotante Cochabamba */}
      <div className="absolute top-4 left-4 z-[1000] bg-propio-blue text-white px-4 py-2 rounded-2xl shadow-lg border border-white/10 flex items-center gap-2">
        <span className="animate-pulse w-2.5 h-2.5 rounded-full bg-propio-green" />
        <span className="text-xs font-black font-sans uppercase tracking-wider">Cochabamba Activo</span>
      </div>

      {/* Estilos inyectados para formatear los Popups de Leaflet */}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 20px !important;
          box-shadow: 0 10px 25px -5px rgba(4, 4, 94, 0.15) !important;
          border: 1px solid rgba(4, 4, 94, 0.05) !important;
          overflow: hidden !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 224px !important;
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
