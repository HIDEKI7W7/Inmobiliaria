'use client';

import React from 'react';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  rooms?: number;
  bathrooms?: number;
  area: number;
  verified: boolean;
  type: string;
  image: string;
}

const AGENT_PROPERTIES: Property[] = [
  { id: 'prop-1', title: 'Casa en Cala Cala', price: 320000, location: 'Cala Cala, Cochabamba', rooms: 4, bathrooms: 3, area: 350, verified: true, type: 'Casa', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80' },
  { id: 'prop-2', title: 'Penthouse en Queru Queru', price: 185000, location: 'Queru Queru, Cochabamba', rooms: 3, bathrooms: 2, area: 180, verified: true, type: 'Departamento', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
  { id: 'prop-3', title: 'Departamento en El Prado', price: 95000, location: 'El Prado, Cochabamba', rooms: 2, bathrooms: 2, area: 110, verified: false, type: 'Departamento', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80' },
  { id: 'prop-4', title: 'Terreno Comercial en Cala Cala', price: 140000, location: 'Cala Cala, Cochabamba', area: 1500, verified: true, type: 'Terreno', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80' },
  { id: 'prop-5', title: 'Casa de Lujo en Cala Cala', price: 450000, location: 'Cala Cala, Cochabamba', rooms: 5, bathrooms: 5, area: 520, verified: true, type: 'Casa', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' },
];

export default function AgentProperties() {
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
        <Link 
          href="/propietario/nuevo"
          className="bg-[#b9fa3c] text-[#04045E] font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
        >
          Publicar Inmueble
        </Link>
      </div>

      {/* Grid de Propiedades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENT_PROPERTIES.map((prop) => (
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
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 border border-slate-100 bg-slate-50 rounded-xl">
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

              {/* Footer de Tarjeta con Precio y Detalles */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-auto">
                <span className="text-lg font-black text-[#04045E]">
                  ${prop.price.toLocaleString()} USD
                </span>
                <Link 
                  href={`/properties/${prop.id}`}
                  className="bg-[#04045E] hover:bg-[#04045E]/95 text-white font-bold text-[9px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all hover:scale-[1.02] shadow-xs active:scale-95"
                >
                  Ver Ficha
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
