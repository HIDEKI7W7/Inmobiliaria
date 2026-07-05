'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PricingPlansGrid } from '@/components/PricingPlansGrid';

const t = (key: string) => key;

interface Plan {
  id: string;
  name: string;
  price?: number;
  customPrice?: string;
  period: string;
  highlight: boolean;
  badge?: string;
  badgeDark?: boolean;
  pill?: string;
  features: { text: string; included: boolean }[];
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // State for dynamic global plan prices loaded from localStorage
  const [prices, setPrices] = useState({
    contenidos: 69,
    venta_pro: 199,
    cierre_garantizado: 1.5,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let finalPrices = { contenidos: 69, venta_pro: 199, cierre_garantizado: 1.5 };
      const saved = localStorage.getItem('propio_global_plan_prices');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          finalPrices.contenidos = parsed.contenidos ?? 69;
          finalPrices.venta_pro = parsed.venta_pro ?? 199;
          finalPrices.cierre_garantizado = parsed.cierre_garantizado ?? 1.5;
        } catch (e) {
          console.error('Error parsing global plan prices:', e);
        }
      }

      // Check announcement for commission rate overrides
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
        } catch (e) {
          console.error('Error parsing announcement for commission rate:', e);
        }
      }

      setPrices(finalPrices);
    }
  }, []);

  const dynamicPlans = useMemo<Plan[]>(() => [
    {
      id: 'gratuito',
      name: 'PLAN GRATUITO',
      price: 0,
      period: 'Gratis',
      highlight: false,
      features: [
        { text: '1 publicación activa', included: true },
        { text: 'Fotos básicas (hasta 5)', included: true },
        { text: 'Contacto directo por WhatsApp', included: true },
        { text: 'Fotos + Video optimizado', included: false },
        { text: 'Alquiler de letrero físico', included: false },
        { text: 'Dron + Fotos Profesionales', included: false },
        { text: 'Sello Oro + Mapa Premium', included: false },
        { text: 'Estadísticas avanzadas de visitas', included: false },
      ],
    },
    {
      id: 'contenidos',
      name: 'PLAN CONTENIDOS',
      price: prices.contenidos,
      period: 'mes',
      highlight: false,
      badge: 'MAS RECOMENDADO PARA RENTAS',
      features: [
        { text: '1 propiedad', included: true },
        { text: 'Fotos + Video optimizado', included: true },
        { text: 'Contacto directo por WhatsApp', included: true },
        { text: 'Alquiler de letrero físico', included: true },
        { text: 'Dron + Fotos Profesionales', included: false },
        { text: 'Sello Oro + Mapa Premium', included: false },
        { text: 'Estadísticas avanzadas de visitas', included: false },
      ],
    },
    {
      id: 'venta_pro',
      name: 'PLAN VENTA PRO',
      price: prices.venta_pro,
      period: 'mes',
      highlight: true,
      badge: 'MAS RECOMENDADO PARA VENTA',
      pill: 'PUBLICIDAD PRIORITARIA',
      features: [
        { text: '1 propiedad', included: true },
        { text: 'Dron + Fotos Profesionales', included: true },
        { text: 'Sello Oro + Mapa Premium', included: true },
        { text: 'Alquiler de letrero físico', included: true },
        { text: 'Estadísticas avanzadas de visitas', included: true },
      ],
    },
    {
      id: 'cierre_garantizado',
      name: 'CIERRE GARANTIZADO',
      customPrice: `Comisión: ${prices.cierre_garantizado}% del valor de venta`,
      period: '',
      highlight: false,
      badge: 'TODO INCLUIDO',
      badgeDark: true,
      features: [
        { text: 'Gestión completa por agente experto', included: true },
        { text: 'Visitas y negociación delegadas', included: true },
        { text: 'Alquiler de letrero físico', included: true },
        { text: 'Auditoría legal y notarial', included: true },
        { text: `Comisión del ${prices.cierre_garantizado}%`, included: true },
      ],
    },
  ], [prices]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-20 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Grilla de Planes de Precios */}
        <PricingPlansGrid onSelectPlan={setSelectedPlan} prices={prices} />

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
                  {dynamicPlans.find(p => p.id === selectedPlan)?.name}
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
