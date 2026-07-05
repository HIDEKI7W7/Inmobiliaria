'use client';

/**
 * /cliente
 *
 * Dashboard principal del Cliente (Comprador/Inquilino).
 * Diseñado bajo estética de alto nivel minimalista:
 * - KPIs (Intereses, Ofertas, Consultas, Reuniones)
 * - Sección "MIS INTERESES" unificada (Favoritos + Contactados)
 * - Barra lateral "RECOMENDADOS" (Haversine < 3km y misma categoría)
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Property } from '../../components/modules/properties/PropertyCard';
import { getCurrentUser, removeToken, getToken } from '@/utils/session';
import { apiClient } from '@/services/api.client';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';
import { useFavorites } from '@/context/FavoritesContext';

export default function ClienteDashboard() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const [userName, setUserName] = useState('Cliente');
  const [interests, setInterests] = useState<Property[]>([]);
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [recentlyViewedCount, setRecentlyViewedCount] = useState(0);
  const [stats, setStats] = useState({
    savedSearchesCount: 0,
    activeOffersCount: 0,
    sentInquiriesCount: 0,
    scheduledMeetingsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]); // Detalle de Consultas y Ofertas vacio o mock

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

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (token) {
          const res = await apiClient.getWithAuth<any>('/dashboard/client/dashboard', token);
          setInterests(res.interests || []);
          setRecommendations(res.recommendations || []);
          setStats(res.stats || {
            savedSearchesCount: 0,
            activeOffersCount: 0,
            sentInquiriesCount: 0,
            scheduledMeetingsCount: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // ── Contador "Visto Recientemente" con purga de IDs huérfanos ──
    try {
      const raw = localStorage.getItem('propio_client_recently_viewed');
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        const validIds = ids.filter(id => ALL_REAL_PROPERTIES.some(p => p.id === id));
        if (validIds.length !== ids.length) {
          // Sobreescribir con la lista limpia
          localStorage.setItem('propio_client_recently_viewed', JSON.stringify(validIds));
        }
        setRecentlyViewedCount(validIds.length);
      }
    } catch (_) {}
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      removeToken();
      router.replace('/');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      removeToken();
      router.replace('/');
    }
  };

  const handleCancelRequest = (id: string) => {
    if (confirm('¿Deseas retirar esta solicitud?')) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const deletedStored = typeof window !== 'undefined' ? localStorage.getItem('propio_admin_deleted_properties') : null;
  const deletedIds: string[] = deletedStored ? JSON.parse(deletedStored) : [];

  // Favoritos validados: cruzar el contexto con ALL_REAL_PROPERTIES y purgar eliminados
  const validatedFavorites = favorites.filter(
    fav => ALL_REAL_PROPERTIES.some(p => String(p.id) === String(fav.id)) && !deletedIds.includes(fav.id)
  );

  // combinedInterests: usa favoritos validados si interests está vacío (NO fallback al slice)
  const combinedInterests = (interests && interests.length > 0 ? interests : validatedFavorites)
    .filter(i => ALL_REAL_PROPERTIES.some(p => String(p.id) === String(i.id)) && !deletedIds.includes(i.id))
    .map(i => {
      const real = ALL_REAL_PROPERTIES.find(p => String(p.id) === String(i.id));
      return real ? { ...i, ...real } : i;
    });
  const finalSidebarItems = (recommendations && recommendations.length > 0 ? recommendations : ALL_REAL_PROPERTIES.slice(3, 6))
    .filter(r => ALL_REAL_PROPERTIES.some(p => String(p.id) === String(r.id)) && !deletedIds.includes(r.id))
    .map(r => {
      const real = ALL_REAL_PROPERTIES.find(p => String(p.id) === String(r.id));
      return real ? { ...r, ...real } : r;
    });
  const showFeatured = false;


  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans antialiased">
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-10 space-y-10">
        
        {/* ── ENCABEZADO BIENVENIDA ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-8 !bg-[#0B1354] text-white rounded-2xl shadow-md border-none">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
              Portal del Cliente
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hola, {userName} 👋
            </h1>
            <p className="text-sm text-white/80 font-medium font-sans">
              Gestiona tus propiedades de interés, revisa recomendaciones cercanas y coordina visitas directas.
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 !bg-[#D4FF00] hover:!bg-[#c2eb00] !text-slate-900 font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              🔍 Explorar Propiedades
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 !bg-white/10 hover:!bg-white/20 border !border-white/20 !text-white font-bold uppercase tracking-wider rounded-xl transition-all"
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
              <span className="text-3xl font-black text-[#04045E]">{validatedFavorites.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border font-bold uppercase">Guardados</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ofertas Activas</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">
                {stats.activeOffersCount}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase">Vigentes</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultas Enviadas</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#04045E]">{stats.sentInquiriesCount}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase">Procesando</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reuniones Agendadas</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-500">{stats.scheduledMeetingsCount}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase">Programadas</span>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MIS INTERESES (Izquierda 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                Mis Intereses
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {combinedInterests.length} propiedad{combinedInterests.length !== 1 ? 'es' : ''}
              </span>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="h-48 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04045E]" />
                </div>
              ) : combinedInterests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-5 shadow-sm">
                  <div className="w-16 h-16 mx-auto bg-[#ccff00]/25 text-[#000033] rounded-full flex items-center justify-center text-3xl border border-[#ccff00]/40">
                    🔍
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-heading font-black text-[#04045E] uppercase tracking-wide">
                      ¿Buscas el hogar de tus sueños?
                    </h3>
                    <p className="text-xs font-sans font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Aún no tienes búsquedas guardadas.
                    </p>
                  </div>
                  <div>
                    <Link
                      href="/properties"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#b9fa3c] hover:bg-[#adf02c] text-[#04045E] font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-md shadow-[#b9fa3c]/20"
                    >
                      🔍 Explorar Propiedades
                    </Link>
                  </div>
                </div>
              ) : (
                combinedInterests.map((prop) => {
                  const formattedPrice = (prop as any).currency === 'USD'
                    ? `$${(prop.price || 0).toLocaleString('en-US')} USD`
                    : `${((prop as any).priceBob || (prop.price * 9.76)).toLocaleString('es-BO')} Bs.`;
                  return (
                    <div
                      key={prop.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <img
                          src={prop.imageUrl || prop.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                          alt={prop.title}
                          className="w-16 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                        />
                        <div className="space-y-1">
                          {/* Nombre */}
                          <h4 className="text-xs font-black text-[#04045E] uppercase tracking-tight">
                            {prop.title}
                          </h4>
                          {/* Tipo de transacción y Categoría */}
                          <div className="flex gap-1.5 items-center mt-1">
                            <span className="text-[7px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {prop.offerType}
                            </span>
                            <span className="text-[7px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                              {prop.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Precio Final y Acción */}
                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="sm:text-right">
                          <p className="text-sm font-black text-[#04045E]">
                            {formattedPrice}
                          </p>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                            Precio de Lista
                          </span>
                        </div>
                        <Link
                          href={`/properties/${prop.id}`}
                          className="text-[9px] font-black uppercase bg-[#b9fa3c] text-[#04045E] px-3 py-1.5 rounded-lg hover:brightness-95 transition-all mt-2"
                        >
                          Ver Ficha →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Historial de Propuestas / Solicitudes */}
            <div className="pt-8 space-y-4 font-sans">
              <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider font-heading">
                Detalle de Consultas y Ofertas
              </h2>
              {requests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-sm font-sans">
                  <span className="text-2xl">📋</span>
                  <p className="text-[10px] font-sans font-bold text-slate-450 uppercase tracking-wider">No tienes solicitudes o consultas registradas</p>
                  <p className="text-[9px] font-sans text-slate-450 leading-normal max-w-xs mx-auto">
                    Cuando realices una consulta o envíes una oferta comercial por un inmueble, podrás realizar el seguimiento en este panel.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Propiedad</th>
                          <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Tipo</th>
                          <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Monto</th>
                          <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Estado</th>
                          <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-wider text-right font-sans">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {requests.map((req) => {
                          const realProp = ALL_REAL_PROPERTIES.find(p => String(p.id) === String(req.propertyId));
                          const title = realProp?.title || req.propertyTitle || 'Propiedad de Catálogo';
                          const priceValue = req.offerAmount || realProp?.price;
                          return (
                            <tr key={req.id} className="hover:bg-slate-50/30 transition-all font-sans">
                              <td className="p-4 font-sans font-bold text-[#04045E]">{title}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase text-[8px] border font-sans">
                                  {req.type}
                                </span>
                              </td>
                              <td className="p-4 font-sans font-black">
                                {priceValue ? `$${priceValue.toLocaleString()} USD` : 'N/A'}
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 font-sans ${
                                  req.status === 'Aceptada'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : req.status === 'En revisión'
                                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                                    : 'bg-slate-50 text-slate-650 border-slate-200'
                                }`}>
                                  <span className={`h-1 w-1 rounded-full ${
                                    req.status === 'Aceptada' ? 'bg-emerald-500' : req.status === 'En revisión' ? 'bg-amber-500' : 'bg-slate-400'
                                  }`} />
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleCancelRequest(req.id)}
                                  className="text-[9px] font-bold hover:text-red-655 text-slate-450 transition-colors font-sans"
                                >
                                  ✕ Retirar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FAVORITOS Y RECOMENDADOS (Derecha 1/3) */}
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-2">
              <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider font-heading">
                FAVORITOS Y RECOMENDADOS
              </h2>
              <p className="text-[9px] text-slate-400 font-semibold mt-1 font-sans font-medium">
                Recomendaciones en un radio de 3 km del mismo tipo de inmueble.
              </p>
            </div>

            {/* Listado de Recomendados */}
            {loading ? (
              <div className="h-48 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04045E]" />
              </div>
            ) : finalSidebarItems.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2.5 font-sans shadow-sm">
                <span className="text-2xl">📍</span>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Sin recomendaciones</p>
                <p className="text-[9px] text-slate-400 leading-normal max-w-xs mx-auto">
                  Agrega inmuebles a tus favoritos para recibir recomendaciones geoespaciales cercanas del mismo tipo.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {finalSidebarItems.map((prop: any) => {
                  const formattedPrice = prop.currency === 'USD'
                    ? `$${(prop.price || 0).toLocaleString('en-US')} USD`
                    : `${(prop.priceBob || (prop.price * 9.76)).toLocaleString('es-BO')} Bs.`;
                  
                  const distanceLabel = prop.distance !== undefined && prop.distance !== null
                    ? `${Number(prop.distance).toFixed(2)} km`
                    : prop.location || 'Bolivia';

                  return (
                    <div
                      key={prop.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 hover:shadow-md hover:border-slate-300 transition-all duration-300"
                    >
                      <img
                        src={prop.imageUrl || prop.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                        alt={prop.title}
                        className="w-16 h-16 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                      />
                      <div className="min-w-0 flex flex-col justify-between flex-1">
                        <div className="space-y-0.5">
                          <h4 className="text-[11px] font-sans font-black text-[#04045E] truncate leading-tight uppercase">
                            {prop.title}
                          </h4>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[7px] font-sans font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                              {prop.offerType}
                            </span>
                            <span className="text-[8px] font-sans text-slate-400 font-bold truncate max-w-[120px]">
                              📍 {distanceLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                          <p className="text-xs font-sans font-black text-[#04045E]">
                            {formattedPrice}
                          </p>
                          <Link
                            href={`/properties/${prop.id}`}
                            className="text-[8px] font-sans font-black text-[#04045E] hover:underline uppercase"
                          >
                            Ver →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
