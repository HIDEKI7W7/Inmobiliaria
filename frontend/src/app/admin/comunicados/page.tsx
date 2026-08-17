'use client';
"constructora peru" "contructora truj"
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, Tab } from '@/components/ui/AdminSidebar';
import { AgentProvider, useAgents } from '@/context/AgentContext';
import { getCurrentUser } from '@/utils/session';

// ==========================================
// [INTERFACES_Y_ESTADO_COMUNICADOS]
// ==========================================
interface AnnouncementSection {
  titulo: string;
  vinetas: string[];
}

interface Announcement {
  id: string;
  titulo: string;
  subtitulo: string;
  secciones: AnnouncementSection[];
  activo: boolean;
  fechaCreacion: string;
}

interface LecturaAuditoria {
  idAgente: string;
  nombre: string;
  email: string;
  sucursal: string;
  leido: boolean;
  fechaLectura: string;
}

export default function ComunicadosPage() {
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propio_admin_agents');
      if (stored) {
        try {
          setAgents(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        // Mock fallback if empty
        const defaultAgents = [
          { id: 'AGT-2026-001', name: 'Roberto Claros', email: 'roberto.agt@propio.bo', cityOfResidence: 'Cochabamba' },
          { id: 'AGT-2026-002', name: 'Lucía Arteaga', email: 'lucia.agt@propio.bo', cityOfResidence: 'Santa Cruz' },
          { id: 'AGT-2026-003', name: 'David Choque', email: 'david.agt@propio.bo', cityOfResidence: 'La Paz' },
          { id: 'AGT-2026-007', name: 'david.agt', email: 'david.agt@propio.bo', cityOfResidence: 'Cochabamba' },
        ];
        setAgents(defaultAgents);
        localStorage.setItem('propio_admin_agents', JSON.stringify(defaultAgents));
      }
    }
  }, []);

  return (
    <AgentProvider value={{ agents, setAgents }}>
      <ComunicadosDashboard />
    </AgentProvider>
  );
}

