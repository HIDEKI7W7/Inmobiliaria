'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getToken, getRedirectPathByRole } from '@/utils/session';

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  googleLinked: boolean;
  alertInstant: boolean;
  allowWhatsAppContact: boolean;
}

export default function ConfigurarCuentaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState('/cliente');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Form states
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    avatarUrl: '',
    googleLinked: true,
    alertInstant: true,
    allowWhatsAppContact: true,
  });

  // Password fields
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    const user = getCurrentUser();
    const activeToken = getToken();

    if (!user || !activeToken) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard/configuracion')}`);
      return;
    }

    setToken(activeToken);
    setRedirectPath(getRedirectPathByRole(user.role));

    // Load initial values from localStorage to support client-side updates, or fallback to JWT
    const stored = localStorage.getItem('propio_profile_custom');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({
          ...prev,
          ...parsed,
          email: user.email, // Email stays read-only from session
        }));
      } catch (err) {
        console.error('Error loading custom settings:', err);
      }
    } else {
      setSettings({
        name: (user as any).name || user.email?.split('@')[0] || 'Cliente Premium',
        email: user.email,
        phone: (user as any).whatsappPhone || '+591 78945612',
        avatarUrl: '',
        googleLinked: true,
        alertInstant: true,
        allowWhatsAppContact: true,
      });
    }
    setLoading(false);
  }, [router]);

  // Handle simple input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  // Save general settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('propio_profile_custom', JSON.stringify(settings));
      
      // Fire success toast
      triggerToast('¡Datos personales actualizados con éxito!');
    } catch (error) {
      console.error(error);
      triggerToast('Error al guardar los datos.');
    }
  };

  // Change password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current) {
      triggerToast('Por favor, ingresa tu contraseña actual.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      triggerToast('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (passwords.new.length < 6) {
      triggerToast('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    triggerToast('¡Contraseña actualizada con éxito!');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  // Unlink Google account
  const handleUnlinkGoogle = () => {
    if (!settings.googleLinked) return;
    if (confirm('¿Estás seguro de que deseas desvincular tu cuenta de Google? Deberás configurar una contraseña local para ingresar la próxima vez.')) {
      setSettings(prev => {
        const updated = { ...prev, googleLinked: false };
        localStorage.setItem('propio_profile_custom', JSON.stringify(updated));
        return updated;
      });
      triggerToast('Cuenta de Google desvinculada. Acceso revocado.');
    }
  };

  // Toggle boolean states
  const handleToggle = (key: 'alertInstant' | 'allowWhatsAppContact') => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('propio_profile_custom', JSON.stringify(updated));
      return updated;
    });
    triggerToast('Preferencia de comunicación actualizada.');
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  // Initials generator
  const getInitials = () => {
    const term = settings.name || settings.email || 'CC';
    const cleanTerm = term.trim().split(/\s+/);
    if (cleanTerm.length >= 2) {
      return `${cleanTerm[0][0]}${cleanTerm[1][0]}`.toUpperCase();
    }
    return term.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans antialiased">
      
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#04045E] text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10 animate-fade-in font-sans">
          <span className="text-lime-400 text-lg">💡</span>
          <span className="text-sm font-bold tracking-tight">{showToast}</span>
        </div>
      )}

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-10 space-y-10">
        
        {/* ── ENCABEZADO ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#04045E]/60">
              Mi Cuenta
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] tracking-tight">
              Configuración de la cuenta
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Administra tu perfil público, credenciales de seguridad y alertas automáticas de WhatsApp al estilo Zillow.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={redirectPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-98"
            >
              ← Volver al Panel
            </Link>
          </div>
        </div>

        {/* ── SECCIÓN DIVIDIDA (GRID DE DOS COLUMNAS) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* COLUMNA IZQUIERDA: MENÚ Y RESUMEN AVATAR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm text-center space-y-6">
              
              {/* Contenedor Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="bg-[#0A4D54] text-white font-black text-2xl rounded-full w-24 h-24 flex items-center justify-center shadow-md select-none border-4 border-white">
                    {getInitials()}
                  </div>
                  <div className="absolute inset-0 bg-[#04045E]/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Cambiar</span>
                  </div>
                </div>
                <h3 className="mt-4 font-black text-lg text-[#04045E] tracking-tight leading-tight">
                  {settings.name}
                </h3>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Usuario Registrado
                </span>
              </div>

              <hr className="border-slate-100" />

              {/* Enlaces de Navegación Dashboard */}
              <nav className="flex flex-col gap-2">
                <Link
                  href="/dashboard/favoritos"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-slate-650 hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide"
                >
                  <span className="text-base">❤️</span> Mis Favoritos
                </Link>
                <Link
                  href="/dashboard/visto-recientemente"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-bold text-slate-650 hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide"
                >
                  <span className="text-base">👁️</span> Visto recientemente
                </Link>
                <Link
                  href="/dashboard/configuracion"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left font-black text-[#04045E] bg-slate-100 transition-colors text-xs uppercase tracking-wide border-r-4 border-[#04045E]"
                >
                  <span className="text-base">⚙️</span> Configuración
                </Link>
              </nav>
            </div>
          </div>

          {/* COLUMNA DERECHA: SECCIONES DE FORMULARIO */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* 1. SECCIÓN: PERFIL Y DATOS PERSONALES */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#04045E] uppercase tracking-tight">
                  1. Perfil y Datos Personales
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Esta información se utiliza para personalizar tu experiencia e interactuar con asesores oficiales.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={settings.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4D54]/20 focus:border-[#0A4D54] transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={settings.email}
                      disabled
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/70 text-slate-400 text-sm cursor-not-allowed font-medium focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Número de Teléfono (Alertas de WhatsApp)
                    </label>
                    <div className="relative rounded-lg shadow-sm">
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={settings.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4D54]/20 focus:border-[#0A4D54] transition-all font-medium"
                        placeholder="+591 XXXXXXXX"
                      />
                    </div>
                    {/* Alerta de WhatsApp Verificado */}
                    <div className="mt-2.5 bg-lime-50/80 border border-lime-200 rounded-2xl p-3.5 flex items-start gap-3">
                      <span className="text-base mt-0.5">💬</span>
                      <div className="space-y-0.5">
                        <span className="block text-xs font-bold text-slate-800">
                          WhatsApp listo para notificaciones
                        </span>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Este número está verificado para recibir notificaciones automáticas y alertas en tiempo real sobre nuevas ofertas inmobiliarias que cumplan con tus intereses.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-98"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>

            {/* 2. SECCIÓN: SEGURIDAD Y CREDENCIALES */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#04045E] uppercase tracking-tight">
                  2. Seguridad y Credenciales
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Actualiza tu contraseña para mantener tu panel a salvo.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="current" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Contraseña Actual
                    </label>
                    <input
                      type="password"
                      id="current"
                      value={passwords.current}
                      onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4D54]/20 focus:border-[#0A4D54] transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="new" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      id="new"
                      value={passwords.new}
                      onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4D54]/20 focus:border-[#0A4D54] transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      id="confirm"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#0A4D54]/20 focus:border-[#0A4D54] transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  {/* Botón de desvincular Google */}
                  {settings.googleLinked ? (
                    <button
                      type="button"
                      onClick={handleUnlinkGoogle}
                      className="inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-750 transition-colors bg-red-50 hover:bg-red-100/70 border border-red-200 px-4 py-2.5 rounded-lg text-left"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.746-.08-1.32-.176-1.886H12.24z"/>
                      </svg>
                      Desvincular cuenta de Google
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                      Cuenta local (Sin vinculación OAuth)
                    </span>
                  )}

                  <button
                    type="submit"
                    className="bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all duration-200 shadow-sm active:scale-98 self-end sm:self-auto"
                  >
                    Actualizar contraseña
                  </button>
                </div>
              </form>
            </div>

            {/* 3. SECCIÓN: PREFERENCIAS DE COMUNICACIÓN (ZILLOW FEED) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-[#04045E] uppercase tracking-tight">
                  3. Preferencias de Comunicación (Zillow Feed)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Controla cómo y cuándo nos comunicamos contigo sobre las propiedades de tu interés.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                
                {/* Interruptor 1 */}
                <div className="flex items-start justify-between gap-6 py-4">
                  <div className="space-y-1">
                    <span className="block text-sm font-bold text-slate-800 leading-tight">
                      Alertas instantáneas de búsqueda
                    </span>
                    <p className="text-xs text-slate-450 leading-relaxed font-medium">
                      Recibir alertas instantáneas cuando aparezcan propiedades nuevas en mis zonas favoritas.
                    </p>
                  </div>
                  
                  {/* Stateful Custom Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle('alertInstant')}
                    className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors duration-300 outline-none ${
                      settings.alertInstant ? 'bg-[#0A4D54]' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.alertInstant ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Interruptor 2 */}
                <div className="flex items-start justify-between gap-6 py-4">
                  <div className="space-y-1">
                    <span className="block text-sm font-bold text-slate-800 leading-tight">
                      Asesores directos de WhatsApp
                    </span>
                    <p className="text-xs text-slate-450 leading-relaxed font-medium">
                      Permitir que los asesores certificados de Propio me contacten directamente vía WhatsApp.
                    </p>
                  </div>

                  {/* Stateful Custom Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle('allowWhatsAppContact')}
                    className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors duration-300 outline-none ${
                      settings.allowWhatsAppContact ? 'bg-[#0A4D54]' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                        settings.allowWhatsAppContact ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
