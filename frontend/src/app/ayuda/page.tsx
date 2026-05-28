'use client';

import { useState } from 'react';
import Link from 'next/link';

// ── DEFINICIÓN DE TIPOS ──────────────────────────────────────────────────────
type Rol = 'profesional' | 'propietario' | 'inquilino' | null;

interface FAQQuestion {
  id: string;
  q: string;
  a: string;
}

interface FAQCategory {
  categorias: Record<string, FAQQuestion[]>;
}

// ── CONSTANTE FAQ_TREE (ESTRUCTURA COMPLEJA DE CATEGORÍAS) ───────────────────
const FAQ_TREE: Record<NonNullable<Rol>, FAQCategory> = {
  profesional: {
    categorias: {
      "Radar de Cierre (Kanban)": [
        {
          id: "prof-kanban-1",
          q: "¿Cómo muevo un lead entre columnas en el Radar de Cierre?",
          a: "El Radar de Cierre utiliza un tablero Kanban 100% visual. Simplemente haz clic sostenido sobre la tarjeta del lead y arrástrala horizontalmente a la columna de la nueva etapa (ej. de 'Contactado' a 'Visitado'). El sistema guardará el progreso automáticamente y actualizará las estadísticas en tu panel operativo."
        },
        {
          id: "prof-kanban-2",
          q: "¿Qué significa el estado 'Perdido' en el embudo y cómo afecta las métricas?",
          a: "Marcar un lead como 'Perdido' cierra la oportunidad activa especificando el motivo (ej. precio alto, falta de interés). Esto detiene el seguimiento automatizado y excluye el lead de los cierres activos, pero te brinda valiosa información estadística para analizar por qué no se concretó la venta."
        }
      ],
      "Automatizaciones de WhatsApp": [
        {
          id: "prof-auto-1",
          q: "¿Dónde configuro mi número de WhatsApp para notificaciones de leads?",
          a: "Dirígete a tu Perfil Profesional > Configuración > Integraciones de Contacto. Introduce tu número en formato internacional (ej. +591...) y activa la casilla 'Recibir notificaciones inmediatas'. Así, cuando un interesado haga clic en tu propiedad, recibirás una plantilla de contacto al instante."
        },
        {
          id: "prof-auto-2",
          q: "¿Puedo personalizar las plantillas de mensajes automatizados?",
          a: "Sí. Dentro del panel de configuración de integraciones, puedes modificar el cuerpo del mensaje utilizando variables dinámicas como {nombre_cliente}, {nombre_propiedad} y {precio}."
        }
      ],
      "Reportes de Conversión": [
        {
          id: "prof-rep-1",
          q: "¿Cómo puedo generar un reporte de conversión mensual de mis cierres?",
          a: "En el menú lateral de tu Dashboard, ve a la sección 'Reportes y Analíticas'. Filtra por el rango de fechas mensual que deseas evaluar y haz clic en 'Exportar PDF'. El informe incluirá tasas de conversión por etapa, tiempos medios de respuesta y el valor total de la cartera gestionada."
        }
      ]
    }
  },
  propietario: {
    categorias: {
      "Sello Oro de Verificación": [
        {
          id: "prop-sello-1",
          q: "¿Qué documentos necesito para obtener el Sello Oro de Verificación?",
          a: "Para certificar tu propiedad con el Sello Oro y multiplicar tus visitas, debes subir copias digitales de: 1) Folio Real actualizado, 2) Testimonio de Propiedad (Escritura pública), 3) Impuestos municipales pagados de la última gestión, y 4) Plano catastral aprobado. Nuestro equipo legal auditará la veracidad de los folios de forma totalmente segura."
        },
        {
          id: "prop-sello-2",
          q: "¿Cuánto tiempo tarda la verificación legal de mi propiedad?",
          a: "Una vez cargados todos los documentos de respaldo en la pestaña 'Seguimiento Legal', el equipo de abogados de Propio procesa y valida la información en un plazo máximo de 48 horas hábiles. Si todo está al día, el Sello Oro se activará de inmediato."
        }
      ],
      "Gestión de Publicaciones": [
        {
          id: "prop-pub-1",
          q: "¿Cómo edito el precio o la descripción de mi publicación activa?",
          a: "Inicia sesión, accede a tu 'Dashboard de Propietario' y desplázate al listado de tus inmuebles. Haz clic en el botón 'Editar Publicación' en la tarjeta correspondiente. Modifica la información deseada (precios, fotos o texto descriptivo) y presiona 'Guardar Cambios'."
        },
        {
          id: "prop-pub-2",
          q: "¿Puedo pausar mi publicación temporalmente sin perder el progreso?",
          a: "Totalmente. Si estás negociando una oferta o deseas suspender las visitas por unos días, ve a tu panel de control, ubica la tarjeta de la propiedad y cambia el interruptor de estado de 'Publicado' a 'Pausado'."
        }
      ]
    }
  },
  inquilino: {
    categorias: {
      "Búsqueda y Filtros": [
        {
          id: "inq-bus-1",
          q: "¿Cómo puedo filtrar propiedades por zonas específicas en Bolivia?",
          a: "Utiliza nuestra barra de búsqueda interactiva en el inicio. Introduce el departamento o ciudad (ej. Cochabamba) y haz clic en 'Filtros Avanzados'. Allí podrás acotar tu búsqueda por zonas concretas (ej. Cala Cala, Queru Queru), rango de precios en USD, tipo de inmueble y número de dormitorios."
        }
      ],
      "Garantías y Legalidad": [
        {
          id: "inq-leg-1",
          q: "¿Qué es el Sello Oro y por qué me conviene buscar propiedades con esta insignia?",
          a: "El Sello Oro es la máxima garantía de seguridad de Propio. Significa que nuestro departamento legal ha auditado físicamente el Folio Real, los impuestos y la escritura pública de la propiedad, certificando que el dueño es legítimo y que el inmueble está libre de gravámenes o estafas."
        },
        {
          id: "inq-leg-2",
          q: "¿Cómo funciona el proceso de anticrético en la plataforma de Propio?",
          a: "En Propio acompañamos todo el proceso de anticrético para garantizar tu seguridad financiera: desde la búsqueda de inmuebles con Sello Oro hasta la redacción y registro de la minuta de contrato en Derechos Reales."
        }
      ]
    }
  }
};

