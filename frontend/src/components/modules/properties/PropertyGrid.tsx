'use client';

import React from 'react';
import { Property, PropertyCard } from './PropertyCard';

interface PropertyGridProps {
  properties: Property[];
  currency: 'USD' | 'BOB';
  loading?: boolean;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  currency,
  loading = false,
}) => {
  return (
    <section className="w-full py-16 px-6 sm:px-8 lg:px-12 bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Cabecera del Catálogo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-propio-blue uppercase tracking-tight">
              Catálogo de Propiedades
            </h2>
            <p className="text-sm text-slate-500 font-sans font-medium">
              Explora opciones validadas por nuestro Sello Oro con precios transparentes y sin comisiones ocultas.
            </p>
          </div>
          
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-xs font-sans font-black text-propio-blue uppercase tracking-wider">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-propio-green animate-ping"></span>
                Actualizando...
              </span>
            ) : (
              <span>🏠 {properties.length} Inmuebles encontrados</span>
            )}
          </div>
        </div>

        {/* Estado de Carga */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-propio-blue border-t-propio-green"></div>
            <p className="text-sm font-sans font-black text-propio-blue/70 uppercase tracking-widest">
              Cargando catálogo en tiempo real...
            </p>
          </div>
        ) : properties.length === 0 ? (
          /* Estado Vacío Súper Pulido (Glassmorphism / Premium Empty State) */
          <div className="max-w-xl mx-auto text-center py-16 px-8 rounded-3xl bg-white border border-slate-100 shadow-xl space-y-6">
            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-4xl mx-auto shadow-inner">
              🔍
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-heading font-black text-propio-blue uppercase tracking-tight">
                No hay resultados para tu búsqueda
              </h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-sm mx-auto">
                No encontramos propiedades que coincidan exactamente con tus filtros. Intenta ampliando la zona de búsqueda o eliminando el filtro de Sello Oro.
              </p>
            </div>
          </div>
        ) : (
          /* Grid Responsivo Pixel-Perfect (Mobile-first, se colapsa a flex-col en móvil, y se expande en desktop) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="transition-all duration-300 transform hover:-translate-y-1"
              >
                <PropertyCard
                  title={property.title}
                  price={property.price}
                  priceBob={property.priceBob}
                  image={property.imageUrl}
                  isVerified={property.verified}
                  location={property.location}
                  specs={{
                    rooms: property.rooms,
                    bathrooms: property.bathrooms,
                    area: property.area,
                  }}
                  currency={currency}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
