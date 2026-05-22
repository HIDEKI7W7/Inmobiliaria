'use client';

import React, { useEffect, useState } from 'react';
import { propertiesService } from '../../services/properties.service';
import { Property } from '../../components/modules/properties/PropertyCard';

export default function AdminDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [observationNotes, setObservationNotes] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'NUEVA_PUBLICACION' | 'TODAS'>('NUEVA_PUBLICACION');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Carga de propiedades
  const loadProperties = async () => {
    try {
      setLoading(true);
      // Obtenemos todos los registros. 
      // El backend o mock retornará el catálogo completo
      const data = await propertiesService.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error al cargar inventario comercial:', error);
      showToast('Error al conectar con la base de datos comercial', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Filtrado de propiedades según vista (Pendientes vs Todas)
  const filteredProperties = properties.filter((p) => {
    if (filterStatus === 'NUEVA_PUBLICACION') {
      return p.status === 'NUEVA_PUBLICACION';
    }
    return true;
  });

  // Handler para Aprobar Propiedad
  const handleApprove = async (id: string) => {
    try {
      setActionLoadingId(id);
      // Usar token de administrador para RBAC
      const res = await propertiesService.updatePropertyStatus(id, 'APROBADO', undefined, 'mock-admin-token');
      
      // Actualizar estado local
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'APROBADO', verified: true, isVerified: true }
            : p
        )
      );
      
      showToast('¡Inmueble aprobado exitosamente! Publicado en catálogo', 'success');
    } catch (error) {
      console.error('Error al aprobar propiedad:', error);
      showToast('No se pudo validar el inmueble. Verifique permisos.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handler para iniciar Observación
  const openObserveModal = (property: Property) => {
    setSelectedProperty(property);
    setObservationNotes('');
    setIsModalOpen(true);
  };

  // Confirmación de Observación
  const handleObserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;
    if (!observationNotes.trim()) {
      showToast('Debe ingresar un comentario técnico para observar la publicación', 'error');
      return;
    }

    try {
      const id = selectedProperty.id;
      setActionLoadingId(id);
      setIsModalOpen(false);

      const res = await propertiesService.updatePropertyStatus(id, 'OBSERVADO', observationNotes, 'mock-admin-token');

      // Actualizar estado local
      setProperties((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'OBSERVADO', observationNotes, verified: false, isVerified: false }
            : p
        )
      );

      showToast('Inmueble marcado como OBSERVADO con notas de corrección', 'success');
    } catch (error) {
      console.error('Error al observar propiedad:', error);
      showToast('No se pudo guardar la observación.', 'error');
    } finally {
      setActionLoadingId(null);
      setSelectedProperty(null);
    }
  };

  // Mapeo estilizado de badges del Checklist Documental
  const renderDocumentChecklist = (property: Property) => {
    const docs = [
      { label: 'FR', name: 'Folio Real', active: property.hasFolioReal },
      { label: 'CT', name: 'Catastro', active: property.hasCatastro },
      { label: 'TS', name: 'Testimonio', active: property.hasTestimonio },
      { label: 'IA', name: 'Impuestos', active: property.hasImpuestosAlDia },
      { label: 'US', name: 'Plano Suelo', active: property.hasPlanoUsoSuelo },
      { label: 'CI', name: 'Cédula Identidad', active: property.hasCI },
    ];

    return (
      <div className="flex flex-wrap gap-1.5 justify-start">
        {docs.map((doc, idx) => (
          <div
            key={idx}
            title={`${doc.name}: ${doc.active ? 'Presentado' : 'Falta'}`}
            className={`px-2 py-1 rounded text-[10px] font-sans font-black tracking-wider transition-all duration-300 ${
              doc.active
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-black shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                : 'bg-[#181a20] text-slate-500 border border-slate-800'
            }`}
          >
            {doc.label}
          </div>
        ))}
      </div>
    );
  };

  // Mapeo estilizado del estado legal con la paleta de semáforos de Propio
  const renderStatusBadge = (status?: string) => {
    const s = status || 'NUEVA_PUBLICACION';
    if (s === 'APROBADO' || s === 'LEGAL_VERDE') {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-sans font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          APROBADO
        </span>
      );
    }
    if (s === 'OBSERVADO' || s === 'LEGAL_AMARILLO') {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-sans font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          OBSERVADO
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-sans font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 w-fit">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
        PENDIENTE VALIDAR
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#030310] text-[#e2e8f0] flex flex-col font-sans relative overflow-hidden">
      
      {/* Fondo Premium Holográfico y de Rejilla */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#090b24_1px,transparent_1px),linear-gradient(to_bottom,#090b24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
      
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#0f112e]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a18] border border-[#161a3f]">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Panel Interno de Control Comercial
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-tight text-white uppercase leading-none">
              Inventario Entrante
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl font-medium">
              Monitor comercial y legal de solicitudes de autoservicio de Propietarios. Valida o añade observaciones para habilitar propiedades en el portal público.
            </p>
          </div>

          {/* Toggle de Filtros de Visualización */}
          <div className="flex bg-[#070716] p-1 rounded-xl border border-[#161a3f]">
            <button
              onClick={() => setFilterStatus('NUEVA_PUBLICACION')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                filterStatus === 'NUEVA_PUBLICACION'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendientes ({properties.filter((p) => p.status === 'NUEVA_PUBLICACION').length})
            </button>
            <button
              onClick={() => setFilterStatus('TODAS')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                filterStatus === 'TODAS'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ver Todo ({properties.length})
            </button>
          </div>
        </div>

        {/* Métricas e Indicadores de Control */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-[#050514]/75 backdrop-blur-md p-6 rounded-2xl border border-[#161a3f] flex flex-col justify-between hover:border-[#222960] transition-all">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En Bandeja Pendiente</span>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-white">{properties.filter((p) => p.status === 'NUEVA_PUBLICACION').length}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-black tracking-wider">
                Nueva Carga
              </span>
            </div>
          </div>

          <div className="bg-[#050514]/75 backdrop-blur-md p-6 rounded-2xl border border-[#161a3f] flex flex-col justify-between hover:border-[#222960] transition-all">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aprobadas / Activas</span>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-400">
                {properties.filter((p) => p.status === 'APROBADO' || p.status === 'LEGAL_VERDE').length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-black tracking-wider">
                Sello Oro
              </span>
            </div>
          </div>

          <div className="bg-[#050514]/75 backdrop-blur-md p-6 rounded-2xl border border-[#161a3f] flex flex-col justify-between hover:border-[#222960] transition-all">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observadas con Notas</span>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-amber-500">
                {properties.filter((p) => p.status === 'OBSERVADO' || p.status === 'LEGAL_AMARILLO').length}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase font-black tracking-wider">
                Corrigiendo
              </span>
            </div>
          </div>

          <div className="bg-[#050514]/75 backdrop-blur-md p-6 rounded-2xl border border-[#161a3f] flex flex-col justify-between hover:border-[#222960] transition-all">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasa de Aceptación</span>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-200">
                {properties.length > 0
                  ? Math.round(
                      (properties.filter((p) => p.status === 'APROBADO' || p.status === 'LEGAL_VERDE').length /
                        properties.length) *
                        100
                    )
                  : 0}
                %
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-700 uppercase font-black tracking-wider">
                Rendimiento
              </span>
            </div>
          </div>
        </div>

        {/* Listado / Tabla Principal (Diseño Mobile-First) */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center bg-[#050514]/75 backdrop-blur-md rounded-2xl border border-[#161a3f]">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#161a3f] border-t-amber-500 mb-4"></div>
            <p className="text-xs uppercase font-black tracking-widest text-slate-400 animate-pulse">
              Consultando base de datos legal de Propio...
            </p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-[#050514]/75 backdrop-blur-md rounded-2xl border border-[#161a3f] text-center p-8 space-y-4">
            <span className="text-4xl animate-bounce">📋</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase">Bandeja Vacía</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No quedan inmuebles pendientes por validar en el estado de {filterStatus === 'NUEVA_PUBLICACION' ? 'Nuevas Publicaciones' : 'Catálogo Completo'}.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabla Compacta Ejecutiva (Visible en Desktop) */}
            <div className="hidden lg:block overflow-hidden bg-[#050514]/75 backdrop-blur-md rounded-2xl border border-[#161a3f]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#161a3f] bg-[#070719]/90 text-[10px] font-sans font-black uppercase tracking-wider text-slate-400">
                    <th className="py-4 px-6">Detalles Inmueble</th>
                    <th className="py-4 px-6">Propietario / Fecha</th>
                    <th className="py-4 px-6">Oferta / Precio</th>
                    <th className="py-4 px-6">Checklist Documental</th>
                    <th className="py-4 px-6">Estado Legal</th>
                    <th className="py-4 px-6 text-right">Herramientas de Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0f112e] text-xs font-sans">
                  {filteredProperties.map((property) => (
                    <tr
                      key={property.id}
                      className="hover:bg-[#090a24]/40 transition-colors duration-200"
                    >
                      {/* Detalles */}
                      <td className="py-4.5 px-6 space-y-1 max-w-xs">
                        <p className="font-extrabold text-white uppercase tracking-tight truncate hover:text-amber-400 transition-colors cursor-pointer" title={property.title}>
                          {property.title}
                        </p>
                        <div className="flex gap-2 text-[10px] text-slate-400">
                          <span className="uppercase font-bold">{property.type}</span>
                          <span>•</span>
                          <span>{property.area} m²</span>
                          <span>•</span>
                          <span>{property.rooms} Hab.</span>
                        </div>
                      </td>

                      {/* Propietario */}
                      <td className="py-4.5 px-6 space-y-1">
                        <p className="font-bold text-white">{property.ownerName || 'Propietario Legítimo'}</p>
                        <p className="text-[10px] text-slate-400">
                          {property.createdAt
                            ? new Date(property.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Fecha Indefinida'}
                        </p>
                      </td>

                      {/* Oferta y Precio */}
                      <td className="py-4.5 px-6 space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-sans font-black tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                          Venta
                        </span>
                        <p className="font-black text-white text-sm">
                          ${property.price.toLocaleString()}{' '}
                          <span className="text-[10px] text-slate-400 font-bold">USD</span>
                        </p>
                      </td>

                      {/* Checklist Documental */}
                      <td className="py-4.5 px-6">
                        {renderDocumentChecklist(property)}
                      </td>

                      {/* Estado */}
                      <td className="py-4.5 px-6">
                        <div className="space-y-1.5">
                          {renderStatusBadge(property.status)}
                          {property.observationNotes && (
                            <p className="text-[10px] text-amber-500 font-sans italic max-w-[160px] line-clamp-1" title={property.observationNotes}>
                              Nota: {property.observationNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Botones de Control */}
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          {property.status === 'NUEVA_PUBLICACION' ? (
                            <>
                              <button
                                onClick={() => handleApprove(property.id)}
                                disabled={actionLoadingId === property.id}
                                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-black font-sans font-black tracking-wider text-[10px] rounded-lg transition-all transform active:scale-95 uppercase flex items-center gap-1 shadow-md shadow-emerald-500/10"
                              >
                                {actionLoadingId === property.id ? '...' : 'Aprobar'}
                              </button>
                              <button
                                onClick={() => openObserveModal(property)}
                                disabled={actionLoadingId === property.id}
                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-black font-sans font-black tracking-wider text-[10px] rounded-lg transition-all transform active:scale-95 uppercase shadow-md shadow-amber-500/10"
                              >
                                Observar
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Evaluado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Layout de Tarjetas Táctiles Modernas (Visible en Móviles) */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-[#050514]/75 backdrop-blur-md rounded-2xl border border-[#161a3f] p-5 flex flex-col justify-between space-y-4 hover:border-[#222960] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[8px] font-sans font-black tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase mb-1">
                          Venta
                        </span>
                        <h3 className="font-extrabold text-white text-base leading-snug uppercase">
                          {property.title}
                        </h3>
                      </div>
                      {renderStatusBadge(property.status)}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 py-1.5 border-b border-[#0f112e]">
                      <span>{property.ownerName || 'Propietario Legítimo'}</span>
                      <span className="font-mono">
                        {property.createdAt
                          ? new Date(property.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center bg-[#07071c] p-2 rounded-xl text-[10px] text-slate-400">
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black">Área</span>
                        <span className="font-bold text-white">{property.area} m²</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black">Precio</span>
                        <span className="font-bold text-white">${property.price.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-500 uppercase font-black">Habitaciones</span>
                        <span className="font-bold text-white">{property.rooms}</span>
                      </div>
                    </div>

                    {/* Checklist Documental */}
                    <div className="space-y-1.5 pt-1">
                      <span className="block text-[8px] text-slate-500 uppercase font-black tracking-widest">
                        Checklist Legal
                      </span>
                      {renderDocumentChecklist(property)}
                    </div>

                    {property.observationNotes && (
                      <div className="bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                        <p className="text-[10px] text-amber-500 font-sans leading-relaxed">
                          <span className="font-bold uppercase tracking-wider block text-[8px] mb-0.5">Motivo de Observación:</span>
                          "{property.observationNotes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones de Validación en Mobile */}
                  {property.status === 'NUEVA_PUBLICACION' && (
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#0f112e]">
                      <button
                        onClick={() => handleApprove(property.id)}
                        disabled={actionLoadingId === property.id}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-black font-sans font-black tracking-wider text-[10px] rounded-xl transition-all uppercase text-center shadow-lg"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => openObserveModal(property)}
                        disabled={actionLoadingId === property.id}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-black font-sans font-black tracking-wider text-[10px] rounded-xl transition-all uppercase text-center shadow-lg"
                      >
                        Observar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Observaciones (Glassmorphism Premium) */}
      {isModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010106]/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#050514] border border-[#161a3f] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="bg-[#07071d] px-6 py-4.5 border-b border-[#161a3f] flex items-center justify-between">
              <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                Observar Publicación
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleObserveSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inmueble Seleccionado</span>
                <p className="text-xs font-black text-white uppercase truncate">{selectedProperty.title}</p>
                <p className="text-[10px] text-slate-500">Por {selectedProperty.ownerName || 'Propietario Legítimo'}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Comentario de Observación Técnica
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detalla detalladamente los motivos del rechazo comercial (ej: 'El plano de uso de suelo está incompleto o de baja calidad, por favor escanear de nuevo.')"
                  value={observationNotes}
                  onChange={(e) => setObservationNotes(e.target.value)}
                  className="w-full bg-[#08081f] text-xs text-white border border-[#161a3f] focus:border-amber-500 rounded-xl p-3 focus:outline-none transition-all placeholder:text-slate-600 resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#0a0a1f] border border-[#161a3f] hover:bg-[#0f1136] text-slate-300 font-sans font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-sans font-black text-[10px] rounded-lg uppercase tracking-wider transition-all transform active:scale-95 shadow-md shadow-amber-500/10"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Toast Notification Premium */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-4.5 py-3 rounded-xl border shadow-xl ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
          >
            <span className="text-sm">{toast.type === 'success' ? '🏆' : '⚠️'}</span>
            <span className="text-xs font-sans font-bold tracking-tight text-white">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
