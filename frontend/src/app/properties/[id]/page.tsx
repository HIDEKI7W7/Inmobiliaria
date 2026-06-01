'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getToken, getCurrentUser } from '@/utils/session';
import { DaysOnMarketBadge } from '@/components/ui/DaysOnMarketBadge';
import { PriceTrendChart } from '@/components/ui/PriceTrendChart';
import { PropertyAlertForm } from '@/components/ui/PropertyAlertForm';

// Importación dinámica del Mini Mapa para evitar problemas de hidratación en Next.js
const MiniMap = dynamic(() => import('@/components/modules/properties/MiniMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-3 p-6 text-center animate-pulse border border-slate-200">
      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#b9fa3c] animate-spin"></div>
      <p className="text-xs text-slate-400 font-sans tracking-wider uppercase">Cargando cartografía...</p>
    </div>
  )
});

interface PriceHistory {
  date: string;
  event: string;
  price: number;
}

interface Agent {
  id: string;
  name: string;
  agency: string;
  stars: number;
  phone: string;
  avatar: string;
}

// Catálogo simulado de inmuebles
const PROPERTIES_CATALOG: Record<string, any> = {
  'prop-1-cala-cala': {
    id: 'prop-1-cala-cala',
    code: 'PRP-001-CBBA',
    title: 'Casa Familiar en Cala Cala',
    price: 320000,
    beds: 5,
    baths: 4,
    m2: 350,
    address: 'Av. América Oeste #1420, Cala Cala Norte',
    city: 'Cochabamba, Bolivia',
    verified: true,
    offerType: 'VENTA',
    description: 'Espléndida residencia de dos plantas ubicada en una de las zonas más exclusivas de Cochabamba. Cuenta con jardín interior privado, churrasquera cubierta, sistema de seguridad las 24 horas y acabados de primera calidad.',
    amenities: ['COCINA REMODELADA', 'LOTE PREMIUM', 'JARDÍN INTERIOR', 'PRIVACIDAD ABSOLUTA', 'SEGURIDAD 24/7', 'PARQUEO DOBLE'],
    history: [
      { date: '15/05/2026', event: 'Aprobado en Propio', price: 320000 },
      { date: '02/04/2026', event: 'Cambio de precio', price: 335000 },
      { date: '10/03/2026', event: 'Publicación Inicial', price: 350000 }
    ],
    coordinates: { lat: -17.3680, lng: -66.1590 },
    docs: { folioReal: true, catastro: true, testimonio: false, impuestos: true, plano: false, ci: true },
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    ]
  },
  'prop-2-queru-queru': {
    id: 'prop-2-queru-queru',
    code: 'PRP-002-CBBA',
    title: 'Penthouse de Lujo en Queru Queru',
    price: 185000,
    beds: 4,
    baths: 3,
    m2: 195,
    address: 'Edificio Skyview Piso 14, Queru Queru',
    city: 'Cochabamba, Bolivia',
    verified: true,
    offerType: 'VENTA',
    description: 'Espectacular penthouse de estreno ubicado en el último piso del Edificio Skyview. Terraza panorámica con jacuzzi, cocina gourmet equipada, sala de estar con doble altura y vistas únicas a la ciudad. Acabados europeos, domótica integrada y dos parqueos independientes.',
    amenities: ['DOMÓTICA INTEGRADA', 'JACUZZI PANORÁMICO', 'ACABADOS EUROPEOS', 'VISTA PANORÁMICA', 'SEGURIDAD 24/7', 'PARQUEO DOBLE'],
    history: [
      { date: '10/05/2026', event: 'Aprobado en Propio', price: 185000 },
      { date: '15/04/2026', event: 'Publicación Inicial', price: 190000 }
    ],
    coordinates: { lat: -17.3695, lng: -66.1480 },
    docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: false, ci: true },
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    ]
  },
  'prop-3-el-prado': {
    id: 'prop-3-el-prado',
    code: 'PRP-003-CBBA',
    title: 'Departamento Moderno en El Prado',
    price: 95000,
    beds: 2,
    baths: 2,
    m2: 85,
    address: 'Av. Ballivián #450, El Prado',
    city: 'Cochabamba, Bolivia',
    verified: false,
    offerType: 'ALQUILER',
    description: 'Departamento de 2 habitaciones recién remodelado en pleno Prado. Cocina americana integrada, balcón privado, portería 24h y acceso controlado. Alta demanda de alquiler por su ubicación céntrica ideal para ejecutivos y profesionales.',
    amenities: ['COCINA AMERICANA', 'BALCÓN PRIVADO', 'UBICACIÓN CÉNTRICA', 'RECIÉN REMODELADO', 'PORTERÍA 24H'],
    history: [
      { date: '12/05/2026', event: 'Aprobado en Propio', price: 95000 }
    ],
    coordinates: { lat: -17.3820, lng: -66.1560 },
    docs: { folioReal: false, catastro: true, testimonio: false, impuestos: false, plano: false, ci: true },
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    ]
  }
};

