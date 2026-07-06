'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { removeToken } from '@/utils/session';

interface ClientBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientBlockModal: React.FC<ClientBlockModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    // Eliminar token para cerrar sesión y permitir registrarse de nuevo
    removeToken();
    // Redirigir a la ruta de registro/actualización con el rol propietario (ahora con soporte de re-escritura)
    router.push('/register?role=propietario');
    // Forzar actualización del estado del Navbar / sesión local
    if (typeof window !== 'undefined') {
      window.location.href = '/register?role=propietario';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con desenfoque de cristal (Glassmorphism) */}
      <div 
        className="absolute inset-0 bg-[#000022]/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Tarjeta del Modal con Estética Linear / Supabase adaptada al tema de Propio */}
      <div className="relative w-full max-w-md bg-[#000033] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(204,255,0,0.15)] p-6 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col items-center text-center">
        
        {/* Glow Decorativo de Acento Verde Lima en la esquina superior */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#ccff00]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#ccff00]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Círculo del Icono con Acento Amarillo/Naranja de Advertencia */}
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <span className="text-2xl text-amber-400 select-none">⚠️</span>
        </div>

        {/* Título de Acceso Denegado */}
        <h3 className="font-heading font-black text-lg text-white uppercase tracking-wider mb-2">
          Acceso Restringido
        </h3>

        {/* Mensaje Explicativo de Restricción de Rol */}
        <p className="text-slate-300 text-xs font-sans leading-relaxed mb-6 px-2">
          Tu cuenta actual tiene el rol de <strong className="text-[#ccff00] font-bold">Cliente</strong> (Comprador/Inquilino). 
          Para poder publicar propiedades, necesitas registrarte o actualizar tu perfil como <strong className="text-white font-bold">Propietario</strong> o <strong className="text-white font-bold">Agente</strong>.
        </p>

        {/* Acciones del Modal */}
        <div className="w-full flex flex-col sm:flex-row gap-3">
          {/* Botón Secundario: Cerrar */}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 active:scale-[0.98] transition-all duration-200"
          >
            Volver
          </button>
          
          {/* Botón Principal: Registrarse / Actualizar */}
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2.5 bg-[#ccff00] hover:bg-[#b5e600] text-[#000033] font-sans font-black text-xs uppercase tracking-wider rounded-xl border border-[#ccff00]/25 shadow-[0_4px_12px_rgba(204,255,0,0.2)] active:scale-[0.98] transition-all duration-200"
          >
            Actualizar Perfil
          </button>
        </div>

      </div>
    </div>
  );
};
