'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken, getCurrentUser, getRedirectPathByRole, getToken, saveToken } from '@/utils/session';

type Objective = 'COMPRAR' | 'ALQUILAR' | 'VENDER';
type PropertyInterest = 'CASA' | 'DEPARTAMENTO' | 'TERRENO';

const objectives: Array<{ value: Objective; label: string; detail: string; badge: string }> = [
  { value: 'COMPRAR', label: 'Comprar Inmueble', detail: 'Busco una propiedad para invertir o vivir de forma directa y transparente.', badge: 'Comprador' },
  { value: 'ALQUILAR', label: 'Alquilar Inmueble', detail: 'Quiero ver opciones disponibles de alquiler directo y sin intermediarios.', badge: 'Inquilino' },
  { value: 'VENDER', label: 'Publicar / Vender', detail: 'Deseo cargar mis inmuebles en la plataforma para recibir apoyo comercial.', badge: 'Propietario' },
];

const propertyTypes: Array<{ value: PropertyInterest; label: string; icon: string; desc: string }> = [
  { value: 'CASA', label: 'Casa Familiar', icon: '🏡', desc: 'Espacios amplios y jardines' },
  { value: 'DEPARTAMENTO', label: 'Departamento', icon: '🏢', desc: 'Estilo moderno y condominio' },
  { value: 'TERRENO', label: 'Lote / Terreno', icon: '🌱', desc: 'Proyectos y construcción' },
];

