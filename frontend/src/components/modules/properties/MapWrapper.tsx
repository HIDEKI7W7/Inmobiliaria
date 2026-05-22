'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Property } from './PropertyCard';

// Carga dinámica de MapView desactivando el renderizado en servidor (SSR: false)
// de forma que se eviten errores de hidratación de objetos globales como 'window' o 'document' de Leaflet.
const DynamicMapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="relative w-full h-full min-h-[400px] lg:min-h-[550px] bg-[#050516] border border-[#161a4c] rounded-2xl flex flex-col items-center justify-center overflow-hidden animate-pulse">
      {/* Grilla Holográfica simulando la rejilla del mapa */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#070929_1px,transparent_1px),linear-gradient(to_bottom,#070929_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35 pointer-events-none"></div>
      
      {/* Holograma del Pin Central */}
      <div className="relative z-10 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin flex items-center justify-center bg-indigo-500/5">
          <span className="text-lg filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">📍</span>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-heading font-black tracking-widest text-white uppercase">
            Iniciando Mapa Satelital
          </h4>
          <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest animate-pulse">
            Cochabamba Activo
          </p>
        </div>
      </div>

      {/* Esquinas Estilizadas Linear */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-indigo-500/30"></div>
      <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-indigo-500/30"></div>
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-indigo-500/30"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-indigo-500/30"></div>
    </div>
  ),
});

interface MapWrapperProps {
  properties: Property[];
  activePropertyId: string | null;
  selectedPropertyId: string | null;
  onSelectProperty: (id: string) => void;
  currency: 'USD' | 'BOB';
}

export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[550px] relative rounded-2xl overflow-hidden border border-[#161a4c] bg-[#02020a]">
      <DynamicMapView {...props} />
    </div>
  );
};

export default MapWrapper;
