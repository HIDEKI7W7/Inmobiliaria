'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LeafletMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function LeafletMap({ lat, lng, onChange }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, []);

  useEffect(() => {
    if (!L || !mapContainerRef.current || mapRef.current) return;

    // Centro inicial: Cochabamba, Bolivia
    const initialLat = lat || -17.3895;
    const initialLng = lng || -66.1568;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    // Icono premium de Propio para el marcador
    const customIcon = L.divIcon({
      html: `
        <div class="flex flex-col items-center">
          <div class="bg-[#04045E] text-[#b9fa3c] p-2 rounded-lg border-2 border-[#b9fa3c] shadow-lg font-bold text-xs whitespace-nowrap animate-bounce">
            📍 Soltar Marcador Aquí
          </div>
          <div class="w-3 h-3 bg-[#b9fa3c] rotate-45 -mt-1.5 shadow-md border-r border-b border-[#04045E]"></div>
        </div>
      `,
      className: 'custom-gps-icon',
      iconSize: [120, 45],
      iconAnchor: [60, 45],
    });

    // Marcador
    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Evento de arrastre
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onChange(position.lat, position.lng);
    });

    // Evento de clic en el mapa
    map.on('click', (e: any) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      onChange(clickLat, clickLng);
    });

    // Forzar redimensionamiento por si se montó antes de cargar estilos de Tailwind
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [L]);

  // Si cambian las coordenadas externamente, movemos el marcador y el mapa
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !lat || !lng) return;
    const currentLatLng = markerRef.current.getLatLng();
    if (currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-[#23252a] bg-[#141516] shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ height: '100%', width: '100%' }} />
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#04045E] text-[#f7f8f8] px-3 py-1.5 rounded-lg border border-[#23252a] text-[10px] font-sans font-bold flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#b9fa3c] animate-pulse"></span>
        <span>Modo GPS: Haz clic o arrastra para ubicar</span>
      </div>
      <style jsx global>{`
        .custom-gps-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