export default function OnboardingPage() {
  const router = useRouter();
  
  // Estados principales de control
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [propertyInterest, setPropertyInterest] = useState<PropertyInterest | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Control de Skeleton Loading en transiciones de paso para evitar salto de pantalla
  const [isChangingStep, setIsChangingStep] = useState(false);
  const [activeStepView, setActiveStepView] = useState(1);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.onboardingCompleted) {
      router.replace(getRedirectPathByRole(user.role, user.objective, true));
    }
  }, [router]);

  const progress = useMemo(() => `${Math.round((activeStepView / 3) * 100)}%`, [activeStepView]);

  const validatePhone = (phone: string) => /^\+[1-9]\d{7,14}$/.test(phone.trim());
  const isPhoneValid = useMemo(() => validatePhone(whatsappPhone), [whatsappPhone]);

  // Transición de pasos con Skeleton de 300ms de alta calidad
  const handleStepTransition = (nextStep: number) => {
    setError(null);
    setIsChangingStep(true);
    setTimeout(() => {
      setStep(nextStep);
      setActiveStepView(nextStep);
      setIsChangingStep(false);
    }, 300);
  };

  const finish = async () => {
    setError(null);

    if (!objective || !propertyInterest || !isPhoneValid) {
      setError('Por favor, completa todos los campos requeridos con un número de WhatsApp válido.');
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    setIsSaving(true);

    try {
      // Llamar al proxy BFF local de Next.js para evitar problemas de red y CORS directos
      const response = await fetch(`/api/auth/onboarding`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          objective,
          propertyInterest,
          whatsappPhone: whatsappPhone.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'No pudimos guardar tu configuración inicial.');
      }

      if (data.backendToken) {
        saveToken(data.backendToken);
      }

      const payload = data.backendToken ? decodeToken(data.backendToken) : getCurrentUser();
      const role = payload?.role || data.user?.role;
      const resolvedObjective = payload?.objective || data.user?.objective || objective;

      // ── Enrutamiento Final Riguroso para Evitar Redirecciones Cruzadas al Admin ──
      switch (role?.toUpperCase()) {
        case 'ADMIN':
          router.replace('/admin');
          break;
        case 'AGENTE':
          router.replace('/agente/kanban');
          break;
        case 'CLIENTE':
          router.replace('/cliente');
          break;
        case 'PROPIETARIO':
          router.replace(resolvedObjective === 'VENDER' ? '/propietario/publicar' : '/propietario/dashboard');
          break;
        default:
          router.replace('/');
      }
    } catch (err: any) {
      setError(err.message || 'No pudimos completar tu perfil de onboarding.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-600 font-sans antialiased selection:bg-[#b9fa3c]/30 flex flex-col justify-between py-10 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Elemento Decorativo de Fondo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[350px] bg-gradient-to-b from-blue-50/40 via-transparent to-transparent -z-10 rounded-full blur-3xl"></div>
      
      {/* Header Corporativo Fino */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 select-none group">
          <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z" 
              fill="#04045E"
            />
          </svg>
          <span className="font-heading font-black text-xl tracking-tight text-[#04045E]">
            Propio<span className="text-[#b9fa3c] text-2xl leading-none font-bold">.</span>
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100/70 px-3 py-1.5 rounded-full border border-slate-200/50">
          Onboarding Asistido
        </span>
      </header>

      {/* Contenedor Principal */}
      <section className="flex-grow flex items-center justify-center py-6">
        <div className="w-full max-w-5xl">
          
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-slate-200/35 relative flex flex-col">
            
            {/* Barra de Progreso Verde Lima Suave */}
            <div className="h-1.5 bg-slate-100/80 w-full relative">
              <div 
                className="h-full bg-gradient-to-r from-[#b9fa3c] to-[#adf02c] transition-all duration-500 ease-out shadow-sm" 
                style={{ width: progress }} 
              />
            </div>

            <div className="grid gap-6 p-6 sm:p-10 lg:grid-cols-[240px_1fr] min-h-[500px]">
              
              {/* Navegador Lateral de Pasos (Premium Sidebar) */}
              <aside className="border-b border-slate-100 pb-6 lg:border-b-0 lg:border-r lg:border-slate-100 lg:pr-8 flex flex-row lg:flex-col gap-3 justify-center lg:justify-start">
                {[1, 2, 3].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (item < activeStepView || (item === 2 && objective) || (item === 3 && objective && propertyInterest)) {
                        handleStepTransition(item);
                      }
                    }}
                    disabled={isSaving || (item === 2 && !objective) || (item === 3 && (!objective || !propertyInterest))}
                    className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-left transition-all duration-300 w-full select-none ${
                      activeStepView === item 
                        ? 'bg-[#04045E] text-white shadow-lg shadow-[#04045E]/15 scale-[1.02]' 
                        : 'bg-slate-50/80 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-45 disabled:hover:bg-slate-50/80'
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black transition-all ${
                      activeStepView === item 
                        ? 'bg-[#b9fa3c] text-[#04045E] scale-110 shadow-sm' 
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                      {item}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline-block">
                      {item === 1 ? 'Intención' : item === 2 ? 'Inmueble' : 'Validación'}
                    </span>
                  </button>
                ))}
              </aside>

              {/* Panel de Contenido del Paso */}
              <div className="flex flex-col justify-between min-h-[380px]">
                
                {isChangingStep ? (
                  /* ── SKELETON LOADERS (PULSING MICRO-ANIMATION) ── */
                  <div className="space-y-6 animate-pulse my-auto">
                    <div className="space-y-2.5">
                      <div className="h-6.5 bg-slate-200/80 rounded-lg w-1/3"></div>
                      <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 pt-2">
                      <div className="h-28 bg-slate-100/70 rounded-2xl border border-slate-100"></div>
                      <div className="h-28 bg-slate-100/70 rounded-2xl border border-slate-100"></div>
                      <div className="h-28 bg-slate-100/70 rounded-2xl border border-slate-100"></div>
                    </div>
                  </div>
                ) : (
                  /* ── CONTENIDO DEL WIZARD (SENTENCE CASE - ELEGANT TYPOGRAPHY) ── */
                  <div className="transition-all duration-300 my-auto">
                    
                    {step === 1 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#04045E]/50">Paso 1 · Intención Comercial</span>
                          <h2 className="text-xl sm:text-2xl font-black text-[#04045E] tracking-tight mt-1">¿Cuál es tu intención principal?</h2>
                          <p className="text-xs font-semibold text-slate-450 mt-1.5 leading-relaxed">Selecciona el objetivo que mejor describe lo que deseas realizar en Propio.</p>
                        </div>
                        
                        <div className="grid gap-3.5 sm:grid-cols-3">
                          {objectives.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setObjective(item.value);
                                handleStepTransition(2);
                              }}
                              className={`min-h-[140px] rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between shadow-sm cursor-pointer ${
                                objective === item.value
                                  ? 'border-[#04045E] bg-[#04045E] text-white shadow-lg shadow-[#04045E]/15'
                                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-[#04045E]/40 hover:bg-white'
                              }`}
                            >
                              <div className="space-y-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                  objective === item.value ? 'bg-[#b9fa3c]/20 text-[#b9fa3c]' : 'bg-slate-200/70 text-slate-500'
                                }`}>
                                  {item.badge}
                                </span>
                                <h3 className="text-sm font-black tracking-tight pt-1.5">{item.label}</h3>
                              </div>
                              <p className={`text-xs font-medium leading-relaxed mt-2 ${
                                objective === item.value ? 'text-white/70' : 'text-slate-450'
                              }`}>
                                {item.detail}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#04045E]/50">Paso 2 · Tipo de Propiedad</span>
                          <h2 className="text-xl sm:text-2xl font-black text-[#04045E] tracking-tight mt-1">Preferencia de inventario</h2>
                          <p className="text-xs font-semibold text-slate-455 mt-1.5 leading-relaxed">Selecciona qué tipo de inmueble te interesa comprar, alquilar o vender.</p>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-3">
                          {propertyTypes.map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => {
                                setPropertyInterest(item.value);
                                handleStepTransition(3);
                              }}
                              className={`rounded-2xl border px-5 py-8 text-center transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col items-center gap-3.5 shadow-sm ${
                                propertyInterest === item.value
                                  ? 'border-[#b9fa3c] bg-[#b9fa3c] text-[#04045E] shadow-lg shadow-[#b9fa3c]/20 font-black'
                                  : 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-[#04045E]/40 hover:bg-white hover:text-[#04045E]'
                              }`}
                            >
                              <span className="text-4xl filter drop-shadow-sm select-none transform transition-transform group-hover:scale-110">{item.icon}</span>
                              <div className="space-y-0.5">
                                <span className="block text-xs font-black uppercase tracking-widest">{item.label}</span>
                                <span className={`block text-[10px] font-semibold ${propertyInterest === item.value ? 'text-[#04045E]/70' : 'text-slate-400'}`}>
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#04045E]/50">Paso 3 · Validación Comercial</span>
                          <h2 className="text-xl sm:text-2xl font-black text-[#04045E] tracking-tight mt-1">WhatsApp validado comercial</h2>
                          <p className="text-xs font-semibold text-slate-450 mt-1.5 leading-relaxed">Introduce tu número de celular con el código internacional de país correspondiente.</p>
                        </div>
                        
                        <div className="space-y-3 max-w-md">
                          <label htmlFor="whatsappPhone" className="block text-[9px] font-black uppercase tracking-widest text-slate-400 pl-0.5">
                            Número de Celular con Código de País
                          </label>
                          <div className="relative">
                            <input
                              id="whatsappPhone"
                              type="tel"
                              value={whatsappPhone}
                              onChange={(event) => setWhatsappPhone(event.target.value)}
                              placeholder="+59170712345"
                              className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 text-base font-bold outline-none transition-all duration-300 ${
                                whatsappPhone
                                  ? isPhoneValid
                                    ? 'border-emerald-400 bg-emerald-50/10 focus:border-emerald-500 focus:ring-emerald-500/10 text-emerald-800'
                                    : 'border-red-300 bg-red-50/10 focus:border-red-400 focus:ring-red-400/10 text-red-800'
                                  : 'border-slate-200 focus:border-[#04045E] text-[#04045E]'
                              }`}
                            />
                            {whatsappPhone && (
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black">
                                {isPhoneValid ? '✅ Válido' : '❌ Incompleto'}
                              </span>
                            )}
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-2">
                            <p className="text-[10px] font-semibold text-slate-450 leading-relaxed uppercase tracking-wider">
                              <span className="font-black text-[#04045E] text-[9px]">Ejemplo:</span> Bolivia es <span className="font-black text-[#04045E]">+591</span> seguido de tu celular (ej. +59170712345). Lo utilizaremos para enviarte carpetas de títulos comerciales de tus inmuebles.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mensajes de Error (Estilo premium no-invasivo) */}
                {error && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3.5 text-xs font-bold text-red-700 flex items-start gap-2.5 animate-fadeIn">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="flex-shrink-0 mt-0.5 text-red-650">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Botones de Navegación del Wizard */}
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between shrink-0 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleStepTransition(step - 1)}
                    disabled={step === 1 || isSaving}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-450 transition-all duration-300 hover:bg-slate-50 hover:text-[#04045E] disabled:opacity-40 cursor-pointer select-none"
                  >
                    Anterior
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (step === 1 && !objective) {
                          setError('Por favor, selecciona tu objetivo comercial.');
                          return;
                        }
                        if (step === 2 && !propertyInterest) {
                          setError('Por favor, selecciona tu tipo de inmueble de interés.');
                          return;
                        }
                        handleStepTransition(step + 1);
                      }}
                      className="rounded-xl bg-[#04045E] px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-[#04045E]/15 transition-all duration-300 hover:scale-[1.02] hover:bg-[#0b0b82] cursor-pointer select-none"
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finish}
                      disabled={isSaving || !isPhoneValid}
                      className="rounded-xl bg-[#b9fa3c] hover:bg-[#adf02c] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#04045E] shadow-lg shadow-[#b9fa3c]/20 transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-[#b9fa3c] cursor-pointer border border-[#04045E]/5 select-none"
                    >
                      {isSaving ? 'Guardando Perfil...' : 'Finalizar Configuración'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer Fino */}
      <footer className="w-full text-center text-[10px] text-slate-400 font-medium pt-4 select-none">
        © 2026 Propio Digital · Conexión directa y transparente · Bolivia
      </footer>
    </main>
  );
}
