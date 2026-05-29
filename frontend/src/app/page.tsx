'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LogoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} stroke-current stroke-[2]`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M6 21V3h8a4 4 0 014 4v0a4 4 0 01-4 4H6M12 11l6 10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURED_PROPERTIES = [
  {
    id: 'prop-1-cala-cala',
    title: 'Casa Familiar en Cala Cala',
    price: 320000,
    location: 'Cala Cala, Cochabamba',
    area: 350,
    rooms: 5,
    baths: 4,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'prop-2-queru-queru',
    title: 'Penthouse de Lujo en Queru Queru',
    price: 185000,
    location: 'Queru Queru, Cochabamba',
    area: 195,
    rooms: 4,
    baths: 3,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85',
  },
  {
    id: 'prop-3-el-prado',
    title: 'Departamento Moderno en El Prado',
    price: 95000,
    location: 'El Prado, Cochabamba',
    area: 85,
    rooms: 2,
    baths: 2,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=85',
  },
];

const ZONAS_POPULARES = [
  { name: 'Cala Cala', count: 128, img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Queru Queru', count: 94, img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80' },
  { name: 'El Prado', count: 76, img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sarco', count: 52, img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80' },
];

function PropertyCard({ property }: { property: (typeof FEATURED_PROPERTIES)[0] }) {
  const t = (key: string) => key;
  return (
    <Link href={`/properties?id=${property.id}`} className="group cursor-pointer block">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 border border-neutral-200 rounded-3xl shadow-sm group-hover:shadow-md transition-all duration-300">
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute top-6 left-6 bg-[#04045E] text-[#b9fa3c] px-3.5 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-full">
          {t("VERIFICADO SELLO ORO")}
        </span>
      </div>
      <div className="mt-6 space-y-2">
        <h3 className="font-sans text-xl font-bold text-[#04045E] tracking-tight group-hover:text-opacity-80 transition-all leading-tight">
          {property.title}
        </h3>
        <div className="flex justify-between items-baseline pt-1">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide">
            {property.location} • {property.area} m²
          </span>
          <span className="font-sans text-lg font-black text-[#04045E]">
            ${property.price.toLocaleString()}
          </span>
        </div>
        <div className="flex gap-4 pt-3 border-t border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span>{property.rooms} {t("Dorms")}</span>
          <span>{property.baths} {t("Baños")}</span>
        </div>
      </div>
    </Link>
  );
}

const UBICACIONES_BOLIVIA = [
  { label: "Cochabamba - Cala Cala", valor: "cochabamba_cala_cala" },
  { label: "Cochabamba - Queru Queru", valor: "cochabamba_queru_queru" },
  { label: "Cochabamba - El Prado", valor: "cochabamba_el_prado" },
  { label: "Cochabamba - Sacaba", valor: "cochabamba_sacaba" },
  { label: "Cochabamba - Quillacollo", valor: "cochabamba_quillacollo" },
  { label: "Santa Cruz - Equipetrol", valor: "santa_cruz_equipetrol" },
  { label: "Santa Cruz - Urubó", valor: "santa_cruz_urubo" },
  { label: "Santa Cruz - Centro", valor: "santa_cruz_centro" },
  { label: "La Paz - Sopocachi", valor: "la_paz_sopocachi" },
  { label: "La Paz - Zona Sur (Calacoto)", valor: "la_paz_calacoto" },
  { label: "La Paz - El Alto", valor: "la_paz_el_alto" },
  { label: "Chuquisaca - Sucre Centro", valor: "chuquisaca_sucre" },
  { label: "Tarija - Barrio El Molino", valor: "tarija_el_molino" },
  { label: "Oruro - Zona Central", valor: "oruro_centro" },
  { label: "Potosí - Centro Histórico", valor: "potosi_centro" },
  { label: "Beni - Trinidad", valor: "beni_trinidad" },
  { label: "Pando - Cobija", valor: "pando_cobija" }
];

export default function HomePage() {
  const router = useRouter();
  const [zona, setZona] = useState('');
  const [tipo, setTipo] = useState('casa');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const t = (key: string) => key;

  // Estados del Buscador Predictivo (Autocomplete)
  const [showMenu, setShowMenu] = useState(false);
  const [opcionesFiltradas, setOpcionesFiltradas] = useState(UBICACIONES_BOLIVIA);

  const handleZonaChange = (value: string) => {
    setZona(value);
    setShowMenu(true);
    if (!value.trim()) {
      setOpcionesFiltradas(UBICACIONES_BOLIVIA);
    } else {
      const filtered = UBICACIONES_BOLIVIA.filter((loc) =>
        loc.label.toLowerCase().includes(value.toLowerCase())
      );
      setOpcionesFiltradas(filtered);
    }
  };

  const handleInputFocus = () => {
    setShowMenu(true);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (zona) params.set('zone', zona);
    if (tipo) params.set('type', tipo.toUpperCase());
    if (priceRange.min) params.set('min', priceRange.min);
    if (priceRange.max) params.set('max', priceRange.max);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 font-sans antialiased">
      
      {/* ─── HERO SECTION CORPORATIVO A COLOR ─── */}
      <section className="relative min-h-screen flex flex-col justify-center bg-[#04045E] overflow-hidden pt-20">
        <div className="absolute inset-0 opacity-40 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2200&q=85"
            alt="Hero Architecture"
            className="w-full h-full object-cover scale-102"
          />
        </div>
        
        {/* Máscara translúcida de marca para una fusión armónica */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#04045E] via-[#04045E]/40 to-[#04045E]/70 z-5" />

        {/* Patrón geométrico */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#b9fa3c_1px,transparent_1px)] [background-size:16px_16px] z-5"></div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-8 lg:px-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-20">
          <div className="lg:col-span-10 flex flex-col gap-6">
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-[#b9fa3c]/20 border border-[#b9fa3c]/20 w-fit rounded-full backdrop-blur-md">
              <LogoIcon className="w-4 h-4 text-[#b9fa3c]" />
              <span className="text-[10px] font-black tracking-widest text-[#b9fa3c] uppercase">
                {t("PROPIO · TRATO DIRECTO VERIFICADO")}
              </span>
            </div>
            
            <h1 className="font-sans text-5xl md:text-7xl text-white font-black tracking-tight leading-[1.1] uppercase">
              {t("Arquitectura,")}<br />
              <span className="text-[#b9fa3c]">{t("Respaldo Legal")}</span><br />
              {t("y Trato Directo.")}
            </h1>
            
            <p className="max-w-xl text-sm sm:text-base font-medium leading-relaxed text-slate-300 mt-2">
              {t("Una selección de propiedades exclusivas verificadas jurídicamente con Sello Oro en Bolivia. Conecta directamente con propietarios reales, sin comisiones de corretaje.")}
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <Link
                href="/properties"
                className="bg-[#b9fa3c] text-[#04045E] px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all duration-300 rounded-xl shadow-lg shadow-lime-100"
              >
                {t("Explorar Propiedades")}
              </Link>
              <Link
                href="/login?tab=register"
                className="border-2 border-white/60 text-white px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#04045E] transition-all duration-300 rounded-xl"
              >
                {t("Publicar Inmueble")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FILTROS DE BÚSQUEDA ─── */}
      <section className="relative z-20 -mt-16 max-w-[1440px] mx-auto px-8 lg:px-20">
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white p-8 md:p-10 border border-slate-100 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-8 items-end shadow-xl"
        >
          <div className="flex flex-col gap-2 relative">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("Ubicación / Zona")}</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cala Cala, Queru Queru..."
                className="w-full border-b border-[#04045E] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#04045E] placeholder:text-slate-350 text-sm font-semibold text-[#04045E]"
                value={zona}
                onFocus={handleInputFocus}
                onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                onChange={(e) => handleZonaChange(e.target.value)}
              />
              
              {showMenu && opcionesFiltradas.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-b-xl shadow-xl max-h-[200px] overflow-y-auto z-50 animate-fadeIn">
                  {opcionesFiltradas.map((loc) => (
                    <button
                      key={loc.valor}
                      type="button"
                      onClick={() => {
                        setZona(loc.label);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-[#b9fa3c]/20 hover:text-[#04045E] transition-colors border-b border-slate-50 last:border-b-0 uppercase tracking-wide"
                    >
                      📍 {loc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("Tipo de Inmueble")}</label>
            <select
              className="border-b border-[#04045E] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#04045E] text-sm font-semibold text-[#04045E]"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="casa">{t("Casa")}</option>
              <option value="departamento">{t("Departamento")}</option>
              <option value="terreno">{t("Terreno")}</option>
              <option value="oficina">{t("Oficina")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">{t("Presupuesto (USD)")}</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                className="w-1/2 border-b border-[#04045E] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#04045E] placeholder:text-slate-350 text-sm font-semibold text-[#04045E]"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
              />
              <span className="text-slate-300 self-center">/</span>
              <input
                type="number"
                placeholder="Max"
                className="w-1/2 border-b border-[#04045E] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#04045E] placeholder:text-slate-350 text-sm font-semibold text-[#04045E]"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#04045E] hover:bg-opacity-95 text-white py-4 font-sans text-xs font-black uppercase tracking-widest transition-colors duration-300 rounded-xl shadow-md"
          >
            {t("Buscar")}
          </button>
        </form>
      </section>

      {/* ─── METRICAS DE CONFIANZA / SOCIAL PROOF ─── */}
      <section className="py-24 max-w-[1440px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-slate-100 pt-16">
          <div className="group py-6 border-b border-slate-100 md:border-b-0">
            <div className="flex flex-col gap-4">
              <span className="font-sans text-6xl md:text-7xl font-black text-[#04045E] transition-all duration-500">10k+</span>
              <h3 className="font-sans text-lg font-bold text-[#04045E] uppercase tracking-wider">{t("Propiedades Verificadas")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold max-w-xs">{t("Propiedades seleccionadas y auditadas legalmente por abogados especialistas para garantizar tu seguridad.")}</p>
            </div>
          </div>
          <div className="group py-6 border-b border-slate-100 md:border-b-0">
            <div className="flex flex-col gap-4">
              <span className="font-sans text-6xl md:text-7xl font-black text-[#04045E] transition-all duration-500">100%</span>
              <h3 className="font-sans text-lg font-bold text-[#04045E] uppercase tracking-wider">{t("Trato Directo Puro")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold max-w-xs">{t("Transparencia total. Negocia de forma confidencial y privada directamente con el propietario del inmueble.")}</p>
            </div>
          </div>
          <div className="group py-6">
            <div className="flex flex-col gap-4">
              <span className="font-sans text-6xl md:text-7xl font-black text-[#04045E] transition-all duration-500">0%</span>
              <h3 className="font-sans text-lg font-bold text-[#04045E] uppercase tracking-wider">{t("Comisiones Ocultas")}</h3>
              <p className="text-slate-500 text-xs leading-relaxed font-semibold max-w-xs">{t("Sin comisiones de corretaje inmobiliario abusivas. Ahorra miles de dólares negociando directamente.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN EDITORIAL SELECTION ─── */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 border-b border-slate-100 pb-8 gap-4">
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 block mb-2 tracking-[0.25em] uppercase">{t("SELECCIÓN EXCLUSIVA")}</span>
              <h2 className="font-sans text-4xl md:text-5xl font-black text-[#04045E] uppercase tracking-tight">
                {t("Colecciones")} <span className="text-[#b9fa3c]">{t("Destacadas")}</span>
              </h2>
            </div>
            <Link
              href="/properties"
              className="font-sans text-xs font-black uppercase tracking-widest text-[#04045E] underline underline-offset-8 decoration-2 hover:text-opacity-80 transition-colors"
            >
              {t("Ver Todo el Catálogo")}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {FEATURED_PROPERTIES.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA PROPIO ─── */}
      <section className="py-24 max-w-[1440px] mx-auto px-8 lg:px-20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="font-sans text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase">{t("MÉTODO DE CONFIANZA")}</span>
          <h2 className="font-sans text-4xl md:text-6xl font-black text-[#04045E] uppercase tracking-tight">
            {t("El Protocolo")} <span className="text-[#b9fa3c]">{t("Propio")}</span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            { n: '01', title: 'Selección Rigurosa', desc: 'Filtramos únicamente propiedades de alto perfil con valores reales de mercado.' },
            { n: '02', title: 'Auditoría Legal Oro', desc: 'Sometemos los títulos comerciales a una rigurosa revisión jurídica para tu tranquilidad.' },
            { n: '03', title: 'Cierre Directo', desc: 'Conectas de manera privada con el dueño para acordar los términos finales del traspaso.' },
          ].map((step) => (
            <div 
              key={step.n} 
              className="border border-slate-100 bg-white p-8 md:p-10 rounded-3xl transition-all duration-300 hover:shadow-xl hover:border-[#b9fa3c]"
            >
              <p className="font-sans text-6xl font-black text-[#b9fa3c] leading-none">{step.n}</p>
              <h3 className="mt-8 text-lg font-bold text-[#04045E] uppercase tracking-wider">{step.title}</h3>
              <p className="mt-4 text-xs leading-relaxed text-slate-500 font-semibold">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CALL TO ACTION (CTA) COLOR DE MARCA ─── */}
      <section className="relative overflow-hidden bg-[#04045E] py-28 px-8 text-white text-center rounded-t-[3rem]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#b9fa3c_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="font-sans text-4xl md:text-6xl font-black leading-[1.1] uppercase tracking-tight">
            ¿Deseas vender o alquilar<br />
            <span className="text-[#b9fa3c]">{t("tu propiedad?")}</span>
          </h2>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-semibold leading-relaxed text-slate-300">
            {t("Regístrala hoy de manera gratuita y accede a nuestro pipeline asistido con validación legal premium de Sello Oro en Bolivia.")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link 
              href="/login?tab=register" 
              className="bg-[#b9fa3c] text-[#04045E] px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all duration-300 rounded-xl shadow-lg shadow-lime-100"
            >
              {t("Publicar Gratis Ahora")}
            </Link>
            <Link 
              href="/servicios" 
              className="border-2 border-white/40 text-white px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#04045E] transition-all duration-300 rounded-xl"
            >
              {t("Ver Servicios Editoriales")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ZONAS POPULARES ─── */}
      <section className="bg-white py-24 border-t border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20">
          <div className="mb-16 text-center space-y-4">
            <span className="font-sans text-[10px] font-bold text-slate-400 tracking-[0.25em] uppercase">{t("EXPLORACIÓN ESTRATÉGICA")}</span>
            <h2 className="font-sans text-4xl md:text-5xl font-black text-[#04045E] uppercase tracking-tight">
              {t("Zonas")} <span className="text-[#b9fa3c]">{t("Premium")}</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {ZONAS_POPULARES.map((zonaItem) => (
              <Link
                key={zonaItem.name}
                href={`/properties?zone=${zonaItem.name}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl border border-slate-100 shadow-sm hover:border-[#b9fa3c] hover:shadow-md transition-all duration-300"
              >
                <img 
                  src={zonaItem.img} 
                  alt={zonaItem.name} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04045E]/90 via-[#04045E]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 z-10">
                  <p className="text-lg font-bold text-white uppercase tracking-wider">{zonaItem.name}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#b9fa3c] mt-1">{zonaItem.count} {t("Propiedades")}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