const ROLES_METADATA = [
  {
    id: 'profesional' as Rol,
    emoji: '📊',
    title: 'Profesional Inmobiliario',
    subtitle: 'Agentes y corredores',
    desc: 'Optimiza tus ventas con nuestro Radar de Cierre, gestiona tus leads en tablero Kanban y automatiza el seguimiento por WhatsApp.'
  },
  {
    id: 'propietario' as Rol,
    emoji: '🏡',
    title: 'Propietario de Vivienda',
    subtitle: 'Vende o alquila tu inmueble',
    desc: 'Publica tu propiedad de forma gratuita, gestiona ofertas de manera directa y obtén el Sello Oro de Verificación legal.'
  },
  {
    id: 'inquilino' as Rol,
    emoji: '🔑',
    title: 'Inquilino / Comprador',
    subtitle: 'Busca tu próximo hogar',
    desc: 'Encuentra propiedades verificadas, agenda visitas presenciales fácilmente y firma contratos con total respaldo legal.'
  }
];

export default function CentroDeAyuda() {
  const [activeRole, setActiveRole] = useState<Rol>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectRole = (role: Rol) => {
    setActiveRole(role);
    setOpenId(null);
    setSearchQuery('');
  };

  const handleToggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const roleMetadata = activeRole ? ROLES_METADATA.find((r) => r.id === activeRole) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#04045E] font-sans antialiased">
      
      {/* ── ENCABEZADO PRINCIPAL ── */}
      <header className="bg-white border-b border-slate-100 py-12 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b9fa3c]/20 border border-[#b9fa3c]/40 text-[10px] font-black uppercase tracking-widest text-[#04045E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#04045E] animate-pulse" />
            Centro de Soporte Propio
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#04045E] leading-tight">
            {activeRole ? `¿Cómo podemos ayudarte como ${roleMetadata?.title}?` : '¿Cómo podemos ayudarte hoy?'}
          </h1>
          <p className="text-sm text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            {activeRole 
              ? `Encuentra respuestas rápidas y guías de uso diseñadas a la medida de tu rol en la plataforma.` 
              : 'Selecciona tu perfil a continuación para recibir guías y soporte adaptado de forma personalizada a tus necesidades.'}
          </p>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="max-w-4xl mx-auto px-6 py-12 pb-24">
        
        {/* ── ESTADO INICIAL: SELECTOR DE ROL (ZILLOW UX) ── */}
        {!activeRole && (
          <section className="space-y-8">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 text-center mb-6">
              Selecciona tu rol en la plataforma
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ROLES_METADATA.map((rol) => (
                <div
                  key={rol.id}
                  onClick={() => handleSelectRole(rol.id)}
                  className="group bg-white border border-slate-200 rounded-3xl p-8 hover:border-[#b9fa3c] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between h-[360px] relative hover:-translate-y-1 focus:outline-none"
                >
                  <div className="space-y-5">
                    {/* Ilustración / Emoji minimalista */}
                    <div className="w-16 h-16 rounded-2xl bg-[#04045E]/5 flex items-center justify-center text-4xl border border-slate-100 group-hover:bg-[#b9fa3c]/10 group-hover:scale-105 transition-all duration-300">
                      {rol.emoji}
                    </div>
                    
                    <div className="space-y-2">
                      <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                        {rol.subtitle}
                      </span>
                      <h3 className="text-lg font-bold text-[#04045E]">
                        {rol.title}
                      </h3>
                      <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
                        {rol.desc}
                      </p>
                    </div>
                  </div>

                  {/* Flecha interactiva en círculo */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#04045E] transition-colors">
                      Ver artículos
                    </span>
                    <div className="bg-slate-100 group-hover:bg-[#04045E] group-hover:text-white p-2 rounded-full transition-all duration-300 w-8 h-8 flex items-center justify-center">
                      <span className="text-sm font-bold">→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ESTADO POST-SELECCIÓN: VISTA DE ARTÍCULOS FILTRADOS EN ACORDEÓN POR CATEGORÍAS ── */}
        {activeRole && roleMetadata && (
          <section className="space-y-10">
            
            {/* Breadcrumbs estilo Zillow */}
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <button 
                onClick={() => handleSelectRole(null)}
                className="hover:text-[#04045E] transition-colors"
              >
                Ayuda
              </button>
              <span>/</span>
              <span className="text-[#04045E] font-bold">
                {roleMetadata.title}
              </span>
            </nav>

            {/* Botón para cambiar de rol */}
            <div>
              <button
                onClick={() => handleSelectRole(null)}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#04045E] transition-all border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 bg-white shadow-sm"
              >
                ← Volver al selector de rol
              </button>
            </div>

            {/* Buscador de Ayuda por Texto */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <label htmlFor="search-input" className="block text-xs font-black uppercase tracking-wider text-slate-500">
                ¿Qué estás buscando?
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOpenId(null); // Cerrar preguntas al filtrar para evitar desorden visual
                  }}
                  placeholder={`Busca ayuda específica para ${roleMetadata.title}...`}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-2xl text-sm text-[#04045E] font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#b9fa3c] focus:border-[#b9fa3c] shadow-inner transition-all duration-200"
                />
              </div>
            </div>

            {/* Renderizado dinámico de FAQ_TREE filtrado y ordenado por categorías */}
            <div className="space-y-8">
              {Object.entries(FAQ_TREE[activeRole].categorias).map(([categoriaNombre, preguntas]) => {
                // Filtrar las preguntas de la categoría según la consulta de búsqueda
                const preguntasFiltradas = preguntas.filter(
                  (p) =>
                    searchQuery === '' ||
                    p.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.a.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (preguntasFiltradas.length === 0) return null;

                return (
                  <div key={categoriaNombre} className="mb-8 border-l-4 border-[#b9fa3c] pl-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#04045E] mb-3">
                      {categoriaNombre}
                    </h3>
                    
                    <div className="divide-y divide-slate-100 bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                      {preguntasFiltradas.map((faq) => {
                        const isOpen = openId === faq.id;
                        return (
                          <div key={faq.id} className="transition-all duration-200">
                            <button
                              onClick={() => handleToggleFaq(faq.id)}
                              className="w-full text-left focus:outline-none py-3 px-5 flex items-center justify-between group"
                            >
                              <span className="cursor-pointer text-[#04045E] font-bold py-1 hover:text-[#b9fa3c] transition-colors leading-snug text-sm sm:text-base">
                                {faq.q}
                              </span>
                              <span className={`w-6 h-6 rounded-full border border-slate-100 flex items-center justify-center text-[10px] font-bold text-[#04045E] bg-slate-50 group-hover:bg-[#b9fa3c] transition-all duration-300 ${isOpen ? 'rotate-180 bg-[#b9fa3c]' : ''}`}>
                                ↓
                              </span>
                            </button>
                            
                            {/* Renderizado expandible de la respuesta */}
                            <div
                              className={`transition-all duration-300 overflow-hidden ${
                                isOpen ? 'max-h-[300px] border-t border-slate-100' : 'max-h-0'
                              }`}
                            >
                              <div className="bg-slate-50 p-4 rounded-lg mt-2 text-slate-600 text-sm mx-5 mb-4 leading-relaxed font-medium">
                                {faq.a}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Estado cuando ninguna categoría tiene coincidencias */}
              {Object.values(FAQ_TREE[activeRole].categorias).every(
                (preguntas) =>
                  preguntas.filter(
                    (p) =>
                      searchQuery === '' ||
                      p.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.a.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0
              ) && (
                <div className="bg-white border border-slate-200 rounded-2xl py-12 text-center shadow-sm">
                  <p className="text-sm text-slate-400 font-bold">
                    No encontramos preguntas en "{roleMetadata.title}" que coincidan con tu búsqueda.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs font-black uppercase tracking-widest text-[#04045E] hover:underline"
                  >
                    Mostrar todas las categorías
                  </button>
                </div>
              )}
            </div>

            {/* Footer de Soporte Directo / Panel de Conversión */}
            <div className="bg-[#04045E] rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#b9fa3c]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-2 text-center md:text-left z-10">
                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-[#b9fa3c]">
                  ¿Aún con dudas?
                </span>
                <h4 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                  Soporte Directo con Especialistas
                </h4>
                <p className="text-xs text-slate-300 font-medium max-w-md">
                  Contamos con asesores expertos listos para ayudarte. Respondemos en menos de 2 horas hábiles.
                </p>
              </div>

              <a
                href="https://wa.me/59171234567?text=Hola%2C+necesito+soporte+personalizado+en+Propio+como+usuario"
                target="_blank"
                rel="noopener noreferrer"
                className="z-10 flex-shrink-0 inline-flex items-center gap-2 px-6 py-4 bg-[#b9fa3c] hover:bg-[#adf02c] active:scale-95 text-[#04045E] font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg"
              >
                <svg className="w-4 h-4 fill-[#04045E]" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 2.12.552 4.107 1.514 5.836L0 24l6.336-1.492A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.728.877.895-3.637-.234-.374A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Hablar con un Especialista
              </a>
            </div>

          </section>
        )}

      </main>

      {/* ── BOTÓN FIJO DE WHATSAPP (UI/UX AUTOMATIZADA) ── */}
      <a
        href="https://wa.me/59171234567?text=Hola%2C+necesito+ayuda+urgente+en+Propio"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 bg-[#b9fa3c] p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-50 flex items-center justify-center border border-[#04045E]/10"
        title="Contacto directo por WhatsApp"
      >
        <svg className="w-6 h-6 fill-[#04045E]" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.374 0 0 5.373 0 12c0 2.12.552 4.107 1.514 5.836L0 24l6.336-1.492A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.728.877.895-3.637-.234-.374A9.818 9.818 0 1112 21.818z"/>
        </svg>
      </a>

    </div>
  );
}
