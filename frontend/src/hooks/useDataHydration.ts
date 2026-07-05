import { useState, useEffect } from 'react';
import { seedPropertiesAndUsers } from '../utils/seedProperties';

export const KEYS = {
  PROPERTIES: 'propio_properties_data',
  CLIENTS: 'propio_admin_users_permissions',
  COLLABORATIONS: 'propio_admin_collaborations',
  TRANSACTIONS: 'propio_admin_transactions',
};

export function useDataHydration<T>(key: string, initialData: T): [T, (data: T) => void] {
  const [state, setState] = useState<T>(initialData);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadData = () => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setState(JSON.parse(stored));
        } catch {
          setState(initialData);
        }
      } else {
        setState(initialData);
      }
    };

    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key, initialData]);

  const saveData = (newData: T) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(newData));
      window.dispatchEvent(new Event('local-storage'));
    }
    setState(newData);
  };

  return [state, saveData];
}
