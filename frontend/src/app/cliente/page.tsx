'use client';

/**
 * /cliente
 *
 * Dashboard principal del Cliente (Comprador/Inquilino).
 * Diseñado bajo estética de alto nivel minimalista:
 * - KPIs (Favoritos, Consultas, Ofertas, Reuniones)
 * - Tarjetas interactivas con hover micro-animado.
 * - Tabla de ofertas y solicitudes vigentes.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesService } from '../../services/properties.service';
import { Property } from '../../components/modules/properties/PropertyCard';
import { getCurrentUser, removeToken } from '@/utils/session';

interface LeadRequest {
  id: string;
  propertyTitle: string;
  type: 'Compra' | 'Alquiler';
  status: 'Pendiente' | 'En revisión' | 'Aceptada' | 'Rechazada';
  date: string;
  offerAmount?: number;
}

export default function ClienteDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('Cliente');
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const [requests, setRequests] = useState<LeadRequest[]>([
    {
      id: 'req-1',
      propertyTitle: 'Apartaestudio Moderno en Laureles',
      type: 'Alquiler',
      status: 'En revisión',
      date: '2026-05-21',
      offerAmount: 450,
    },
    {
      id: 'req-2',
      propertyTitle: 'Penthouse de Lujo en Queru Queru',
      type: 'Compra',
      status: 'Pendiente',
      date: '2026-05-22',
      offerAmount: 235000,
    },
  ]);

  useEffect(() => {
    // Guard de Autenticación
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login?redirect=/cliente');
      return;
    }
    if (user.role !== 'CLIENTE' && user.role !== 'ADMIN') {
      router.replace('/');
      return;
    }
    setUserName((user as any).name || user.email?.split('@')[0] || 'Cliente');

    // Cargar propiedades recomendadas/favoritas
    const fetchProps = async () => {
      try {
        setLoading(true);
        const data = await propertiesService.getProperties({ verifiedOnly: true });
        // Simular que las dos primeras son sus favoritas
        setFavorites(data.slice(0, 2));
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProps();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.replace('/');
  };

  const handleCancelRequest = (id: string) => {
    if (confirm('¿Deseas retirar esta solicitud de interés/oferta?')) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans antialiased">

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-10 space-y-10">
        
        {/* ── ENCABEZADO BIENVENIDA ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#04045E]/60">
              Portal del Cliente
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] tracking-tight">
              Hola, {userName} 👋
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Encuentra propiedades, realiza ofertas y gestiona tus citas directamente con los propietarios.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              🔍 Explorar Propiedades
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mis Favoritos</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#04045E]">{favorites.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border font-bold uppercase">Guardados</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ofertas Activas</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">
                {requests.filter(r => r.offerAmount).length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase">Vigentes</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultas Enviadas</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#04045E]">{requests.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase">Procesando</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reuniones Agendadas</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-500">0</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase">Programadas</span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Solicitudes y Ofertas (Izquierda 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                Mis Solicitudes de Interés y Ofertas
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {requests.length} en curso
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {requests.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <span className="text-3xl">✉️</span>
                  <p className="text-xs font-bold text-slate-400 uppercase">Sin solicitudes activas</p>
                  <p className="text-[11px] text-slate-400">Cuando explores y dejes tus datos en un inmueble aparecerán aquí.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Propiedad</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Monto Ofertado</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Estado</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/30 transition-all">
                          <td className="p-4 font-bold text-[#04045E]">{req.propertyTitle}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase text-[9px] border">
                              {req.type}
                            </span>
                          </td>
                          <td className="p-4 font-black">
                            {req.offerAmount ? `$${req.offerAmount.toLocaleString()} USD` : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${
                              req.status === 'Aceptada'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : req.status === 'En revisión'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                req.status === 'Aceptada' ? 'bg-emerald-500' : req.status === 'En revisión' ? 'bg-amber-500' : 'bg-slate-400'
                              }`} />
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              className="p-1 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
                              title="Retirar solicitud"
                            >
                              ✕ Retirar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Favoritos Recomendados (Derecha 1/3) */}
          <div className="space-y-6">
            <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
              Favoritos y Recomendados
            </h2>

            {loading ? (
              <div className="h-48 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04045E]" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                <span className="text-2xl">⭐️</span>
                <p className="text-[11px] text-slate-400">Guarda propiedades favoritas para verlas rápidamente aquí.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all"
                  >
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-20 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                    />
                    <div className="min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-[#04045E] truncate leading-tight">
                          {prop.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{prop.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#04045E]">${prop.price.toLocaleString()} USD</p>
                        <Link
                          href={`/properties?search=${encodeURIComponent(prop.title)}`}
                          className="text-[10px] font-bold text-[#b9fa3c] hover:underline bg-[#04045E] px-2 py-0.5 rounded mt-1 inline-block"
                        >
                          Ver Detalle →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
