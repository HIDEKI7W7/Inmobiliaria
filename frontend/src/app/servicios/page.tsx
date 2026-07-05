'use client';

import React, { useEffect, useState } from 'react';
import { WHATSAPP_LINK } from '@/utils/whatsapp';

export default function ServiciosPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(1.5);

  const handleSelectPlan = (planName: string) => {
    window.open(WHATSAPP_LINK, '_blank');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeAnnRaw = localStorage.getItem('propio_active_announcement');
      if (activeAnnRaw) {
        try {
          const ann = JSON.parse(activeAnnRaw);
          const sec = ann.secciones?.find((s: any) => s.titulo.toLowerCase().includes('comisión') || s.titulo.toLowerCase().includes('comision') || s.titulo.toLowerCase().includes('comisión base'));
          if (sec && sec.vinetas && sec.vinetas[0]) {
            const match = sec.vinetas[0].match(/(\d+(\.\d+)?)\s*%/);
            if (match && match[1]) {
              setCommissionRate(parseFloat(match[1]));
            }
          }
        } catch (e) {
          console.error('Error parsing active announcement for commission rate:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBaseUrl}/marketing-plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        }
      } catch (err) {
        console.error('Error fetching marketing plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const fallbackPlans = [
    {
      id: 'plan-gratis',
      name: 'Plan Gratuito',
      price: 'Gratis',
      billingCycle: '',
      badgeText: null,
      themeType: 'gray',
      features: [
        { text: '1 publicación activa', included: true },
        { text: 'Fotos básicas (hasta 5)', included: true },
        { text: 'Contacto directo por WhatsApp', included: true },
      ],
    },
    {
      id: 'plan-contenidos',
      name: 'Plan Contenidos',
      price: 'Bs. 69',
      billingCycle: '/mes',
      badgeText: 'MAS RECOMENDADO PARA RENTAS',
      themeType: 'green',
      features: [
        { text: '1 propiedad', included: true },
        { text: 'Fotos + Video optimizado', included: true },
        { text: 'Contacto directo por WhatsApp', included: true },
        { text: 'Mapa interactivo con radar', included: true },
        { text: 'Alquiler de letrero físico', included: true },
      ],
    },
    {
      id: 'plan-venta-pro',
      name: 'Plan Venta Pro',
      price: 'Bs. 199',
      billingCycle: '/mes',
      badgeText: 'MAS RECOMENDADO PARA VENTA',
      themeType: 'green',
      features: [
        { text: '1 propiedad', included: true },
        { text: 'Dron + Fotos Profesionales', included: true },
        { text: 'Sello Oro + Mapa Premium', included: true },
        { text: 'Alquiler de letrero físico', included: true },
        { text: 'Estadísticas Avanzadas de Visitas', included: true },
        { text: 'PUBLICIDAD PRIORITARIA', included: true },
      ],
    },
    {
      id: 'plan-cierre-garantizado',
      name: 'Cierre Garantizado',
      price: `Comisión: ${commissionRate}%`,
      billingCycle: 'del valor de venta (Todo incluido)',
      badgeText: 'TODO INCLUIDO',
      themeType: 'blue',
      features: [
        { text: 'Gestión completa por Agente Experto', included: true },
        { text: 'Visitas y Negociación delegadas', included: true },
        { text: 'Alquiler de letrero físico', included: true },
        { text: 'Auditoría Legal y Notarial', included: true },
      ],
    },
  ];

  const displayPlans = (plans.length > 0 ? plans : fallbackPlans).map(p => {
    if (p.id === 'plan-cierre-garantizado' || p.id === 'cierre_garantizado') {
      return {
        ...p,
        price: `Comisión: ${commissionRate}%`,
        billingCycle: 'del valor de venta (Todo incluido)'
      };
    }
    if (p.id === 'plan-contenidos' || p.id === 'contenidos') {
      return { ...p, price: 'Bs. 69' };
    }
    if (p.id === 'plan-venta-pro' || p.id === 'venta_pro') {
      return { ...p, price: 'Bs. 199' };
    }
    return p;
  });

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen font-sans antialiased text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#000033] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-[#000033] uppercase tracking-wider">Cargando planes...</p>
        </div>
      </div>
    );
  }

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
          {displayPlans.map((plan) => {
            // Custom styles based on themeType
            let theme = {
              borderClass: 'border-slate-200 shadow-md hover:shadow-xl hover:border-slate-350',
              badgeClass: 'bg-[#000033] text-white',
              buttonClass: 'bg-[#000033] text-white hover:bg-[#000044]',
              checkClass: 'bg-emerald-50 text-emerald-600',
              cardBg: 'bg-white text-slate-800',
              titleColor: 'text-[#000033]',
              priceColor: 'text-[#000033]',
              cycleColor: 'text-slate-400',
              featureTextClass: 'text-slate-800',
              dividerClass: 'border-slate-100',
            };

            if (plan.themeType === 'gray') {
              theme = {
                borderClass: 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-350',
                badgeClass: 'bg-slate-500 text-white',
                buttonClass: 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl',
                checkClass: 'bg-slate-100 text-slate-500',
                cardBg: 'bg-white text-slate-800',
                titleColor: 'text-slate-700',
                priceColor: 'text-slate-800',
                cycleColor: 'text-slate-400',
                featureTextClass: 'text-slate-650',
                dividerClass: 'border-slate-100',
              };
            } else if (plan.themeType === 'green') {
              theme = {
                borderClass: 'border-2 border-[#a3e635] shadow-md relative pt-10',
                badgeClass: 'bg-[#a3e635] text-slate-900',
                buttonClass: 'bg-[#a3e635] text-slate-900 font-bold hover:bg-[#8ed024]',
                checkClass: 'bg-emerald-100 text-emerald-600 font-bold',
                cardBg: 'bg-white text-slate-800',
                titleColor: 'text-[#000033]',
                priceColor: 'text-[#000033]',
                cycleColor: 'text-slate-400',
                featureTextClass: 'text-slate-800',
                dividerClass: 'border-slate-100',
              };
            } else if (plan.themeType === 'blue') {
              theme = {
                borderClass: 'border-2 border-blue-950 shadow-2xl',
                badgeClass: 'bg-blue-950 text-white',
                buttonClass: 'bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-2xl shadow-md',
                checkClass: 'bg-emerald-100 text-emerald-600 font-bold',
                cardBg: 'bg-slate-50/50 text-slate-800',
                titleColor: 'text-[#000033]',
                priceColor: 'text-[#000033]',
                cycleColor: 'text-slate-500',
                featureTextClass: 'text-slate-805',
                dividerClass: 'border-slate-200',
              };
            }

            // Custom button text based on requirements
            let buttonText = 'Contratar Plan';
            if (plan.id === 'plan-gratis' || plan.id === 'gratuito') {
              buttonText = 'Comenzar gratis';
            } else if (plan.id === 'plan-cierre-garantizado' || plan.id === 'cierre_garantizado') {
              buttonText = 'Contratar Cierre Garantizado';
            }
            
            const isNumericPrice = /^\d+$/.test(plan.price);

            return (
              <div 
                key={plan.id}
                className={
                  plan.themeType === 'green'
                    ? `rounded-3xl border-2 border-[#a3e635] bg-white p-6 flex flex-col justify-between shadow-md relative pt-10 transition-all duration-300 hover:-translate-y-1`
                    : `relative rounded-3xl flex flex-col p-6 transition-all duration-300 hover:-translate-y-1 border ${theme.cardBg} ${theme.borderClass}`
                }
              >
                {plan.badgeText && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm z-10 whitespace-nowrap ${theme.badgeClass}`}>
                    {plan.badgeText}
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-heading font-black text-lg uppercase tracking-wide mb-4 ${theme.titleColor}`}>
                      {plan.name}
                    </h3>
                    
                    <div className="flex items-baseline gap-1 mb-6 min-h-[48px]">
                      {isNumericPrice ? (
                        <>
                          <span className={`font-heading font-black text-4xl ${theme.priceColor}`}>
                            Bs. {plan.price}
                          </span>
                          <span className={`text-xs ${theme.cycleColor}`}>{plan.billingCycle}</span>
                        </>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-heading font-black text-2xl tracking-tight leading-none ${theme.priceColor}`}>
                            {plan.price}
                          </span>
                          {plan.billingCycle && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.cycleColor}`}>
                              {plan.billingCycle}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <ul className={`space-y-3 pt-4 border-t ${theme.dividerClass}`}>
                      {(plan.features as any[] || []).map((f, i) => (
                        <li key={i} className={`flex items-start gap-2.5 text-xs ${
                          f.included ? theme.featureTextClass : 'text-gray-400 line-through opacity-70'
                        }`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                            f.included ? theme.checkClass : 'bg-slate-100 text-slate-350'
                          }`}>
                            {f.included ? '✓' : '–'}
                          </span>
                          <span>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`w-full py-3 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all duration-200 hover:-translate-y-0.5 shadow-md ${theme.buttonClass}`}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
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
              href={WHATSAPP_LINK}
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
