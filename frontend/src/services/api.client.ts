const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // ISR (Incremental Static Regeneration) cada 60s
    });

    if (!response.ok) {
      throw new Error(`API GET Error en ruta ${path}`);
    }
    return response.json();
  },

  async getWithAuth<T>(path: string, token: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API GET Auth Error en ruta ${path}`);
    }
    return response.json();
  },

  async post<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API POST Error en ruta ${path}`);
    }
    return response.json();
  },

  async postWithAuth<T>(path: string, body: any, token: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API POST Error en ruta ${path}`);
    }
    return response.json();
  },

  async patchWithAuth<T>(path: string, body: any, token: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API PATCH Error en ruta ${path}`);
    }
    return response.json();
  },
};
