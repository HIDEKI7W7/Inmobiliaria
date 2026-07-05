'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getToken, getRedirectPathByRole } from '@/utils/session';
import { PropertyCard } from '@/components/modules/properties/PropertyCard';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';

export default function VistoRecientementeDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [redirectPath, setRedirectPath] = useState('/cliente');
  const [propiedadesVistas, setPropiedadesVistas] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const user = getCurrentUser();
    const token = getToken();

    if (!user || !token) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard/visto-recientemente')}`);
      return;
    }

    setUserName((user as any).name || user.email?.split('@')[0] || 'Usuario');
    setRedirectPath(getRedirectPathByRole(user.role));

    // [LOGICA_HISTORIAL_ANTI_CONGELAMIENTO]
    try {
      if (typeof window === 'undefined') return;

      const historial = localStorage.getItem('propio_client_recently_viewed');
      if (historial) {
        const idsVistos: string[] = JSON.parse(historial);
        
        if (Array.isArray(idsVistos) && idsVistos.length > 0) {
          const deletedStored = localStorage.getItem('propio_admin_deleted_properties');
          const deletedIds: string[] = deletedStored ? JSON.parse(deletedStored) : [];
          
          // Cruzar contra la base de datos centralizada real ALL_REAL_PROPERTIES
          const filtradas = ALL_REAL_PROPERTIES.filter(p => 
            idsVistos.includes(p.id) && !deletedIds.includes(p.id)
          );

          // Purga silenciosa: sobreescribir el store con solo IDs válidos
          const validIds = filtradas.map(p => p.id);
          if (validIds.length !== idsVistos.length) {
            localStorage.setItem('propio_client_recently_viewed', JSON.stringify(validIds));
          }

          // Mantener el orden original de visualización
          const ordenadas = [...filtradas].sort((a, b) => idsVistos.indexOf(a.id) - idsVistos.indexOf(b.id));
          setPropiedadesVistas(ordenadas);
        }
      }
    } catch (error) {
      console.error("Error al recuperar el historial de navegación:", error);
    } finally {
      // SOLUCIÓN AL BUG: El bloque finally se ejecuta obligatoriamente apagando el spinner siempre
      setCargando(false);
    }
  }, [router]);

  // [JSX_INTERFAZ_HISTORIAL_CONDICIONAL]
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#f4f4fa] p-4 md:p-8 font-sans">
      {/* Cabecera del Panel */}
      <div className="flex justify-between items-center w-full border-b border-gray-200 pb-4 shrink-0">
        <div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Panel Privado</span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Visto Recientemente</h1>
          <p className="text-xs text-slate-400 mt-0.5">Hola {userName}, aquí tienes la lista de inmuebles que has visitado recientemente.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={redirectPath} className="px-4 py-2 border border-gray-200 bg-white rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">← Volver al panel</Link>
          <Link href="/properties" className="px-4 py-2 bg-[#000033] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#000044] transition-all">🔍 Buscar más</Link>
        </div>
      </div>

      {/* Cuerpo Lógico Adaptativo */}
      <div className="flex-1 w-full flex flex-col">
        {cargando ? (
          <div className="flex-1 flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-9 h-9 border-4 border-slate-200 border-t-blue-950 rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando historial...</span>
          </div>
        ) : propiedadesVistas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6 w-full animate-fadeIn">
            {propiedadesVistas.map((item) => (
              <PropertyCard
                property={item}
                key={item.id}
                propertyId={item.id}
                title={item.title}
                price={item.price}
                priceBob={item.priceBob}
                image={item.imageUrl || item.image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'}
                isVerified={item.isVerified || item.verified || false}
                specs={{
                  rooms: item.rooms,
                  bathrooms: item.bathrooms,
                  area: item.area,
                }}
                location={item.location}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg mb-3">👁️</div>
            <h3 className="text-sm font-bold text-slate-800">Historial vacío</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">Los inmuebles que explores dentro de la plataforma se guardarán automáticamente aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
