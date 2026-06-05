'use client';

import { useEffect } from 'react';
import { getToken } from '@/utils/session';

export default function HttpInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).__fetch_intercepted) {
      (window as any).__fetch_intercepted = true;
      const originalFetch = window.fetch;
      window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
        const urlStr = input.toString();
        // Interceptamos llamadas que vayan al backend o contengan '/api/'
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        
        if (urlStr.includes('/api/') || urlStr.startsWith(apiBaseUrl)) {
          const token = getToken();
          if (token) {
            init = init || {};
            
            // Asegurar que Headers existan
            if (!init.headers) {
              init.headers = {};
            }

            // Inyectar cabecera Authorization si no está presente
            if (init.headers instanceof Headers) {
              if (!init.headers.has('Authorization')) {
                init.headers.set('Authorization', `Bearer ${token}`);
              }
            } else if (Array.isArray(init.headers)) {
              const hasAuth = init.headers.some(h => h[0].toLowerCase() === 'authorization');
              if (!hasAuth) {
                init.headers.push(['Authorization', `Bearer ${token}`]);
              }
            } else {
              const hasAuth = Object.keys(init.headers).some(k => k.toLowerCase() === 'authorization');
              if (!hasAuth) {
                (init.headers as any)['Authorization'] = `Bearer ${token}`;
              }
            }
          }
        }
        return originalFetch(input, init);
      };
    }
  }, []);

  return null;
}
