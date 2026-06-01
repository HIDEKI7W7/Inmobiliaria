'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, removeToken, getRedirectPathByRole } from '@/utils/session';

const NAV_LINKS = [
  { href: '/properties', label: 'Comprar' },
  { href: '/properties?type=DEPARTAMENTO', label: 'Alquilar' },
  { href: '/servicios', label: 'Soy Propietario' },
];

// ────────────────────────────────────────────────────────────────────────────
// Logo SVG Component (reutilizable)
// ────────────────────────────────────────────────────────────────────────────
const PropioLogo = () => (
  <Link href="/" className="flex items-center gap-2 select-none active:scale-98 transition-transform">
    {/* Isotipo verde lima */}
    <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 32C10 19.8497 19.8497 10 32 10H68C80.1503 10 90 19.8497 90 32V68C90 80.1503 80.1503 90 68 90H62V60C62 53.3726 56.6274 48 50 48C43.3726 48 38 53.3726 38 60V90H32C19.8497 90 10 80.1503 10 68V32Z"
        fill="#b9fa3c"
      />
    </svg>
    {/* Wordmark en azul marino */}
    <span className="font-heading font-black text-2xl tracking-tight text-[#04045E] flex items-center gap-0.5">
      Propio<span className="text-[#b9fa3c] text-3xl leading-none font-bold">.</span>
    </span>
  </Link>
);

// ────────────────────────────────────────────────────────────────────────────
// Navbar Component
// ────────────────────────────────────────────────────────────────────────────
export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Estados de Autenticación reactivos del cliente
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/cliente');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
      setRedirectPath(getRedirectPathByRole(currentUser.role));
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
    const baseHref = href.split('?')[0];
    return pathname === baseHref;
  };

  // Do not render the Navbar on control panel, agent routes, and auth screens
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/agente') || pathname === '/login') {
    return null;
  }

  // ── Lógica de redirección para "Publicar Gratis" ──────────────────────────
  // Si hay sesión activa con rol PROPIETARIO → va al asistente de publicación
  // Cualquier otro caso (sin sesión, AGENTE, ADMIN) → va al registro público
  const handlePublicar = (e: React.MouseEvent) => {
    e.preventDefault();
    const user = getCurrentUser();
    if (user) {
      const role = user.role?.toUpperCase();
      if (role === 'PROPIETARIO' || role === 'CLIENTE') {
        // PROPIETARIO o CLIENTE → asistente de publicación
        router.push('/propietario/publicar');
      } else {
        // Cualquier otro rol se redirige a / para mantener el desacoplamiento
        router.push('/');
      }
    } else {
      // Sin sesión activa → redirigir a registro con callback para volver post-auth
      router.push('/login?tab=register&redirect=/propietario/publicar');
    }
  };

  return (
    <nav className="w-full bg-white shadow-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/95">

      {/* ── LOGO ── */}
      <PropioLogo />

      {/* ── ENLACES DE NAVEGACIÓN (desktop) ── */}
      <div className="hidden md:flex items-center gap-9 text-[11px] font-bold uppercase tracking-widest">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors duration-200 ${
              isActive(link.href)
                ? 'text-[#04045E] font-black'
                : 'text-slate-600 hover:text-[#04045E]'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* ── CTAs (desktop) ── */}
      <div className="hidden md:flex items-center gap-3">
        {/* [AYUDA] — Link secundario sutil de soporte */}
        <Link
          href="/ayuda"
          className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 ${
            isActive('/ayuda') ? 'text-[#04045E] font-black' : 'text-slate-400 hover:text-[#04045E]'
          }`}
        >
          Ayuda
        </Link>

        {/* [PUBLICAR GRATIS] — Punto de mayor conversión, verde lima */}
        <button
          onClick={handlePublicar}
          className="px-5 py-2.5 bg-[#b9fa3c] hover:bg-[#adf02c] text-[#04045E] font-heading font-black rounded-xl text-[11px] tracking-wider uppercase border border-[#04045E]/10 shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
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
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block" 
                    href="/dashboard/perfil"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Mi perfil
                  </Link>

                  <Link 
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block" 
                    href="/dashboard/visto-recientemente"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Visto recientemente
                  </Link>
                  
                  <Link 
                    className="w-full text-left px-5 py-2.5 font-bold text-neutral-900 text-[15px] hover:bg-neutral-50 transition-colors block" 
                    href="/dashboard/favoritos"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Favoritos
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
                    className="w-full text-left px-5 py-2.5 font-bold text-red-600 text-[15px] hover:bg-neutral-50 transition-colors cursor-pointer block border-none bg-transparent"
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
            className="px-5 py-2.5 rounded-xl border border-[#04045E]/40 font-bold text-[11px] tracking-wide text-[#04045E] hover:bg-[#04045E]/5 active:scale-[0.98] transition-all duration-200"
          >
            Ingresar / Registrarse
          </Link>
        )}
      </div>

      {/* ── HAMBURGUESA MÓVIL ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-[#04045E] transition-all"
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
      <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-lg transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-3 invisible pointer-events-none'
      }`}>
        <div className="px-6 py-8 flex flex-col gap-5">

          {/* Links de navegación */}
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-[11px] font-bold uppercase tracking-wider pb-2.5 border-b border-slate-100 ${
                isActive(link.href) ? 'text-[#04045E] border-[#b9fa3c]' : 'text-slate-600'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Ayuda móvil */}
          <Link
            href="/ayuda"
            onClick={() => setIsOpen(false)}
            className={`text-[11px] font-bold uppercase tracking-wider pb-2.5 border-b border-slate-100 ${
              isActive('/ayuda') ? 'text-[#04045E] border-[#b9fa3c]' : 'text-slate-400'
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
                  className="text-center py-3 border border-[#04045E]/40 text-[#04045E] font-bold rounded-xl text-[11px] hover:bg-[#04045E]/5 transition-all cursor-pointer border-none bg-transparent"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center py-3.5 border border-[#04045E]/40 text-[#04045E] font-bold rounded-xl text-[11px] hover:bg-[#04045E]/5 transition-all"
              >
                Ingresar / Registrarse
              </Link>
            )}

            {/* Publicar Gratis → validación de sesión */}
            <button
              onClick={(e) => { setIsOpen(false); handlePublicar(e); }}
              className="text-center py-3.5 bg-[#b9fa3c] hover:bg-[#adf02c] text-[#04045E] font-black uppercase tracking-wider rounded-xl text-[11px] shadow-md shadow-[#b9fa3c]/15 hover:brightness-105 transition-all border border-[#04045E]/10 flex items-center justify-center gap-1.5"
            >
              Publicar Gratis <span className="text-xs">→</span>
            </button>
          </div>

        </div>
      </div>

    </nav>
  );
};
