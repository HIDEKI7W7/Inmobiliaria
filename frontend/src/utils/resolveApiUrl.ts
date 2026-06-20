/**
 * Resuelve la URL de la API del backend de forma dinámica.
 * Si la petición se ejecuta del lado del servidor (SSR, Route Handlers) y
 * se detecta que corre dentro de un contenedor Docker local (ej. docker-compose),
 * mapea las referencias a 'localhost:4000' o '127.0.0.1:4000' hacia el nombre del
 * servicio de Docker 'propio-backend:4000' para evitar errores de conexión (ECONNREFUSED).
 */
export function resolveApiUrl(url?: string): string {
  const targetUrl = url || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  if (typeof window === 'undefined') {
    let isDocker = false;
    try {
      // Usamos eval("require('fs')") para evitar que Next.js/Webpack intente empaquetar 'fs' del lado del cliente
      const fs = eval("require('fs')");
      isDocker = fs.existsSync('/.dockerenv');
    } catch {
      // Fallback si la ejecución ocurre en un runtime sin soporte de fs o del lado del cliente
    }

    if (isDocker) {
      return targetUrl
        .replace('localhost:4000', 'propio-backend:4000')
        .replace('127.0.0.1:4000', 'propio-backend:4000');
    }
  }

  return targetUrl;
}
