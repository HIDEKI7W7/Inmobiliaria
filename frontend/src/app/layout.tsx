import '../styles/globals.css';
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
}
