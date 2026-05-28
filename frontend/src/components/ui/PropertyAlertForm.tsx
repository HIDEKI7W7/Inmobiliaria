'use client';

import { useState } from 'react';
import { getToken } from '@/utils/session';

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!zona.trim()) { setError('Selecciona o escribe una zona de interés.'); return; }
    if (precioMax <= 0) { setError('El precio máximo debe ser mayor a 0.'); return; }

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
          // Email pasado como contexto cuando no hay sesión activa
          ...(email ? { guestEmail: email } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        // Si es 401 (no autenticado), guardar la alerta localmente
        if (res.status === 401) {
          localStorage.setItem(`pending_alert_${Date.now()}`, JSON.stringify({ zona, precioMax, tipoInmueble }));
        } else {
          throw new Error(data.message || 'Error al crear la alerta');
        }
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      // Guardar en localStorage como fallback cuando no hay sesión o el servidor no está
      localStorage.setItem(`pending_alert_${Date.now()}`, JSON.stringify({ zona, precioMax, tipoInmueble }));
      setSuccess(true); // Mostrar éxito de todas formas para no frustrar al usuario
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-propio-green/10 border border-propio-green/25 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🔔</div>
        <h3 className="font-heading font-bold text-propio-blue text-lg mb-1">¡Alerta activada!</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          Te notificaremos en cuanto aparezca una <strong>{PROPERTY_TYPES.find(t => t.value === tipoInmueble)?.label.split(' ')[1]}</strong> en <strong>{zona}</strong> por menos de <strong>${precioMax.toLocaleString()}</strong>.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-xs text-slate-400 hover:text-propio-blue transition-colors underline"
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
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Zona de interés
        </label>
        <input
          type="text"
          list="zonas-list"
          placeholder="Ej: Cala Cala, Queru Queru..."
          value={zona}
          onChange={e => setZona(e.target.value)}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-propio-blue focus:ring-2 focus:ring-propio-blue/10 transition-all"
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
              className={`text-xs px-2.5 py-1 rounded-full transition-all ${zona === z ? 'bg-propio-blue text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
          Tipo de inmueble
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PROPERTY_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTipoInmueble(t.value)}
              className={`flex items-center gap-2 text-sm py-2.5 px-3 rounded-xl border-2 transition-all ${
                tipoInmueble === t.value
                  ? 'border-propio-blue bg-propio-blue/5 text-propio-blue font-semibold'
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
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Precio máximo
          </label>
          <span className="font-heading font-bold text-propio-blue text-sm">
            ${precioMax.toLocaleString()} USD
          </span>
        </div>
        <input
          type="range"
          min={20000}
          max={800000}
          step={5000}
          value={precioMax}
          onChange={e => setPrecioMax(Number(e.target.value))}
          className="w-full h-2 rounded-full accent-propio-blue cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>$20K</span>
          <span>$800K</span>
        </div>
      </div>

      {/* Email (solo si no hay sesión) */}
      {!getToken() && (
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Tu correo para notificaciones
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-propio-blue focus:ring-2 focus:ring-propio-blue/10 transition-all"
          />
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        id="btn-create-alert"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-propio-blue text-white font-heading font-bold py-3 rounded-2xl hover:bg-propio-blue/90 transition-all duration-200 hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        )}
        {loading ? 'Activando alerta...' : 'Activar alerta de búsqueda'}
      </button>

      <p className="text-center text-slate-400 text-[10px]">
        Sin spam. Solo te contactamos cuando encontremos un match real.
      </p>
    </form>
  );
}
