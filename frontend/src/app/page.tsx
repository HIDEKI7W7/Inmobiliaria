'use client';

import React, { useState } from 'react';
import { HeroSearch, FilterState } from '../components/modules/properties/HeroSearch';
import { PropertyGrid } from '../components/modules/properties/PropertyGrid';
import { useProperties } from '../hooks/useProperties';

export default function HomePage() {
  const { properties, loading, error } = useProperties();

  // Estado del Filtro de Inmuebles
  const [filters, setFilters] = useState<FilterState>({
    text: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    verifiedOnly: false,
  });

  // Estado de Moneda
  const [currency, setCurrency] = useState<'USD' | 'BOB'>('USD');

  // Toggle de Moneda con Reset de Precios
  const handleCurrencyToggle = () => {
    setCurrency((prev) => (prev === 'USD' ? 'BOB' : 'USD'));
    setFilters((prev) => ({
      ...prev,
      minPrice: '',
      maxPrice: '',
    }));
  };

  // Filtrado de Inmuebles Interactivos en Tiempo Real
  const filteredProperties = properties.filter((property) => {
    // 1. Filtro de Texto (Título o Ubicación)
    if (filters.text) {
      const query = filters.text.toLowerCase();
      const matchTitle = property.title.toLowerCase().includes(query);
      const matchLocation = property.location.toLowerCase().includes(query);
      if (!matchTitle && !matchLocation) return false;
    }

    // 2. Filtro de Tipo de Inmueble
    if (filters.type && property.type !== filters.type) {
      return false;
    }

    // 3. Filtro Sello de Oro (Verificadas)
    if (filters.verifiedOnly && !property.verified) {
      return false;
    }

    // 4. Filtro de Precios (Considera tipo de cambio corporativo 1 USD = 10 BOB)
    const currentPrice =
      currency === 'USD' ? property.price : property.priceBob || property.price * 10;

    if (filters.minPrice !== '' && currentPrice < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== '' && currentPrice > filters.maxPrice) {
      return false;
    }

    return true;
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      
      {/* 1. Hero Section + Buscador Flotante (Disposición Premium del Figma) */}
      <HeroSearch
        filters={filters}
        onFilterChange={setFilters}
        currency={currency}
        onCurrencyToggle={handleCurrencyToggle}
      />

      {/* Margen adaptativo debido al traslape del buscador flotante */}
      <div className="h-6 md:h-12" />

      {/* 2. Catálogo / Cuadrícula de Propiedades Reactiva */}
      {error ? (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-red-50 text-red-800 rounded-3xl border border-red-100 text-center space-y-3">
          <span className="text-3xl block">⚠️</span>
          <h3 className="font-heading font-black uppercase text-lg">Error al conectar con la base de datos</h3>
          <p className="text-xs font-sans font-medium">{error}</p>
        </div>
      ) : (
        <PropertyGrid
          properties={filteredProperties}
          currency={currency}
          loading={loading}
        />
      )}

      {/* 3. Sección Premium de Propuesta de Valor (Pilares de la Metodología Antigravity) */}
      <section className="w-full py-20 px-6 sm:px-8 lg:px-12 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Encabezado de la Sección */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-propio-blue uppercase tracking-tight">
              La Revolución Inmobiliaria de Propio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-sans font-black uppercase tracking-wider">
              Tecnología de vanguardia para conectar personas de forma transparente, directa y segura.
            </p>
          </div>

          {/* Grid de 3 Columnas (Value Cards con micro-animaciones premium) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Columna 1: Trato 100% Directo */}
            <div className="group bg-slate-50/50 p-8 rounded-2xl border border-slate-100 hover:border-propio-green/40 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-propio-green/10 text-propio-green flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  🤝
                </div>
                <h3 className="text-xl font-heading font-black text-propio-blue uppercase tracking-tight group-hover:text-propio-blue transition-colors">
                  Trato Directo sin Intermediarios
                </h3>
                <p className="text-slate-500 font-sans text-sm font-medium leading-relaxed">
                  Evita pagar pesadas comisiones inmobiliarias del 3% o 4%. En Propio, te conectas directamente con los propietarios de forma ágil y digitalizada.
                </p>
              </div>
            </div>

            {/* Columna 2: Sello Oro de Calidad */}
            <div className="group bg-slate-50/50 p-8 rounded-2xl border border-slate-100 hover:border-propio-green/40 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-propio-green/10 text-propio-green flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  🏆
                </div>
                <h3 className="text-xl font-heading font-black text-propio-blue uppercase tracking-tight group-hover:text-propio-blue transition-colors">
                  Sello Oro de Verificación
                </h3>
                <p className="text-slate-500 font-sans text-sm font-medium leading-relaxed">
                  Todas las propiedades con el Sello Oro han sido verificadas jurídicamente e inspeccionadas físicamente por nuestro equipo especializado para brindarte 100% seguridad.
                </p>
              </div>
            </div>

            {/* Columna 3: Información Unificada */}
            <div className="group bg-slate-50/50 p-8 rounded-2xl border border-slate-100 hover:border-propio-green/40 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-propio-green/10 text-propio-green flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  ⚡
                </div>
                <h3 className="text-xl font-heading font-black text-propio-blue uppercase tracking-tight group-hover:text-propio-blue transition-colors">
                  Backend como Fuente Única
                </h3>
                <p className="text-slate-500 font-sans text-sm font-medium leading-relaxed">
                  Basta de avisos duplicados, precios inflados o propiedades fantasmas. Nuestra API construida en NestJS y Prisma garantiza datos limpios, consistentes y actualizados en tiempo real.
                </p>
              </div>
            </div>

          </div>

          {/* Banner de Acción Secundario (CTA Mapa) */}
          <div className="bg-propio-blue rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-2xl">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-propio-blue/95 to-propio-blue/80" />
            
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-tight">
                ¿Prefieres buscar sobre un mapa interactivo?
              </h3>
              <p className="text-sm text-slate-300 font-sans leading-relaxed">
                Descubre nuestra vista geolocalizada en Cochabamba para filtrar de forma geográfica las mejores ofertas escolares, bancarias o laborales cerca de ti.
              </p>
              <div className="pt-2">
                <a
                  href="/properties"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-propio-green text-propio-blue hover:bg-white font-heading font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-95"
                >
                  Ver Mapa Interactivo 🗺️
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
