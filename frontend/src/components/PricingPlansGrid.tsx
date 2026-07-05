'use client';

import React from 'react';

// ─── [ESTRUCTURA_DATOS_PLANES] ──────────────────────────────────────────────
export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanData {
  id: string;
  name: string;
  priceLabel: string;
  badge: string;
  badgeDark?: boolean;
  features: PlanFeature[];
  pill?: string;
  ctaText: string;
}

interface PricingPlansGridProps {
  onSelectPlan: (planId: string) => void;
  prices?: {
    contenidos: number;
    venta_pro: number;
    cierre_garantizado: number;
  };
}

export const PricingPlansGrid: React.FC<PricingPlansGridProps> = ({
  onSelectPlan,
  prices
}) => {
  const [localPrices, setLocalPrices] = React.useState({
    contenidos: 69,
    venta_pro: 199,
    cierre_garantizado: 1.5,
  });

  React.useEffect(() => {
    let finalPrices = {
      contenidos: prices?.contenidos ?? 69,
      venta_pro: prices?.venta_pro ?? 199,
      cierre_garantizado: prices?.cierre_garantizado ?? 1.5,
    };

    if (typeof window !== 'undefined') {
      if (!prices) {
        const saved = localStorage.getItem('propio_global_plan_prices');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            finalPrices.contenidos = parsed.contenidos ?? 69;
            finalPrices.venta_pro = parsed.venta_pro ?? 199;
            finalPrices.cierre_garantizado = parsed.cierre_garantizado ?? 1.5;
          } catch {}
        }
      }

      // Check active announcement for commission overrides
      const activeAnnRaw = localStorage.getItem('propio_active_announcement');
      if (activeAnnRaw) {
        try {
          const ann = JSON.parse(activeAnnRaw);
          const sec = ann.secciones?.find((s: any) => s.titulo.toLowerCase().includes('comisión') || s.titulo.toLowerCase().includes('comision') || s.titulo.toLowerCase().includes('comisión base'));
          if (sec && sec.vinetas && sec.vinetas[0]) {
            const match = sec.vinetas[0].match(/(\d+(\.\d+)?)\s*%/);
            if (match && match[1]) {
              finalPrices.cierre_garantizado = parseFloat(match[1]);
            }
          }
        } catch {}
      }
    }

    setLocalPrices(finalPrices);
  }, [prices]);

  const [dbPlans, setDbPlans] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchDbPlans = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBase}/marketing-plans`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setDbPlans(data);
        } else {
          throw new Error('Backend responded with non-200 status');
        }
      } catch (err) {
        console.warn('Error fetching db plans, falling back to local db.json:', err);
        try {
          const localRes = await fetch('/api/local/marketing-plans', { cache: 'no-store' });
          if (localRes && localRes.ok) {
            const localData = await localRes.json();
            if (Array.isArray(localData.plans) && localData.plans.length > 0) {
              setDbPlans(localData.plans);
            }
          }
        } catch (localErr) {
          console.error('Local fallback fetch for PricingPlansGrid failed:', localErr);
        }
      }
    };
    fetchDbPlans();
  }, []);

  const plans = React.useMemo(() => {
    if (dbPlans && dbPlans.length > 0) {
      return dbPlans.map(p => {
        const id = p.id === 'plan-gratis' ? 'gratuito' : p.id.replace('plan-', '');
        
        let priceLabel = '';
        if (p.id === 'plan-gratis') {
          priceLabel = 'Gratis';
        } else if (p.id === 'plan-cierre-garantizado') {
          priceLabel = p.price.includes('Comisión') || p.price.includes('%') 
            ? p.price 
            : `Comisión: ${p.price}% ${p.billingCycle || 'del valor de venta'}`;
        } else {
          const cleanPrice = String(p.price).replace('Bs.', '').replace('Bs', '').trim();
          priceLabel = cleanPrice.startsWith('$') ? `${cleanPrice} ${p.billingCycle || '/mes'}` : `Bs. ${cleanPrice} ${p.billingCycle || '/mes'}`;
        }

        let ctaText = '';
        if (p.id === 'plan-gratis') ctaText = 'Comenzar gratis';
        else if (p.id === 'plan-contenidos') ctaText = 'Contratar PLAN CONTENIDOS';
        else if (p.id === 'plan-venta-pro') ctaText = 'Contratar PLAN VENTA PRO';
        else if (p.id === 'plan-cierre-garantizado') ctaText = 'Contratar Cierre Garantizado';

        return {
          id,
          name: p.name || 'Plan',
          priceLabel,
          badge: p.badgeText || '',
          badgeDark: p.id === 'plan-cierre-garantizado',
          pill: p.id === 'plan-venta-pro' ? 'PUBLICIDAD PRIORITARIA' : undefined,
          features: Array.isArray(p.features) ? p.features : [],
          ctaText
        };
      });
    }

    return [
      {
        id: 'gratuito',
        name: 'PLAN GRATUITO 🏠',
        priceLabel: 'Gratis',
        badge: 'GRATIS',
        features: [
          { text: '1 publicación activa', included: true },
          { text: 'Fotos básicas hasta 5', included: true },
          { text: 'Contacto por WhatsApp', included: true },
          { text: 'Verificación legal', included: false },
          { text: 'Mapa interactivo', included: false },
          { text: 'Estadísticas', included: false },
          { text: 'Atención prioritaria', included: false }
        ],
        ctaText: 'Comenzar gratis'
      },
      {
        id: 'contenidos',
        name: 'PLAN CONTENIDOS 🏠',
        priceLabel: `Bs. ${localPrices.contenidos} /mes`,
        badge: 'MAS RECOMENDADO PARA RENTAS',
        features: [
          { text: '1 propiedad', included: true },
          { text: 'Fotos+Video optimizado', included: true },
          { text: 'WhatsApp', included: true },
          { text: 'Mapa interactivo con radar', included: true },
          { text: 'Alquiler de letrero físico', included: true },
          { text: 'Dron', included: false },
          { text: 'ses de visitas', included: false }
        ],
        ctaText: 'Contratar PLAN CONTENIDOS'
      },
      {
        id: 'venta_pro',
        name: 'PLAN VENTA PRO 🏠',
        priceLabel: `Bs. ${localPrices.venta_pro} /mes`,
        badge: 'MAS RECOMENDADO PARA VENTA',
        pill: 'PUBLICIDAD PRIORITARIA',
        features: [
          { text: '1 propiedad', included: true },
          { text: 'Dron+Fotos Profesionales', included: true },
          { text: 'Sello Oro+Mapa Premium', included: true },
          { text: 'Alquiler de letrero físico', included: true },
          { text: 'Estadísticas Avanzadas', included: true }
        ],
        ctaText: 'Contratar PLAN VENTA PRO'
      },
      {
        id: 'cierre_garantizado',
        name: 'CIERRE GARANTIZADO 🏠',
        priceLabel: `Comisión: ${localPrices.cierre_garantizado}% del valor de venta`,
        badge: 'TODO INCLUIDO',
        badgeDark: true,
        features: [
          { text: 'Gestión completa por Agente Experto', included: true },
          { text: 'Visitas y negociación delegadas', included: true },
          { text: 'Alquiler de letrero físico', included: true },
          { text: 'Auditoría Legal y Notarial', included: true },
          { text: `Comisión del ${localPrices.cierre_garantizado}%`, included: true }
        ],
        ctaText: 'Contratar Cierre Garantizado'
      }
    ];
  }, [dbPlans, localPrices]);

  return (
    <section className="w-full py-12 bg-transparent">
      {/* ─── [JSX_HEADER_SECCION_PLANES] ──────────────────────────────────────── */}
      <div className="text-center mb-12">
        <span className="bg-blue-950 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mx-auto block w-max mb-3">
          PLANES
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-2 text-center">
          Elige tu plan ideal
        </h2>
        <p className="text-sm text-gray-500 text-center mb-10">
          Sin permanencia mínima. Puedes cambiar o cancelar cuando quieras.
        </p>
      </div>

      {/* ─── [JSX_GRID_Y_TARJETAS_ESTANDAR] ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 items-stretch">
        {plans.map((plan) => {
          const isCierre = plan.id === 'cierre_garantizado';
          const isVentaPro = plan.id === 'venta_pro';

          if (isCierre) {
            // ─── [JSX_TARJETA_PREMIUM_CIERRE_GARANTIZADO] ─────────────────────
            return (
              <div
                key={plan.id}
                className="rounded-3xl border-2 border-blue-950 bg-slate-50/50 p-6 flex flex-col justify-between shadow-md relative pt-10 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Badge flotante azul oscuro */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wide bg-blue-950 text-white">
                  {plan.badge}
                </div>

                <div>
                  {/* Nombre y Precio */}
                  <div className="mb-6">
                    <h3 className="font-black text-sm text-[#04045E] mb-2 uppercase tracking-wider">
                      {plan.name}
                    </h3>
                    <div className="space-y-1">
                      <span className="block font-black text-lg md:text-xl text-[#04045E] leading-none">
                        {plan.priceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Características */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature: any, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-[11px] font-medium text-slate-800"
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-600">
                          ✓
                        </span>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón Invertido Premium */}
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-2xl text-center transition-all text-sm mt-6 shadow-md"
                >
                  {plan.ctaText}
                </button>
              </div>
            );
          }

          // Tarjetas estándar (Gratuito, Contenidos, Venta Pro)
          return (
            <div
              key={plan.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between shadow-sm relative pt-10 transition-all duration-300 hover:-translate-y-1 bg-white ${
                isVentaPro ? 'border-4 border-[#a3e635] shadow-lg scale-[1.02] z-10' : 'border-gray-200/80'
              }`}
            >
              {/* Badge flotante verde lima */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wide bg-[#a3e635] text-slate-900 shadow-sm">
                {plan.badge}
              </div>

              <div>
                {/* Nombre y Precio */}
                <div className="mb-6">
                  <h3 className="font-black text-sm text-[#04045E] mb-2 uppercase tracking-wider">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-3xl text-[#04045E]">
                      {plan.priceLabel}
                    </span>
                  </div>
                </div>

                {/* Características */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature: any, idx: number) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 text-[11px] font-medium ${
                        feature.included ? 'text-slate-800 font-semibold' : 'text-slate-400 opacity-50'
                      }`}
                    >
                      {feature.included ? (
                        <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold bg-emerald-100 text-emerald-600">
                          ✓
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-gray-300">
                          —
                        </span>
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pill de Publicidad Prioritaria */}
              {plan.pill && (
                <div className="mb-4">
                  <span className="inline-block w-full text-center bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-black py-1.5 rounded-lg uppercase tracking-wider">
                    {plan.pill}
                  </span>
                </div>
              )}

              {/* Botón CTA */}
              <button
                onClick={() => onSelectPlan(plan.id)}
                className={`w-full font-bold py-3 px-4 rounded-2xl text-center transition-all text-sm mt-6 ${
                  plan.id === 'gratuito'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    : 'bg-[#a3e635] hover:bg-[#8ed024] text-slate-900 shadow-sm'
                }`}
              >
                {plan.ctaText}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PricingPlansGrid;
