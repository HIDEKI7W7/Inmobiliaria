'use client';

import { useState } from 'react';
import Link from 'next/link';

const t = (key: string) => key;

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  highlight: boolean;
  badge?: string;
  features: { text: string; included: boolean }[];
}

interface Service {
  id: string;
  icon: string;
  title: string;
  desc: string;
  price: string;
  cta: string;
  color: string;
}

// ─── Datos de planes ──────────────────────────────────────────────────────────
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
      { text: 'Atención prioritaria', included: false },
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
      { text: 'Atención prioritaria', included: false },
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
      { text: 'Atención prioritaria 24/7', included: true },
    ],
  },
];

// ─── Servicios adicionales ────────────────────────────────────────────────────
const SERVICES: Service[] = [
  {
    id: 'fotografia',
    icon: '📸',
    title: 'Sesión Fotográfica Pro',
    desc: 'Fotógrafo inmobiliario certificado que captura tu propiedad con drones y lentes gran angular para maximizar el impacto visual.',
    price: 'Desde $89 USD',
    cta: 'Agendar sesión',
    color: 'from-violet-500/10 to-violet-500/5',
  },
  {
    id: 'valuacion',
    icon: '📊',
    title: 'Valuación Profesional',
    desc: 'Informe técnico de tasación de mercado emitido por nuestro equipo de expertos para fijar el precio óptimo de venta.',
    price: 'Desde $120 USD',
    cta: 'Solicitar informe',
    color: 'from-blue-500/10 to-blue-500/5',
  },
  {
    id: 'legal',
    icon: '⚖️',
    title: 'Asesoría Legal Exprés',
    desc: 'Revisión completa de documentos legales (folio real, catastro, testimonio) por abogados especializados en bienes raíces.',
    price: 'Desde $75 USD',
    cta: 'Consultar ahora',
    color: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    id: 'virtual',
    icon: '🥽',
    title: 'Tour Virtual 360°',
    desc: 'Producción completa de recorrido inmersivo con cámaras 360° para que los compradores visiten tu propiedad desde cualquier lugar.',
    price: 'Desde $199 USD',
    cta: 'Quiero un tour',
    color: 'from-propio-green/10 to-propio-green/5',
  },
  {
    id: 'marketing',
    icon: '📣',
    title: 'Campaña de Marketing Digital',
    desc: 'Difusión en redes sociales, Google Ads y portales inmobiliarios gestionada por nuestro equipo de marketing con resultados garantizados.',
    price: 'Desde $159 USD',
    cta: 'Activar campaña',
    color: 'from-orange-500/10 to-orange-500/5',
  },
  {
    id: 'notarial',
    icon: '📄',
    title: 'Trámites Notariales',
    desc: 'Gestión completa de minutas, transferencias y protocolización de documentos ante notaría, sin que muevas un dedo.',
    price: 'Desde $250 USD',
    cta: 'Iniciar trámite',
    color: 'from-rose-500/10 to-rose-500/5',
  },
];

// ─── Testimoniales ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'María Quispe', role: 'Propietaria · Cala Cala', text: 'Vendí mi casa en 3 semanas gracias al plan Profesional. La verificación legal fue un diferencial enorme para los compradores.', avatar: 'MQ', rating: 5 },
  { name: 'Carlos Rodríguez', role: 'Propietario · Queru Queru', text: 'El tour virtual 360° me permitió cerrar la venta con un comprador que estaba en Santa Cruz. Increíble herramienta.', avatar: 'CR', rating: 5 },
  { name: 'Sofía Blanco', role: 'Inversora · El Prado', text: 'Las estadísticas en tiempo real me ayudan a entender el mercado. Sé exactamente cuántas personas ven mis propiedades.', avatar: 'SB', rating: 5 },
];

