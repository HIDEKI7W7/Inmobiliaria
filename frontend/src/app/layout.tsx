import './globals.css';
import type { Metadata } from 'next';
import { Lora } from 'next/font/google';
import { Navbar } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import HttpInterceptor from '../components/HttpInterceptor';
import { FavoritesProvider } from '../context/FavoritesContext';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
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
      <html lang="es" className={`${lora.variable}`}>
        <body className="font-sans antialiased min-h-screen flex flex-col bg-slate-50 relative">
          <HttpInterceptor />
          <FavoritesProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
            
            {/* Botón Flotante Fijo de WhatsApp - Persistente en móvil y desktop */}
            <a
              href="https://wa.me/59171234567?text=Hola,%20quisiera%20hacer%20una%20consulta%20en%20Propio."
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 z-[9999] bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-white/20"
              aria-label="Contactar por WhatsApp"
            >
              <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.019-5.117-2.875-6.976C16.602 1.905 14.128.885 11.498.885c-5.414 0-9.822 4.417-9.826 9.862-.001 1.702.463 3.364 1.34 4.816l-.997 3.636 3.731-.978c1.41.8 3.01 1.218 4.62 1.218h.007zm14.394-7.3c-.272-.136-1.61-.795-1.86-.886-.25-.09-.432-.136-.613.136-.182.273-.705.886-.864 1.068-.159.182-.318.205-.59.069-.272-.136-1.15-.424-2.19-1.3-.183-.137-.364-.318-.545-.454-.182-.136-.318-.272-.364-.363-.09-.136-.454-.772-.454-1.408 0-.636.318-.954.454-1.09.136-.136.318-.182.409-.182.09 0 .182 0 .272.045.09 0 .227-.045.364.272.136.318.455 1.182.5 1.273.045.09.045.227 0 .318-.045.09-.136.227-.227.318-.09.09-.182.227-.09.363.136.273.545.91 1.136 1.455.773.682 1.41.91 1.59 1 .182.09.318.09.409-.045.09-.136.409-.455.5-.636.09-.182.182-.136.364-.09.182.045 1.182.59 1.364.682.182.09.318.136.364.227.09.09.09.545-.09 1-.182.454-1.09 1-1.545 1.045-.455.045-.91-.09-2.636-.772z"/>
            </svg>
          </a>
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
          <h1 className="font-serif text-2xl mb-4 uppercase">Error de Inicialización</h1>
          <p className="text-sm text-neutral-500">Ocurrió un error inesperado al cargar la plataforma. Por favor, recarga la página.</p>
        </div>
      </body>
    </html>
  );
}
}