const DEFAULT_PROPERTY = {
  id: 'prop-default',
  code: 'PRP-DFT-CBBA',
  title: 'Residencia Premium del Bosque',
  price: 320000,
  beds: 4,
  baths: 3,
  m2: 285,
  address: "Av. América Oeste #1420, Queru Queru Norte",
  city: "Cochabamba, Bolivia",
  verified: true,
  offerType: 'VENTA',
  description: 'Exclusivo inmueble de arquitectura contemporánea con orientación solar inmejorable. Destaca por sus acabados de lujo, cocina de diseño con isla central, climatización domotizada y amplios ventanales termoacústicos de piso a techo que expanden la iluminación natural.',
  amenities: ["COCINA REMODELADA", "LOTE PREMIUM", "PRIVACIDAD ABSOLUTA", "DOMÓTICA INTEGRADA", "PARQUEO DOBLE", "SEGURIDAD 24/7"],
  history: [
    { date: "15/05/2026", event: "Aprobado en Propio", price: 320000 },
    { date: "02/04/2026", event: "Cambio de precio", price: 335000 },
    { date: "10/03/2026", event: "Publicación Inicial", price: 350000 }
  ] as PriceHistory[],
  coordinates: { lat: -17.3680, lng: -66.1590 },
  docs: { folioReal: true, catastro: true, testimonio: true, impuestos: true, plano: true, ci: true },
  images: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
  ]
};

