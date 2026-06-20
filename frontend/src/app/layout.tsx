import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import { Navbar } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import HttpInterceptor from '../components/HttpInterceptor';
import { FavoritesProvider } from '../context/FavoritesContext';
import { FloatingWhatsApp } from '../components/ui/FloatingWhatsApp';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Propio - Tu Hogar Digital Inteligentemente',
  description: 'Descubre propiedades exclusivas con la plataforma inmobiliaria moderna de Propio. Compra, vende and gestiona de manera directa y transparente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    return (
      <html lang="es" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
        <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-50 relative">
          <HttpInterceptor />
          <FavoritesProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
            
            {/* Botón Flotante Fijo de WhatsApp - Condicional por ruta */}
            <FloatingWhatsApp />
          </FavoritesProvider>
        </body>
      </html>
    );
  } catch (error) {
    console.error("Critical crash in RootLayout:", error);
    return (
      <html lang="es">
        <body className="bg-white text-black p-8 font-sans">
          <div className="max-w-md mx-auto my-20 p-8 border border-neutral-300">
            <h1 className="font-sans font-black text-2xl mb-4 uppercase">Error de Inicialización</h1>
            <p className="text-sm text-neutral-500">Ocurrió un error inesperado al cargar la plataforma. Por favor, recarga la página.</p>
          </div>
        </body>
      </html>
    );
  }
}
