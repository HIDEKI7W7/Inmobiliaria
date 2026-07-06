'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';

interface LeafletMapProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

// Helper: Reverse geocoding utilizando el proxy seguro del Backend de NestJS (Photon)
async function reverseGeocode(
  lat: number,
  lng: number,
  addLog?: (msg: string) => void
): Promise<string> {
  try {
    if (addLog) addLog(`Llamando proxy backend (Photon)...`);
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
    const url = `${apiBase}/maps/reverse-geocode?lat=${lat}&lng=${lng}`;
    
    const res = await fetch(url);

    if (!res.ok) {
      const errorText = await res.text();
      const errorMsg = `Proxy Error ${res.status}: ${errorText.slice(0, 50)}`;
      if (addLog) addLog(errorMsg);
      console.error(`[ReverseGeocode Proxy Error] ${errorMsg}`);
      return '';
    }

    const data = await res.json();
    if (data && data.success) {
      const street = data.street || '';
      if (street) {
        if (addLog) addLog(`Éxito: Calle "${street}"`);
        return street;
      }
      if (data.formattedAddress) {
        if (addLog) addLog(`Fallback address: "${data.formattedAddress}"`);
        return data.formattedAddress.split(',')[0].trim();
      }
    }
    
    if (addLog) addLog('Advertencia: Sin dirección válida en respuesta.');
    return '';
  } catch (err: any) {
    const excMsg = `Proxy Excepción: ${err.message || err}`;
    if (addLog) addLog(excMsg);
    console.error('[ReverseGeocode Proxy Exception]', err);
    return '';
  }
}

export default function LeafletMap({ lat, lng, onChange, onAddressChange }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hot Logger de depuración visual en caliente
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-3), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  // [CALLBACKS_ESTABLES] - Guardamos las props en refs para evitar re-suscribir eventos
  const onChangeRef = useRef(onChange);
  const onAddressChangeRef = useRef(onAddressChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onAddressChangeRef.current = onAddressChange; }, [onAddressChange]);

  // Limpiar temporizadores al desmontar
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  // Handler estable para dragend
  const handleDragEnd = useCallback(async (e: any) => {
    const marker = e.target;
    const pos = marker.getLatLng();
    addLog(`Arrastre finalizado en: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
    onChangeRef.current(pos.lat, pos.lng);
    
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    addLog('Programando geocodificación (500ms debounce)...');
    geocodeTimeoutRef.current = setTimeout(async () => {
      if (onAddressChangeRef.current) {
        const addr = await reverseGeocode(pos.lat, pos.lng, addLog);
        if (addr) {
          addLog(`Asignando dirección en UI: "${addr}"`);
          onAddressChangeRef.current(addr);
        } else {
          addLog('Error: No se obtuvo dirección válida.');
        }
      }
    }, 500);
  }, [addLog]);

  // Handler estable para clic en el mapa
  const handleMapClick = useCallback(async (e: any) => {
    const { lat: clickLat, lng: clickLng } = e.latlng;
    addLog(`Clic detectado en mapa: ${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}`);
    onChangeRef.current(clickLat, clickLng);
    
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    addLog('Programando geocodificación (500ms debounce)...');
    geocodeTimeoutRef.current = setTimeout(async () => {
      if (onAddressChangeRef.current) {
        const addr = await reverseGeocode(clickLat, clickLng, addLog);
        if (addr) {
          addLog(`Asignando dirección en UI: "${addr}"`);
          onAddressChangeRef.current(addr);
        } else {
          addLog('Error: No se obtuvo dirección válida.');
        }
      }
    }, 500);
  }, [addLog]);

  // [CALLBACK_REFS] - Guardamos las funciones actualizadas en refs para evitar Stale Closures en Leaflet
  const handleDragEndRef = useRef(handleDragEnd);
  const handleMapClickRef = useRef(handleMapClick);
  useEffect(() => { handleDragEndRef.current = handleDragEnd; }, [handleDragEnd]);
  useEffect(() => { handleMapClickRef.current = handleMapClick; }, [handleMapClick]);

  // [INIT_MAPA] - Se ejecuta una sola vez al montar
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;
    if (mapRef.current || initializingRef.current) return;

    initializingRef.current = true;
    addLog('Inicializando mapa táctil...');

    import('leaflet').then((leafletModule) => {
      const L = leafletModule.default;
      LRef.current = L;

      // Verificación de resguardo para StrictMode (si ya se inicializó en el DOM)
      const container = mapContainerRef.current;
      if (!container || (container as any)._leaflet_id) {
        initializingRef.current = false;
        return;
      }

      const initialLat = lat || -17.3895;
      const initialLng = lng || -66.1568;

      const map = L.map(container, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;

      // Suscribir el clic al mapa con wrapper que lee la ref actual
      map.on('click', (e: any) => handleMapClickRef.current(e));

      // Crear el ÚNICO marcador desde el inicio
      const customIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-[#000033] text-[#ccff00] p-2 rounded-lg border-2 border-[#ccff00] shadow-lg font-bold text-xs whitespace-nowrap animate-bounce">
              📍 Soltar Marcador Aquí
            </div>
            <div class="w-3 h-3 bg-[#ccff00] rotate-45 -mt-1.5 shadow-md border-r border-b border-[#000033]"></div>
          </div>
        `,
        className: 'custom-gps-icon',
        iconSize: [160, 48],
        iconAnchor: [80, 48],
      });

      const marker = L.marker([initialLat, initialLng], {
        icon: customIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e: any) => handleDragEndRef.current(e));
      markerRef.current = marker;

      // Redimensionar por si el DOM aún no estaba listo
      setTimeout(() => { map.invalidateSize(); }, 200);
      initializingRef.current = false;
      addLog('Mapa táctil cargado correctamente.');
    }).catch((err) => {
      initializingRef.current = false;
      addLog(`Error de carga Leaflet: ${err.message || err}`);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencias vacías → solo se ejecuta una vez

  // [SYNC_POSICION] - Sincroniza el marcador cuando lat/lng cambian desde el exterior (autocompletado o geocodificación)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat === null || lng === null) return;
    if (isNaN(lat) || isNaN(lng)) return;

    const current = markerRef.current.getLatLng();
    // Solo mover si realmente cambió la posición (evita micro-loops)
    if (Math.abs(current.lat - lat) > 0.00001 || Math.abs(current.lng - lng) > 0.00001) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
      addLog(`Mapa reposicionado a: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  }, [lat, lng, addLog]);

  return (
    <div className="relative w-full h-[280px] rounded-xl overflow-hidden border border-[#23252a] bg-[#141516] shadow-inner">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ height: '100%', width: '100%' }}
      />

      {/* Modo GPS Info */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#000033] text-[#f7f8f8] px-3 py-1.5 rounded-lg border border-[#23252a] text-[10px] font-sans font-bold flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse" />
        <span>Modo GPS: Haz clic o arrastra para ubicar</span>
      </div>

      {/* Hot Logger de Depuración Visual (Punto 4 de Auditoría) */}
      <div className="absolute top-3 right-3 z-[1000] bg-black/85 text-[10px] text-emerald-400 font-mono p-2.5 rounded-lg border border-slate-700 max-w-[240px] pointer-events-none select-none leading-relaxed shadow-xl">
        <div className="font-bold border-b border-slate-700 pb-1 mb-1 text-[9px] uppercase tracking-wider text-slate-400">
          Auditoría de Ubicación (Logs)
        </div>
        {logs.length === 0 ? (
          <div className="text-slate-500 italic">Esperando interacción...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="truncate">
              {log}
            </div>
          ))
        )}
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
