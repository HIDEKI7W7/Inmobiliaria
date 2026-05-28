import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { Navbar } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Propio - Tu Hogar Digital Inteligentemente',
  description: 'Descubre propiedades exclusivas con la plataforma inmobiliaria moderna de Propio. Compra, vende y gestiona de manera directa y transparente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    return (
      <html lang="es" className={`${inter.variable} ${outfit.variable} ${plusJakartaSans.variable}`}>
        <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main className="flex-grow flex flex-col">
            {children}
          </main>
          <Footer />
        </body>
      </html>
    );
  } catch (error) {
    console.error("Critical crash in RootLayout:", error);
    return (
      <html lang="es">
        <body className="bg-white text-black p-8 font-sans">
          <div className="max-w-md mx-auto my-20 p-8 border border-neutral-300">
            <h1 className="font-serif text-2xl mb-4 uppercase">Error de Inicialización</h1>
            <p className="text-sm text-neutral-500">Ocurrió un error inesperado al cargar la plataforma. Por favor, recarga la página.</p>
          </div>
        </body>
      </html>
    );
  }
}
