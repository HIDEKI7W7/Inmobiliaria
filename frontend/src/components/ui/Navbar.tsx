'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getCurrentUser, removeToken, getRedirectPathByRole, getToken } from '@/utils/session';
import { useFavorites } from '@/context/FavoritesContext';
import { ClientBlockModal } from './ClientBlockModal';

const NAV_LINKS = [
  { href: '/properties?category=VENTA', label: 'COMPRAR' },
  { href: '/properties?category=ALQUILER', label: 'ALQUILAR' },
  { href: '/properties?category=ANTICRETICO', label: 'ANTICRETICO' },
  { href: '/properties?category=PROYECTOS', label: 'PROYECTOS' },
  { href: '/servicios', label: 'SOY PROPIETARIO' },
];

// ────────────────────────────────────────────────────────────────────────────
// Logo SVG Component (reutilizable)
// ────────────────────────────────────────────────────────────────────────────
const PropioLogo = () => (
  <div className="flex flex-col items-start leading-none select-none active:scale-98 transition-transform">
    <Link href="/" className="flex items-center gap-1.5">
      {/* Isotipo verde lima */}
      <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
          fill="#ccff00"
        />
      </svg>
      {/* Wordmark en blanco */}
      <span className="font-heading font-black text-xl tracking-tight text-white flex items-center gap-0.5">
        Propio<span className="text-[#ccff00] text-2xl leading-none font-bold">.</span>
      </span>
    </Link>
    {/* Eslogan oficial */}
    <span className="text-[7.5px] font-medium text-slate-350 tracking-wide leading-none select-none pl-0.5 mt-[-1px]">
      Hazlo seguro. Hazlo tuyo. Hazlo propio.
    </span>
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
// Navbar Component
// ────────────────────────────────────────────────────────────────────────────
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de Autenticación reactivos del cliente
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/cliente');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { favorites } = useFavorites();
  const [vistosRecientes, setVistosRecientes] = useState<any[]>([]);

  useEffect(() => {
    const token = getToken();
    if (isDropdownOpen && isAuthenticated && token) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

      fetch(`${apiBaseUrl}/historial-vistas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setVistosRecientes(data))
        .catch(err => console.error("Error historial UI:", err));
    }
  }, [isDropdownOpen, isAuthenticated]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
      // Pasar los 3 argumentos para calcular correctamente el destino del panel
      setRedirectPath(
        getRedirectPathByRole(
          currentUser.role,
          (currentUser as any).objective ?? null,
          (currentUser as any).onboardingCompleted ?? true
        )
      );
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [pathname]); // Recargar al cambiar de ruta para reflejar cambios de sesión

  // Detector de clics externos para cerrar el dropdown flotante
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estado para controlar si el encabezado es sticky
  const [isHeaderSticky, setIsHeaderSticky] = useState(true);

  useEffect(() => {
    if (pathname !== '/') {
      // En otras páginas o rutas, según especificación se ajusta (deja de ser fijo)
      setIsHeaderSticky(false);
      return;
    }

    const handleScroll = () => {
      // La sección inicial (Hero) ocupará calc(100vh - 60px).
      // Deja de ser fijo cuando el scroll supera el alto de la pantalla inicial.
      const threshold = window.innerHeight - 60;
      if (window.scrollY >= threshold) {
        setIsHeaderSticky(false);
      } else {
        setIsHeaderSticky(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Función para obtener las iniciales de manera segura
  const obtenerIniciales = () => {
    if (!user) return 'CC';
    const nombreCompleto = user.name || user.email?.split('@')[0] || 'Cliente';
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length >= 2) {
      return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }
    return nombreCompleto.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
    setIsDropdownOpen(false);
    router.push('/');
  };

  const isActive = (href: string) => {
    const url = new URL(href, 'http://localhost');
    const category = url.searchParams.get('category');
    if (category) {
      const currentCategory = searchParams.get('category');
      return pathname === url.pathname && String(currentCategory).toUpperCase().trim() === String(category).toUpperCase().trim();
    }
    return pathname === url.pathname && !searchParams.get('category');
  };

  // Do not render the Navbar on control panel, agent routes, and auth screens
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/agente') || pathname === '/login') {
    return null;
  }

  // ── Lógica de redirección para "Publicar Gratis" ──────────────────────────
  // Si hay sesión activa con rol PROPIETARIO → va al asistente de publicación
  // Si el rol es CLIENTE → se muestra el modal de bloqueo
  // Cualquier otro caso (sin sesión, AGENTE, ADMIN) → va a la ruta correspondiente o al registro
  const handlePublicar = (e: React.MouseEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (user) {
      const role = user.role?.toUpperCase();
      if (role === 'CLIENTE') {
        setIsBlockModalOpen(true);
      } else if (role === 'ADMIN') {
        router.push('/admin'); // Admin dashboard
      } else if (role === 'AGENTE') {
        router.push('/agente/propiedades'); // Agent properties dashboard
      } else {
        router.push('/propietario/publicar'); // Owner assistant
      }
    } else {
      // Sin sesión activa → redirigir a registro con callback para volver post-auth
      router.push('/login?tab=register&redirect=/propietario/publicar');
    }
  };

  return (
    <nav className={`w-full h-[60px] bg-[#000033] shadow-md border-b border-white/10 px-6 py-2.5 flex items-center justify-between z-50 shrink-0 ${
      isHeaderSticky ? 'sticky top-0' : 'relative'
    }`}>

      {/* ── LOGO ── */}
      <PropioLogo />

      {/* ── ENLACES DE NAVEGACIÓN (desktop) ── */}
      <div className="hidden lg:flex items-center gap-9 text-[11px] font-bold uppercase tracking-widest">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors duration-200 ${
              isActive(link.href)
                ? 'text-[#ccff00] font-black'
                : 'text-white/85 hover:text-[#ccff00]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* ── CTAs (desktop) ── */}
      <div className="hidden lg:flex items-center gap-3">
        {/* [AYUDA] — Link secundario sutil de soporte */}
        <Link
          href="/ayuda"
          className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 ${
            isActive('/ayuda') ? 'text-[#ccff00] font-black' : 'text-white/60 hover:text-[#ccff00]'
          }`}
        >
          Ayuda
        </Link>

        {/* [PUBLICAR GRATIS] — Punto de mayor conversión, verde lima */}
        <button
          onClick={handlePublicar}
          className="px-5 py-2.5 bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-heading font-black rounded-xl text-[11px] tracking-wider uppercase border border-[#ccff00]/10 shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
        >
          Publicar Gratis <span className="text-xs">→</span>
        </button>

        {/* [INGRESAR / AVATAR DROPDOWN] */}
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-[#0A4D54] text-white font-bold text-sm rounded-full w-9 h-9 flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 border border-white shadow-sm"
            >
              {obtenerIniciales()}
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-3.5 z-50 text-left font-sans animate-fade-in transform origin-top-right">
                
                <div className="flex flex-col">
                  
                  <Link
                    className="w-full text-left px-5 py-2.5 font-sans font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block"
                    href={redirectPath}
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Mi perfil
                  </Link>

                  <Link 
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block" 
                    href="/dashboard/visto-recientemente"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Visto recientemente {vistosRecientes.length > 0 ? `(${vistosRecientes.length})` : ''}
                  </Link>
                  
                  <Link 
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block" 
                    href="/dashboard/favoritos"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Favoritos {favorites.length > 0 ? `(${favorites.length})` : ''}
                  </Link>

                  <Link 
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block" 
                    href="/dashboard/configuracion"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Configuración de la cuenta
                  </Link>
                  
                  <button 
                    onClick={() => {
                      handleLogout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors cursor-pointer block border-none bg-transparent"
                  >
                    Cerrar sesión
                  </button>
                </div>

              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-[#03034f] font-bold text-[11px] tracking-wide text-white active:scale-[0.98] transition-all duration-200 shadow-sm border border-brand-blue/20"
          >
            Ingresar / Registrarse
          </Link>
        )}
      </div>

      {/* ── HAMBURGUESA MÓVIL ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden p-2 rounded-xl text-white/80 hover:bg-white/5 hover:text-white transition-all"
        aria-label="Menú principal"
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* ── CAJÓN MÓVIL ── */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-[#000033] border-b border-white/10 shadow-lg transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-3 invisible pointer-events-none'
      }`}>
        <div className="px-6 py-8 flex flex-col gap-5">

          {/* Links de navegación */}
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-[11px] font-bold uppercase tracking-wider pb-2.5 border-b border-white/10 ${
                isActive(link.href) ? 'text-[#ccff00] border-[#ccff00]' : 'text-white/80'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Ayuda móvil */}
          <Link
            href="/ayuda"
            onClick={() => setIsOpen(false)}
            className={`text-[11px] font-bold uppercase tracking-wider pb-2.5 border-b border-white/10 ${
              isActive('/ayuda') ? 'text-[#ccff00] border-[#ccff00]' : 'text-white/60'
            }`}
          >
            Ayuda
          </Link>

          {/* CTAs móviles */}
          <div className="flex flex-col gap-3 pt-2">
            {/* Ingresar → condicional a sesión */}
            {isAuthenticated ? (
              <>
                <Link
                  href={redirectPath}
                  onClick={() => setIsOpen(false)}
                  className="text-center py-3 bg-[#0A4D54] text-white font-bold rounded-xl text-[11px] hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold">
                    {obtenerIniciales()}
                  </span>
                  Mi Panel ({user?.name || user?.email?.split('@')[0] || 'Mi cuenta'})
                </Link>
                <button
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="text-center py-3 border border-white/40 text-white font-bold rounded-xl text-[11px] hover:bg-white/5 transition-all cursor-pointer border-none bg-transparent"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center py-3.5 bg-brand-blue text-white font-bold rounded-xl text-[11px] hover:bg-[#03034f] transition-all shadow-sm border border-brand-blue/20"
              >
                Ingresar / Registrarse
              </Link>
            )}

            {/* Favoritos móvil */}
            <Link
              href="/dashboard/favoritos"
              onClick={() => setIsOpen(false)}
              className="text-center py-3 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl text-[11px] transition-all flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill={favorites.length > 0 ? '#b9fa3c' : 'none'} viewBox="0 0 24 24" stroke={favorites.length > 0 ? '#b9fa3c' : 'currentColor'} strokeWidth={2.5} className="w-4 h-4 transition-transform duration-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              Favoritos {favorites.length > 0 ? `(${favorites.length})` : ''}
            </Link>

            {/* Publicar Gratis → validación de sesión */}
            <button
              onClick={(e) => { setIsOpen(false); handlePublicar(e); }}
              className="text-center py-3.5 bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-black uppercase tracking-wider rounded-xl text-[11px] shadow-md transition-all border border-white/10 flex items-center justify-center gap-1.5"
            >
              Publicar Gratis <span className="text-xs">→</span>
            </button>
          </div>

        </div>
      </div>

      <ClientBlockModal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} />
    </nav>
  );
};
