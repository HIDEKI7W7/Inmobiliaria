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

// Inversiones inteligentes: Filtrar exclusivamente por PROYECTOS o VENTAS recientes.
// Se muestran en Bolivianos (Bs.) por defecto.
const INVERSIONES_PROPERTIES = [
  {
    id: 'prop-4-cala-cala',
    title: 'Casa Familiar de Estilo Moderno',
    priceBob: 2100000,
    location: 'Cala Cala, Cochabamba',
    area: 250,
    rooms: 5,
    baths: 4,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=85',
    verified: true,
    offerType: 'VENTA',
  },
  {
    id: 'prop-3-queru-queru',
    title: 'Penthouse de Lujo en Queru Queru',
    priceBob: 1280000,
    location: 'Queru Queru, Cochabamba',
    area: 195,
    rooms: 4,
    baths: 3,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=85',
    verified: true,
    offerType: 'VENTA',
  },
  {
    id: 'prop-17-cruce-taquina',
    title: 'Condominio de Casas Smart (En Planos)',
    priceBob: 1900000,
    location: 'Cruce Taquiña, Cochabamba',
    area: 280,
    rooms: 4,
    baths: 4,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85',
    verified: true,
    offerType: 'PROYECTO',
  },
];

const DEPARTAMENTOS_BOLIVIA = [
  'Cochabamba',
  'La Paz',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Tarija',
  'Chuquisaca',
  'Beni',
  'Pando'
];

const CATEGORIAS_BUSQUEDA = [
  { value: 'VENTA', label: 'Venta' },
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'ANTICRETICO', label: 'Anticrético' },
  { value: 'PROYECTOS', label: 'Proyectos' }
];

const TIPOS_PROPIEDAD = [
  'Local Comercial',
  'Oficina',
  'Casa',
  'Casa en condominio',
  'Terreno',
  'Propiedad agrícola/ganadera',
  'Edificio',
  'Hotel',
  'Monoambiente',
  'Garzonier',
  'Departamento',
  'Penthouse',
  'Garaje/Baulera',
  'Galpón'
];

