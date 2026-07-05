'use client';

import { useState, useEffect } from 'react';
import { getToken, getCurrentUser } from '@/utils/session';
import Link from 'next/link';

interface PropertyAlertFormProps {
  defaultZona?: string;
  defaultType?: string;
  defaultMaxPrice?: number;
  onSuccess?: () => void;
}

const PROPERTY_TYPES = [
  { value: 'CASA', label: '🏠 Casa' },
  { value: 'DEPARTAMENTO', label: '🏢 Departamento' },
  { value: 'TERRENO', label: '🌱 Terreno' },
  { value: 'OFICINA', label: '💼 Oficina' },
];

const POPULAR_ZONES = ['Cala Cala', 'Queru Queru', 'El Prado', 'Sarco', 'Mayorazgo', 'Muyurina'];

export function PropertyAlertForm({
  defaultZona = '',
  defaultType = 'DEPARTAMENTO',
  defaultMaxPrice = 200000,
  onSuccess,
}: PropertyAlertFormProps) {
  const [zona, setZona] = useState(defaultZona);
  const [tipoInmueble, setTipoInmueble] = useState(defaultType);
  const [precioMax, setPrecioMax] = useState(defaultMaxPrice);
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getCurrentUser() as any;
    if (token && user) {
      setIsAuthenticated(true);
      setEmail(user.email || '');
      setWhatsappPhone(user.whatsappPhone || user.phone || '');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('Debes iniciar sesión para activar alertas.');
      return;
    }
    if (!zona.trim()) {
      setError('Selecciona o escribe una zona de interés.');
      return;
    }
    if (precioMax <= 0) {
      setError('El precio máximo debe ser mayor a 0.');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!whatsappPhone.trim()) {
      setError('El número de WhatsApp es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = getToken();

      const res = await fetch(`${API}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          zona: zona.trim(),
          precioMax,
          tipoInmueble,
          email: email.trim(),
          whatsappPhone: whatsappPhone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear la alerta');
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      // Guardar en localStorage como fallback
      localStorage.setItem(`pending_alert_${Date.now()}`, JSON.stringify({ zona, precioMax, tipoInmueble, email, whatsappPhone }));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#000033]/5 border border-[#000033]/10 rounded-2xl p-6 text-center space-y-4">
        <div className="text-3xl">🔒</div>
        <h3 className="font-heading font-bold text-[#000033] text-sm uppercase tracking-wider">
          Inicio de sesión obligatorio
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Para suscribirte a alertas de búsqueda y recibir avisos instantáneos de propiedades en tu WhatsApp, debes ingresar o registrarte.
        </p>
        <div className="pt-2">
          <Link
            href={`/login?redirect=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '/properties'}`}
            className="inline-block bg-[#000033] hover:bg-[#000044] text-white font-sans font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-[0.98]"
          >
            Ingresar / Registrarse
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-[#ccff00]/10 border border-[#ccff00]/25 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🔔</div>
        <h3 className="font-heading font-bold text-[#000033] text-lg mb-1">¡Alerta activada!</h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          Te notificaremos a <strong>{email}</strong> y al WhatsApp <strong>{whatsappPhone}</strong> cuando aparezca una propiedad en <strong>{zona}</strong> por menos de <strong>Bs. {precioMax.toLocaleString()}</strong>.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-xs text-slate-400 hover:text-[#000033] transition-colors underline"
        >
          Crear otra alerta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Zona */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          Zona de interés
        </label>
        <input
          type="text"
          list="zonas-list"
          placeholder="Ej: Cala Cala, Queru Queru..."
          value={zona}
          onChange={e => setZona(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#000033] focus:ring-2 focus:ring-[#000033]/10 transition-all font-sans"
        />
        <datalist id="zonas-list">
          {POPULAR_ZONES.map(z => <option key={z} value={z} />)}
        </datalist>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {POPULAR_ZONES.slice(0, 4).map(z => (
            <button
              key={z}
              type="button"
              onClick={() => setZona(z)}
              className={`text-[10px] px-2.5 py-1 rounded-full transition-all font-bold ${zona === z ? 'bg-[#000033] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
          Tipo de inmueble
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipoInmueble(t.value)}
              className={`flex items-center gap-2 text-xs py-2 px-3 rounded-xl border-2 transition-all ${
                tipoInmueble === t.value
                  ? 'border-[#000033] bg-[#000033]/5 text-[#000033] font-bold'
                  : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Precio máximo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Precio máximo
          </label>
          <span className="font-heading font-black text-[#000033] text-sm">
            Bs. {precioMax.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min={100000}
          max={8000000}
          step={50000}
          value={precioMax}
          onChange={e => setPrecioMax(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-[#000033] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>Bs. 100K</span>
          <span>Bs. 8M</span>
        </div>
      </div>

      {/* Email y Teléfono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Tu Correo
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#000033] focus:ring-2 focus:ring-[#000033]/10 transition-all font-sans"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            WhatsApp / Teléfono
          </label>
          <input
            type="tel"
            placeholder="Ej: 71234567"
            value={whatsappPhone}
            onChange={e => setWhatsappPhone(e.target.value)}
            required
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:border-[#000033] focus:ring-2 focus:ring-[#000033]/10 transition-all font-sans"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#000033] hover:bg-[#000044] text-white font-sans font-bold py-3 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        )}
        {loading ? 'Activando alerta...' : 'Activar alerta de búsqueda'}
      </button>

      <p className="text-center text-slate-400 text-[9px] uppercase tracking-wider font-bold">
        Recibe alertas en tiempo real directo en tu WhatsApp.
      </p>
    </form>
  );
}
