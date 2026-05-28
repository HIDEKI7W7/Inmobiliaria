/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar errores de ESLint durante la compilación en producción
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Ignorar errores de TypeScript durante la compilación en producción
  typescript: {
    ignoreBuildErrors: false,
  },
  // Configuración de patrones de imágenes remotas para recursos del catálogo (como Unsplash)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Mapear rutas de enrutamiento dinámico solicitadas por el usuario a las rutas físicas existentes
  async rewrites() {
    return [
      {
        source: '/admin/dashboard',
        destination: '/admin',
      },
      {
        source: '/admin/properties',
        destination: '/admin',
      },
      {
        source: '/admin/propiedades',
        destination: '/admin',
      },
      {
        source: '/admin/clients',
        destination: '/admin',
      },
      {
        source: '/admin/clientes',
        destination: '/admin',
      },
      {
        source: '/admin/owners',
        destination: '/admin',
      },
      {
        source: '/admin/propietarios',
        destination: '/admin',
      },
      {
        source: '/admin/developers',
        destination: '/admin',
      },
      {
        source: '/admin/constructoras',
        destination: '/admin',
      },
      {
        source: '/admin/contracts',
        destination: '/admin',
      },
      {
        source: '/admin/contratos',
        destination: '/admin',
      },
      {
        source: '/admin/payments',
        destination: '/admin',
      },
      {
        source: '/admin/pagos',
        destination: '/admin',
      },
      {
        source: '/admin/expenses',
        destination: '/admin',
      },
      {
        source: '/admin/gastos',
        destination: '/admin',
      },
      {
        source: '/admin/reports',
        destination: '/admin',
      },
      {
        source: '/admin/reportes',
        destination: '/admin',
      },

      {
        source: '/registro',
        destination: '/login?register=true',
      },
      {
        source: '/asociate',
        destination: '/servicios',
      },
    ];
  },
};

module.exports = nextConfig;