function PropertyInversionCard({ property }: { property: typeof INVERSIONES_PROPERTIES[0] }) {
  return (
    <Link href={`/properties?id=${property.id}`} className="group cursor-pointer block">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 border border-neutral-200 rounded-3xl shadow-sm group-hover:shadow-md transition-all duration-300">
        <img
          src={property.image}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Sello de confianza de acuerdo a especificaciones */}
        <span className={`absolute top-6 left-6 text-[9px] font-black px-3.5 py-1.5 uppercase tracking-wider rounded-full shadow-sm z-10 ${
          property.verified ? 'bg-[#000033] text-[#ccff00]' : 'bg-slate-500 text-white'
        }`}>
          {property.verified ? 'documentacion verificada' : 'sin verificar'}
        </span>
        <span className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm text-[#000033] text-[9px] font-black px-3.5 py-1.5 uppercase tracking-wider rounded-xl shadow-sm border border-slate-200/50">
          {property.offerType}
        </span>
      </div>
      <div className="mt-6 space-y-2">
        <h3 className="font-sans text-xl font-bold text-[#000033] tracking-tight group-hover:text-opacity-85 transition-all leading-tight">
          {property.title}
        </h3>
        <div className="flex justify-between items-baseline pt-1">
          <span className="text-xs font-semibold text-slate-500 font-sans tracking-wide">
            {property.location}
          </span>
          <span className="font-sans text-lg font-black text-[#000033]">
            Bs. {property.priceBob.toLocaleString()}
          </span>
        </div>

        {/* Especificaciones con iconos vectoriales */}
        <div className="flex gap-4 pt-3 border-t border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            {property.rooms} Dorms
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545M2.25 5.5l4.5-1.636M18.75 5.5l-1.5.545m-9 3.5v3m0 0V17m0-4.5H10.5m-3 0h3m-3 0V17m0-4.5H4.5" />
            </svg>
            {property.baths} Baños
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L12 7.5l5.571 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0L12 16.5 6.429 14.25" />
            </svg>
            {property.area} m²
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const router = useRouter();
  
  // Estados reactivos de filtros secuenciales obligatorios
  const [ciudad, setCiudad] = useState('Cochabamba');
  const [categoria, setCategoria] = useState('VENTA');
  const [tipoPropiedad, setTipoPropiedad] = useState('Casa');

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set('city', ciudad);
    params.set('category', categoria);
    params.set('type', tipoPropiedad);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 font-sans antialiased">
      
      {/* ─── HERO SECTION CORPORATIVO A COLOR ─── */}
      <section className="relative min-h-[90vh] flex flex-col justify-center bg-[#000033] overflow-hidden pt-20">
        <div className="absolute inset-0 opacity-40 z-0">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2200&q=85"
            alt="Hero Architecture"
            className="w-full h-full object-cover scale-102"
          />
        </div>
        
        {/* Máscara translúcida de marca para una fusión armónica */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000033] via-[#000033]/40 to-[#000033]/70 z-5" />

        {/* Patrón geométrico */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ccff00_1px,transparent_1px)] [background-size:16px_16px] z-5"></div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-8 lg:px-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-20">
          <div className="lg:col-span-10 flex flex-col gap-6">
            
            <h1 className="font-sans text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-black tracking-tight leading-[1.1] uppercase break-words hyphens-auto">
              Arquitectura,<br />
              <span className="text-[#ccff00]">Respaldo Legal</span><br />
              y Trato Directo.
            </h1>
            
            <p className="max-w-xl text-sm sm:text-base font-medium leading-relaxed text-slate-350 mt-2">
              Hazlo seguro. Hazlo tuyo. Hazlo propio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link
                href="/properties"
                className="w-full sm:w-auto text-center bg-[#ccff00] text-[#000033] px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all duration-300 rounded-xl shadow-lg shadow-lime-100"
              >
                explorar en el mapa
              </Link>
              <Link
                href="/login?tab=register"
                className="w-full sm:w-auto text-center border-2 border-white/60 text-white px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:bg-white hover:text-[#000033] transition-all duration-300 rounded-xl"
              >
                Publicar Inmueble
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOTOR DE BÚSQUEDA AVANZADA (HOME FILTERS) ─── */}
      <section className="relative z-20 -mt-16 max-w-[1440px] mx-auto px-8 lg:px-20">
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white p-8 md:p-10 border border-slate-100 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-8 items-end shadow-xl"
        >
          {/* 1. CIUDAD */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">CIUDAD</label>
            <select
              className="border-b border-[#000033] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#000033] text-sm font-semibold text-[#000033] cursor-pointer"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
            >
              {DEPARTAMENTOS_BOLIVIA.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 2. CATEGORÍA */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">CATEGORÍA</label>
            <select
              className="border-b border-[#000033] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#000033] text-sm font-semibold text-[#000033] cursor-pointer"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIAS_BUSQUEDA.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 3. TIPO DE PROPIEDAD */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-[10px] font-bold uppercase tracking-widest text-slate-400">TIPO DE PROPIEDAD</label>
            <select
              className="border-b border-[#000033] rounded-none bg-transparent py-2.5 px-1 focus:outline-none focus:ring-0 focus:border-[#000033] text-sm font-semibold text-[#000033] cursor-pointer"
              value={tipoPropiedad}
              onChange={(e) => setTipoPropiedad(e.target.value)}
            >
              {TIPOS_PROPIEDAD.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* BOTÓN EXPLORAR */}
          <button
            type="submit"
            className="w-full bg-[#000033] hover:bg-opacity-95 text-white py-4 font-sans text-xs font-black uppercase tracking-widest transition-colors duration-300 rounded-xl shadow-md cursor-pointer"
          >
            explorar en el mapa
          </button>
        </form>
      </section>

      {/* ─── SECCIÓN DE PILARES CORPORATIVOS (HORIZONTALES) ─── */}
      <section className="py-24 max-w-[1440px] mx-auto px-8 lg:px-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          
          {/* Pilar 1 */}
          <div className="bg-white border border-slate-150 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <span className="font-sans text-5xl font-black text-[#000033]">0%</span>
            <h3 className="font-sans text-base font-black text-[#000033] uppercase tracking-wider">Cero Comisiones Ocultas</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Olvídate de las comisiones infladas. Con nuestra tecnología conectas directo con el dueño y ahorras miles de dólares.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="bg-white border border-slate-150 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <span className="font-sans text-5xl font-black text-[#000033]">⚖️</span>
            <h3 className="font-sans text-base font-black text-[#000033] uppercase tracking-wider">Filtro Legal y Seguro</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Cada propiedad pasa por una auditoría jurídica estricta. Información real, transparente y sin sorpresas.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="bg-white border border-slate-150 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
            <span className="font-sans text-5xl font-black text-[#000033]">⚡</span>
            <h3 className="font-sans text-base font-black text-[#000033] uppercase tracking-wider">Agilidad Transacciones a un Clic</h3>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Agenda visitas, oferta y cierra el trato de forma rápida, eficiente y digital.
            </p>
          </div>

        </div>
      </section>

      {/* ─── SECCIÓN INVERSIONES INTELIGENTES ─── */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 border-b border-slate-100 pb-8 gap-4">
            <div>
              <span className="font-sans text-[10px] font-bold text-slate-400 block mb-2 tracking-[0.25em] uppercase">SELECCIÓN EXCLUSIVA</span>
              <h2 className="font-sans text-4xl md:text-5xl font-black text-[#000033] uppercase tracking-tight leading-none">
                Inversiones inteligentes <span className="text-[#ccff00] block sm:inline">Maximiza tu capital</span>
              </h2>
            </div>
            <Link
              href="/properties"
              className="font-sans text-xs font-black uppercase tracking-widest text-[#000033] underline underline-offset-8 decoration-2 hover:text-opacity-80 transition-colors"
            >
              ver todas las propiedades
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {INVERSIONES_PROPERTIES.map((property) => (
              <PropertyInversionCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECCIÓN DE PUBLICACIÓN REMANENTE (CTA) ─── */}
      <section className="relative overflow-hidden bg-[#000033] py-28 px-8 text-white text-center rounded-t-[3rem]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ccff00_1px,transparent_1px)] [background-size:16px_16px] z-0"></div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="font-sans text-4xl md:text-6xl font-black leading-[1.1] uppercase tracking-tight">
            ¿Deseas vender o alquilar<br />
            <span className="text-[#ccff00]">tu propiedad?</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link 
              href="/login?tab=register" 
              className="bg-white text-[#000033] px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all duration-300 rounded-xl shadow-lg"
            >
              publicar ahora
            </Link>
            <Link 
              href="/servicios" 
              className="bg-[#ccff00] text-[#000033] px-10 py-5 font-sans text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all duration-300 rounded-xl shadow-none"
              style={{ boxShadow: 'none' }}
            >
              promociona tu propiedad
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
