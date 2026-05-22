import React from 'react';
import { Property, PropertyCard } from './modules/properties/PropertyCard';

interface PropertyListingProps {
  properties: Property[];
  isLoading: boolean;
  highlightedId: string | null;
  onPropertyHover: (id: string | null) => void;
  currency?: 'USD' | 'BOB';
}

// Tarjeta Skeleton pulsante para prevenir el Layout Shift (Desplazamiento de Layout)
const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm flex flex-col h-full animate-pulse">
    {/* Bloque superior - Simula la Imagen */}
    <div className="h-48 w-full bg-gray-200" />
    
    {/* Bloque inferior - Simula el Contenido */}
    <div className="p-6 space-y-4 flex flex-col flex-grow">
      {/* Ubicación & Título */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
      </div>
      
      {/* Ficha Atómica de Specs */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 bg-slate-50 rounded-xl mt-auto h-12">
        <div className="h-3 bg-gray-200 rounded mx-auto w-2/3" />
        <div className="h-3 bg-gray-200 rounded mx-auto w-1/2" />
        <div className="h-3 bg-gray-200 rounded mx-auto w-1/2" />
      </div>
      
      {/* Botón de Detalles */}
      <div className="h-10 bg-gray-200 rounded-xl w-full" />
    </div>
  </div>
);

export const PropertyListing: React.FC<PropertyListingProps> = ({
  properties,
  isLoading,
  highlightedId,
  onPropertyHover,
  currency = 'USD',
}) => {
  // 1. Renderizado en Estado de Carga (Skeleton Loaders)
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 overflow-y-auto h-[calc(100vh-200px)] pr-2 scrollbar-thin">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // 2. Renderizado en Estado Vacío (Cumpliendo la regla del manual de marca Propio)
  if (properties.length === 0) {
    return (
      <div className="bg-slate-50 p-8 text-center rounded-2xl border border-gray-100/50 flex flex-col items-center justify-center space-y-4 my-4">
        <span className="text-4xl animate-bounce">🔍</span>
        <h3 className="font-heading font-black text-propio-blue text-lg uppercase tracking-tight leading-tight">
          Sin Resultados
        </h3>
        <p className="text-sm font-sans font-bold text-propio-blue/80 px-2">
          No encontramos inmuebles con esos filtros, intenta ajustar tu búsqueda.
        </p>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Propio - Transparencia y Conectividad Directa
        </span>
      </div>
    );
  }

  // 3. Renderizado del Catálogo de Propiedades
  return (
    <div className="flex flex-col gap-4 overflow-y-auto h-[calc(100vh-200px)] pr-2 scrollbar-thin">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
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
          isHovered={highlightedId === property.id}
          onMouseEnter={() => onPropertyHover(property.id)}
          onMouseLeave={() => onPropertyHover(null)}
        />
      ))}
    </div>
  );
};

export default PropertyListing;
