/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignorar errores de ESLint durante la compilación en producción
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignorar errores de TypeScript durante la compilación en producción
  typescript: {
    ignoreBuildErrors: true,
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
};

module.exports = nextConfig;
