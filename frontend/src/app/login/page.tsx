'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveToken, decodeToken, getRedirectPathByRole, isAuthenticated } from '@/utils/session';

interface AuthResponse {
  backendToken?: string;
  user: { id: string; email: string; name: string; role: string };
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const socialAuthBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
  const t = (key: string) => key;

  // Estados de control de formulario
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de carga, éxito y errores
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Redirigir si la sesión ya está activa
  useEffect(() => {
    if (isAuthenticated()) {
      const stored = localStorage.getItem('propio_token');
      if (stored) {
        const payload = decodeToken(stored);
        if (payload) {
          router.replace(getRedirectPathByRole(payload.role, payload.objective, payload.onboardingCompleted));
        }
      }
    }
  }, [router]);

  // Escuchar parámetros de búsqueda para activar pestaña de registro
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('register') === 'true' || params.get('tab') === 'register' || window.location.pathname === '/registro') {
        setIsRegister(true);
      }
    }
  }, []);

  // Manejo de foco según el modo (Login vs Registro)
  useEffect(() => {
    if (isRegister) {
      nameRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, [isRegister]);

  // Validaciones
  const validateName = (val: string) => {
    if (!val.trim()) return t('El nombre completo es requerido');
    if (val.trim().length < 3) return t('Ingresa al menos 3 caracteres');
    return '';
  };

  const validateEmail = (val: string) => {
    if (!val) return t('El correo electrónico es requerido');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return t('Ingresa un correo válido');
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return t('La contraseña es requerida');
    if (val.length < 6) return t('La contraseña debe tener al menos 6 caracteres');
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Ejecutar validaciones locales
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const nErr = isRegister ? validateName(name) : '';

    setEmailError(eErr);
    setPasswordError(pErr);
    setNameError(nErr);

    if (eErr || pErr || nErr) return;

    setIsLoading(true);
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    try {
      if (isRegister) {
        // ─── FLUJO DE REGISTRO ───
        const registerRes = await fetch(`${API}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const registerData = await registerRes.json();

        if (!registerRes.ok) {
          throw new Error(registerData?.message || t('Error al registrar el usuario.'));
        }

        setSuccessMsg(t('¡Registro exitoso! Iniciando sesión automáticamente...'));

        // ─── AUTO-LOGIN AUTOMÁTICO ───
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          throw new Error(loginData?.message || t('Cuenta creada con éxito, pero falló el inicio automático. Intenta iniciar sesión manualmente.'));
        }

        const authResponse: AuthResponse = loginData;
        if (authResponse.backendToken) {
          saveToken(authResponse.backendToken);
          const payload = decodeToken(authResponse.backendToken);
          
          const searchParams = new URLSearchParams(window.location.search);
          const customRedirect = searchParams.get('redirect');
          
          let redirectPath = payload
            ? getRedirectPathByRole(payload.role, payload.objective, payload.onboardingCompleted)
            : getRedirectPathByRole(authResponse.user.role);

          if (payload && !payload.onboardingCompleted && payload.role?.toUpperCase() !== 'ADMIN' && payload.role?.toUpperCase() !== 'AGENTE') {
            redirectPath = '/onboarding';
          } else if (customRedirect && customRedirect.startsWith('/')) {
            redirectPath = customRedirect;
          }

          setTimeout(() => {
            try {
              router.push(redirectPath);
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.location.pathname !== redirectPath) {
                  window.location.href = redirectPath;
                }
              }, 150);
            } catch (e) {
              if (typeof window !== 'undefined') {
                window.location.href = redirectPath;
              }
            }
          }, 1200);
        } else {
          setTimeout(() => {
            setIsRegister(false);
            setSuccessMsg(t('Por favor ingresa con tus nuevas credenciales'));
          }, 1500);
        }
      } else {
        // ─── FLUJO DE LOGIN ESTÁNDAR ───
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
          throw new Error(loginData?.message || t('Credenciales inválidas. Verifica tu correo y contraseña.'));
        }

        const authResponse: AuthResponse = loginData;
        if (authResponse.backendToken) {
          saveToken(authResponse.backendToken);
          const payload = decodeToken(authResponse.backendToken);
          
          const searchParams = new URLSearchParams(window.location.search);
          const customRedirect = searchParams.get('redirect');
          
          let redirectPath = payload
            ? getRedirectPathByRole(payload.role, payload.objective, payload.onboardingCompleted)
            : getRedirectPathByRole(authResponse.user.role);

          if (payload && !payload.onboardingCompleted && payload.role?.toUpperCase() !== 'ADMIN' && payload.role?.toUpperCase() !== 'AGENTE') {
            redirectPath = '/onboarding';
          } else if (customRedirect && customRedirect.startsWith('/')) {
            redirectPath = customRedirect;
          }

          setSuccessMsg(`${t("¡Bienvenido,")} ${authResponse.user.name || authResponse.user.email}!`);

          setTimeout(() => {
            try {
              router.push(redirectPath);
              setTimeout(() => {
                if (typeof window !== 'undefined' && window.location.pathname !== redirectPath) {
                  window.location.href = redirectPath;
                }
              }, 150);
            } catch (e) {
              if (typeof window !== 'undefined') {
                window.location.href = redirectPath;
              }
            }
          }, 800);
        }
      }
    } catch (err: any) {
      setError(err.message || t('Error al conectar con el servidor. Intenta de nuevo.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased font-sans">
      
      {/* Columna Izquierda: Formulario Institucional Propio */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 bg-white min-h-screen relative overflow-y-auto">
        {/* Cabecera / Logo */}
        <div className="flex justify-between items-center w-full">
          <Link href="/" className="flex items-center gap-2 select-none group transition-transform">
            <svg viewBox="0 0 100 100" className="w-8 h-8 group-hover:scale-105 transition-transform" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
                fill="#ccff00"
              />
            </svg>
            <div className="text-2xl font-bold tracking-tight text-[#000033]">
              Propio<span className="text-[#ccff00] font-black">.</span>
            </div>
          </Link>
          <Link href="/" className="text-xs uppercase tracking-wider font-bold text-slate-400 hover:text-[#000033] border border-slate-200 px-4 py-2 rounded-xl transition-colors">
            ✕ {t("Cerrar")}
          </Link>
        </div>

        {/* Contenedor del Formulario Central */}
        <div className="max-w-md w-full mx-auto my-auto pt-10 pb-10">
          <h1 className="text-3xl font-black tracking-tight text-[#000033] mb-2 uppercase">
            {isRegister ? t('Crear Cuenta') : t('Ingresa a tu cuenta')}
          </h1>
          <p className="text-slate-500 text-sm font-medium mb-8">
            {isRegister 
              ? t('Portal de trato directo verificado con Sello Oro en Bolivia.')
              : t('Explora de manera directa y transparente el mercado inmobiliario boliviano.')
            }
          </p>

          {/* Selectores de Tab (Ingresar / Registrarse) */}
          <div className="flex border-b border-slate-200 mb-8 text-sm font-bold uppercase tracking-wider">
            <button 
              type="button"
              onClick={() => { setIsRegister(false); setError(null); setSuccessMsg(null); }}
              className={`pb-3 pr-6 border-b-2 transition-all ${!isRegister ? 'border-[#000033] text-[#000033]' : 'border-transparent text-slate-400 hover:text-[#000033]'}`}
            >
              {t("Ingresar")}
            </button>
            <button 
              type="button"
              onClick={() => { setIsRegister(true); setError(null); setSuccessMsg(null); }}
              className={`pb-3 px-6 border-b-2 transition-all ${isRegister ? 'border-[#000033] text-[#000033]' : 'border-transparent text-slate-400 hover:text-[#000033]'}`}
            >
              {t("Registrarse")}
            </button>
          </div>

          {/* Alertas */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-3 rounded-xl mb-6 animate-fadeIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-3 rounded-xl mb-6 animate-fadeIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botones de Autenticación Social COLORIDOS Y REALES */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <a
              href={`${socialAuthBaseUrl}/auth/google`}
              className="flex justify-center items-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              title={t("Google")}
            >
              <img src="/images/logos/google_logo_colorful.svg" alt="Google" className="h-5" />
            </a>
            <a
              href={`${socialAuthBaseUrl}/auth/apple`}
              className="flex justify-center items-center py-3 border border-slate-200 rounded-xl hover:opacity-90 transition-opacity bg-black cursor-pointer shadow-sm"
              title={t("Apple")}
            >
              <img src="/images/logos/apple_logo_white.svg" alt="Apple" className="h-5" />
            </a>
            <a
              href={`${socialAuthBaseUrl}/auth/facebook`}
              className="flex justify-center items-center py-3 border border-slate-200 rounded-xl hover:opacity-90 transition-opacity bg-[#1877F2] cursor-pointer shadow-sm"
              title={t("Facebook")}
            >
              <img src="/images/logos/facebook_logo_white.svg" alt="Facebook" className="h-5" />
            </a>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              {isRegister ? t('O REGÍSTRATE CON TU CORREO') : t('O CONTINÚA CON TU CORREO')}
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Campos de Entrada Estructurados */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Nombre Completo (Solo en Registro) */}
            {isRegister && (
              <div className="space-y-2 animate-fadeIn">
                <label htmlFor="name" className="block text-[11px] font-bold tracking-wider text-[#000033] uppercase">{t("Nombre Completo")}</label>
                <input
                  id="name"
                  ref={nameRef}
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); setError(null); }}
                  onBlur={(e) => setNameError(validateName(e.target.value))}
                  className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm text-slate-900 font-medium bg-[#F8FAFC] transition-all focus:border-[#000033] focus:bg-white ${
                    nameError ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                {nameError && <p className="text-[10px] font-bold text-red-500 mt-1">{nameError}</p>}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2 animate-fadeIn">
              <label htmlFor="email" className="block text-[11px] font-bold tracking-wider text-[#000033] uppercase">{t("Correo electrónico")}</label>
              <input
                id="email"
                ref={emailRef}
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(null); }}
                onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm text-slate-900 font-medium bg-[#F8FAFC] transition-all focus:border-[#000033] focus:bg-white ${
                  emailError ? 'border-red-500' : 'border-slate-200'
                }`}
                disabled={isLoading}
              />
              {emailError && <p className="text-[10px] font-bold text-red-500 mt-1">{emailError}</p>}
            </div>

            {/* Contraseña */}
            <div className="space-y-2 animate-fadeIn">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-[11px] font-bold tracking-wider text-[#000033] uppercase">{t("Contraseña")}</label>
                {!isRegister && (
                  <a href="#" className="text-xs font-semibold text-slate-400 hover:text-[#000033] transition-colors">{t("¿La olvidaste?")}</a>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setError(null); }}
                  onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
                  className={`w-full px-4 py-3.5 rounded-xl border outline-none text-sm text-slate-900 font-medium bg-[#F8FAFC] transition-all focus:border-[#000033] focus:bg-white pr-16 ${
                    passwordError ? 'border-red-500' : 'border-slate-200'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#000033] transition-colors text-[10px] font-bold uppercase select-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? t('Ocultar') : t('Mostrar')}
                </button>
              </div>
              {passwordError && <p className="text-[10px] font-bold text-red-500 mt-1">{passwordError}</p>}
            </div>

            {/* Botón de Conversión Maestro en Verde Lima */}
            <button
              type="submit"
              className="w-full bg-[#ccff00] text-[#000033] font-black py-4 rounded-xl hover:bg-opacity-90 transition-all text-sm uppercase tracking-wider shadow-md shadow-lime-100 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#000033]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isRegister ? t('Registrando...') : t('Autenticando...')}
                </>
              ) : (
                isRegister ? t('Crear cuenta gratis') : t('Ingresar al sistema')
              )}
            </button>
          </form>

          {/* Credenciales Demo */}
          {!isRegister && (
            <div className="pt-8 border-t border-slate-200 space-y-4">
              <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t("Acceso de Prueba Rápido")}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { label: 'Admin', email: 'admin@propio.com.bo', pass: 'admin123' },
                  { label: 'Agente', email: 'agent@propio.com.bo', pass: 'agent123' },
                  { label: 'Propietario', email: 'owner@propio.com.bo', pass: 'owner123' },
                  { label: 'Cliente', email: 'client@propio.com.bo', pass: 'client123' },
                ].map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    className="bg-[#F8FAFC] hover:bg-[#000033] border border-slate-200 rounded-xl px-3.5 py-2 text-[10px] font-bold text-slate-600 hover:text-white transition-all cursor-pointer select-none uppercase tracking-wider"
                    onClick={() => {
                      setEmail(demo.email);
                      setPassword(demo.pass);
                      setEmailError('');
                      setPasswordError('');
                      setError(null);
                    }}
                    disabled={isLoading}
                  >
                    <span className="font-bold text-[#000033] group-hover:text-white">{demo.label}</span> · {demo.email.split('@')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Formulario */}
        <footer className="mt-auto pt-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-center gap-6">
          <a href="#" className="hover:text-[#000033] transition-colors">{t("Privacidad")}</a>
          <a href="#" className="hover:text-[#000033] transition-colors">{t("Términos")}</a>
          <a href="#" className="hover:text-[#000033] transition-colors">{t("Soporte")}</a>
        </footer>
      </div>

      {/* Columna Derecha: Panel de Imagen Corporativa A Color */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-16 text-white overflow-hidden min-h-screen">
        {/* FOTO FAMILIAR DE FONDO A TODO COLOR */}
        <img 
          src="/images/marketing/family_photo_happy.png" 
          alt="Familia feliz" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        
        {/* Máscara translúcida para contraste */}
        <div className="absolute inset-0 bg-[#000033] bg-opacity-70"></div>
        
        <div className="relative z-10 text-xs uppercase tracking-[0.2em] font-bold text-[#ccff00]">
          Bolivia Inmobiliaria Premium
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-6 uppercase text-white">
            El espacio donde comienzan tus historias<span className="text-[#ccff00]">.</span>
          </h2>
          <p className="text-slate-200 text-sm font-medium leading-relaxed">
            Conectamos de forma directa, segura y transparente a compradores con propietarios en todo el territorio nacional. Sin intermediarios, sin comisiones de corretaje y con el respaldo legal que necesitas.
          </p>
        </div>

        <div className="relative z-10 text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
          Cochabamba · Santa Cruz · La Paz
        </div>
      </div>
    </div>
  );
}
