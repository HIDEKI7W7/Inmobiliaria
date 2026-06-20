'use client';

import React from 'react';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  highlight: boolean;
  badge?: string;
  features: { text: string; included: boolean }[];
}

const PLANS: Plan[] = [
  {
    id: 'basico',
    name: 'Plan Básico',
    price: 0,
    period: 'gratis',
    highlight: false,
    features: [
      { text: '1 publicación activa', included: true },
      { text: 'Fotos básicas (hasta 5)', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Verificación legal documental', included: false },
      { text: 'Posicionamiento destacado', included: false },
    ],
  },
  {
    id: 'estandar',
    name: 'Plan Estándar',
    price: 250,
    period: 'mes',
    highlight: false,
    features: [
      { text: '3 publicaciones activas', included: true },
      { text: 'Fotos y video estándar', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Sello de verificación documental', included: true },
      { text: 'Posicionamiento destacado', included: false },
    ],
  },
  {
    id: 'profesional',
    name: 'Plan Profesional',
    price: 490,
    period: 'mes',
    highlight: true,
    badge: 'Recomendado',
    features: [
      { text: '10 publicaciones activas', included: true },
      { text: 'Fotos HD + video premium', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Sello de verificación Sello Oro', included: true },
      { text: 'Posicionamiento destacado en mapa', included: true },
    ],
  },
  {
    id: 'elite',
    name: 'Plan Elite',
    price: 990,
    period: 'mes',
    highlight: false,
    badge: 'Todo incluido',
    features: [
      { text: 'Publicaciones ilimitadas', included: true },
      { text: 'Fotos, video + tour virtual 360°', included: true },
      { text: 'Contacto prioritario directo', included: true },
      { text: 'Sello de verificación Sello Oro', included: true },
      { text: 'Campañas de Marketing dedicadas', included: true },
    ],
  },
];

export default function ServiciosPage() {
  const handleSelectPlan = (planName: string) => {
    const text = encodeURIComponent(`Hola Propio, me interesa contratar el ${planName} de la plataforma.`);
    window.open(`https://wa.me/59171234567?text=${text}`, '_blank');
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-800">
      {/* HERO SECTION */}
      <section className="bg-[#000033] relative overflow-hidden py-24 text-center">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ccff00]/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 space-y-6">
          <span className="inline-flex items-center gap-2 bg-[#ccff00]/15 border border-[#ccff00]/25 text-[#ccff00] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            Planes y Precios
          </span>
          <h1 className="font-heading font-black text-white text-4xl md:text-6xl leading-tight">
            Vende o alquila rápido<br />
            <span className="text-[#ccff00]">con el respaldo de Propio</span>
          </h1>
          <p className="font-sans italic text-white/80 text-base md:text-lg max-w-xl mx-auto tracking-wide">
            "hazlo seguro, hazlo tuyo, hazlo propio"
          </p>
          <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
            Publica con las comisiones más bajas y las herramientas de visibilidad más avanzadas de Bolivia. Sin plazos mínimos.
          </p>
        </div>
      </section>

      {/* PLANES MATRIX SECTION */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative rounded-3xl flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 bg-white border ${
                plan.highlight
                  ? 'border-2 border-[#ccff00] shadow-2xl scale-[1.03] z-10'
                  : 'border-slate-100 shadow-md hover:shadow-xl'
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                  plan.highlight ? 'bg-[#ccff00] text-[#000033]' : 'bg-[#000033] text-white'
                }`}>
                  {plan.badge}
                </div>
              )}
              
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading font-black text-lg text-[#000033] uppercase tracking-wide mb-4">
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-heading font-black text-3xl text-[#000033]">
                      {plan.price === 0 ? 'Gratis' : `Bs. ${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-xs text-slate-400">/{plan.period}</span>}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-slate-100">
                    {plan.features.map((f, i) => (
                      <li key={i} className={`flex items-center gap-2.5 text-xs ${
                        f.included ? 'text-slate-800 font-medium' : 'text-slate-350 line-through'
                      }`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          f.included ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-slate-50 text-slate-300'
                        }`}>
                          {f.included ? '✓' : '–'}
                        </span>
                        {f.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  className={`w-full py-3 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 shadow-md ${
                    plan.highlight
                      ? 'bg-[#ccff00] text-[#000033] hover:bg-[#b5e600]'
                      : 'bg-[#000033] text-white hover:bg-[#000044]'
                  }`}
                >
                  {plan.price === 0 ? 'Comenzar Gratis' : 'Contratar Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER MINI SLOGAN BANNER */}
      <section className="bg-slate-100 border-t border-slate-200/50 py-16 text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-3">
          <p className="text-xs font-bold text-[#000033] uppercase tracking-widest">
            ¿Tienes dudas sobre los planes?
          </p>
          <p className="text-xs text-slate-500">
            Nuestro equipo de asesores corporativos te ayudará a seleccionar la mejor estrategia de difusión para tu inmueble.
          </p>
          <div className="pt-3">
            <a 
              href="https://wa.me/59171234567?text=Hola,%20tengo%20dudas%20sobre%20los%20planes%20de%20difusión%20de%20Propio."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#000033] hover:bg-[#000044] text-white font-sans font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
            >
              Contactar Soporte
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
