'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MiniMapProps {
  center: { lat: number; lng: number };
  isInteractive?: boolean;
}

export const MiniMap: React.FC<MiniMapProps> = ({ center, isInteractive = true }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  // Load Leaflet dynamically on the client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
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

    // High-fidelity elegant voyager map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    // Dibuja un círculo de 3km de radio (3000 metros) alrededor del inmueble de color plomo
    L.circle([center.lat, center.lng], {
      color: '#808080',
      fillColor: '#808080',
      fillOpacity: 0.12,
      radius: 3000,
      weight: 1.5,
    }).addTo(map);

    mapRef.current = map;

    // PIN Central de Color Plomo (#808080)
    const markerHtml = `
      <div class="relative flex items-center justify-center w-10 h-10">
        <span class="absolute w-8 h-8 rounded-full bg-[#808080]/40 animate-ping"></span>
        <span class="absolute w-5 h-5 rounded-full bg-[#808080]/20 animate-pulse border border-[#808080]/40"></span>
        <div class="relative w-4.5 h-4.5 rounded-full bg-[#808080] border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
        </div>
      </div>
    `;

    const markerIcon = L.divIcon({
      html: markerHtml,
      className: 'custom-minimap-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([center.lat, center.lng], { icon: markerIcon }).addTo(map);
    markerRef.current = marker;

    // PINs alternativos en colores vivos dentro del radio
    const altCoords = [
      { lat: center.lat + 0.007, lng: center.lng + 0.009, label: 'Bs. 850K', color: '#ccff00', textColor: '#000033' },
      { lat: center.lat - 0.009, lng: center.lng - 0.011, label: 'Bs. 1.2M', color: '#006AFF', textColor: '#ffffff' },
      { lat: center.lat + 0.011, lng: center.lng - 0.008, label: 'Bs. 980K', color: '#e11d48', textColor: '#ffffff' },
    ];

    altCoords.forEach((alt, idx) => {
      const altHtml = `
        <div class="font-sans font-bold text-[9px] px-2 py-1 rounded-md shadow-md border whitespace-nowrap cursor-default" style="background-color: ${alt.color}; color: ${alt.textColor}; border-color: white;">
          ${alt.label}
        </div>
      `;
      const altIcon = L.divIcon({
        html: altHtml,
        className: `alt-marker-${idx}`,
        iconSize: [65, 25],
        iconAnchor: [32.5, 12.5],
      });
      L.marker([alt.lat, alt.lng], { icon: altIcon }).addTo(map);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [L, center.lat, center.lng, isInteractive]);

  // Handle map resizing
  useEffect(() => {
    if (!L || !mapRef.current) return;

    const forceResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

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
