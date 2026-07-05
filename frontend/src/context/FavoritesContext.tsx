'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, isAuthenticated } from '@/utils/session';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';

// Pure normalization middleware function
export function normalizeProperty(p: any): any {
  if (!p) return null;
  
  // Force all IDs to be string and strip any formatting symbol like '#'
  const id = p.id ? String(p.id).replace('#', '') : '';
  
  // Standardize geographical coordinates (lat/lng, latitude/longitude, latitud/longitud)
  let lat = p.lat ?? p.latitude ?? p.latitud;
  let lng = p.lng ?? p.longitude ?? p.longitud;
  
  if (p.location?.coordinates) {
    lat = lat ?? p.location.coordinates.lat;
    lng = lng ?? p.location.coordinates.lng;
  }
  
  const parsedLat = typeof lat === 'string' ? parseFloat(lat) : typeof lat === 'number' ? lat : -17.3895;
  const parsedLng = typeof lng === 'string' ? parseFloat(lng) : typeof lng === 'number' ? lng : -66.1568;

  // Standardize images array
  let images: string[] = [];
  if (Array.isArray(p.images)) {
    images = p.images;
  } else if (p.media?.images && Array.isArray(p.media.images)) {
    images = p.media.images.map((img: any) => img.fileUrl || img);
  } else if (p.imageUrl || p.image) {
    images = [p.imageUrl || p.image];
  }

  // Normalizar y enriquecer ubicación y tipo de oferta
  let location = p.location || '';
  if (typeof location === 'object' && location !== null) {
    const addr = location.address || location.calle || '';
    const city = location.city || location.sucursal || location.branch || location.zona || '';
    const parts = [addr, city].filter(Boolean);
    location = parts.length > 0 ? parts.join(', ') : (location.city || 'Bolivia');
  }

  if (typeof location === 'string') {
    const locLower = location.toLowerCase();
    if ((locLower.includes('urubó') || locLower.includes('equipetrol') || locLower.includes('sirari') || locLower.includes('norte') || locLower.includes('trompillo')) && !locLower.includes('santa cruz')) {
      location = `${location}, Santa Cruz`;
    } else if ((locLower.includes('cala cala') || locLower.includes('queru queru') || locLower.includes('sarco') || locLower.includes('américa') || locLower.includes('amercia') || locLower.includes('ticti')) && !locLower.includes('cochabamba')) {
      location = `${location}, Cochabamba`;
    }
  }

  const offerType = p.offerType || p.intent || '';

  return {
    ...p,
    id,
    lat: parsedLat,
    lng: parsedLng,
    images,
    imageUrl: images[0] || '',
    location,
    offerType,
    price: typeof p.price === 'string' ? parseFloat(p.price) : (p.price || 0),
  };
}

interface FavoritesContextType {
  favorites: any[];
  isFavorited: (propertyId: string) => boolean;
  toggleFavorite: (propertyId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  loading: boolean;
  properties: any[];
  refreshProperties: () => Promise<void>;
  setProperties?: React.Dispatch<React.SetStateAction<any[]>>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(
    typeof window !== 'undefined' && !!localStorage.getItem('propio_token')
  );

  const refreshProperties = useCallback(async () => {
    let apiList: any[] = [];
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBaseUrl}/properties`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiList = data;
        }
      }
    } catch (e) {
      console.warn("API properties load failed, falling back to static seeds:", e);
    }

    const combinedMap = new Map<string, any>();
    ALL_REAL_PROPERTIES.forEach((p: any) => {
      if (p && p.id) combinedMap.set(p.id, p);
    });
    apiList.forEach((p: any) => {
      if (p && p.id) combinedMap.set(p.id, p);
    });
    let allList = Array.from(combinedMap.values());

    // Merge custom created properties from localStorage if any (propio_custom_created_properties and propio_custom_properties)
    const customCreatedStored = localStorage.getItem('propio_custom_created_properties');
    if (customCreatedStored) {
      try {
        const parsed = JSON.parse(customCreatedStored);
        if (Array.isArray(parsed)) {
          const validCustomProps = parsed.filter((p: any) => 
            p && p.id && p.title && p.location &&
            (Number(p.price || 0) > 0 || Number(p.priceBob || 0) > 0 || Number(p.minPrice || 0) > 0)
          );
          if (validCustomProps.length < parsed.length) {
            localStorage.setItem('propio_custom_created_properties', JSON.stringify(validCustomProps));
          }
          allList = [...allList, ...validCustomProps];
        }
      } catch {}
    }

    const customPropsStored = localStorage.getItem('propio_custom_properties');
    if (customPropsStored) {
      try {
        const parsed = JSON.parse(customPropsStored);
        if (Array.isArray(parsed)) {
          const validCustomProps = parsed.filter((p: any) => 
            p && p.id && p.title && p.location &&
            (Number(p.price || 0) > 0 || Number(p.priceBob || 0) > 0 || Number(p.minPrice || 0) > 0)
          );
          if (validCustomProps.length < parsed.length) {
            localStorage.setItem('propio_custom_properties', JSON.stringify(validCustomProps));
          }
          allList = [...allList, ...validCustomProps];
        }
      } catch {}
    }

    const publicApprovedOnly = allList.filter((p: any) => p && (p.status === 'APROBADO' || p.status === 'aprobado'));
    setProperties(publicApprovedOnly.map(normalizeProperty));
  }, []);

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
        setFavorites((data || []).map(normalizeProperty));
      }
    } catch (err) {
      console.error('Error al cargar favoritos en contexto global:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mounting routine: clean up old local storage formatting and load properties
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const keysToClear = [
          'propio_admin_agents',
          'propio_custom_agents',
          'propio_admin_properties',
          'propio_admin_prospects',
          'propio_admin_owners',
          'propio_deleted_agent_ids',
          'propio_admin_collaborations',
          'propio_admin_pedidos_mkt',
          'propio_announcement_reads',
          'propio_client_recently_viewed',
          'propio_favorites'
        ];
        keysToClear.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn("Storage cleanup failed:", e);
      }
    }

    refreshProperties();
  }, [refreshProperties]);

  // Cargar favoritos al montar o cuando cambie la autenticación
  useEffect(() => {
    if (ALL_REAL_PROPERTIES.length === 0) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('propio_favorites', JSON.stringify([]));
        } catch {}
      }
      setFavorites([]);
      setLoading(false);
      return;
    }

    if (isAuthenticated()) {
      refreshFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [refreshFavorites]);

  const isFavorited = useCallback((propertyId: string) => {
    const cleanId = String(propertyId).replace('#', '');
    return favorites.some(p => String(p.id).replace('#', '') === cleanId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (propertyId: string): Promise<boolean> => {
    const token = getToken();
    if (!token) return false;
    const cleanId = String(propertyId).replace('#', '');

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiBaseUrl}/favoritos/toggle/${cleanId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const isFav = data.favorited;

        if (isFav) {
          await refreshFavorites();
        } else {
          setFavorites(prev => prev.filter(p => String(p.id).replace('#', '') !== cleanId));
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
    <FavoritesContext.Provider value={{ favorites, isFavorited, toggleFavorite, refreshFavorites, loading, properties, refreshProperties, setProperties }}>
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
