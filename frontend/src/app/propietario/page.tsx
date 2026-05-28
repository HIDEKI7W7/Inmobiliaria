'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { propertiesService } from '../../services/properties.service';
import { Property } from '../../components/modules/properties/PropertyCard';

export default function PropietarioDashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargamos las propiedades del propietario owner-1
  useEffect(() => {
    async function loadProperties() {
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
    }
    loadProperties();
  }, []);

  const handleLogout = async () => {
    try {
      // 1. Llamada síncrona al endpoint del backend para invalidar la sesión
      await fetch('/api/auth/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Error al revocar la sesión del propietario en el servidor:', error);
    } finally {
      // 2. Limpieza estricta de cookies del lado del cliente
      document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
      
      // 3. Limpieza de almacenamiento local
      localStorage.removeItem('propio_token');
      localStorage.removeItem('propio_user');

      // 4. Redirección forzada eliminando el historial inmediato para evitar re-ingreso
      router.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#04045E] font-sans antialiased flex flex-col selection:bg-[#b9fa3c]/30">
      
      {/* NAVBAR ENFOCADO EN EL CONTROL DE SESIÓN */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 sticky top-0 z-30 select-none shadow-sm">
        {/* Lado Izquierdo: Logotipo Corporativo */}
        <div className="text-2xl font-bold tracking-tight text-[#04045E]">
          Propio<span className="text-[#b9fa3c] font-black">.</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-3 border-l border-slate-200 pl-3 hidden md:inline">
            Propietarios
          </span>
        </div>
        
        {/* Lado Derecho: Bloque de Acciones e Interacción de Usuario */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {/* Botón Principal (CTA) */}
          <Link 
            href="/propietario/nuevo" 
            className="bg-[#b9fa3c] text-[#04045E] px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-opacity-90 transition-all shadow-sm text-center"
          >
            + Publicar Nueva Propiedad
          </Link>
          
          {/* BOTÓN QUIRÚRGICO DE CERRAR SESIÓN */}
          <button 
            onClick={handleLogout}
            className="border border-slate-200 text-slate-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center gap-2"
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
      </nav>

      {/* Contenido Central */}
      <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Banner de Bienvenida */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] font-black tracking-widest text-[#04045E] uppercase">Área de Autoservicio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] uppercase tracking-tight">
              Mi Centro Operativo
            </h1>
            <p className="text-xs text-slate-555 font-medium">
              Monitorea el rendimiento de tus inmuebles, controla el estado de tu carpeta legal y recibe ofertas directas.
            </p>
          </div>

          {/* Stats Rápidos */}
          <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-center px-4 border-r border-slate-200">
              <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Inmuebles</span>
              <span className="text-sm font-black text-[#04045E]">{properties.length}</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest">Sello Oro</span>
              <span className="text-sm font-black text-emerald-600">
                {properties.filter((p) => p.verified).length}
              </span>
            </div>
          </div>
        </div>

        {/* Sección 1: Tarjetas de Métricas de Impacto (Analytics) */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
            📊 Rendimiento de Tráfico e Impacto (Simulación en Vivo)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Métrica 1: Visitas */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center group hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Visitas Totales</span>
                <span className="text-3xl font-black text-[#04045E] tracking-tight">1,420</span>
                <span className="block text-[9px] font-bold text-emerald-600">+18.5% esta semana</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl select-none">
                👁️‍🗨️
              </div>
            </div>

            {/* Métrica 2: Favoritos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center group hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Guardados en Favoritos</span>
                <span className="text-3xl font-black text-[#04045E] tracking-tight">84</span>
                <span className="block text-[9px] font-bold text-emerald-600">+4 nuevos interesados</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl select-none">
                ❤️
              </div>
            </div>

            {/* Métrica 3: WhatsApp Clics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-center group hover:scale-[1.01] transition-transform">
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Clics Directos a mi WhatsApp</span>
                <span className="text-3xl font-black text-[#04045E] tracking-tight">39</span>
                <span className="block text-[9px] font-bold text-emerald-600">Conversión: 2.74%</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl select-none">
                💬
              </div>
            </div>

          </div>
        </div>

        {/* Sección 2: Módulo de Auditoría Sello Oro (Legal Tracking) */}
        <div id="sello-oro-auditoria" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xs text-[#04045E] uppercase tracking-wider">
                👑 Auditoría de Sello Oro Legal
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Estado de aprobación documental para tus propiedades en Venta</p>
            </div>
            <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[8px] font-black uppercase px-2.5 py-1 rounded">
              Validación Requerida
            </span>
          </div>

          {/* Timeline de Seguimiento */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative select-none">
            
            {/* Paso 1 */}
            <div className="flex gap-3.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">1. Folio Real</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Libre Alodial Verificado</p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-3.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">2. Testimonio</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Propiedad Acreditada</p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex gap-3.5 items-start p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">3. Impuestos</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Gestión 2025 al día</p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex gap-3.5 items-start p-3 bg-white border-2 border-[#b9fa3c] rounded-xl shadow-xs animate-pulse">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                ⌛
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-[#04045E] tracking-tight">4. Catastro</h4>
                <p className="text-[9px] text-slate-550 font-bold mt-0.5">En Revisión Técnica</p>
              </div>
            </div>

            {/* Paso 5 */}
            <div className="flex gap-3.5 items-start p-3 bg-slate-100/50 border border-dashed border-slate-200 rounded-xl opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black flex-shrink-0">
                5
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-tight">5. Sello Oro</h4>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Publicación Protegida</p>
              </div>
            </div>

          </div>
        </div>

        {/* Sección 3: Listado de Propiedades en Formato Horizontal */}
        <div id="catalogo-inmuebles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
              🏠 Catálogo de Inmuebles en mi Cartera ({properties.length})
            </h2>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]"></div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">
                  Cargando catálogo personal...
                </p>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-2xs">
              <span className="text-4xl animate-bounce">🏡</span>
              <div className="space-y-1">
                <h3 className="font-bold text-[#04045E] text-base uppercase tracking-tight">¿Aún no has publicado ninguna propiedad?</h3>
                <p className="text-xs text-slate-550 max-w-sm font-medium leading-relaxed">
                  Registra tu primera casa, departamento, terreno u oficina para conectar directamente con miles de compradores sin intermediarios.
                </p>
              </div>
              <Link
                href="/propietario/nuevo"
                className="px-6 py-3 bg-[#b9fa3c] text-[#04045E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-[1.02]"
              >
                Comenzar Carga Asistida
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row hover:border-[#b9fa3c]/50 hover:shadow-md transition-all duration-300 shadow-2xs"
                >
                  {/* Imagen a la izquierda (Horizontal) */}
                  <div className="relative w-full lg:w-72 h-48 shrink-0 bg-slate-100">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.verified ? (
                      <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#04045E] text-[#b9fa3c] text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md border border-[#b9fa3c]/35">
                        👑 Sello Oro
                      </div>
                    ) : (
                      <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                        ⚖️ En Validación
                      </div>
                    )}
                    {/* Badge de Estado del Inmueble */}
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-[#b9fa3c] text-[#04045E] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-md border border-[#b9fa3c]/30">
                        Publicado
                      </span>
                    </div>
                  </div>

                  {/* Contenido a la derecha */}
                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                          {property.type}
                        </span>
                        <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                          {property.area} M²
                        </span>
                        {property.rooms && (
                          <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                            {property.rooms} Dorm.
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500">
                            {property.bathrooms} Baños
                          </span>
                        )}
                        <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded bg-blue-50 text-[#0066ff] border border-blue-100">
                          📍 Cochabamba
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-black tracking-tight text-[#04045E] uppercase leading-tight hover:text-[#04045E]/90 transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-semibold line-clamp-2 leading-relaxed">
                        {property.description}
                      </p>
                    </div>

                    {/* Footer de Tarjeta con Precio y Leads */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-[8px] uppercase font-black text-slate-400 tracking-wider">Precio pretendido</p>
                        <p className="text-xl font-black text-[#04045E] leading-none">
                          ${property.price.toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase">USD</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`Visualizando detalles y leads de: ${property.title}`)}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-[#04045E] border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-[1.01]"
                        >
                          Ver Leads (3) 📬
                        </button>
                        <Link
                          href={`/properties/${property.id}`}
                          className="px-4 py-2 bg-[#04045E] hover:bg-[#04045E]/95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:scale-[1.01] text-center"
                        >
                          Ficha Pública →
                        </Link>
                      </div>
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
