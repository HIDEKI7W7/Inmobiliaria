import React from 'react';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  priceBob?: number;
  area: number;
  rooms: number;
  bathrooms: number;
  location: string;
  imageUrl: string;
  featured?: boolean;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  type: 'casa' | 'departamento' | 'terreno' | 'oficina';
  verified: boolean;
  isVerified?: boolean;
  status?: string;
  observationNotes?: string | null;
  hasFolioReal?: boolean;
  hasCatastro?: boolean;
  hasTestimonio?: boolean;
  hasImpuestosAlDia?: boolean;
  hasPlanoUsoSuelo?: boolean;
  hasCI?: boolean;
  createdAt?: string | Date;
  ownerName?: string;
}

export interface PropertySpecs {
  rooms: number;
  bathrooms: number;
  area: number; // m²
}

interface PropertyCardProps {
  title: string;
  price: number;
  priceBob?: number;
  image: string;
  isVerified: boolean;
  specs: PropertySpecs;
  location?: string;
  currency?: 'USD' | 'BOB';
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  title,
  price,
  priceBob,
  image,
  isVerified,
  specs,
  location = 'Cochabamba, Bolivia',
  currency = 'USD',
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Cálculo de precio según tasa de cambio corporativa (1 USD = 10 BOB)
  const formattedPrice =
    currency === 'USD'
      ? `$${price.toLocaleString()}`
      : `Bs. ${(priceBob || price * 10).toLocaleString()}`;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`group relative rounded-2xl overflow-hidden bg-linear-surface-1 border transition-all duration-300 ease-out flex flex-col h-full ${
        isHovered
          ? 'border-linear-primary ring-1 ring-linear-primary/30 scale-[1.01] shadow-xl bg-linear-surface-1/90'
          : 'border-linear-hairline shadow-sm hover:shadow-lg hover:scale-[1.005] hover:border-linear-primary/30'
      }`}
    >
      {/* Sección Superior: Imagen y Badges Flotantes */}
      <div className="relative h-48 w-full overflow-hidden bg-linear-surface-2">
        <img
          src={image}
          alt={title}
          className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Badges Flotantes sobre la Imagen */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          {isVerified && (
            <span className="bg-linear-primary text-linear-ink text-[10px] font-sans font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 border border-linear-primary/40">
              🏆 Sello Oro: Verificada
            </span>
          )}
        </div>

        {/* Contenedor del Precio */}
        <div className="absolute bottom-4 right-4 z-10">
          <span className="font-sans text-xs font-extrabold text-linear-primary bg-linear-canvas/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg shadow-md border border-linear-hairline uppercase tracking-wider block">
            {formattedPrice}
          </span>
        </div>
      </div>

      {/* Sección Inferior: Contenido e Información */}
      <div className="p-5 flex flex-col flex-grow space-y-4">
        {/* Ubicación y Título */}
        <div className="space-y-1">
          <span className="inline-block text-[9px] font-sans font-black tracking-widest text-linear-ink-subtle uppercase">
            📍 {location}
          </span>
          <h3 className="font-sans text-base font-bold text-linear-ink tracking-tight leading-snug line-clamp-1 group-hover:text-linear-primary transition-colors duration-200 uppercase">
            {title}
          </h3>
        </div>

        {/* Ficha Atómica de Especificaciones (Specs) */}
        <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-linear-hairline text-center bg-linear-surface-2 rounded-xl mt-auto">
          <div className="space-y-0.5">
            <span className="block text-[8px] text-linear-ink-subtle font-bold uppercase tracking-wider font-sans">Área</span>
            <span className="text-xs font-black text-linear-ink font-sans">{specs.area} m²</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-[8px] text-linear-ink-subtle font-bold uppercase tracking-wider font-sans">Hab.</span>
            <span className="text-xs font-black text-linear-ink font-sans">{specs.rooms}</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-[8px] text-linear-ink-subtle font-bold uppercase tracking-wider font-sans">Baños</span>
            <span className="text-xs font-black text-linear-ink font-sans">{specs.bathrooms}</span>
          </div>
        </div>

        {/* Botón de Acción Directa */}
        <div className="pt-1">
          <button
            type="button"
            className="w-full block py-2.5 bg-linear-primary hover:bg-linear-primary-hover text-linear-ink font-sans font-bold text-xs rounded-xl shadow-sm hover:shadow-md uppercase tracking-widest transition-all duration-300 transform active:scale-[0.98]"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>
  );
};
