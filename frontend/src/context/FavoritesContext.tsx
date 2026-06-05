'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, isAuthenticated } from '@/utils/session';

interface FavoritesContextType {
  favorites: any[];
  isFavorited: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(
    typeof window !== 'undefined' && !!localStorage.getItem('propio_token')
  );

  const refreshFavorites = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setFavorites([]);
      setLoading(false);
      return;
    }

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
        setFavorites(data || []);
      }
    } catch (err) {
      console.error('Error al cargar favoritos en contexto global:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar favoritos al montar o cuando cambie la autenticación
  useEffect(() => {
    if (isAuthenticated()) {
      refreshFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [refreshFavorites]);

  const isFavorited = useCallback((propertyId: string) => {
    return favorites.some(p => p.id === propertyId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (propertyId: string): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBaseUrl}/favoritos/toggle/${propertyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const isFav = data.favorited;

        // Actualizar atómicamente la lista global para evitar desincronizaciones
        if (isFav) {
          // Si se marcó como favorito, refrescamos la lista completa para obtener el objeto completo
          await refreshFavorites();
        } else {
          // Si se desmarcó, lo removemos directamente
          setFavorites(prev => prev.filter(p => p.id !== propertyId));
        }
        return isFav;
      }
      return false;
    } catch (err) {
      console.error('Error al alternar favorito en contexto global:', err);
      return false;
    }
  }, [refreshFavorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorited, toggleFavorite, refreshFavorites, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
  }
  return context;
}
