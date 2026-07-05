'use client';

import React, { useEffect, useRef, useState, createContext, useContext } from 'react';

interface LeafletMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

// [COMPONENTE_CONTROLADOR_DINAMICO_MAPA] - Contexto y hook customizados para simular react-leaflet
const MapContext = createContext<any>(null);

export function useMap() {
  return useContext(MapContext);
}

export function MapContainer({ map, children }: { map: any; children: React.ReactNode }) {
  return <MapContext.Provider value={map}>{children}</MapContext.Provider>;
}

// [COMPONENTE_INTERNO_LEAFLET_FLYTO] - Controlador reactivo del mapa para flyTo
export function MarcadorYMapaControlador({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng) && map) {
      map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
    }
  }, [lat, lng, map]);
  return null;
}

// [JSX_INPUT_Y_MARCADOR_SINCRONIZADOS] - Componente marcador reactivo que actualiza el pin
export function Marker({ position, icon, draggable, eventHandlers }: any) {
  const map = useMap();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !position) return;
    const [lat, lng] = position;
    if (isNaN(lat) || isNaN(lng)) return;

    if (!markerRef.current) {
      import('leaflet').then((LModule) => {
        const L = LModule.default;
        const marker = L.marker([lat, lng], {
          icon,
          draggable,
        }).addTo(map);

        if (eventHandlers) {
          Object.keys(eventHandlers).forEach((event) => {
            marker.on(event, eventHandlers[event]);
          });
        }
        markerRef.current = marker;
      });
    } else {
      const currentLatLng = markerRef.current.getLatLng();
      if (currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, position, icon, draggable, eventHandlers]);

  return null;
}

export default function LeafletMap({ lat, lng, onChange }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

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
    setMapInstance(map);

    // Evento de clic en el mapa
    map.on('click', (e: any) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      onChange(clickLat, clickLng);
    });

    // Forzar redimensionamiento por si se montó antes de cargar estilos de Tailwind
    const timer = setTimeout(() => {
      if (mapRef.current) {
        map.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L]);

  // Icono premium de Propio para el marcador
  const customIcon = L ? L.divIcon({
    html: `
      <div class="flex flex-col items-center">
        <div class="bg-[#000033] text-[#ccff00] p-2 rounded-lg border-2 border-[#ccff00] shadow-lg font-bold text-xs whitespace-nowrap animate-bounce">
          📍 Soltar Marcador Aquí
        </div>
        <div class="w-3 h-3 bg-[#ccff00] rotate-45 -mt-1.5 shadow-md border-r border-b border-[#000033]"></div>
      </div>
    `,
    className: 'custom-gps-icon',
    iconSize: [120, 45],
    iconAnchor: [60, 45],
  }) : null;

  return (
    <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-[#23252a] bg-[#141516] shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full" style={{ height: '100%', width: '100%' }} />
      
      {mapInstance && (
        <MapContainer map={mapInstance}>
          <MarcadorYMapaControlador lat={lat} lng={lng} />
          {customIcon && lat && lng && (
            <Marker
              position={[lat, lng]}
              icon={customIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e: any) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  onChange(position.lat, position.lng);
                }
              }}
            />
          )}
        </MapContainer>
      )}

      <div className="absolute bottom-3 left-3 z-[1000] bg-[#000033] text-[#f7f8f8] px-3 py-1.5 rounded-lg border border-[#23252a] text-[10px] font-sans font-bold flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
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
