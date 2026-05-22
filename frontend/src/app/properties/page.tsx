'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '../../components/ui/Navbar';
import { PropertySearch, FilterState } from '../../components/modules/properties/PropertySearch';
import { PropertyListing } from '../../components/modules/properties/PropertyListing';
import { Property } from '../../components/modules/properties/PropertyCard';
import { propertiesService } from '../../services/properties.service';

import MapWrapper from '../../components/modules/properties/MapWrapper';

export default function PropertiesCatalog() {
  // Estado de montaje en cliente para garantizar que el servidor nunca pre-renderice Leaflet
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);

  // Estado de los Filtros de Búsqueda
  const [filters, setFilters] = useState<FilterState>({
    text: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    verifiedOnly: false,
  });

  // Estado del Conversor de Moneda
  const [currency, setCurrency] = useState<'USD' | 'BOB'>('USD');

  // Estados de Sincronización Bidireccional (Hover y Clic)
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch reactivo de propiedades desde el backend real o fallback
  useEffect(() => {
    let isSubscribed = true;
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        // Normalizamos los filtros de precios según la divisa seleccionada para la BD
        const queryFilters = {
          ...filters,
          minPrice: filters.minPrice !== '' 
            ? (currency === 'BOB' ? Number(filters.minPrice) / 10 : Number(filters.minPrice))
            : '',
          maxPrice: filters.maxPrice !== ''
            ? (currency === 'BOB' ? Number(filters.maxPrice) / 10 : Number(filters.maxPrice))
            : '',
        };

        const data = await propertiesService.getProperties(queryFilters);
        if (isSubscribed) {
          setProperties(data);
        }
      } catch (error) {
        console.error('Error al cargar propiedades de Propio:', error);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchProperties();
    return () => {
      isSubscribed = false;
    };
  }, [filters, currency]);

  // Toggle de Moneda
  const handleCurrencyToggle = () => {
    setCurrency((prev) => (prev === 'USD' ? 'BOB' : 'USD'));
    setFilters((prev) => ({
      ...prev,
      minPrice: '',
      maxPrice: '',
    }));
  };

  // Filtrar propiedades con coordenadas válidas para el mapa
  const validProperties = useMemo(() => {
    return properties.filter(
      (p) => typeof p?.lat === 'number' && typeof p?.lng === 'number'
    );
  }, [properties]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col h-screen w-full overflow-hidden bg-linear-canvas text-linear-ink font-sans">
      {/* Navbar Superior Fijo */}
      <Navbar />

      {/* Cuerpo Principal Dividido */}
      <div className="flex flex-1 w-full h-[calc(100vh-80px)] overflow-hidden">
        {/* BARRA LATERAL IZQUIERDA (420px, scroll independiente) */}
        <div className="w-[420px] h-full bg-linear-surface-1 border-r border-linear-hairline flex flex-col z-10 min-w-0">
          {/* Buscador Compacto tipo Figma */}
          <div className="p-4 border-b border-linear-hairline bg-linear-surface-1 space-y-3">
            <PropertySearch
              filters={filters}
              onFilterChange={setFilters}
              currency={currency}
              onCurrencyToggle={handleCurrencyToggle}
            />
            <div className="space-y-0.5 pt-1">
              <h1 className="text-xs font-bold text-linear-ink uppercase tracking-wider leading-none">
                Resultados de Búsqueda
              </h1>
              <p className="text-[10px] text-linear-ink-subtle font-semibold mt-1">
                {properties.length} inmuebles de alta gama encontrados
              </p>
            </div>
          </div>

          {/* Listado de Tarjetas con Scroll Independiente */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-linear-canvas">
            <PropertyListing
              properties={properties}
              isLoading={isLoading}
              highlightedId={activePropertyId}
              onPropertyHover={setActivePropertyId}
              currency={currency}
            />
          </div>
        </div>

        {/* MAPA DERECHO CONTINUO (Restante de la pantalla) */}
        <div className="flex-1 h-full w-full relative z-0 bg-linear-canvas border-l border-linear-hairline">
          {isMounted && (
            <MapWrapper
              properties={validProperties}
              activePropertyId={activePropertyId}
              selectedPropertyId={selectedPropertyId}
              onSelectProperty={setSelectedPropertyId}
              currency={currency}
            />
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-linear-canvas/70 backdrop-blur-[2px] z-[999] flex items-center justify-center transition-all duration-300">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-linear-hairline border-t-linear-primary"></div>
                <p className="text-xs text-linear-ink-muted font-bold uppercase tracking-wider animate-pulse">Sincronizando con Propio...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
