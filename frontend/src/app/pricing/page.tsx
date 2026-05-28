'use client';

import { useState } from 'react';
import Link from 'next/link';

const t = (key: string) => key;

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
    name: 'Básico',
    price: 0,
    period: 'gratis',
    highlight: false,
    features: [
      { text: '1 publicación activa', included: true },
      { text: 'Fotos básicas (hasta 5)', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Verificación legal', included: false },
      { text: 'Publicación en mapa interactivo', included: false },
      { text: 'Estadísticas de visitas', included: false },
    ],
  },
  {
    id: 'profesional',
    name: 'Profesional',
    price: 49,
    period: 'mes',
    highlight: true,
    badge: 'Más popular',
    features: [
      { text: '5 publicaciones activas', included: true },
      { text: 'Fotos ilimitadas + video', included: true },
      { text: 'Contacto directo por WhatsApp', included: true },
      { text: 'Verificación legal Sello Oro', included: true },
      { text: 'Publicación en mapa interactivo', included: true },
      { text: 'Estadísticas de visitas en tiempo real', included: true },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 129,
    period: 'mes',
    highlight: false,
    badge: 'Todo incluido',
    features: [
      { text: 'Publicaciones ilimitadas', included: true },
      { text: 'Fotos + video + tour 360°', included: true },
      { text: 'Contacto multi-canal', included: true },
      { text: 'Verificación legal Sello Oro', included: true },
      { text: 'Publicación en mapa interactivo', included: true },
      { text: 'Estadísticas avanzadas + exportación', included: true },
    ],
  },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[#04045E] bg-[#b9fa3c]/20 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
            {t("Planes y Tarifas")}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#04045E] tracking-tight mt-4 mb-4 uppercase">
            {t("Elige tu plan ideal")}
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm font-medium">
            {t("Sin contratos forzosos ni comisiones de corretaje. Cambia o cancela tu suscripción en cualquier momento.")}
          </p>
        </div>

        {/* Planes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isProfessional = plan.id === 'profesional';
            
            return (
              <div 
                key={plan.id}
                className={`relative rounded-3xl flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 ${
                  isProfessional
                    ? 'bg-white border-4 border-[#b9fa3c] shadow-2xl scale-[1.03] z-10'
                    : 'bg-white border border-slate-100 shadow-md hover:shadow-xl'
                }`}
              >
                {/* Badge para el Plan Central */}
                {plan.badge && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-black px-5 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
                    isProfessional ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-[#04045E] text-white'
                  }`}>
                    {plan.badge}
                  </div>
                )}

                {/* Encabezado de Plan */}
                <div className="mb-6">
                  <h3 className="font-bold text-xl text-[#04045E] mb-2 uppercase tracking-wide">
                    {plan.name}
                  </h3>
                  <div className="flex items-end gap-1">
                    <span className="font-black text-4xl text-[#04045E]">
                      {plan.price === 0 ? t('Gratis') : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-slate-400 text-sm font-semibold mb-1">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* CONTENIDO DEL PLAN PROFESIONAL / OTROS PLANES */}
                {/* Solución de Contraste: Texto oscuro para legibilidad 100% garantizada */}
                <div className="text-slate-700 font-medium text-sm flex-1 mb-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li 
                        key={i} 
                        className={`flex items-center gap-3 ${
                          feature.included ? 'text-slate-800' : 'text-slate-350 line-through'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          feature.included 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-slate-100 text-slate-300'
                        }`}>
                          {feature.included ? '✓' : '✕'}
                        </span>
                        <span>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón CTA */}
                <div>
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                      isProfessional
                        ? 'bg-[#b9fa3c] text-[#04045E] hover:brightness-95 shadow-md shadow-lime-100'
                        : 'bg-[#04045E] text-white hover:bg-opacity-90 shadow-sm'
                    }`}
                  >
                    {plan.price === 0 ? t('Comenzar gratis') : `${t('Contratar')} ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal de confirmación */}
        {selectedPlan && (
          <div 
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" 
            onClick={() => setSelectedPlan(null)}
          >
            <div 
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="font-bold text-[#04045E] text-xl mb-2 uppercase tracking-wide">
                {t("¡Excelente elección!")}
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-6">
                {t("Seleccionaste el plan ")}
                <strong className="text-[#04045E] font-black">
                  {PLANS.find(p => p.id === selectedPlan)?.name}
                </strong>
                {t(". Para continuar, inicia sesión o crea tu cuenta de propietario.")}
              </p>
              <Link 
                href="/login" 
                className="w-full flex items-center justify-center bg-[#b9fa3c] text-[#04045E] font-bold py-4 rounded-xl hover:brightness-95 transition-all text-xs uppercase tracking-wider shadow-md mb-3"
              >
                {t("Continuar al registro")}
              </Link>
              <button 
                onClick={() => setSelectedPlan(null)} 
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
              >
                {t("Cancelar")}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
