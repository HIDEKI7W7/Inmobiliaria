'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface NearbyPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  title?: string;
  priceFormatted?: string;
  imageUrl?: string;
  location?: string;
}

interface MiniMapProps {
  center: { lat: number; lng: number };
  isInteractive?: boolean;
  nearbyProperties?: NearbyPin[];
}

// Default nearby suggestions relative to center
const buildDefaultPins = (center: { lat: number; lng: number }): NearbyPin[] => {
  const lat = parseFloat(String(center?.lat || -17.7833));
  const lng = parseFloat(String(center?.lng || -63.1833));
  return [
    { id: 'nearby-1', lat: lat + 0.007, lng: lng + 0.009, label: 'Bs. 850K' },
    { id: 'nearby-2', lat: lat - 0.009, lng: lng - 0.011, label: 'Bs. 1.2M' },
    { id: 'nearby-3', lat: lat + 0.011, lng: lng - 0.008, label: 'Bs. 980K' },
  ];
};

export const MiniMap: React.FC<MiniMapProps> = ({
  center,
  isInteractive = true,
  nearbyProperties,
}) => {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  // PUNTO DE ANCLAJE: [MANEJADOR_NAVEGACION_DINAMICA_MAPA_SUGERENCIAS]
  const handleNavegarAPropiedadCercana = (idPropiedad: string) => {
    if (!idPropiedad) return;
    // Forzar la navegación limpia hacia la ficha técnica exacta elegida por el usuario
    router.push(`/properties/${idPropiedad}`);
  };

  // Load Leaflet client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => setL(leaflet.default));
    }
  }, []);

  // Expose global click handler so inline onclick in divIcon HTML can reach router
  useEffect(() => {
    (window as any).__miniMapNavigate = (id: string) => {
      handleNavegarAPropiedadCercana(id);
    };
    return () => {
      delete (window as any).__miniMapNavigate;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;

    const centerLat = parseFloat(String(center?.lat || (center as any)?.latitude || -17.7833));
    const centerLng = parseFloat(String(center?.lng || (center as any)?.longitude || -63.1833));
    const finalCenter: [number, number] = [isNaN(centerLat) ? -17.7833 : centerLat, isNaN(centerLng) ? -63.1833 : centerLng];

    const map = L.map(mapContainerRef.current, {
      center: finalCenter,
      zoom: 13,
      zoomControl: isInteractive,
      dragging: isInteractive,
      touchZoom: isInteractive,
      doubleClickZoom: isInteractive,
      scrollWheelZoom: isInteractive,
      boxZoom: isInteractive,
      keyboard: isInteractive,
      tap: isInteractive,
    });

    if (isInteractive) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    // ponytail: instanciar capa de grupo y guardar referencia
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, [L, center.lat, center.lng, isInteractive]);

  // ponytail: renderizar marcadores reactivamente
  useEffect(() => {
    if (!L || !mapRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();

    const propiedadesCercanas = nearbyProperties ?? [];

    propiedadesCercanas.forEach((item) => {
      const pinIdUnico = item.id;
      const isMain = !!(item as any).isMain;
      
      const pinHtml = isMain ? `
        <div class="bg-[#ccff00] text-[#000033] rounded-full px-3 py-1.5 text-[10px] font-black shadow-md border-none flex items-center justify-center whitespace-nowrap cursor-default ring-4 ring-[#ccff00]/30 select-none">
          📍 USTED ESTÁ AQUÍ
        </div>
      ` : `
        <div
          onclick="window.__miniMapNavigate && window.__miniMapNavigate('${pinIdUnico}')"
          class="bg-white border border-slate-200 text-slate-900 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm flex items-center justify-center whitespace-nowrap cursor-pointer hover:scale-105 transition-all duration-200 font-sans"
        >
          ${item.label}
        </div>
      `;

      // ponytail: parseo inline absoluto con Number() para prevenir fallas de tipo string
      const latVal = Number(item.lat);
      const lngVal = Number(item.lng);
      if (isNaN(latVal) || isNaN(lngVal)) return;

      const marker = L.marker([latVal, lngVal], {
        icon: L.divIcon({
          html: pinHtml,
          className: isMain ? 'custom-main-minimap-marker' : 'custom-price-marker-minimap',
          iconSize: isMain ? [130, 32] : [70, 26],
          iconAnchor: isMain ? [65, 16] : [35, 13]
        }),
      }).addTo(layerGroupRef.current);

      if (!isMain && item.title && item.priceFormatted) {
        const popupContent = `
          <div class="font-sans w-56 rounded-2xl overflow-hidden bg-white shadow-lg">
            <div class="relative h-28 w-full overflow-hidden">
              <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'}" alt="${item.title}" class="object-cover h-full w-full" />
              <span class="absolute bottom-2 right-2 bg-[#000033] text-white text-xs font-black px-2.5 py-1 rounded-lg border border-white/10">${item.label}</span>
            </div>
            <div class="p-3.5 space-y-2 text-left">
              <h4 class="font-heading font-black text-[#000033] text-xs leading-tight m-0 line-clamp-2">${item.title}</h4>
              <p class="text-[9px] text-gray-500 font-bold m-0">📍 ${item.location || 'Ubicación Premium'}</p>
              <button
                class="bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-black text-[9px] py-2 px-1.5 rounded-lg border-0 cursor-pointer text-center w-full uppercase tracking-wider transition-colors mt-2"
                onclick="window.__miniMapNavigate && window.__miniMapNavigate('${pinIdUnico}')"
              >
                VER FICHA
              </button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, {
          closeButton: false,
          minWidth: 220,
        });
      }
    });
  }, [L, nearbyProperties, center]);

  // Invalidate size on resize or tab reveal
  useEffect(() => {
    if (!L || !mapRef.current) return;
    const forceResize = () => mapRef.current?.invalidateSize();
    const timer = setTimeout(forceResize, 200);
    window.addEventListener('resize', forceResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', forceResize);
    };
  }, [L, center]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ minHeight: '100%' }}>
      <div ref={mapContainerRef} className="w-full h-full z-0 absolute inset-0" style={{ height: '100%', width: '100%' }} />

      {/* Brand Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#000033]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-white/10 flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ccff00] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ccff00]"></span>
        </span>
        <span className="text-[10px] font-black font-sans uppercase tracking-widest text-[#ccff00]">Propio Geo</span>
      </div>

      <style jsx global>{`
        .custom-minimap-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default MiniMap;
