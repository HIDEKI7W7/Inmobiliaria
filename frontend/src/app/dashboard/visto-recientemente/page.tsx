'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getToken, getRedirectPathByRole } from '@/utils/session';
import { PropertyCard } from '@/components/modules/properties/PropertyCard';

interface BackendProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  rooms: number;
  bathrooms: number;
  location: string;
  imageUrl?: string;
  isVerified: boolean;
}

export default function VistoRecientementeDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [history, setHistory] = useState<BackendProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState('/cliente');

  useEffect(() => {
    const user = getCurrentUser();
    const token = getToken();

    if (!user || !token) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard/visto-recientemente')}`);
      return;
    }

    setUserName((user as any).name || user.email?.split('@')[0] || 'Usuario');
    setRedirectPath(getRedirectPathByRole(user.role));

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBaseUrl}/historial-vistas`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Error al cargar historial de vistas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-sans antialiased">
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 sm:px-8 py-10 space-y-10">
        
        {/* ── ENCABEZADO ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#04045E]/60">
              Panel Privado
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-[#04045E] tracking-tight">
              Visto Recientemente
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Hola {userName}, aquí tienes la lista de inmuebles que has visitado recientemente.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={redirectPath}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-650 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              ← Volver al Panel
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              🔍 Buscar Más
            </Link>
          </div>
        </div>

        {/* ── CONTENIDO PRINCIPAL ────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando historial...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-lg mx-auto shadow-sm space-y-6">
            <div className="text-5xl">👀</div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-tight">No tienes historial de visitas</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                ¡Explora nuestro catálogo premium de departamentos, casas y oficinas en Bolivia para registrar tus primeras visitas!
              </p>
            </div>
            <div>
              <Link
                href="/properties"
                className="inline-block px-6 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                Ver propiedades
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {history.map((property) => (
              <div key={property.id} className="h-full">
                <PropertyCard
                  propertyId={property.id}
                  title={property.title}
                  price={property.price}
                  image={property.imageUrl || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'}
                  isVerified={property.isVerified || false}
                  specs={{
                    rooms: property.rooms,
                    bathrooms: property.bathrooms,
                    area: property.area,
                  }}
                  location={property.location}
                  isFavorite={false}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
