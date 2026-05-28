'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#0b0b0f] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 via-transparent to-emerald-500/10 pointer-events-none" />
        <div className="mx-auto mb-6 h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30 animate-pulse">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">Cargando Simulador...</h1>
        <p className="mt-2 text-sm text-slate-400">
          Preparando entorno de desarrollo seguro de Propio.
        </p>
      </div>
    </main>
  );
}

function SimulatorForm() {
  const searchParams = useSearchParams();
  const rawProvider = searchParams.get('provider') || 'GOOGLE';
  const errorParam = searchParams.get('error');
  
  const provider = rawProvider.toUpperCase();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  // Generar datos aleatorios sugeridos al cargar
  useEffect(() => {
    const firstNames = ['Carlos', 'Mariana', 'Alejandro', 'Sofia', 'Rodrigo', 'Valeria', 'Daniel'];
    const lastNames = ['Mendoza', 'Siles', 'Vargas', 'Rojas', 'Guzman', 'Pinto', 'Flores'];
    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    setName(`${randomFirst} ${randomLast}`);
    setEmail(`${randomFirst.toLowerCase()}.${randomLast.toLowerCase()}@propio-dev.com`);
  }, []);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const actionUrl = `${apiBaseUrl}/auth/social-mock`;

  // Colores de acento según proveedor
  const getProviderTheme = () => {
    switch (provider) {
      case 'FACEBOOK':
        return {
          bg: 'bg-blue-600/10 border-blue-500/30 text-blue-400',
          hoverBg: 'hover:bg-blue-600',
          btnBg: 'bg-blue-600 text-white',
          glow: 'shadow-blue-500/10',
          logo: (
            <svg className="h-6 w-6 text-blue-500 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )
        };
      case 'APPLE':
        return {
          bg: 'bg-slate-200/10 border-slate-300/30 text-slate-200',
          hoverBg: 'hover:bg-slate-100 hover:text-slate-900',
          btnBg: 'bg-slate-100 text-slate-900',
          glow: 'shadow-slate-500/10',
          logo: (
            <svg className="h-6 w-6 text-slate-100 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.52-.62.72-1.16 1.86-1.01 2.98 1.1.08 2.23-.62 2.94-1.44z" />
            </svg>
          )
        };
      case 'GOOGLE':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          hoverBg: 'hover:bg-emerald-500 hover:text-slate-900',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900',
          glow: 'shadow-emerald-500/20',
          logo: (
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.414 0-6.19-2.775-6.19-6.19 0-3.414 2.776-6.19 6.19-6.19 1.56 0 2.977.586 4.062 1.543l3.056-3.057C19.124 2.058 15.92 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.333 0 10.533-4.453 10.533-10.715 0-.727-.08-1.272-.2-1.715h-10.33z" />
            </svg>
          )
        };
    }
  };

  const theme = getProviderTheme();

  return (
    <main className="min-h-screen bg-[#0b0b0f] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Luces de gradiente de fondo */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[128px] pointer-events-none" />

      <div className={`w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${theme.glow}`}>
        
        {/* Línea decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-emerald-500 to-transparent" />

        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-slate-800/80 flex items-center justify-center border border-slate-700/80 shadow-inner">
            {theme.logo}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">
            Simulador de Acceso Social
          </h1>
          <p className="mt-1 text-xs font-semibold text-violet-400 uppercase tracking-widest">
            Entorno de Desarrollo Seguro
          </p>
        </div>

        {errorParam && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-medium leading-relaxed">
            ⚠️ Ocurrió un error en el inicio OAuth real. El backend te redirigió automáticamente al simulador para no bloquear tu flujo de desarrollo.
          </div>
        )}

        {/* Explicación de simulación */}
        <div className="mb-6 p-4 rounded-2xl border border-slate-800 bg-slate-950/40 text-slate-300 text-xs leading-relaxed">
          <span className="font-bold text-slate-200">DevMode Activo:</span> Hemos detectado que no posees credenciales de <span className="font-bold text-slate-200">{provider}</span> configuradas. Para evitar errores de conexión externa, puedes simular el login a continuación.
        </div>

        {/* Formulario que hace POST directo al backend */}
        <form action={actionUrl} method="POST" className="space-y-4">
          {/* Campos ocultos requeridos por el backend */}
          <input type="hidden" name="provider" value={provider} />
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Nombre Completo Simulado
            </label>
            <input
              type="text"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Juan Pérez"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico Simulado
            </label>
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-300 text-sm"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 mt-2 shadow-lg ${theme.btnBg} ${theme.hoverBg}`}
          >
            Continuar con {provider.charAt(0) + provider.slice(1).toLowerCase()} Simulador
          </button>
        </form>

        {/* Botón Acordeón de Configuración */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="w-full text-slate-400 hover:text-slate-200 text-xs font-bold flex items-center justify-between transition-colors duration-200 focus:outline-none"
          >
            <span>🛠️ ¿CÓMO CONFIGURAR LLAVES REALES?</span>
            <span>{showConfigGuide ? '▲' : '▼'}</span>
          </button>

          {showConfigGuide && (
            <div className="mt-4 text-left space-y-3 animate-fadeIn">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Si deseas probar el flujo oficial con los servidores reales de Google o Facebook, edita el archivo <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">backend/.env</code> e inyecta tus credenciales auténticas:
              </p>
              <pre className="p-3 bg-slate-950/80 border border-slate-800/60 rounded-xl text-[10px] text-slate-300 font-mono overflow-x-auto leading-normal">
{`# Google OAuth
GOOGLE_CLIENT_ID="tu-client-id-real.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-secreto-real"

# Facebook OAuth
FACEBOOK_APP_ID="tu-app-id-real"
FACEBOOK_APP_SECRET="tu-app-secret-real"`}
              </pre>
              <p className="text-[10px] text-violet-400 italic">
                Nota: Al ingresar llaves reales (que no inicien con la palabra "mock-"), el sistema desactivará el simulador automáticamente y cargará la pasarela OAuth oficial.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Enlace para volver */}
      <a
        href="/login"
        className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200 font-semibold"
      >
        ← Regresar a la pantalla de ingreso
      </a>
    </main>
  );
}

export default function SocialSimulatorPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SimulatorForm />
    </Suspense>
  );
}