// ─── Componente Plan ──────────────────────────────────────────────────────────
function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: (id: string) => void }) {
  const isProfessional = plan.id === 'profesional';

  return (
    <div className={`relative rounded-3xl flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 ${
      isProfessional
        ? 'bg-white border-t-4 border-t-[#b9fa3c] border-x border-b border-slate-100 shadow-2xl scale-[1.02] z-10'
        : 'bg-white border border-slate-100 shadow-md hover:shadow-xl'
    }`}>
      {plan.badge && (
        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-black px-4 py-1 rounded-full uppercase tracking-wider ${
          isProfessional ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-[#04045E] text-white'
        }`}>
          {plan.badge}
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-heading font-bold text-xl mb-1 text-[#04045E] uppercase tracking-wide">
          {plan.name}
        </h3>
        <div className="flex items-end gap-1 mb-6">
          <span className="font-heading font-black text-4xl text-[#04045E]">
            {plan.price === 0 ? 'Gratis' : `$${plan.price}`}
          </span>
          {plan.price > 0 && <span className="text-sm mb-1.5 text-slate-400">/{plan.period}</span>}
        </div>

        {/* Solución de Contraste: Texto oscuro para legibilidad 100% garantizada */}
        <div className="text-slate-700 font-medium">
          <ul className="space-y-3">
            {plan.features.map((f, i) => (
              <li key={i} className={`flex items-center gap-2.5 text-sm ${
                f.included ? 'text-slate-800' : 'text-slate-350 line-through'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  f.included ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'
                }`}>
                  {f.included ? '✓' : '–'}
                </span>
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="pt-6">
        <button
          id={`btn-plan-${plan.id}`}
          onClick={() => onSelect(plan.id)}
          className={`w-full py-3.5 rounded-2xl font-heading font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
            isProfessional
              ? 'bg-[#b9fa3c] text-[#04045E] hover:brightness-95 shadow-lg shadow-lime-100'
              : 'bg-[#04045E] text-white hover:bg-opacity-95 shadow-md'
          }`}
        >
          {plan.price === 0 ? 'Comenzar gratis' : `Contratar ${plan.name}`}
        </button>
      </div>
    </div>
  );
}

// ─── Página de Servicios ──────────────────────────────────────────────────────
export default function ServiciosPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [publishForm, setPublishForm] = useState({ title: '', price: '', zone: '', type: '', desc: '' });
  const [formSent, setFormSent] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => setFormSent(false), 4000);
  };

  return (
    <div className="bg-slate-50 font-sans">
      {/* ─── HERO PROPIETARIO ─────────────────────────────────────────────────── */}
      <section className="bg-[#04045E] relative overflow-hidden py-24">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#b9fa3c]/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#b9fa3c]/15 border border-[#b9fa3c]/25 text-[#b9fa3c] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#b9fa3c] animate-pulse" />{t("Para propietarios")}</span>
          <h1 className="font-heading font-bold text-white text-4xl md:text-6xl leading-tight mb-5">{t("Vende más rápido")}<br /><span className="text-[#b9fa3c]">{t("con las herramientas correctas")}</span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Elige el plan que mejor se adapta a tus objetivos. Desde publicaciones gratuitas hasta campañas de marketing digital con resultados medibles.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#planes" className="bg-[#b9fa3c] text-[#04045E] font-heading font-bold px-8 py-4 rounded-full hover:brightness-110 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-lime-100">{t("Ver planes y precios")}</a>
            <a href="#publicar" className="bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/15 transition-colors">
              {t("Publicar ahora (Gratis)")}
            </a>
          </div>
        </div>
      </section>

      {/* ─── ESTADÍSTICAS ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { v: '22 días', l: 'Promedio de cierre con plan Pro' },
            { v: '3.4×', l: 'Más visitas con verificación legal' },
            { v: '97%', l: 'Propietarios satisfechos' },
            { v: '$0', l: 'Comisión oculta de Propio' },
          ].map(s => (
            <div key={s.l}>
              <p className="font-heading font-black text-[#04045E] text-3xl md:text-4xl">{s.v}</p>
              <p className="text-slate-400 text-sm mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PLANES ───────────────────────────────────────────────────────────── */}
      <section id="planes" className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[#b9fa3c] bg-[#04045E] font-semibold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">{t("Planes")}</span>
          <h2 className="font-heading font-bold text-[#04045E] text-3xl md:text-4xl mt-4 mb-3">{t("Elige tu plan ideal")}</h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">Sin permanencia mínima. Puedes cambiar o cancelar cuando quieras.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map(p => <PlanCard key={p.id} plan={p} onSelect={setSelectedPlan} />)}
        </div>

        {/* Modal confirmación de plan */}
        {selectedPlan && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPlan(null)}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-heading font-bold text-[#04045E] text-xl mb-2 uppercase tracking-wide">{t("¡Excelente elección!")}</h3>
              <p className="text-slate-500 text-sm mb-6">{t("Seleccionaste el plan ")}<strong className="text-[#04045E]">{PLANS.find(p => p.id === selectedPlan)?.name}</strong>{t(". Para continuar, inicia sesión o crea tu cuenta.")}
              </p>
              <Link href="/login" className="w-full flex items-center justify-center bg-[#b9fa3c] text-[#04045E] font-heading font-bold py-3.5 rounded-2xl hover:brightness-105 transition-all mb-3 text-xs uppercase tracking-wider shadow-md">{t("Continuar con este plan")}</Link>
              <button onClick={() => setSelectedPlan(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">{t("Cancelar")}</button>
            </div>
          </div>
        )}
      </section>

      {/* ─── SERVICIOS ADICIONALES ────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[#b9fa3c] bg-[#04045E] font-semibold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">{t("Servicios à la carte")}</span>
            <h2 className="font-heading font-bold text-[#04045E] text-3xl md:text-4xl mt-4 mb-3">{t("Potencia tu publicación")}</h2>
            <p className="text-slate-400 max-w-xl mx-auto">{t("Complementa cualquier plan con servicios especializados para destacar sobre la competencia.")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(svc => (
              <div
                key={svc.id}
                className="bg-[#F8FAFC] border border-slate-100 rounded-3xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                <span className="text-4xl mb-4 block">{svc.icon}</span>
                <h3 className="font-heading font-bold text-[#04045E] text-lg mb-2 uppercase tracking-wide">{svc.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-4">{svc.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[#04045E] text-base">{svc.price}</span>
                  <button
                    id={`btn-service-${svc.id}`}
                    className="bg-[#04045E] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors uppercase tracking-wider"
                  >
                    {svc.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FORMULARIO PUBLICAR ──────────────────────────────────────────────── */}
      <section id="publicar" className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-[#b9fa3c] bg-[#04045E] font-semibold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider">{t("Publicación express")}</span>
            <h2 className="font-heading font-bold text-[#04045E] text-3xl md:text-4xl mt-4 mb-3">{t("Publica en 2 minutos")}</h2>
            <p className="text-slate-400">{t("Registra tu propiedad ahora y empieza a recibir consultas hoy mismo.")}</p>
          </div>

          {formSent ? (
            <div className="bg-[#b9fa3c]/10 border border-[#b9fa3c]/25 rounded-3xl p-10 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="font-heading font-bold text-[#04045E] text-2xl mb-2">{t("¡Propiedad registrada!")}</h3>
              <p className="text-slate-500">{t("Nuestro equipo revisará tu publicación y la activará en menos de 24 horas.")}</p>
            </div>
          ) : (
            <form onSubmit={handlePublish} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#04045E] uppercase tracking-wide mb-2">{t("Título del inmueble")}</label>
                  <input
                    type="text"
                    placeholder="Casa en Cala Cala con jardín..."
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#04045E] focus:ring-2 focus:ring-[#04045E]/10 transition-all bg-[#F8FAFC]"
                    value={publishForm.title}
                    onChange={e => setPublishForm(s => ({ ...s, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#04045E] uppercase tracking-wide mb-2">{t("Precio (USD)")}</label>
                  <input
                    type="number"
                    placeholder="120000"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#04045E] focus:ring-2 focus:ring-[#04045E]/10 transition-all bg-[#F8FAFC]"
                    value={publishForm.price}
                    onChange={e => setPublishForm(s => ({ ...s, price: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[#04045E] uppercase tracking-wide mb-2">{t("Zona / Barrio")}</label>
                  <input
                    type="text"
                    placeholder="Cala Cala, Cochabamba"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#04045E] focus:ring-2 focus:ring-[#04045E]/10 transition-all bg-[#F8FAFC]"
                    value={publishForm.zone}
                    onChange={e => setPublishForm(s => ({ ...s, zone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#04045E] uppercase tracking-wide mb-2">{t("Tipo de inmueble")}</label>
                  <select
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#04045E] focus:ring-2 focus:ring-[#04045E]/10 transition-all bg-[#F8FAFC]"
                    value={publishForm.type}
                    onChange={e => setPublishForm(s => ({ ...s, type: e.target.value }))}
                  >
                    <option value="">{t("Selecciona un tipo")}</option>
                    <option value="CASA">{t("Casa")}</option>
                    <option value="DEPARTAMENTO">{t("Departamento")}</option>
                    <option value="TERRENO">{t("Terreno")}</option>
                    <option value="OFICINA">{t("Oficina")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#04045E] uppercase tracking-wide mb-2">{t("Descripción breve")}</label>
                <textarea
                  rows={4}
                  placeholder="Describe las características más importantes de tu propiedad..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:border-[#04045E] focus:ring-2 focus:ring-[#04045E]/10 transition-all resize-none bg-[#F8FAFC]"
                  value={publishForm.desc}
                  onChange={e => setPublishForm(s => ({ ...s, desc: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                id="btn-publish-property"
                className="w-full bg-[#b9fa3c] text-[#04045E] font-heading font-bold py-4 rounded-2xl hover:brightness-95 transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-lime-100 text-sm uppercase tracking-wider"
              >
                {t("Publicar mi propiedad →")}
              </button>
              <p className="text-center text-slate-400 text-[10px] uppercase tracking-widest font-bold">{t("Al publicar aceptas los ")}<a href="#" className="text-[#04045E] underline">{t("términos del servicio")}</a>{t(" de Propio.")}</p>
            </form>
          )}
        </div>
      </section>

      {/* ─── TESTIMONIALES ────────────────────────────────────────────────────── */}
      <section className="bg-[#04045E] py-20 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-white text-3xl md:text-4xl uppercase tracking-tight">{t("Propietarios que confían en Propio")}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/8 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <span key={i} className="text-[#b9fa3c] text-sm">★</span>)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#b9fa3c]/20 flex items-center justify-center text-[#b9fa3c] font-bold text-xs shrink-0">{t.avatar}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-[#04045E] text-3xl uppercase tracking-tight">{t("Preguntas frecuentes")}</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: '¿Puedo publicar de forma gratuita?', a: 'Sí. El plan Básico es completamente gratuito y te permite publicar 1 propiedad activa con hasta 5 fotos y contacto directo por WhatsApp.' },
              { q: '¿Qué incluye la Verificación Legal Sello Oro?', a: 'Nuestro equipo de abogados revisa y valida todos los documentos: folio real, catastro, testimonio, impuestos, plano de uso suelo y CI del propietario. Se muestra una insignia de confianza visible para los compradores.' },
              { q: '¿Puedo cancelar mi plan en cualquier momento?', a: 'Sí. No hay permanencia mínima. Puedes cancelar, bajar o subir de plan cuando lo desees desde tu panel de propietario.' },
              { q: '¿Cobra Propio comisión por la venta?', a: 'No. Propio no cobra comisiones por la transacción. Solo pagas el plan mensual elegido. La negociación y cierre queda 100% entre el propietario y el comprador.' },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── FAQ Item con acordeón ────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-[#04045E] text-sm">{question}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-slate-500 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
