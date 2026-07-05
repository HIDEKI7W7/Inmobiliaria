'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * TSK-7.2 — Error Boundary Global (Next.js App Router)
 * Se activa cuando cualquier página o layout hijo lanza un error no capturado.
 * Previene pantallas de error crudas de Next.js y ofrece recuperación amigable.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log al sistema de monitoreo (en producción conectar con Sentry/Datadog)
    console.error('[GlobalError Boundary]', error.message, error.digest);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "'Inter', 'Outfit', sans-serif",
          background: '#0b0b0f',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            maxWidth: '480px',
          }}
        >
          {/* Ícono de error */}
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚡</div>

          {/* Título */}
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#b9fa3c',
              marginBottom: '0.5rem',
            }}
          >
            Algo salió mal
          </h1>

          {/* Descripción segura — sin exponer stack trace al usuario */}
          <p style={{ color: '#a0a0b0', marginBottom: '2rem', lineHeight: 1.6 }}>
            Ocurrió un error inesperado en la plataforma. El equipo de Propio ya fue notificado.
          </p>

          {/* Acciones de recuperación */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                background: '#b9fa3c',
                color: '#0b0b0f',
                border: 'none',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.85')}
              onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
            >
              🔄 Reintentar
            </button>

            <Link
              href="/"
              style={{
                background: 'transparent',
                color: '#b9fa3c',
                border: '1px solid rgba(185,250,60,0.4)',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
            >
              🏠 Ir al inicio
            </Link>
          </div>

          {/* Digest para soporte técnico — solo si existe */}
          {error.digest && (
            <p
              style={{
                marginTop: '2rem',
                fontSize: '0.75rem',
                color: '#555',
                fontFamily: 'monospace',
              }}
            >
              Código de referencia: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
