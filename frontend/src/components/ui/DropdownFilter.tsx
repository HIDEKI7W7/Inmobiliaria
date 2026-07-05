import React, { useState } from 'react';

interface DropdownFilterProps {
  title: string;
  options: string[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
  isOpen: boolean;
  onToggle: () => void;
  placeholder?: string;
}

export const DropdownFilter: React.FC<DropdownFilterProps> = ({
  title,
  options,
  selectedValues,
  onFilterChange,
  isOpen,
  onToggle,
  placeholder = 'Buscar...'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt =>
    String(opt || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }}
        className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-155 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg px-2"
      >
        <span className="font-semibold text-[9px] tracking-wide uppercase">
          {title} {selectedValues.length > 0 ? `(${selectedValues.length})` : ''}
        </span>
        <span className="text-[9px] font-bold ml-1">▼</span>
      </div>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
        >
          <div className="px-1 py-0.5">
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal normal-case tracking-normal"
            />
          </div>

          <div className="max-h-36 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isChecked = selectedValues.includes(opt);
                return (
                  <label
                    key={opt}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          onFilterChange(selectedValues.filter(v => v !== opt));
                        } else {
                          onFilterChange([...selectedValues, opt]);
                        }
                      }}
                      className="rounded border-slate-350 text-[#04045E] focus:ring-[#04045E]"
                    />
                    <span>{opt}</span>
                  </label>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 font-semibold">
                Sin resultados
              </div>
            )}
          </div>

          {selectedValues.length > 0 && (
            <button
              onClick={() => {
                onFilterChange([]);
                setSearchTerm('');
              }}
              className="w-full text-center py-1 text-[10px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      )}
    </div>
  );
};
