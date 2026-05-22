'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '../../components/ui/Navbar';
import { propertiesService } from '../../services/properties.service';
import { Property } from '../../components/modules/properties/PropertyCard';

export default function PropietarioDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargamos las propiedades del propietario owner-1
  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        // Filtrar en backend o localmente por ownerId = 'owner-1'
        const allProperties = await propertiesService.getProperties({ verifiedOnly: false });
        // Filtrar por ownerId si lo soporta el objeto, o tomamos las mockeadas del propietario
        const ownerProperties = allProperties.filter(
          (p: any) => p.ownerId === 'owner-1' || p.id === '1' || p.id === '4'
        );
        setProperties(ownerProperties);
      } catch (error) {
        console.error('Error al cargar propiedades del propietario:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  return (
    <div className="min-h-screen bg-[#010102] text-[#f7f8f8] flex flex-col font-sans selection:bg-[#5e6ad2]/30 selection:text-white">
      {/* Navbar Superior */}
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 space-y-12">
        {/* Encabezado del Panel */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#23252a]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141516] border border-[#23252a]">
              <span className="h-2 w-2 rounded-full bg-[#5e6ad2] animate-pulse"></span>
              <span className="text-xs font-medium tracking-wider text-[#8a8f98] uppercase">
                Área de Autoservicio
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-semibold tracking-tight text-[#f7f8f8] uppercase leading-none">
              Panel del Propietario
            </h1>
            <p className="text-sm text-[#8a8f98] font-sans font-medium">
              Gestiona tus inmuebles, revisa el estado legal y publica nuevos activos en el ecosistema Propio.
            </p>
          </div>

          <div>
            <a
              href="/propietario/nuevo"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#5e6ad2] hover:bg-[#828fff] text-white font-sans font-medium text-sm rounded-lg shadow-lg hover:shadow-[#5e6ad2]/20 transition-all duration-300 transform active:scale-95 gap-2"
            >
              <span>Publicar Inmueble 🚀</span>
            </a>
          </div>
        </div>

        {/* Métrica de Estado de Activos (Cards en Surface-1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0f1011] p-6 rounded-xl border border-[#23252a] space-y-4">
            <p className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">Total de Inmuebles</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight">{properties.length}</span>
              <span className="text-xs text-[#8a8f98] px-2 py-0.5 rounded-full bg-[#141516] border border-[#23252a]">Activos</span>
            </div>
          </div>

          <div className="bg-[#0f1011] p-6 rounded-xl border border-[#23252a] space-y-4">
            <p className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">Sello de Oro Verificado</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#27a644]">
                {properties.filter((p) => p.verified).length}
              </span>
              <span className="text-xs text-[#27a644]/10 text-[#27a644] px-2 py-0.5 rounded-full bg-[#27a644]/5 border border-[#27a644]/20">Seguro</span>
            </div>
          </div>

          <div className="bg-[#0f1011] p-6 rounded-xl border border-[#23252a] space-y-4">
            <p className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">En Revisión Legal</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-amber-500">
                {properties.filter((p) => !p.verified).length}
              </span>
              <span className="text-xs text-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/5 border border-amber-500/20">Trámite</span>
            </div>
          </div>

          <div className="bg-[#0f1011] p-6 rounded-xl border border-[#23252a] space-y-4">
            <p className="text-xs font-semibold text-[#8a8f98] uppercase tracking-wider">Interesados (Leads)</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-[#5e6ad2]">
                {properties.length * 3}
              </span>
              <span className="text-xs text-[#5e6ad2]/10 text-[#5e6ad2] px-2 py-0.5 rounded-full bg-[#5e6ad2]/5 border border-[#5e6ad2]/20">Potenciales</span>
            </div>
          </div>
        </div>

        {/* Sección de Catálogo Personal */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#f7f8f8]">
              Mis Propiedades Publicadas
            </h2>
            <span className="text-xs text-[#8a8f98] font-mono">
              Mostrando {properties.length} inmuebles en Cochabamba
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center bg-[#0f1011] rounded-xl border border-[#23252a]">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#23252a] border-t-[#5e6ad2]"></div>
                <p className="text-xs text-[#8a8f98] font-bold uppercase tracking-wider animate-pulse">
                  Cargando catálogo personal...
                </p>
              </div>
            </div>
          ) : properties.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-[#0f1011] rounded-xl border border-[#23252a] p-8 text-center space-y-4">
              <span className="text-3xl">🏡</span>
              <div className="space-y-1">
                <h3 className="font-bold text-[#f7f8f8]">¿Aún no has publicado ninguna propiedad?</h3>
                <p className="text-xs text-[#8a8f98] max-w-sm">
                  Registra tu primera casa, departamento, terreno u oficina para conectar directamente con miles de compradores sin intermediarios.
                </p>
              </div>
              <a
                href="/propietario/nuevo"
                className="px-4 py-2 bg-[#141516] hover:bg-[#18191a] text-white border border-[#23252a] text-xs font-semibold uppercase tracking-wider rounded-md transition-all"
              >
                Comenzar Carga asistida
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-[#0f1011] rounded-xl border border-[#23252a] overflow-hidden flex flex-col justify-between hover:border-[#3e3e44] hover:bg-[#141516] transition-all duration-300"
                >
                  <div className="relative h-48 w-full bg-[#141516]">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    {property.verified && (
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-[#27a644] text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <span>🏆</span> Sello Oro
                      </div>
                    )}
                    {!property.verified && (
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                        <span>⚖️</span> En Validación
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#18191a] border border-[#23252a] text-[#8a8f98]">
                          {property.type}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#18191a] border border-[#23252a] text-[#8a8f98]">
                          {property.area} m²
                        </span>
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-[#f7f8f8] hover:text-[#5e6ad2] transition-colors">
                        {property.title}
                      </h3>
                      <p className="text-xs text-[#8a8f98] font-sans font-medium line-clamp-2">
                        {property.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#23252a] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[10px] uppercase font-bold text-[#8a8f98] tracking-wider">Precio pretendido</p>
                        <p className="text-xl font-extrabold text-[#f7f8f8]">
                          ${property.price.toLocaleString()} <span className="text-xs text-[#8a8f98] font-medium">USD</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => alert(`Visualizando detalles y leads de: ${property.title}`)}
                          className="px-3 py-1.5 bg-[#141516] hover:bg-[#18191a] text-white border border-[#23252a] text-xs font-semibold rounded-md transition-all"
                        >
                          Ver Leads (3) 📬
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