const staffAgents: Agent[] = [
  { id: 'age_1', name: 'Carlos Mendoza', agency: 'Propio Premium Staff', stars: 5.0, phone: '+591 72345678', avatar: 'CM' },
  { id: 'age_2', name: 'Ana María Rojas', agency: 'Propio Cochabamba Norte', stars: 4.9, phone: '+591 70112233', avatar: 'AR' },
  { id: 'age_3', name: 'Bryan Salirrosas', agency: 'Propio VIP Sales', stars: 5.0, phone: '+591 71987654', avatar: 'BS' }
];

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const currentProperty = PROPERTIES_CATALOG[params.id] || { ...DEFAULT_PROPERTY, id: params.id };

  useEffect(() => {
    const recordPropertyView = async () => {
      const token = getToken();
      const user = getCurrentUser();
      if (token && user && currentProperty.id) {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
          await fetch(`${apiBaseUrl}/historial-vistas/${currentProperty.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (err) {
          console.error('Error recording view on backend:', err);
        }
      }
      
      // Local storage fallback for view history
      try {
        const localViews = localStorage.getItem('propio_recent_views');
        let viewsArray: string[] = localViews ? JSON.parse(localViews) : [];
        viewsArray = viewsArray.filter(id => id !== currentProperty.id);
        viewsArray.unshift(currentProperty.id);
        localStorage.setItem('propio_recent_views', JSON.stringify(viewsArray.slice(0, 10)));
      } catch (err) {
        console.error('Error writing to local recent views:', err);
      }
    };

    recordPropertyView();
  }, [currentProperty.id]);

  const [activeTab, setActiveTab] = useState<'fotos' | '3d' | 'plano' | 'mapa'>('fotos');
  const [selectedAgent, setSelectedAgent] = useState<string>('age_1');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showQR, setShowQR] = useState<boolean>(false);

  // ─── Estados Interactivos de la Calculadora Hipotecaria Real ───
  const [downPayment, setDownPayment] = useState<number>(Math.round(currentProperty.price * 0.2));
  const [interestRate, setInterestRate] = useState<number>(5.5); // Tasa anual en %
  const [loanTerm, setLoanTerm] = useState<number>(20); // Plazo en años

  // Estados interactivos 3D y Plano
  const [active3DRoom, setActive3DRoom] = useState<'fachada' | 'cocina' | 'sala'>('fachada');
  const room3DImages = {
    fachada: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    cocina: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    sala: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
  };
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  const currentAgent = staffAgents.find(a => a.id === selectedAgent) || staffAgents[0];

  // Cálculo matemático en tiempo real para la calculadora hipotecaria
  const mortgageResults = useMemo(() => {
    const principal = currentProperty.price - downPayment;
    if (principal <= 0) {
      return {
        monthlyPrincipalInterest: 0,
        monthlyTax: 0,
        monthlyInsurance: 0,
        totalMonthly: 0,
        percentages: { principalInterest: 0, tax: 0, insurance: 0 }
      };
    }

    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = loanTerm * 12;

    // Fórmula del amortizador estándar francés
    let monthlyPrincipalInterest = 0;
    if (monthlyRate === 0) {
      monthlyPrincipalInterest = principal / totalMonths;
    } else {
      monthlyPrincipalInterest = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    // Impuesto predial anual simulado: 0.1% de la propiedad, mensualizado
    const monthlyTax = (currentProperty.price * 0.001) / 12;
    
    // Seguro de hogar anual simulado: 0.05% de la propiedad, mensualizado
    const monthlyInsurance = (currentProperty.price * 0.0005) / 12;

    const totalMonthly = monthlyPrincipalInterest + monthlyTax + monthlyInsurance;

    const pctPrincipalInterest = Math.round((monthlyPrincipalInterest / totalMonthly) * 100);
    const pctTax = Math.round((monthlyTax / totalMonthly) * 100);
    const pctInsurance = 100 - pctPrincipalInterest - pctTax;

    return {
      monthlyPrincipalInterest: Math.round(monthlyPrincipalInterest),
      monthlyTax: Math.round(monthlyTax),
      monthlyInsurance: Math.round(monthlyInsurance),
      totalMonthly: Math.round(totalMonthly),
      percentages: {
        principalInterest: pctPrincipalInterest,
        tax: pctTax,
        insurance: pctInsurance
      }
    };
  }, [currentProperty.price, downPayment, interestRate, loanTerm]);

  const whatsappMsg = encodeURIComponent(
    `Hola ${currentAgent.name}, me interesa el inmueble "${currentProperty.title}" (${currentProperty.code}). ¿Podríamos coordinar una cita de atención premium?`
  );
  const whatsappUrl = `https://wa.me/${currentAgent.phone.replace(/\D/g, '')}?text=${whatsappMsg}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-700 antialiased selection:bg-[#b9fa3c]/30">
      
      {/* ─── Breadcrumb de Navegación ─── */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#04045E] transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/properties" className="hover:text-[#04045E] transition-colors">Propiedades</Link>
            <span>/</span>
            <span className="text-[#04045E] font-black line-clamp-1">{currentProperty.title}</span>
          </div>
          <span className="font-mono text-[10px] tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            CÓD: {currentProperty.code}
          </span>
        </div>
      </div>

      {/* Layout Principal Asimétrico */}
      <main className="max-w-[1440px] mx-auto flex flex-col lg:flex-row w-full relative pb-24 lg:pb-0">
        
        {/* =================================================================
            COLUMNA IZQUIERDA: CONTENIDO SCROLLABLE (65% de Ancho)
            ================================================================= */}
        <div className="w-full lg:w-[65%] lg:pr-8 p-4 md:p-6 lg:border-r lg:border-slate-200/80 space-y-8 h-full">
          
          {/* 1. CABECERA MULTIMEDIA INTEGRADA CON TABS ZILLOW-STYLE */}
          <section className="space-y-4">
            <div className="w-full aspect-[16/9] bg-slate-900 rounded-3xl relative overflow-hidden shadow-md border border-slate-200/50 group">
              
              {/* Fotos Slider */}
              {activeTab === 'fotos' && (
                <div className="w-full h-full relative">
                  {/* Desktop slider (hidden on mobile, block on md:) */}
                  <div className="hidden md:block w-full h-full relative">
                    <img 
                      src={currentProperty.images[activeImageIndex]} 
                      alt={currentProperty.title}
                      className="w-full h-full object-cover transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                    
                    {currentProperty.images.length > 1 && (
                      <>
                        <button 
                          onClick={() => setActiveImageIndex((prev) => (prev === 0 ? currentProperty.images.length - 1 : prev - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-[#b9fa3c] text-[#04045E] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setActiveImageIndex((prev) => (prev === currentProperty.images.length - 1 ? 0 : prev + 1))}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-[#b9fa3c] text-[#04045E] shadow transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </>
                    )}

                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                      Foto {activeImageIndex + 1} de {currentProperty.images.length}
                    </span>
                  </div>

                  {/* Mobile Táctil Carousel (block on mobile, hidden on md:) */}
                  <div className="flex md:hidden w-full h-full overflow-x-scroll snap-x scrollbar-none">
                    {currentProperty.images.map((imgUrl: string, idx: number) => (
                      <div key={idx} className="w-full h-full flex-shrink-0 snap-start relative">
                        <img 
                          src={imgUrl} 
                          alt={`${currentProperty.title} - ${idx + 1}`}
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                          Foto {idx + 1} de {currentProperty.images.length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matterport 3D Mockup */}
              {activeTab === '3d' && (
                <div className="w-full h-full relative bg-slate-950 flex flex-col justify-between overflow-hidden">
                  <img 
                    src={room3DImages[active3DRoom]} 
                    alt="Tour 3D" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 filter saturate-[0.8]"
                  />
                  <div className="absolute inset-0 bg-[#04045E]/10 backdrop-blur-[1px]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>
                  
                  <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                      <span className="text-[10px] text-white font-black uppercase tracking-wider">Tour Virtual Activo</span>
                    </div>
                    <span className="text-white font-mono text-[10px] font-bold bg-[#04045E]/85 border border-[#b9fa3c]/35 px-3 py-1 rounded-full uppercase">
                      Estancia: {active3DRoom}
                    </span>
                  </div>

                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    {active3DRoom === 'fachada' && (
                      <button onClick={() => setActive3DRoom('cocina')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Ingresar a Cocina</span>
                      </button>
                    )}
                    {active3DRoom === 'cocina' && (
                      <button onClick={() => setActive3DRoom('sala')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Pasar a Living</span>
                      </button>
                    )}
                    {active3DRoom === 'sala' && (
                      <button onClick={() => setActive3DRoom('fachada')} className="group flex flex-col items-center">
                        <span className="relative flex h-8 w-8 items-center justify-center">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b9fa3c] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#b9fa3c] border border-white"></span>
                        </span>
                        <span className="mt-1 bg-black/80 px-2 py-1 text-[9px] font-bold text-white uppercase rounded">Salir al Exterior</span>
                      </button>
                    )}
                  </div>

                  <div className="relative z-10 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center gap-2">
                    {(['fachada', 'cocina', 'sala'] as const).map((room) => (
                      <button
                        key={room}
                        onClick={() => setActive3DRoom(room)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          active3DRoom === room 
                            ? 'bg-[#b9fa3c] text-[#04045E]' 
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {room === 'fachada' ? 'Fachada' : room === 'cocina' ? 'Cocina' : 'Living'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Plano de Planta Vectorial */}
              {activeTab === 'plano' && (
                <div className="w-full h-full bg-[#050516] flex flex-col justify-between p-4 relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] pointer-events-none"></div>

                  <div className="relative z-10 flex justify-between items-center">
                    <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">Plano Arquitectónico</span>
                    <span className="text-[#b9fa3c] font-mono text-[10px] font-black uppercase">
                      {hoveredRoom ? `Zona Activa: ${hoveredRoom}` : 'Pasa el cursor por las habitaciones'}
                    </span>
                  </div>

                  <div className="relative w-full flex-1 flex items-center justify-center p-4">
                    <svg viewBox="0 0 800 450" className="w-full h-full max-h-[260px] drop-shadow-2xl">
                      <rect x="50" y="30" width="700" height="390" fill="none" stroke="#161a4c" strokeWidth="4" />
                      <rect 
                        x="50" y="30" width="280" height="200" 
                        fill={hoveredRoom === 'Dormitorio Master' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Dormitorio Master')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="190" y="130" textAnchor="middle" fill={hoveredRoom === 'Dormitorio Master' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Dormitorio Master (28 m²)
                      </text>

                      <rect 
                        x="330" y="30" width="420" height="250" 
                        fill={hoveredRoom === 'Living Comedor' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Living Comedor')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="540" y="150" textAnchor="middle" fill={hoveredRoom === 'Living Comedor' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Living Comedor (72 m²)
                      </text>

                      <rect 
                        x="330" y="280" width="220" height="140" 
                        fill={hoveredRoom === 'Cocina Gourmet' ? 'rgba(185, 250, 60, 0.08)' : 'transparent'} 
                        stroke="#161a4c" strokeWidth="2" 
                        className="cursor-pointer transition-all duration-300"
                        onMouseEnter={() => setHoveredRoom('Cocina Gourmet')}
                        onMouseLeave={() => setHoveredRoom(null)}
                      />
                      <text x="440" y="350" textAnchor="middle" fill={hoveredRoom === 'Cocina Gourmet' ? '#b9fa3c' : '#4f5694'} className="text-[11px] font-bold select-none pointer-events-none transition-colors">
                        Cocina / Isla (31 m²)
                      </text>
                    </svg>
                  </div>

                  <div className="relative z-10 flex justify-between items-center text-[9px] font-mono text-white/30 uppercase tracking-widest pt-2 border-t border-white/5">
                    <span>* Escala Real 1:50 · Láser Certificado</span>
                    <span>Plano Planta Baja</span>
                  </div>
                </div>
              )}

              {/* Mapa de Entorno */}
              {activeTab === 'mapa' && (
                <div className="w-full h-full bg-slate-200">
                  <MiniMap center={currentProperty.coordinates} />
                </div>
              )}

              {/* Pestañas Redondeadas Integradas (Zillow Style) */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center">
                <div className="bg-white/90 backdrop-blur-md p-1 rounded-full flex gap-1 shadow-lg border border-slate-200/50 max-w-full overflow-x-auto no-scrollbar">
                  {[
                    { key: '3d', label: 'Inicio 3D' },
                    { key: 'plano', label: 'Plano' },
                    { key: 'fotos', label: 'Fotos' },
                    { key: 'mapa', label: 'Mapa' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${
                        activeTab === tab.key 
                          ? 'bg-[#04045E] text-white shadow' 
                          : 'text-[#04045E] hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Favoritos */}
              <button 
                onClick={() => setIsSaved(!isSaved)}
                className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/95 backdrop-blur shadow hover:scale-110 active:scale-95 transition-all text-[#04045E]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? '#ef4444' : 'none'} viewBox="0 0 24 24" stroke={isSaved ? '#ef4444' : 'currentColor'} strokeWidth={2.5} className="w-5 h-5 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>

            {/* Cabecera Técnica de Datos en Texto Limpio */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                <div className="flex items-baseline gap-3">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#04045E] font-sans">
                    ${currentProperty.price.toLocaleString()}
                  </h1>
                  <span className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {(currentProperty.price / currentProperty.m2).toFixed(0)} USD/m²
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentProperty.verified && (
                    <span className="bg-[#b9fa3c] text-[#04045E] text-[9px] font-black px-3 py-1.5 rounded-full border border-[#04045E]/10 tracking-widest uppercase shadow-sm">
                      ✓ Verificado Oro
                    </span>
                  )}
                  <DaysOnMarketBadge propertyId={currentProperty.id} size="sm" />
                </div>
              </div>

              {/* Habitaciones, Baños y metros cuadrados en Texto Limpio y Sobrio */}
              <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm w-full max-w-max">
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.beds}</strong> habitaciones</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.baths}</strong> baños</span>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                <span className="flex items-center gap-1"><strong className="text-base font-black text-[#04045E]">{currentProperty.m2}</strong> m² construidos</span>
              </div>

              <p className="text-sm md:text-base text-slate-500 font-bold tracking-wide">
                {currentProperty.address} • <span className="text-slate-400 font-semibold">{currentProperty.city}</span>
              </p>
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 2. DESCRIPCIÓN */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#04045E]/50">Resumen y descripción</h3>
            <p className="text-slate-600 font-medium leading-relaxed text-sm">
              {currentProperty.description}
            </p>
          </section>

          <hr className="border-slate-200/80" />

          {/* 3. SECCIÓN ¿QUÉ TIENE DE ESPECIAL? */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E]">¿Qué tiene de especial?</h3>
            <div className="flex flex-wrap gap-2.5">
              {currentProperty.amenities.map((amenity: string, idx: number) => (
                <span 
                  key={idx} 
                  className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 font-sans font-bold text-[10px] px-4 py-2.5 rounded-full tracking-wider uppercase cursor-default transition-all duration-200 flex items-center gap-1.5"
                >
                  ✨ {amenity}
                </span>
              ))}
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 4. HISTORIAL DE PRECIOS - REDISEÑADO COMO LÍNEA DE TIEMPO VERTICAL COMPASS */}
          <section className="space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E]">Historial de eventos y precio de mercado</h3>
            
            <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 py-2">
              {currentProperty.history.map((row: PriceHistory, idx: number) => (
                <div key={idx} className="relative">
                  {/* Timeline circle node */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white border-2 border-[#04045E] shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#b9fa3c]" />
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">{row.date}</span>
                      <h4 className="text-sm font-black text-[#04045E] mt-0.5">{row.event}</h4>
                    </div>
                    <span className="text-base font-black text-[#04045E] font-sans">${row.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 5. CALCULADORA DE PAGO MENSUAL INTERACTIVA COMPLETA */}
          <section className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E]">Calculadora de Pago Mensual Interactiva</h3>
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Desglose visual en tiempo real */}
              <div className="space-y-6 flex flex-col justify-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Cuota mensual estimada</span>
                  <h4 className="text-3xl font-black text-[#04045E] font-sans pt-1">
                    ${mortgageResults.totalMonthly.toLocaleString()} <span className="text-xs text-slate-400 font-semibold tracking-normal">/ mes</span>
                  </h4>
                </div>
                
                {/* Barra de Porcentaje Multicolor Dinámica segmentada */}
                <div className="space-y-4">
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="h-full bg-[#04045E] transition-all duration-300" 
                      style={{ width: `${mortgageResults.percentages.principalInterest}%` }} 
                      title="Capital e intereses"
                    />
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300" 
                      style={{ width: `${mortgageResults.percentages.tax}%` }} 
                      title="Impuestos"
                    />
                    <div 
                      className="h-full bg-[#b9fa3c] transition-all duration-300" 
                      style={{ width: `${mortgageResults.percentages.insurance}%` }} 
                      title="Seguro"
                    />
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-[#04045E] rounded-full inline-block" />
                          Capital e intereses
                        </span>
                        <span className="text-[#04045E]">${mortgageResults.monthlyPrincipalInterest.toLocaleString()} ({mortgageResults.percentages.principalInterest}%)</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />
                          Impuesto predial mensual
                        </span>
                        <span className="text-blue-500">${mortgageResults.monthlyTax.toLocaleString()} ({mortgageResults.percentages.tax}%)</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 bg-[#b9fa3c] rounded-full inline-block" />
                          Seguro de hogar
                        </span>
                        <span className="text-[#04045E] font-black">${mortgageResults.monthlyInsurance.toLocaleString()} ({mortgageResults.percentages.insurance}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario Interactivo */}
              <div className="bg-[#F8FAFC] p-6 border border-slate-200 rounded-2xl space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Cuota Inicial (USD)</label>
                    <input 
                      type="number"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Math.min(currentProperty.price, Math.max(0, Number(e.target.value))))}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#04045E] text-[#04045E] font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Tasa de interés (%)</label>
                    <input 
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#04045E] text-[#04045E] font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Plazo (Años)</label>
                    <select 
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#04045E] text-[#04045E]"
                    >
                      <option value={10}>10 años</option>
                      <option value={15}>15 años</option>
                      <option value={20}>20 años</option>
                      <option value={30}>30 años</option>
                    </select>
                  </div>
                </div>
                <div className="pt-2 text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider select-none">
                  ⚡ Actualizado en tiempo real
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 6. TENDENCIAS DE PRECIOS POR ZONA */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tendencia de precios por Zona</h3>
              <span className="text-xs font-bold text-[#04045E] bg-[#b9fa3c]/30 px-3 py-1 rounded-full border border-[#04045E]/10">
                {currentProperty.city.split(',')[0]}
              </span>
            </div>
            <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
              <PriceTrendChart zona={currentProperty.city.split(',')[0]} height={200} />
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* 7. MINI MAPA ENTORNO INFERIOR */}
          <section className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E]">Ubicación y Entorno</h3>
            <div className="w-full h-80 bg-slate-100 border border-slate-200 rounded-3xl overflow-hidden relative shadow-inner">
              <MiniMap center={currentProperty.coordinates} isInteractive={false} />
            </div>
          </section>

          <hr className="border-slate-200/80" />

          {/* Formulario de alertas integrado al final */}
          <section className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
            <PropertyAlertForm 
              defaultZona={currentProperty.address.split(',')[0]} 
              defaultType={currentProperty.type || 'CASA'} 
              defaultMaxPrice={currentProperty.price} 
            />
          </section>

        </div>

        {/* =================================================================
            COLUMNA DERECHA: STICKY SIDEBAR DE CONVERSIÓN (35% de Ancho)
            ================================================================= */}
        <div className="w-full lg:w-[35%] p-4 md:p-6 bg-slate-50/40 lg:bg-transparent">
          <div className="w-full lg:sticky lg:top-24 space-y-4">
            
            {/* CAJA 1: HORARIOS DE OPEN HOUSE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 inline-block">Tour Disponible</span>
              <h4 className="text-sm font-black text-[#04045E] pt-1">Próxima jornada de Open-House</h4>
              <p className="text-xs text-slate-500 font-semibold">Sábado de esta semana • 14:00 a 17:00</p>
              <button className="text-[10px] font-black uppercase tracking-widest text-[#04045E] underline block pt-1 hover:text-opacity-80 transition-colors cursor-pointer">
                Añadir al calendario corporativo
              </button>
            </div>

            {/* CAJA 2: TARJETA DE AGENTE RESPONSABLE CON SELECTOR */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#04045E]/5 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center font-heading font-black text-[#04045E] text-base">
                  {currentAgent.avatar}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-[#04045E] leading-tight">{currentAgent.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{currentAgent.agency}</p>
                  
                  {/* Calificación */}
                  <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs">
                    <span>★</span>
                    <span className="text-slate-500 font-bold text-[11px]">{currentAgent.stars} Certificación Oro</span>
                  </div>
                </div>
              </div>

              {/* Selector de agente */}
              <div className="pt-3.5 border-t border-slate-100">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                  Agente de Atención Asignado
                </label>
                <select 
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#04045E] cursor-pointer transition-all"
                >
                  {staffAgents.map((ag) => (
                    <option key={ag.id} value={ag.id}>Cambiar agente: {ag.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CAJA 3: BOTONES DE ACCIÓN PRINCIPALES - CONVERSIÓN QUIRÚRGICA */}
            <div className="space-y-2.5">
              
              {/* [SOLICITAR VISITA GUIADA] en verde lima sólido vibrante con texto negro */}
              <button 
                onClick={() => setShowQR(true)}
                className="w-full bg-[#b9fa3c] hover:bg-[#b0f02c] text-[#04045E] font-heading font-black py-4 px-6 rounded-2xl shadow-md hover:shadow-lg hover:shadow-[#b9fa3c]/15 text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-[#04045E]/10 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                Solicitar visita guiada
              </button>

              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#04045E] hover:bg-opacity-95 text-white font-black py-4 px-6 rounded-2xl shadow-sm text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.019-5.117-2.875-6.976C16.602 1.905 14.128.885 11.498.885c-5.414 0-9.822 4.417-9.826 9.862-.001 1.702.463 3.364 1.34 4.816l-.997 3.636 3.731-.978c1.41.8 3.01 1.218 4.62 1.218h.007zm14.394-7.3c-.272-.136-1.61-.795-1.86-.886-.25-.09-.432-.136-.613.136-.182.273-.705.886-.864 1.068-.159.182-.318.205-.59.069-.272-.136-1.15-.424-2.19-1.3-.183-.137-.364-.318-.545-.454-.182-.136-.318-.272-.364-.363-.09-.136-.454-.772-.454-1.408 0-.636.318-.954.454-1.09.136-.136.318-.182.409-.182.09 0 .182 0 .272.045.09 0 .227-.045.364.272.136.318.455 1.182.5 1.273.045.09.045.227 0 .318-.045.09-.136.227-.227.318-.09.09-.182.227-.09.363.136.273.545.91 1.136 1.455.773.682 1.41.91 1.59 1 .182.09.318.09.409-.045.09-.136.409-.455.5-.636.09-.182.182-.136.364-.09.182.045 1.182.59 1.364.682.182.09.318.136.364.227.09.09.09.545-.09 1-.182.454-1.09 1-1.545 1.045-.455.045-.91-.09-2.636-.772z"/>
                </svg>
                Contactar por WhatsApp
              </a>
            </div>

          </div>
        </div>

      </main>

      {/* =========================================================
          MODAL DE VISITA / CÓDIGO QR SIMULADO (Zillow Style)
          ========================================================= */}
      {showQR && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl border border-slate-100">
            <div className="space-y-2">
              <h4 className="text-xl font-black text-[#04045E]">Escanea para Reservar</h4>
              <p className="text-xs text-slate-400 font-medium">Agenda tu visita guiada al instante con un asesor certificado de Propio.</p>
            </div>

            {/* Código QR Vectorial Estetizado */}
            <div className="w-44 h-44 bg-slate-50 rounded-2xl border border-slate-200 mx-auto flex items-center justify-center p-3 relative group">
              <div className="grid grid-cols-6 grid-rows-6 gap-1 w-full h-full">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`rounded-sm transition-all duration-300 ${
                      [0, 1, 2, 3, 4, 5, 6, 11, 12, 17, 18, 23, 24, 29, 30, 31, 32, 33, 34, 35, 8, 9, 14, 15, 20, 21, 26, 27].includes(i) 
                        ? 'bg-[#b9fa3c]' 
                        : 'bg-[#04045E]'
                    }`} 
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100">
                  🏠
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[#04045E] font-black text-lg">${(currentProperty.price * 0.01).toLocaleString()} USD</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Reserva mínima del 1% · {currentProperty.code}</p>
            </div>

            <button 
              onClick={() => setShowQR(false)} 
              className="w-full bg-[#04045E] hover:bg-opacity-95 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Cerrar y Regresar
            </button>
          </div>
        </div>
      )}

      {/* Barra de Contacto Fija en la Base para Móviles (Zillow / Airbnb Style) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-fadeIn">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio</span>
          <span className="text-lg font-black text-[#04045E]">${currentProperty.price.toLocaleString()}</span>
        </div>
        <div className="flex gap-2 flex-1 max-w-[240px]">
          <button 
            onClick={() => setShowQR(true)}
            className="flex-1 bg-[#b9fa3c] hover:bg-[#b0f02c] text-[#04045E] font-heading font-black py-3 rounded-xl text-[10px] uppercase tracking-wider text-center transition-all active:scale-[0.98] border border-[#04045E]/10 cursor-pointer"
          >
            Reservar
          </button>
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-[#04045E] hover:bg-opacity-95 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-[0.98] text-center cursor-pointer"
          >
            WhatsApp
          </a>
        </div>
      </div>

    </div>
  );
}
