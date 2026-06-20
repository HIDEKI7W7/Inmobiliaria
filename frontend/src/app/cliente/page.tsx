'use client';

/**
 * /cliente
 *
 * Dashboard principal del Cliente (Comprador/Inquilino).
 * Diseñado bajo estética de alto nivel minimalista:
 * - KPIs (Intereses, Ofertas, Consultas, Reuniones)
 * - Sección "MIS INTERESES" unificada (Favoritos + Contactados)
 * - Barra lateral "RECOMENDADOS" (Haversine < 3km y misma oferta)
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesService } from '../../services/properties.service';
import { Property } from '../../components/modules/properties/PropertyCard';
import { getCurrentUser, removeToken } from '@/utils/session';
import { useFavorites } from '@/context/FavoritesContext';

interface LeadRequest {
  id: string;
  propertyTitle: string;
  propertyId: string;
  type: 'Compra' | 'Alquiler' | 'Anticrético' | 'Proyecto';
  status: 'Pendiente' | 'En revisión' | 'Aceptada' | 'Rechazada';
  date: string;
  offerAmount?: number;
}

export default function ClienteDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('Cliente');
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);

  const { favorites: favContextList, isFavorited } = useFavorites();

  const [requests, setRequests] = useState<LeadRequest[]>([]);

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

    // Cargar todas las propiedades para filtrados y recomendaciones
    const loadProperties = async () => {
      try {
        setLoading(true);
        const data = await propertiesService.getProperties();
        setAllProperties(data);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [router]);

  // Si cambia la lista de favoritos y no hay seleccionado uno de referencia, elegir el primero
  useEffect(() => {
    if (favContextList.length > 0 && !selectedFavoriteId) {
      setSelectedFavoriteId(favContextList[0].id);
    }
  }, [favContextList, selectedFavoriteId]);

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
    if (confirm('¿Deseas retirar esta solicitud de interés/oferta?')) {
      setRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  // Unión de favoritos de contexto + propiedades contactadas en requests
  const combinedInterests = allProperties.filter(p => {
    const isFav = favContextList.some(f => f.id === p.id);
    const isContacted = requests.some(r => r.propertyId === p.id || r.propertyTitle === p.title);
    return isFav || isContacted;
  });

  // Haversine formula to compute distance in Km
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Determinar propiedad favorita/referencia elegida para recomendaciones
  const selectedRefProp =
    allProperties.find(p => p.id === selectedFavoriteId) ||
    favContextList[0] ||
    combinedInterests[0] ||
    allProperties[0];

  // Algoritmo de recomendaciones: misma categoría de oferta y distancia <= 3km
  const recommendations = allProperties.filter(p => {
    if (!selectedRefProp) return false;
    if (p.id === selectedRefProp.id) return false;

    // 1. Misma categoría de oferta (Venta, Alquiler, Anticrético, Proyecto)
    const sameCategory =
      (p.offerType || '').toUpperCase() === (selectedRefProp.offerType || '').toUpperCase();

    // 2. Ubicación a máximo 3 km
    const pLat = p.lat ?? p.latitude ?? -17.3895;
    const pLng = p.lng ?? p.longitude ?? -66.1568;
    const refLat = selectedRefProp.lat ?? selectedRefProp.latitude ?? -17.3895;
    const refLng = selectedRefProp.lng ?? selectedRefProp.longitude ?? -66.1568;

    const distance = getDistanceKm(pLat, pLng, refLat, refLng);
    const inRange = distance <= 3;

    return sameCategory && inRange;
  });

  // Si no hay intereses, las recomendaciones de la semana serán simplemente propiedades destacadas
  const showFeatured = combinedInterests.length === 0;

  const sidebarItems = showFeatured
    ? allProperties.filter(p => p.isVerified || (p as any).verified).slice(0, 5)
    : recommendations.slice(0, 5);

  // Si no hay verificadas, caemos a las primeras 5 de la cartera
  const finalSidebarItems = sidebarItems.length > 0
    ? sidebarItems
    : allProperties.slice(0, 5);

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
              Gestiona tus propiedades de interés, revisa recomendaciones cercanas y coordina visitas directas.
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              🔍 Explorar Propiedades
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mis Intereses</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#04045E]">{combinedInterests.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border font-bold uppercase">Activos</span>
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
                  const finalPriceBob = prop.priceBob ?? (prop.price * 10);
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
                          {/* Tipo */}
                          <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 mt-1 inline-block">
                            {prop.type}
                          </span>
                        </div>
                      </div>
                      
                      {/* Precio Final y Acción */}
                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="sm:text-right">
                          <p className="text-sm font-black text-[#04045E]">
                            {finalPriceBob.toLocaleString('es-BO')} Bs.
                          </p>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">
                            Precio Final
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
                  <p className="text-[10px] font-sans font-bold text-slate-450 uppercase tracking-wider">Sin ofertas ni consultas activas</p>
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
                        {requests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/30 transition-all font-sans">
                            <td className="p-4 font-sans font-bold text-[#04045E]">{req.propertyTitle}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase text-[8px] border font-sans">
                                {req.type}
                              </span>
                            </td>
                            <td className="p-4 font-sans font-black">
                              {req.offerAmount ? `$${req.offerAmount.toLocaleString()} USD` : 'N/A'}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RECOMENDADOS (Derecha 1/3) */}
          <div className="space-y-6">
            <div className="border-b border-slate-150 pb-2">
              <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider font-heading">
                {showFeatured ? 'Propiedades destacadas de la semana' : 'Recomendados Cercanos (Barra Lateral)'}
              </h2>
              <p className="text-[9px] text-slate-400 font-semibold mt-1 font-sans">
                {showFeatured 
                  ? 'Selección exclusiva de inmuebles recomendados en Bolivia.' 
                  : 'Filtro estricto: misma oferta y radio < 3km.'}
              </p>
            </div>

            {/* Selector de Referencia si hay favoritos y no estamos en modo destacado */}
            {favContextList.length > 0 && !showFeatured && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <label className="block text-[8px] font-sans font-black uppercase text-slate-400 tracking-wider">
                  Inmueble de Referencia
                </label>
                <select
                  value={selectedFavoriteId || ''}
                  onChange={(e) => setSelectedFavoriteId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-[10px] font-sans font-black text-[#04045E] focus:outline-none"
                >
                  {favContextList.map(f => (
                    <option key={f.id} value={f.id} className="font-sans">
                      {f.title} ({f.offerType || 'Venta'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Listado de Recomendados o Destacados */}
            {loading ? (
              <div className="h-48 bg-white border border-slate-200 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04045E]" />
              </div>
            ) : finalSidebarItems.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2 font-sans">
                <span className="text-2xl">📍</span>
                <p className="text-[10px] text-slate-400 font-black uppercase">Sin inmuebles disponibles</p>
                <p className="text-[9px] text-slate-400 leading-normal">
                  No se encontraron propiedades en la plataforma actualmente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {finalSidebarItems.map((prop) => {
                  const finalPriceBob = prop.priceBob ?? (prop.price * 10);
                  
                  // Calcular distancia solo si no estamos en showFeatured
                  let distanceLabel = prop.location || 'Bolivia';
                  if (!showFeatured && selectedRefProp) {
                    const refLat = selectedRefProp?.lat ?? selectedRefProp?.latitude ?? -17.3895;
                    const refLng = selectedRefProp?.lng ?? selectedRefProp?.longitude ?? -66.1568;
                    const pLat = prop.lat ?? prop.latitude ?? -17.3895;
                    const pLng = prop.lng ?? prop.longitude ?? -66.1568;
                    const distanceKm = getDistanceKm(refLat, refLng, pLat, pLng).toFixed(2);
                    distanceLabel = `${distanceKm} km`;
                  }

                  return (
                    <div
                      key={prop.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 hover:shadow-md hover:border-slate-350 transition-all duration-300"
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
                            <span className="text-[7px] font-sans font-black bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded border border-emerald-100 uppercase">
                              {prop.offerType}
                            </span>
                            <span className="text-[8px] font-sans text-slate-400 font-bold truncate max-w-[120px]">
                              📍 {distanceLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                          <p className="text-xs font-sans font-black text-[#04045E]">
                            {finalPriceBob.toLocaleString('es-BO')} Bs.
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
