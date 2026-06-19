'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  price: number;
  minPrice: number; // Precio mínimo de negociación
  location: string;
  rooms?: number;
  bathrooms?: number;
  area: number;
  verified: boolean;
  type: string;
  image: string;
  lat: number;
  lng: number;
}

const INITIAL_PROPERTIES: Property[] = [
  { id: 'prop-1', title: 'Casa en Cala Cala', price: 320000, minPrice: 300000, location: 'Cala Cala, Cochabamba', rooms: 4, bathrooms: 3, area: 350, verified: true, type: 'Casa', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80', lat: -17.368, lng: -66.162 },
  { id: 'prop-2', title: 'Penthouse en Queru Queru', price: 185000, minPrice: 175000, location: 'Queru Queru, Cochabamba', rooms: 3, bathrooms: 2, area: 180, verified: true, type: 'Departamento', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80', lat: -17.361, lng: -66.148 },
  { id: 'prop-3', title: 'Departamento en El Prado', price: 95000, minPrice: 90000, location: 'El Prado, Cochabamba', rooms: 2, bathrooms: 2, area: 110, verified: false, type: 'Departamento', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80', lat: -17.382, lng: -66.155 },
  { id: 'prop-4', title: 'Terreno Comercial en Cala Cala', price: 140000, minPrice: 135000, location: 'Cala Cala, Cochabamba', area: 1500, verified: true, type: 'Terreno', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80', lat: -17.372, lng: -66.168 },
  { id: 'prop-5', title: 'Casa de Lujo en Cala Cala', price: 450000, minPrice: 425000, location: 'Cala Cala, Cochabamba', rooms: 5, bathrooms: 5, area: 520, verified: true, type: 'Casa', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', lat: -17.369, lng: -66.159 },
];

export default function AgentProperties() {
  const [properties, setProperties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [showMap, setShowMap] = useState(false);
  
  // Edit property modal state
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [L, setL] = useState<any>(null);

  // Load Leaflet dynamically on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, []);

  // Listen to collaboration request custom event from Map Popup
  useEffect(() => {
    const handleCollaborationRequest = (e: any) => {
      const propId = e.detail;
      const prop = properties.find(p => p.id === propId);
      if (prop) {
        alert(`🤝 ¡Solicitud de colaboración enviada con éxito para la propiedad: "${prop.title}"! Se notificará al agente captador.`);
      }
    };
    window.addEventListener('request-collaboration', handleCollaborationRequest);
    return () => window.removeEventListener('request-collaboration', handleCollaborationRequest);
  }, [properties]);

  // Map initialization inside modal
  useEffect(() => {
    if (!showMap || !L || !mapContainerRef.current) return;

    // Clean up previous map instance if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Load Leaflet styles dynamically to make sure it doesn't break
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Initialize Map centered in Cala Cala, Cochabamba
    const map = L.map(mapContainerRef.current, {
      center: [-17.368, -66.155],
      zoom: 14,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Add Carto Voyager tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    // Add markers for each property
    markersRef.current = [];
    properties.forEach((prop) => {
      // Create price label divIcon
      const markerHtml = `
        <div style="background-color: #04045E; color: white; border: 2px solid #b9fa3c; border-radius: 12px; font-weight: 800; font-size: 10px; padding: 4px 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); white-space: nowrap; text-align: center;">
          ${prop.verified ? '👑 ' : ''}$${(prop.price / 1000).toFixed(0)}k USD
        </div>
      `;
      const markerIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-price-marker',
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });

      const marker = L.marker([prop.lat, prop.lng], { icon: markerIcon }).addTo(map);

      // Popup content with Solicitar Colaboración button
      const popupHtml = `
        <div style="font-family: sans-serif; width: 220px; border-radius: 16px; overflow: hidden; background-color: white;">
          <img src="${prop.image}" alt="${prop.title}" style="width: 100%; height: 100px; object-cover: cover;" />
          <div style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <h4 style="margin: 0; font-size: 12px; font-weight: 900; color: #04045E; text-transform: uppercase;">${prop.title}</h4>
            <p style="margin: 0; font-size: 10px; color: #64748B;">📍 ${prop.location}</p>
            <p style="margin: 0; font-size: 12px; font-weight: 900; color: #04045E;">$${prop.price.toLocaleString()} USD</p>
            <button 
              style="width: 100%; padding: 8px; margin-top: 6px; background-color: #b9fa3c; color: #04045E; border: none; border-radius: 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.2s;"
              onclick="window.dispatchEvent(new CustomEvent('request-collaboration', { detail: '${prop.id}' }))"
            >
              🤝 Solicitar Colaboración
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: 'custom-leaflet-popup',
      });

      markersRef.current.push(marker);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap, L, properties]);

  // Edit form submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    setProperties(prev => prev.map(p => p.id === editingProperty.id ? editingProperty : p));
    setEditingProperty(null);
  };

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Mis Propiedades
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Visualiza y administra los inmuebles asignados a tu cartera de asesoramiento verificado.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Botón Ver Mapa */}
          <button
            onClick={() => setShowMap(true)}
            className="bg-[#04045E] text-white hover:bg-[#04045E]/90 font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 active:scale-95"
          >
            🗺️ Ver Mapa
          </button>
          <Link 
            href="/propietario/nuevo"
            className="bg-[#b9fa3c] text-[#04045E] font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
          >
            Publicar Inmueble
          </Link>
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch (err) {
                console.error(err);
              } finally {
                document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
                localStorage.removeItem('propio_token');
                localStorage.removeItem('propio_user');
                window.location.href = '/login';
              }
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-505 px-5 py-3.5 border border-red-200/50 text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center active:scale-95 shadow-sm"
            title="Cerrar Sesión"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Grid de Propiedades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => (
          <div key={prop.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col h-full group">
            {/* Imagen con badge */}
            <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
              <img 
                src={prop.image} 
                alt={prop.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                <span className="bg-[#04045E] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
                  {prop.type}
                </span>
              </div>
              {prop.verified && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-[#b9fa3c] text-[#04045E] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm flex items-center gap-1 border border-[#b9fa3c]/30">
                    👑 Sello Oro
                  </span>
                </div>
              )}
            </div>

            {/* Contenido de la Tarjeta */}
            <div className="p-5 flex flex-col flex-grow justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  📍 {prop.location}
                </p>
                <h3 className="text-base font-black text-[#04045E] uppercase tracking-tight leading-snug group-hover:text-[#04045E]/90 transition-colors">
                  {prop.title}
                </h3>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 border border-slate-100 bg-slate-50 rounded-xl">
                {prop.rooms ? (
                  <div className="text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase">Hab.</span>
                    <span className="text-xs font-black text-[#04045E]">{prop.rooms}</span>
                  </div>
                ) : (
                  <div className="text-center col-span-2">
                    <span className="block text-[8px] font-black text-slate-400 uppercase">Frente</span>
                    <span className="text-xs font-black text-[#04045E]">Comercial</span>
                  </div>
                )}
                {prop.bathrooms && (
                  <div className="text-center border-x border-slate-200/50">
                    <span className="block text-[8px] font-black text-slate-400 uppercase">Baños</span>
                    <span className="text-xs font-black text-[#04045E]">{prop.bathrooms}</span>
                  </div>
                )}
                <div className="text-center">
                  <span className="block text-[8px] font-black text-slate-400 uppercase">Área</span>
                  <span className="text-xs font-black text-[#04045E]">{prop.area} m²</span>
                </div>
              </div>

              {/* Footer de Tarjeta con Precio (Venta + Mínimo) y Acciones */}
              <div className="pt-3 border-t border-slate-100 mt-auto flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-lg font-black text-[#04045E]">
                      ${prop.price.toLocaleString()} USD
                    </span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Mín. Negociar: <span className="text-emerald-600 font-black">${prop.minPrice.toLocaleString()} USD</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1 w-full">
                  <button 
                    onClick={() => setEditingProperty(prop)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-[#04045E] border border-slate-200 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all active:scale-95 text-center shadow-2xs"
                  >
                    Editar
                  </button>
                  <Link 
                    href={`/properties/${prop.id}`}
                    className="flex-1 bg-[#04045E] hover:bg-[#04045E]/95 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-center shadow-xs"
                  >
                    Ver Ficha
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DEL MAPA LEAFLET */}
      {showMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 md:p-6 space-y-4 relative overflow-hidden h-[85vh] flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                  Mapa de Propiedades
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Presiona sobre una propiedad para solicitar colaboración
                </p>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="text-slate-450 hover:text-slate-650 text-xl font-bold p-1 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Contenedor del Mapa Leaflet */}
            <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
              {L ? (
                <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%', width: '100%' }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold">
                  Cargando mapa interactivo...
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMap(false)}
                className="py-3 px-6 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Cerrar Mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INLINE PARA EDITAR PROPIEDAD */}
      {editingProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <form 
            onSubmit={handleEditSubmit}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                Editar Inmueble
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Título del Inmueble *</label>
                <input 
                  type="text"
                  required
                  value={editingProperty.title}
                  onChange={e => setEditingProperty({ ...editingProperty, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Ubicación *</label>
                <input 
                  type="text"
                  required
                  value={editingProperty.location}
                  onChange={e => setEditingProperty({ ...editingProperty, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Precio Público ($ USD) *</label>
                  <input 
                    type="number"
                    required
                    value={editingProperty.price}
                    onChange={e => setEditingProperty({ ...editingProperty, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Precio Mínimo ($ USD) *</label>
                  <input 
                    type="number"
                    required
                    value={editingProperty.minPrice}
                    onChange={e => setEditingProperty({ ...editingProperty, minPrice: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Habitaciones</label>
                  <input 
                    type="number"
                    value={editingProperty.rooms || ''}
                    onChange={e => setEditingProperty({ ...editingProperty, rooms: parseInt(e.target.value) || undefined })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Baños</label>
                  <input 
                    type="number"
                    value={editingProperty.bathrooms || ''}
                    onChange={e => setEditingProperty({ ...editingProperty, bathrooms: parseInt(e.target.value) || undefined })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Área (m²)</label>
                  <input 
                    type="number"
                    required
                    value={editingProperty.area}
                    onChange={e => setEditingProperty({ ...editingProperty, area: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01]"
              >
                Guardar Cambios 🚀
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
