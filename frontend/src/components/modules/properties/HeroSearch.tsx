'use client';

import React from 'react';

export interface FilterState {
  text: string;
  type: 'casa' | 'departamento' | 'terreno' | 'oficina' | '';
  minPrice: number | '';
  maxPrice: number | '';
  verifiedOnly: boolean;
}

interface HeroSearchProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  currency: 'USD' | 'BOB';
  onCurrencyToggle: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  filters,
  onFilterChange,
  currency,
  onCurrencyToggle,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, text: e.target.value });
  };

  const handleTypeSelect = (type: 'casa' | 'departamento' | 'terreno' | 'oficina' | '') => {
    onFilterChange({ ...filters, type });
  };

  const handleVerifiedToggle = () => {
    onFilterChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const handlePriceChange = (key: 'minPrice' | 'maxPrice', value: string) => {
    onFilterChange({
      ...filters,
      [key]: value === '' ? '' : Number(value),
    });
  };

  return (
    <div className="w-full">
      {/* 1. Hero Section con Imagen de Fondo Premium y Overlay Oscuro */}
      <section className="relative w-full min-h-[55vh] md:min-h-[60vh] bg-propio-blue flex items-center justify-center py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Imagen de fondo premium de arquitectura con baja opacidad */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-1000"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80')" 
          }}
        />
        
        {/* Overlay gradiente de la marca Propio */}
        <div className="absolute inset-0 bg-gradient-to-b from-propio-blue/90 via-propio-blue/70 to-propio-blue/95" />

        {/* Adornos visuales de luz difusa de marca */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-propio-green/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-propio-green/10 blur-3xl" />

        {/* Contenido del Hero (Centrado y de alto impacto) */}
        <div className="relative max-w-4xl mx-auto text-center space-y-6 z-10">
          {/* Badge de Categoría Premium */}
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-sans font-black tracking-widest bg-propio-green/10 text-propio-green uppercase border border-propio-green/20 animate-pulse-subtle">
            ✨ Plataforma Inmobiliaria Transparente • Bolivia
          </span>

          {/* Título Principal en Amerika Sans (font-heading) */}
          <h1 className="text-4xl sm:text-6xl font-heading font-black text-white tracking-tight leading-none uppercase max-w-3xl mx-auto">
            El camino más directo a tu nuevo{' '}
            <span className="underline decoration-propio-green decoration-4 decoration-wavy underline-offset-8">
              hogar
            </span>
          </h1>

          {/* Subtítulo Descriptivo */}
          <p className="text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-sans font-medium">
            Conexión directa con propietarios, datos validados por el Sello Oro y precios reales sin cargos ocultos ni intermediación abusiva.
          </p>
        </div>
      </section>

      {/* 2. Buscador Flotante Premium (Diseño Pixel-Perfect con sombreado tridimensional) */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 z-30">
        <div className="w-full max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 -mt-12 md:-mt-20 transform transition-all duration-300">
          
          {/* Fila Superior: Selectores de Transacción y Autonomía */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5 mb-6">
            <div className="flex gap-2">
              <button 
                type="button" 
                className="px-4 py-2 bg-propio-blue text-propio-green font-sans font-black text-xs uppercase tracking-wider rounded-xl shadow-sm"
              >
                Comprar
              </button>
              <button 
                type="button" 
                className="px-4 py-2 text-propio-blue/60 hover:text-propio-blue font-sans font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors"
              >
                Alquilar
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="bg-propio-green/10 text-propio-blue font-sans font-black text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-propio-green/20">
                📍 Bolivia • Cochabamba
              </span>
            </div>
          </div>

          {/* Formulario / Inputs de Búsqueda */}
          <div className="space-y-6">
            {/* Fila 1: Texto y Tipo de Inmueble */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Dirección/Ubicación */}
              <div className="lg:col-span-6 space-y-2">
                <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-wider">
                  📍 Ubicación o Zona
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. Queru Queru, Cala Cala, América..."
                    value={filters.text}
                    onChange={handleTextChange}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/40 text-sm font-sans font-bold text-propio-blue placeholder-slate-400 bg-slate-50/50 hover:bg-slate-50 transition-all"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Botones de Selección de Tipo de Inmueble */}
              <div className="lg:col-span-6 space-y-2">
                <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-wider">
                  🏠 Tipo de Inmueble
                </label>
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'casa', label: 'Casa' },
                    { value: 'departamento', label: 'Dpto' },
                    { value: 'terreno', label: 'Terreno' },
                    { value: 'oficina', label: 'Oficina' },
                  ] as const).map((t) => {
                    const isActive = filters.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => handleTypeSelect(isActive ? '' : t.value)}
                        className={`flex-1 min-w-[70px] px-3 py-3 rounded-xl text-xs font-sans font-black uppercase tracking-wider border transition-all duration-200 ${
                          isActive
                            ? 'bg-propio-green border-propio-green text-propio-blue shadow-md scale-[1.02]'
                            : 'bg-slate-50/50 border-slate-200 text-propio-blue/80 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fila 2: Precios, Divisas y Sello de Calidad */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              {/* Rango de Precios */}
              <div className="lg:col-span-6 space-y-2">
                <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-wider">
                  💵 Rango de Precios ({currency === 'USD' ? 'USD $' : 'BOB Bs.'})
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={filters.minPrice}
                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/40 text-sm font-sans font-bold text-propio-blue placeholder-slate-400 bg-slate-50/50 transition-all"
                  />
                  <span className="text-slate-400 text-xs font-black font-sans uppercase">a</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={filters.maxPrice}
                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 focus:border-propio-blue focus:outline-none focus:ring-2 focus:ring-propio-green/40 text-sm font-sans font-bold text-propio-blue placeholder-slate-400 bg-slate-50/50 transition-all"
                  />
                </div>
              </div>

              {/* Sello de Calidad (Toggle) */}
              <div className="lg:col-span-4 space-y-2">
                <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-wider">
                  🏆 Filtro de Confianza
                </label>
                <button
                  type="button"
                  onClick={handleVerifiedToggle}
                  className={`w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs font-sans font-black uppercase tracking-wider border transition-all duration-200 ${
                    filters.verifiedOnly
                      ? 'bg-propio-green border-propio-green text-propio-blue shadow-md scale-[1.01]'
                      : 'bg-slate-50/50 border-slate-200 text-propio-blue/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm">🏆</span>
                  <span>Solo Sello Oro Verificadas</span>
                </button>
              </div>

              {/* Toggle de Moneda (USD / BOB) */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-[11px] font-sans font-black text-propio-blue/70 uppercase tracking-wider text-center lg:text-left">
                  💱 Moneda
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => currency !== 'USD' && onCurrencyToggle()}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-sans font-black uppercase tracking-wider transition-all duration-200 ${
                      currency === 'USD'
                        ? 'bg-propio-blue text-white shadow-sm'
                        : 'text-propio-blue/50 hover:text-propio-blue'
                    }`}
                  >
                    USD
                  </button>
                  <button
                    type="button"
                    onClick={() => currency !== 'BOB' && onCurrencyToggle()}
                    className={`flex-1 py-2.5 rounded-lg text-[10px] font-sans font-black uppercase tracking-wider transition-all duration-200 ${
                      currency === 'BOB'
                        ? 'bg-propio-blue text-white shadow-sm'
                        : 'text-propio-blue/50 hover:text-propio-blue'
                    }`}
                  >
                    BOB
                  </button>
                </div>
              </div>
            </div>

            {/* Fila de Acción Rápida - Limpiar filtros (Opcional, pero muy premium) */}
            {(filters.text || filters.type || filters.minPrice || filters.maxPrice || filters.verifiedOnly) && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => onFilterChange({ text: '', type: '', minPrice: '', maxPrice: '', verifiedOnly: false })}
                  className="text-xs font-sans font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Limpiar Búsqueda
                </button>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
};
