import React from 'react';
import { Property, PropertyCard } from './PropertyCard';

interface PropertyListingProps {
  properties: Property[];
  isLoading?: boolean;
  highlightedId: string | null;
  onPropertyHover: (id: string | null) => void;
  currency: 'USD' | 'BOB';
}

export const PropertyListing: React.FC<PropertyListingProps> = ({
  properties,
  isLoading = false,
  highlightedId,
  onPropertyHover,
  currency,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-linear-hairline border-t-linear-primary"></div>
        <p className="text-xs text-linear-ink-subtle uppercase tracking-widest animate-pulse font-sans font-bold">
          Sincronizando catálogo...
        </p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl border border-linear-hairline bg-linear-surface-1 shadow-xl transition-all duration-300">
        <span className="text-4xl block mb-4 text-linear-primary animate-pulse">🔍</span>
        <p className="font-sans font-bold text-linear-ink text-base uppercase tracking-tight leading-tight">
          No encontramos inmuebles
        </p>
        <p className="text-xs font-sans font-semibold text-linear-ink-muted mt-2 px-2 leading-relaxed">
          No encontramos inmuebles con esos filtros, intenta ajustar tu búsqueda
        </p>
        <p className="text-[10px] text-linear-ink-subtle font-bold uppercase tracking-widest mt-6 pt-4 border-t border-linear-hairline">
          💡 Sugerencia: Desactiva el "Sello Oro" o amplía el rango de precios.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          title={property.title}
          price={property.price}
          priceBob={property.priceBob}
          image={property.imageUrl}
          isVerified={property.verified ?? property.isVerified}
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
