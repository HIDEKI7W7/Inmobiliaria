const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// =========================================================================
// PROPIO FRONTEND (Next.js) - CLIENTE HTTP DEFENSIVO (api.client.ts)
// =========================================================================
// Este cliente realiza llamadas HTTP a la API y cuenta con un manejo de
// errores robusto para diferenciar fallos de red de códigos de estado HTTP (400, 401, 500).
// =========================================================================

async function request<T>(
  path: string, 
  options: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, options);
    
    // Diagnóstico de respuestas no exitosas (HTTP Status Errors)
    if (!response.ok) {
      let message = `Error de servidor en ruta ${path}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          message = Array.isArray(errorData.message) 
            ? errorData.message.join(', ') 
            : errorData.message;
        }
      } catch (jsonErr) {
        // Fallback si la respuesta no es un JSON parseable
      }
      
      const error: any = new Error(message);
      error.status = response.status;
      error.ok = false;
      throw error;
    }

    return await response.json();
  } catch (err: any) {
    // Diagnóstico defensivo de fallos totales de red (Network Error / ECONNREFUSED)
    if (err.message && (err.message.includes('fetch failed') || err.message.includes('Failed to fetch') || err.code === 'ECONNREFUSED')) {
      const networkError: any = new Error(
        `Fallo total de conexión con el backend de autenticación en la ruta ${path}. ` +
        `Por favor, asegúrate de que el servidor NestJS esté levantado y escuchando en ${API_BASE_URL}.`
      );
      networkError.status = 503;
      networkError.ok = false;
      throw networkError;
    }
    throw err;
  }
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    return request<T>(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // ISR (Incremental Static Regeneration) cada 60s
    });
  },

  async getWithAuth<T>(path: string, token: string): Promise<T> {
    return request<T>(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async post<T>(path: string, body: any): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  },

  async postWithAuth<T>(path: string, body: any, token: string): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  },

  async patchWithAuth<T>(path: string, body: any, token: string): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  },

  async deleteWithAuth<T>(path: string, token: string): Promise<T> {
    return request<T>(path, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};
