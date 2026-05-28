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
      zoom: 15,
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

    // High-fidelity elegant map tiles (CartoDB Voyager or Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    // Dynamic elegant marker with pulsing rings using brand colors
    const markerHtml = `
      <div class="relative flex items-center justify-center w-10 h-10">
        <span class="absolute w-8 h-8 rounded-full bg-[#b9fa3c]/40 animate-ping"></span>
        <span class="absolute w-5 h-5 rounded-full bg-[#b9fa3c]/20 animate-pulse border border-[#b9fa3c]/40"></span>
        <div class="relative w-4.5 h-4.5 rounded-full bg-[#04045E] border-2 border-[#b9fa3c] shadow-lg flex items-center justify-center">
          <div class="w-1.5 h-1.5 rounded-full bg-[#b9fa3c] animate-pulse"></div>
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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [L, center.lat, center.lng, isInteractive]);

  // Handle map resizing to avoid Leaflet gray tiles
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
      
      {/* Dynamic branding float badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-[#04045E]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-white/10 flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b9fa3c]"></span>
        </span>
        <span className="text-[10px] font-black font-sans uppercase tracking-widest text-[#b9fa3c]">Propio Geo</span>
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
