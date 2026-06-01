'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getToken, getRedirectPathByRole, removeToken } from '@/utils/session';

interface UserSettings {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  avatarUrl: string;
  googleLinked: boolean;
  alertInstant: boolean;
  allowWhatsAppContact: boolean;
  status: string;
}

export default function ConfigurarCuentaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState('/cliente');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Form states & editing toggles
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    name: '',
    nickname: '',
    email: '',
    phone: '',
    avatarUrl: '',
    googleLinked: true,
    alertInstant: true,
    allowWhatsAppContact: true,
    status: 'ACTIVE',
  });

  // Edit toggles
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit fields values
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

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

    // Load initial settings
    const initialSettings = {
      id: (user as any).id || '',
      name: (user as any).name || '',
      nickname: (user as any).nickname || user.email?.split('@')[0] || 'Nickname',
      email: user.email || '',
      phone: (user as any).whatsappPhone || '',
      avatarUrl: (user as any).avatarUrl || '',
      googleLinked: (user as any).authProvider === 'GOOGLE' || true,
      alertInstant: true,
      allowWhatsAppContact: true,
      status: (user as any).status || 'ACTIVE',
    };
    
    setSettings(initialSettings);
    setEditName(initialSettings.name);
    setEditNickname(initialSettings.nickname);
    setEditEmail(initialSettings.email);
    setEditPhone(initialSettings.phone);
    
    setLoading(false);
  }, [router]);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setShowToast(msg);
    setToastType(type);
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  // Profile update requester
  const handleUpdateProfileField = async (field: keyof UserSettings, value: string) => {
    if (!token) return;
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      
      const payload: Record<string, string> = {};
      if (field === 'name') payload.name = value;
      if (field === 'nickname') payload.nickname = value;
      if (field === 'phone') payload.whatsappPhone = value;
      if (field === 'avatarUrl') payload.avatarUrl = value;
      if (field === 'email') payload.email = value;

      const res = await fetch(`${apiBaseUrl}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          nickname: data.user.nickname || prev.nickname,
          phone: data.user.whatsappPhone || prev.phone,
          avatarUrl: data.user.avatarUrl || prev.avatarUrl,
          email: data.user.email || prev.email,
        }));
        
        // Update user session cookie/localStorage
        const existingUser = getCurrentUser();
        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            name: data.user.name || (existingUser as any).name,
            nickname: data.user.nickname || (existingUser as any).nickname,
            whatsappPhone: data.user.whatsappPhone || (existingUser as any).whatsappPhone,
            avatarUrl: data.user.avatarUrl || (existingUser as any).avatarUrl,
            email: data.user.email || existingUser.email,
          };
          const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
          document.cookie = `propio_user=${encodeURIComponent(JSON.stringify(updatedUser))}; Path=/; Max-Age=604800; SameSite=Strict${secure}`;
        }

        triggerToast('¡Información guardada con éxito!', 'success');
      } else {
        triggerToast('Error al actualizar la información en el servidor.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error de red. Intenta de nuevo.', 'error');
    }
  };

  // Image Upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSettings(prev => ({ ...prev, avatarUrl: base64String }));
        handleUpdateProfileField('avatarUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Change password handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.current) {
      triggerToast('Por favor, ingresa tu contraseña actual.', 'error');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      triggerToast('La nueva contraseña y su confirmación no coinciden.', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      triggerToast('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      if (res.ok) {
        triggerToast('¡Contraseña actualizada con éxito!', 'success');
        setPasswords({ current: '', new: '', confirm: '' });
        setShowPasswordModal(false);
      } else {
        const data = await res.json();
        triggerToast(data.message || 'La contraseña actual es incorrecta.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error de red al actualizar contraseña.', 'error');
    }
  };

  // Unlink Google OAuth Account
  const handleUnlinkGoogle = async () => {
    if (!confirm('¿Estás seguro de que deseas desvincular tu cuenta de Google? Deberás configurar una contraseña local para ingresar la próxima vez.')) {
      return;
    }
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBaseUrl}/auth/unlink-google`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setSettings(prev => ({ ...prev, googleLinked: false }));
        triggerToast('Cuenta de Google desvinculada exitosamente.', 'success');
      } else {
        triggerToast('Error al desvincular la cuenta de Google.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error de red. Intenta de nuevo.', 'error');
    }
  };

  // Deactivate Account logical suspension
  const handleDeactivateAccount = async () => {
    if (!confirm('¿Realmente deseas desactivar tu cuenta? Esta acción suspenderá tu acceso a la plataforma de forma temporal pero segura.')) {
      return;
    }
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBaseUrl}/auth/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        triggerToast('Cuenta desactivada de forma lógica. Cerrando sesión...', 'info');
        setTimeout(() => {
          removeToken();
          router.push('/login');
        }, 2500);
      } else {
        triggerToast('Error al desactivar la cuenta.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error de red al desactivar cuenta.', 'error');
    }
  };

  // Toggle dynamic notification properties
  const handleToggle = (key: 'alertInstant' | 'allowWhatsAppContact') => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      triggerToast('Preferencia de comunicación actualizada.', 'success');
      return updated;
    });
  };

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
        <div className={`fixed bottom-6 right-6 z-50 text-white px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border animate-fade-in font-sans ${
          toastType === 'success' ? 'bg-lime-600 border-lime-500/20' :
          toastType === 'error' ? 'bg-red-600 border-red-500/20' : 'bg-blue-600 border-blue-500/20'
        }`}>
          <span className="text-lg">{toastType === 'success' ? '✔' : toastType === 'error' ? '✖' : '💡'}</span>
          <span className="text-sm font-bold tracking-tight">{showToast}</span>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 sm:px-8 py-10 space-y-8">
        
        {/* ── ENCABEZADO ZILLOW STYLE ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
              Configuración de la cuenta
            </h1>
            <p className="text-sm text-neutral-500 font-normal">
              Administra la configuración del perfil de tu cuenta en Propio.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={redirectPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-98"
            >
              ← Volver al Panel
            </Link>
          </div>
        </div>

        <div className="space-y-12">

          {/* ────────────────── SECCIÓN A: INFORMACIÓN PERSONAL ────────────────── */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-[#04045E] uppercase tracking-tight">
                Información personal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Administra tu nombre público, foto de perfil y reputación como asesor o cliente.
              </p>
            </div>

            <div className="space-y-6">
              
              {/* Campo: Foto de perfil circular interactivo */}
              <div className="flex flex-col sm:flex-row items-center gap-6 py-4">
                <div className="relative group cursor-pointer w-24 h-24">
                  {settings.avatarUrl ? (
                    <img
                      src={settings.avatarUrl}
                      alt={settings.name}
                      className="rounded-full w-24 h-24 object-cover shadow-md border-4 border-white"
                    />
                  ) : (
                    <div className="bg-[#0A4D54] text-white font-black text-2xl rounded-full w-24 h-24 flex items-center justify-center shadow-md border-4 border-white select-none">
                      {getInitials()}
                    </div>
                  )}
                  <label htmlFor="avatarFile" className="absolute inset-0 bg-[#04045E]/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-1">
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Subir foto</span>
                    <input
                      type="file"
                      id="avatarFile"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-slate-800">Foto de perfil</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Sube una foto clara en formato JPG o PNG. Se mostrará en tu perfil de asesor y cuando contactes propietarios.
                  </p>
                </div>
              </div>

              <hr className="border-slate-150" />

              {/* Campo: Nombre */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5 flex-1">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre</span>
                  {isEditingName ? (
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                        placeholder="Primer y último nombre"
                      />
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          handleUpdateProfileField('name', editName);
                        }}
                        className="px-3 py-1.5 bg-[#006AFF] hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wide cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-slate-800">
                      {settings.name || 'No configurado'}
                    </span>
                  )}
                </div>
                {!isEditingName && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-xs font-bold text-[#006AFF] hover:underline cursor-pointer focus:outline-none"
                  >
                    Editar
                  </button>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Campo: Nombre de pantalla */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5 flex-1">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nombre de pantalla</span>
                  {isEditingNickname ? (
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                        placeholder="Nickname público"
                      />
                      <button
                        onClick={() => {
                          setIsEditingNickname(false);
                          handleUpdateProfileField('nickname', editNickname);
                        }}
                        className="px-3 py-1.5 bg-[#006AFF] hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wide cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-slate-800">
                      {settings.nickname}
                    </span>
                  )}
                </div>
                {!isEditingNickname && (
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="text-xs font-bold text-[#006AFF] hover:underline cursor-pointer focus:outline-none"
                  >
                    Editar
                  </button>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Campo: Teléfono */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5 flex-1">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Teléfono de alertas</span>
                  {isEditingPhone ? (
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                        placeholder="+591 XXXXXXXX"
                      />
                      <button
                        onClick={() => {
                          setIsEditingPhone(false);
                          handleUpdateProfileField('phone', editPhone);
                        }}
                        className="px-3 py-1.5 bg-[#006AFF] hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wide cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-slate-800">
                      {settings.phone || 'No configurado'}
                    </span>
                  )}
                </div>
                {!isEditingPhone && (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs font-bold text-[#006AFF] hover:underline cursor-pointer focus:outline-none"
                  >
                    Editar
                  </button>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Campo: Reseñas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 bg-neutral-50 p-4 rounded-2xl">
                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reseñas profesionales</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-500 text-base">★★★★★</div>
                    <span className="text-sm font-extrabold text-neutral-850">5.0 (Excelente reputación)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerToast('Tus opiniones están verificadas y seguras.', 'info')}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-650 hover:bg-slate-50 transition-all uppercase tracking-wide shadow-sm"
                >
                  Gestionar opiniones
                </button>
              </div>

            </div>
          </section>

          {/* ────────────────── SECCIÓN B: INICIAR SESIÓN Y SEGURIDAD ────────────────── */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-[#04045E] uppercase tracking-tight">
                Iniciar sesión y seguridad
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Administra tus credenciales de acceso, verificación en dos pasos y cuentas vinculadas.
              </p>
            </div>

            <div className="space-y-6">
              
              {/* Campo: Correo electrónico */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5 flex-1">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Correo electrónico</span>
                  {isEditingEmail ? (
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                      />
                      <button
                        onClick={() => {
                          setIsEditingEmail(false);
                          handleUpdateProfileField('email', editEmail);
                        }}
                        className="px-3 py-1.5 bg-[#006AFF] hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wide cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-black text-slate-800">
                      {settings.email}
                    </span>
                  )}
                </div>
                {!isEditingEmail && (
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-xs font-bold text-[#006AFF] hover:underline cursor-pointer focus:outline-none"
                  >
                    Editar
                  </button>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Campo: Contraseña */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contraseña</span>
                  <span className="text-sm font-medium text-slate-400">••••••••••••</span>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs uppercase tracking-wide rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Cambiar contraseña
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Campo: 2FA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verificación en dos pasos (2FA)</span>
                  <span className="text-xs text-slate-450 leading-relaxed font-semibold block max-w-md">
                    Protege tu cuenta con un nivel adicional de seguridad. Al iniciar sesión se solicitará un código único.
                  </span>
                </div>
                <button
                  onClick={() => triggerToast('Configuración avanzada disponible pronto.', 'info')}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs uppercase tracking-wide rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Configurar
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Campo: Iniciar sesión en Google */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Iniciar sesión con Google</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${settings.googleLinked ? 'bg-lime-500' : 'bg-slate-350'}`} />
                    <span className="text-sm font-extrabold text-neutral-850">
                      {settings.googleLinked ? 'Cuenta de Google Vinculada' : 'No vinculada'}
                    </span>
                  </div>
                </div>
                {settings.googleLinked && (
                  <button
                    onClick={handleUnlinkGoogle}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs uppercase tracking-wide rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    Unlink
                  </button>
                )}
              </div>

            </div>
          </section>

          {/* ────────────────── SECCIÓN C: ADMINISTRAR CUENTA ────────────────── */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-red-650 uppercase tracking-tight">
                Administrar cuenta
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configura tus opciones de privacidad y el estado permanente de tu cuenta en la red de Propio.
              </p>
            </div>

            <div className="space-y-6">
              
              {/* Utilidad 1: Desactiva mi cuenta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5 max-w-md">
                  <span className="block text-sm font-bold text-slate-800 leading-tight">Desactivar mi cuenta</span>
                  <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                    Esta acción suspenderá de forma temporal tu perfil, ocultando tus publicaciones y deteniendo todas tus alertas de WhatsApp de forma lógica.
                  </p>
                </div>
                <button
                  onClick={handleDeactivateAccount}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Desactivar cuenta
                </button>
              </div>

              <hr className="border-slate-100" />

              {/* Utilidad 2: Privacidad y cookies */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
                <div className="space-y-0.5">
                  <span className="block text-sm font-bold text-slate-800 leading-tight">Políticas de Privacidad & Cookies</span>
                  <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                    Conoce detalladamente cómo protegemos tu información personal y cómo manejamos tus datos inmobiliarios en Bolivia.
                  </p>
                </div>
                <Link
                  href="/ayuda"
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold text-xs uppercase tracking-wide rounded-xl transition-all shadow-sm text-center"
                >
                  Ver políticas
                </Link>
              </div>

            </div>
          </section>

        </div>

      </main>

      {/* ─── MODAL DE CAMBIO DE CONTRASEÑA ─── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 max-w-md w-full p-6 sm:p-8 space-y-6 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-tight">Cambiar contraseña</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-neutral-400 hover:text-neutral-600 font-extrabold text-lg focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Contraseña actual</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-350 rounded-xl text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nueva contraseña</label>
                <input
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-350 rounded-xl text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-350 rounded-xl text-sm font-medium focus:outline-none focus:border-[#006AFF]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-md cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
