'use client';

import { useState, useEffect } from 'react';
import { propertiesService } from '../services/properties.service';
import { Property } from '../components/modules/properties/PropertyCard';

export function useProperties(filters?: {
  type?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  verifiedOnly?: boolean | string;
  text?: string;
}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Serializamos los filtros para tener un trigger seguro en el dependency array de useEffect
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let isCurrent = true;

    async function loadProperties() {
      try {
        setLoading(true);
        const parsedFilters = filtersKey ? JSON.parse(filtersKey) : undefined;
        const data = await propertiesService.getProperties(parsedFilters);
        if (isCurrent) {
          setProperties(data);
          setError(null);
        }
      } catch (err: any) {
        if (isCurrent) {
          setError(err.message || 'Error al obtener propiedades');
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      isCurrent = false;
    };
  }, [filtersKey]);

  return {
    properties,
    loading,
    error,
  };
}
