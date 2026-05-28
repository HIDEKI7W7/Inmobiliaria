'use client';

/**
 * /propietario/dashboard
 *
 * Dashboard principal del Propietario. Replica la funcionalidad de
 * /propietario/page.tsx pero con guard de autenticación estricto y
 * acceso desde la redirección post-login de usuarios con rol PROPIETARIO.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { propertiesService } from '../../../services/properties.service';
import { Property } from '../../../components/modules/properties/PropertyCard';
import { getCurrentUser } from '@/utils/session';

export default function PropietarioDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Propietario');

  useEffect(() => {
    // Guard de autenticación
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login?redirect=/propietario/dashboard');
      return;
    }
    if (user.role !== 'PROPIETARIO' && user.role !== 'ADMIN') {
      router.replace('/');
      return;
    }
    setUserName(user.email?.split('@')[0] || 'Propietario');

    // Cargar propiedades del propietario
    const loadProperties = async () => {
      try {
        setLoading(true);
        const allProperties = await propertiesService.getProperties({ verifiedOnly: false });
        const ownerProperties = allProperties.filter(
          (p: any) => p.ownerId === 'owner-1' || p.id === '1' || p.id === '4'
        );
        setProperties(ownerProperties);
      } catch (error) {
        console.error('Error al cargar propiedades del propietario:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [router]);

  const handleLogout = async () => {
    try {
      // Futura llamada fetch al endpoint del backend para invalidar la sesión:
      // await fetch('/api/auth/logout', { method: 'POST' });
      
      // Limpieza estricta de cookies del lado del cliente
      document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');
      
      router.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const pendingDocs = properties.filter((p) => !p.verified).length;
  const verified = properties.filter((p) => p.verified).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans antialiased">

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-10 space-y-10">

        {/* ── ENCABEZADO BIENVENIDA ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Panel de Propietario
            </p>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] tracking-tight">
                Bienvenido, {userName} 👋
              </h1>
              
              {/* BOTÓN QUIRÚRGICO DE CERRAR SESIÓN */}
              <button 
                onClick={handleLogout}
                className="border border-slate-200 text-slate-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2"
                aria-label="Cerrar sesión"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2.5} 
                  stroke="currentColor" 
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                <span>Salir</span>
              </button>
            </div>
            <p className="text-sm text-slate-555 font-medium">
              Gestiona tus propiedades, revisa solicitudes de clientes y publica nuevos inmuebles.
            </p>
          </div>

          <Link
            href="/propietario/nuevo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#b9fa3c] hover:bg-[#adf02c] text-[#04045E] font-black text-xs uppercase tracking-wider rounded-xl shadow-sm border border-[#04045E]/10 active:scale-[0.98] transition-all"
          >
            <span>+</span> Publicar Inmueble
          </Link>
        </div>

        {/* ── KPI CARDS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Inmuebles</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-[#04045E]">{properties.length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border font-bold uppercase">Activos</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sello Oro</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-600">{verified}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold uppercase">Verificados</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Validación</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-500">{pendingDocs}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-bold uppercase">Pendientes</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads Interesados</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-black text-indigo-600">{properties.length * 3}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold uppercase">Potenciales</span>
            </div>
          </div>
        </div>

        {/* ── LISTADO DE PROPIEDADES ──────────────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
              Mis Propiedades Publicadas
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              {properties.length} inmueble{properties.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                  Cargando propiedades...
                </p>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-4">
              <span className="text-4xl">🏡</span>
              <div className="space-y-1">
                <h3 className="font-black text-[#04045E] text-sm uppercase">Aún no tienes propiedades publicadas</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Registra tu primer inmueble para conectar con miles de compradores sin intermediarios.
                </p>
              </div>
              <Link
                href="/propietario/nuevo"
                className="px-5 py-2 bg-[#04045E] hover:bg-indigo-900 text-white text-xs font-black uppercase rounded-xl tracking-wider transition-all"
              >
                Publicar mi primera propiedad
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all duration-200"
                >
                  <div className="relative h-44 w-full bg-slate-100">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.verified ? (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        🏆 Sello Oro
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                        ⚖️ En Validación
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          {property.type}
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          {property.area} m²
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-[#04045E] tracking-tight leading-snug">
                        {property.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2">
                        {property.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Precio</p>
                        <p className="text-base font-black text-[#04045E]">
                          ${property.price.toLocaleString()}
                          <span className="text-xs text-slate-400 font-medium ml-1">USD</span>
                        </p>
                      </div>
                      <button
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 rounded-xl transition-all"
                        onClick={() => alert(`Leads de interés para: ${property.title}`)}
                      >
                        Ver Leads (3) 📬
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
