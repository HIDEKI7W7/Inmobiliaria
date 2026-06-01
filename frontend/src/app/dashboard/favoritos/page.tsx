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

export default function FavoritosDashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [favorites, setFavorites] = useState<BackendProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState('/cliente');

  useEffect(() => {
    const user = getCurrentUser();
    const token = getToken();

    if (!user || !token) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard/favoritos')}`);
      return;
    }

    setUserName((user as any).name || user.email?.split('@')[0] || 'Usuario');
    setRedirectPath(getRedirectPathByRole(user.role));

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const res = await fetch(`${apiBaseUrl}/favoritos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch (err) {
        console.error('Error al cargar propiedades favoritas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [router]);

  const handleFavoriteToggle = (propertyId: string, isFav: boolean) => {
    // Si se desmarcó de favoritos, lo removemos de la lista local inmediatamente
    if (!isFav) {
      setFavorites(prev => prev.filter(p => p.id !== propertyId));
    }
  };

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
              Mis Propiedades Guardadas
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Hola {userName}, aquí tienes la lista de inmuebles que has guardado en favoritos para revisar o contactar.
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
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando favoritos...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center max-w-lg mx-auto shadow-sm space-y-6">
            <div className="text-5xl">💚</div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-tight">Aún no tienes propiedades guardadas</h3>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">
                ¡Explora nuestro catálogo premium de departamentos, casas y oficinas en Bolivia, y guarda las que más te gusten haciendo clic en el corazón verde lima!
              </p>
            </div>
            <div>
              <Link
                href="/properties"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#A3E635] hover:bg-lime-500 text-neutral-900 font-sans font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md transform hover:scale-[1.02]"
              >
                Explorar catálogo
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((prop) => (
              <div key={prop.id} className="h-full">
                <PropertyCard
                  propertyId={prop.id}
                  title={prop.title}
                  price={prop.price}
                  image={prop.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80'}
                  isVerified={prop.isVerified}
                  specs={{
                    rooms: prop.rooms,
                    bathrooms: prop.bathrooms,
                    area: prop.area,
                  }}
                  location={prop.location}
                  isFavorite={true}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
