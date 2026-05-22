import React from 'react';

export interface FilterState {
  text: string;
  type: 'casa' | 'departamento' | 'terreno' | 'oficina' | '';
  minPrice: number | '';
  maxPrice: number | '';
  verifiedOnly: boolean;
}

interface PropertySearchProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  currency: 'USD' | 'BOB';
  onCurrencyToggle: () => void;
}

export const PropertySearch: React.FC<PropertySearchProps> = ({
  filters,
  onFilterChange,
  currency,
  onCurrencyToggle,
}) => {
  const handleChange = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="w-full bg-linear-surface-1 p-5 rounded-2xl border border-linear-hairline space-y-5">
      {/* Encabezado limpio con área de autonomía */}
      <div className="flex justify-between items-center pb-3 border-b border-linear-hairline">
        <div>
          <h2 className="text-sm font-bold text-linear-ink uppercase tracking-wider">
            Filtros Avanzados
          </h2>
          <p className="text-[10px] text-linear-ink-subtle mt-0.5">
            Buscador técnico en Cochabamba
          </p>
        </div>
        <span className="bg-linear-primary/10 text-linear-primary px-2.5 py-1 rounded-md text-[9px] font-sans font-bold uppercase tracking-wider border border-linear-primary/20">
          📍 Cochabamba
        </span>
      </div>

      {/* Input Texto */}
      <div className="space-y-1.5">
        <label className="block text-[9px] font-bold text-linear-ink-muted uppercase tracking-widest">
          Palabras Clave
        </label>
        <input
          type="text"
          placeholder="Ej. Queru Queru, Cala Cala, Penthouse..."
          value={filters.text}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-linear-hairline focus:border-linear-primary focus:outline-none focus:ring-1 focus:ring-linear-primary/40 text-xs bg-linear-surface-2 text-linear-ink placeholder-linear-ink-subtle transition-all duration-200"
        />
      </div>

      {/* Badges de Selección de Tipo de Inmueble */}
      <div className="space-y-1.5">
        <label className="block text-[9px] font-bold text-linear-ink-muted uppercase tracking-widest">
          Tipo de Inmueble
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['casa', 'departamento', 'terreno', 'oficina'] as const).map((t) => {
            const isActive = filters.type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleChange('type', isActive ? '' : t)}
                className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 ${
                  isActive
                    ? 'bg-linear-primary border-linear-primary text-linear-ink shadow-md shadow-linear-primary/20'
                    : 'bg-linear-surface-2 border-linear-hairline text-linear-ink-muted hover:border-linear-hairline-strong hover:text-linear-ink'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sello de Calidad / Sello Oro */}
      <div className="space-y-1.5">
        <label className="block text-[9px] font-bold text-linear-ink-muted uppercase tracking-widest">
          Calidad Certificada
        </label>
        <button
          type="button"
          onClick={() => handleChange('verifiedOnly', !filters.verifiedOnly)}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 ${
            filters.verifiedOnly
              ? 'bg-linear-primary border-linear-primary text-linear-ink shadow-md shadow-linear-primary/20'
              : 'bg-linear-surface-2 border-linear-hairline text-linear-ink-muted hover:border-linear-hairline-strong hover:text-linear-ink'
          }`}
        >
          <span>🏆</span>
          <span>Sólo Verificadas (Sello Oro)</span>
        </button>
      </div>

      {/* Rango de Precios */}
      <div className="space-y-1.5">
        <label className="block text-[9px] font-bold text-linear-ink-muted uppercase tracking-widest">
          Rango de Precios ({currency})
        </label>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-linear-hairline focus:border-linear-primary focus:outline-none focus:ring-1 focus:ring-linear-primary/40 text-xs bg-linear-surface-2 text-linear-ink placeholder-linear-ink-subtle transition-all duration-200"
          />
          <span className="text-linear-ink-subtle text-[10px] font-bold font-sans">a</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-linear-hairline focus:border-linear-primary focus:outline-none focus:ring-1 focus:ring-linear-primary/40 text-xs bg-linear-surface-2 text-linear-ink placeholder-linear-ink-subtle transition-all duration-200"
          />
        </div>
      </div>

      {/* Divisa y Toggle */}
      <div className="flex justify-between items-center pt-2 border-t border-linear-hairline">
        <span className="text-[9px] font-bold text-linear-ink-subtle uppercase tracking-widest">
          Moneda de Referencia
        </span>
        <div className="flex items-center bg-linear-surface-2 p-0.5 rounded-lg border border-linear-hairline">
          <button
            type="button"
            onClick={() => currency !== 'USD' && onCurrencyToggle()}
            className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${
              currency === 'USD'
                ? 'bg-linear-primary text-linear-ink shadow-sm'
                : 'text-linear-ink-subtle hover:text-linear-ink'
            }`}
          >
            USD
          </button>
          <button
            type="button"
            onClick={() => currency !== 'BOB' && onCurrencyToggle()}
            className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all duration-200 ${
              currency === 'BOB'
                ? 'bg-linear-primary text-linear-ink shadow-sm'
                : 'text-linear-ink-subtle hover:text-linear-ink'
            }`}
          >
            BOB
          </button>
        </div>
      </div>
    </div>
  );
};