function ComunicadosDashboard() {
  const router = useRouter();
  const { agents } = useAgents();

  // Load counts for sidebar
  const [counts, setCounts] = useState({
    properties: 0,
    prospects: 0,
    owners: 0,
    developers: 0,
    contracts: 0,
    payments: 0,
    expenses: 0,
    agents: 0,
  });

  const [currentUserEmail, setCurrentUserEmail] = useState('admin');

  // Load parent counts from localStorage
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.email) {
      setCurrentUserEmail(user.email.split('@')[0]);
    }

    const cachedProps = localStorage.getItem('propio_admin_properties');
    const cachedProspects = localStorage.getItem('propio_admin_prospects');
    const cachedOwners = localStorage.getItem('propio_admin_owners');
    const cachedContracts = localStorage.getItem('propio_admin_contracts');
    const cachedPayments = localStorage.getItem('propio_admin_payments');
    const cachedExpenses = localStorage.getItem('propio_admin_expenses');

    setCounts({
      properties: cachedProps ? JSON.parse(cachedProps).length : 0,
      prospects: cachedProspects ? JSON.parse(cachedProspects).length : 0,
      owners: cachedOwners ? JSON.parse(cachedOwners).length : 0,
      developers: 0,
      contracts: cachedContracts ? JSON.parse(cachedContracts).length : 0,
      payments: cachedPayments ? JSON.parse(cachedPayments).length : 0,
      expenses: cachedExpenses ? JSON.parse(cachedExpenses).length : 0,
      agents: agents.length,
    });
  }, [agents.length]);

  // ANNOUNCEMENT STATE
  const [announcement, setAnnouncement] = useState<Announcement>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_active_announcement');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    // Default seed representing Miro layout rules
    return {
      id: 'MKT-ANN-1002',
      titulo: 'Esquema Restrictivo de Comisiones y Cierres de Gestión 2026',
      subtitulo: 'Normas de obligado cumplimiento para todos los asesores y brokers de la plataforma',
      secciones: [
        {
          titulo: '1. Monto de Comisión Base',
          vinetas: [
            'Se establece una comisión base obligatoria de 1.5% sobre el precio de venta final de cualquier propiedad en cartera.',
            'Quedan excluidos arreglos directos inferiores sin previa autorización escrita de la gerencia.',
          ],
        },
        {
          titulo: '2. Distribución de Comisiones (Split)',
          vinetas: [
            'Distribución Estándar: 50% para Propio y 50% para el Asesor/Broker captador.',
            'En caso de co-corretaje con agentes externos autorizados, el split se calculará sobre el neto percibido por la plataforma.',
          ],
        },
        {
          titulo: '3. Plazos de Registro y Documentación',
          vinetas: [
            'Cualquier cierre de venta o alquiler debe ser registrado formalmente en la plataforma dentro de las 24 horas hábiles posteriores al cobro del anticipo.',
            'Es obligatorio adjuntar la copia legible del contrato de corretaje y el recibo de caja digitalizado en formato PDF.',
          ],
        },
      ],
      activo: false, // Start as draft until launched
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
  });

  const [registroLecturas, setRegistroLecturas] = useState<LecturaAuditoria[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_announcement_reads');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  // Local Storage Synchronization
  useEffect(() => {
    localStorage.setItem('propio_active_announcement', JSON.stringify(announcement));
  }, [announcement]);

  useEffect(() => {
    localStorage.setItem('propio_announcement_reads', JSON.stringify(registroLecturas));
  }, [registroLecturas]);

  // Sync reads when updated outside (like agents accepting)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'propio_announcement_reads' && e.newValue) {
        try {
          setRegistroLecturas(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
      if (e.key === 'propio_active_announcement' && e.newValue) {
        try {
          setAnnouncement(JSON.parse(e.newValue));
        } catch (err) {
          console.error(err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Form Editor Fields Local State
  const [editorTitle, setEditorTitle] = useState(announcement.titulo);
  const [editorSubtitle, setEditorSubtitle] = useState(announcement.subtitulo);
  const [editorSections, setEditorSections] = useState<AnnouncementSection[]>(announcement.secciones);

  // Sync editor fields if announcement updates
  useEffect(() => {
    setEditorTitle(announcement.titulo);
    setEditorSubtitle(announcement.subtitulo);
    setEditorSections(announcement.secciones);
  }, [announcement]);

  // ==========================================
  // [LOGICA_PUBLICACION_Y_BROADCAST]
  // ==========================================
  const handleGuardarBorrador = () => {
    const updated: Announcement = {
      ...announcement,
      titulo: editorTitle,
      subtitulo: editorSubtitle,
      secciones: editorSections,
      activo: false,
    };
    setAnnouncement(updated);
    alert('Borrador del comunicado guardado localmente.');
  };

  const handlePublicarComunicado = () => {
    const updated: Announcement = {
      id: `ANN-TX-${Date.now()}`, // new ID version forces interceptor reactivation
      titulo: editorTitle,
      subtitulo: editorSubtitle,
      secciones: editorSections,
      activo: true,
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
    setAnnouncement(updated);

    // Reset reads log to false for all current active agents in the database/context
    const newReadsList: LecturaAuditoria[] = agents.map(a => {
      const existingRead = registroLecturas.find(r => r.idAgente === a.id);
      return {
        idAgente: a.id,
        nombre: a.name,
        email: a.email,
        sucursal: a.cityOfResidence || 'Cochabamba',
        leido: false,
        fechaLectura: '',
      };
    });
    setRegistroLecturas(newReadsList);

    // Alert completion
    alert('¡Comunicado mandatorio lanzado con éxito! Todos los asesores deberán firmarlo para continuar.');
  };

  const handleSimularLecturaAgente = (agenteId: string) => {
    setRegistroLecturas(prev =>
      prev.map(r => {
        if (r.idAgente !== agenteId) return r;
        return {
          ...r,
          leido: true,
          fechaLectura: new Date().toLocaleString(),
        };
      })
    );
  };

  // Sections Manager Helpers
  const handleAddSection = () => {
    setEditorSections(prev => [
      ...prev,
      { titulo: `Nueva Sección ${prev.length + 1}`, vinetas: ['Escribe una regla aquí.'] },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setEditorSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleSectionTitleChange = (index: number, val: string) => {
    setEditorSections(prev =>
      prev.map((sec, i) => (i === index ? { ...sec, titulo: val } : sec))
    );
  };

  const handleAddVineta = (secIndex: number) => {
    setEditorSections(prev =>
      prev.map((sec, i) =>
        i === secIndex ? { ...sec, vinetas: [...sec.vinetas, 'Nueva regla...'] } : sec
      )
    );
  };

  const handleRemoveVineta = (secIndex: number, vinIndex: number) => {
    setEditorSections(prev =>
      prev.map((sec, i) =>
        i === secIndex ? { ...sec, vinetas: sec.vinetas.filter((_, vi) => vi !== vinIndex) } : sec
      )
    );
  };

  const handleVinetaChange = (secIndex: number, vinIndex: number, val: string) => {
    setEditorSections(prev =>
      prev.map((sec, i) => {
        if (i !== secIndex) return sec;
        const newVin = [...sec.vinetas];
        newVin[vinIndex] = val;
        return { ...sec, vinetas: newVin };
      })
    );
  };

  // KPIs
  const readCount = useMemo(() => registroLecturas.filter(r => r.leido).length, [registroLecturas]);
  const totalCount = useMemo(() => registroLecturas.length, [registroLecturas]);
  const complianceRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((readCount / totalCount) * 100);
  }, [readCount, totalCount]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans antialiased">
      {/* LEFT SIDEBAR */}
      <AdminSidebar
        activeTab="announcements"
        onTabChange={(tab) => {
          if (tab === 'announcements') return;
          router.push('/admin');
        }}
        counts={counts}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center z-20 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            <h1 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
              Gestión de Comunicados Mandatorios
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Admin: {currentUserEmail}</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow overflow-y-auto p-8 space-y-8 pb-32">
          
          {/* ========================================== */}
          {/* [JSX_FORMULARIO_EDITOR_ADMIN] */}
          {/* ========================================== */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                  Editor del Comunicado Activo
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Establezca el esquema de comisiones, plazos y políticas corporativas.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGuardarBorrador}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer border"
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={handlePublicarComunicado}
                  className="bg-[#04045E] hover:bg-[#03034d] text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  Lanzar Comunicado Mandatorio 🚀
                </button>
              </div>
            </div>

            {/* Inputs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Título Principal del Comunicado
                </label>
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                  placeholder="Ej. Esquema Restrictivo de Comisiones"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Subtítulo / Descripción Corta
                </label>
                <input
                  type="text"
                  value={editorSubtitle}
                  onChange={(e) => setEditorSubtitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-350 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  placeholder="Ej. Normas de obligado cumplimiento..."
                />
              </div>
            </div>

            {/* Editor de Secciones Dinámicas */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                  Secciones y Reglas de Negocio
                </h4>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-xs text-blue-650 hover:underline font-bold"
                >
                  + Agregar Sección
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {editorSections.map((section, secIndex) => (
                  <div
                    key={secIndex}
                    className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(secIndex)}
                      className="absolute top-2 right-2 text-slate-300 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer"
                      title="Eliminar Sección"
                    >
                      ✕
                    </button>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                        Título de Sección
                      </label>
                      <input
                        type="text"
                        value={section.titulo}
                        onChange={(e) => handleSectionTitleChange(secIndex, e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-lg px-2.5 py-1 text-xs focus:outline-none font-bold text-[#04045E]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-[8px] font-black uppercase text-slate-400">
                          Viñetas / Reglas
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddVineta(secIndex)}
                          className="text-[9px] text-[#0066ff] hover:underline font-bold"
                        >
                          + Agregar
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {section.vinetas.map((vineta, vinIndex) => (
                          <div key={vinIndex} className="flex items-start gap-1">
                            <textarea
                              value={vineta}
                              onChange={(e) => handleVinetaChange(secIndex, vinIndex, e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-slate-200 focus:border-slate-350 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveVineta(secIndex, vinIndex)}
                              className="text-slate-300 hover:text-red-500 font-bold p-0.5 text-xs transition-colors"
                              title="Remover viñeta"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* [JSX_TABLA_AUDITORIA_LECTURA] */}
          {/* ========================================== */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                  Auditoría de Alcance y Firmas
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Seguimiento en tiempo real de la aceptación del reglamento por el equipo.
                </p>
              </div>
              
              {/* KPI cumplimiento */}
              <div className="bg-slate-50 border px-4 py-2 rounded-2xl flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    FIRMADO Y ACEPTADO
                  </span>
                  <span className="text-sm font-black text-[#04045E] mt-1.5">
                    {readCount} de {totalCount} asesores ({complianceRate}%)
                  </span>
                </div>
                <div className="relative h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-[#04045E] border-2 border-emerald-400">
                  {complianceRate}%
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                    <th className="p-3">Agente</th>
                    <th className="p-3">Correo Electrónico</th>
                    <th className="p-3">Sucursal</th>
                    <th className="p-3">Estado de Firma</th>
                    <th className="p-3">Fecha y Hora</th>
                    <th className="p-3 text-right">Herramientas</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  {registroLecturas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                        No hay agentes asignados en auditoría.
                      </td>
                    </tr>
                  ) : (
                    registroLecturas.map(agente => (
                      <tr key={agente.idAgente} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#04045E]">{agente.nombre}</span>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {agente.idAgente}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono">{agente.email}</td>
                        <td className="p-3">{agente.sucursal}</td>
                        <td className="p-3">
                          {agente.leido ? (
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-[10px] font-black">
                              🟢 Aceptado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-slate-150 text-slate-500 border border-slate-200/50 px-2.5 py-1 rounded-full text-[10px] font-black">
                              ⏳ Pendiente
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {agente.leido ? agente.fechaLectura : '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleSimularLecturaAgente(agente.idAgente)}
                            disabled={agente.leido}
                            className="bg-blue-50 hover:bg-blue-100 disabled:opacity-30 disabled:hover:bg-blue-50 text-blue-650 font-bold px-2.5 py-1 rounded-lg text-[10px] border border-blue-150 transition-colors cursor-pointer"
                          >
                            Simular Firma
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
