import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getCurrentUser } from '@/utils/session';

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
  propertyId?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
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
  propertyId,
  isFavorite = false,
  onFavoriteToggle,
}) => {
  const router = useRouter();
  const [isFav, setIsFav] = useState(isFavorite);

  useEffect(() => {
    setIsFav(isFavorite);
  }, [isFavorite]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const token = getToken();
    const user = getCurrentUser();

    if (!user || !token) {
      // Redirigir a Login con callback
      router.push('/login?redirect=/properties');
      return;
    }

    if (!propertyId) return;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiBaseUrl}/favoritos/toggle/${propertyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFav(data.favorited);
        if (onFavoriteToggle) {
          onFavoriteToggle(propertyId, data.favorited);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCardClick = async () => {
    const token = getToken();
    const user = getCurrentUser();
    const isAuthenticated = !!(user && token);

    if (isAuthenticated && propertyId) {
      // Registro en segundo plano sin bloquear la UI
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      fetch(`${apiBaseUrl}/historial-vistas/${propertyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(err => console.error('Error tracking view history asynchronously:', err));
    }
    
    if (propertyId) {
      router.push(`/properties/${propertyId}`);
    }
  };

  // Cálculo de precio según tasa de cambio corporativa (1 USD = 10 BOB)
  const formattedPrice =
    currency === 'USD'
      ? `$${price.toLocaleString()}`
      : `Bs. ${(priceBob || price * 10).toLocaleString()}`;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleCardClick}
      className={`group relative rounded-2xl overflow-hidden bg-linear-surface-1 border transition-all duration-300 ease-out flex flex-col h-full cursor-pointer ${
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

        {/* Botón de favoritos interactivo en verde lima */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-all active:scale-95 cursor-pointer border border-neutral-100 flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`w-5 h-5 transition-all duration-300 ${
              isFav
                ? 'stroke-lime-500 fill-lime-500 drop-shadow-md hover:scale-110 transition-transform'
                : 'stroke-lime-500 stroke-2 fill-transparent hover:scale-110 transition-transform'
            }`}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

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
