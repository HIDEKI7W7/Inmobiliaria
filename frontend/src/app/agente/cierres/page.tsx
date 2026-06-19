'use client';

import React, { useState, useEffect } from 'react';

interface Cierre {
  id: string;
  propiedadId: string;
  propiedadTitle?: string;
  tipoTransaccion: 'Venta' | 'Alquiler' | 'Anticresis';
  fechaCierre: string; // ISO String
  pdfRespaldo: string;
  pdfEstado?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PropertyOption {
  id: string;
  title: string;
  price: number;
}

const MOCK_PROPERTIES: PropertyOption[] = [
  { id: 'prop-1', title: 'Casa en Cala Cala', price: 320000 },
  { id: 'prop-2', title: 'Penthouse en Queru Queru', price: 185000 },
  { id: 'prop-3', title: 'Departamento en El Prado', price: 95000 },
  { id: 'prop-4', title: 'Terreno Comercial en Cala Cala', price: 140000 },
  { id: 'prop-5', title: 'Casa de Lujo en Cala Cala', price: 450000 },
];

export default function CierresPage() {
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCierre, setEditingCierre] = useState<Cierre | null>(null);

  // Form Fields
  const [selectedPropId, setSelectedPropId] = useState('');
  const [transactionType, setTransactionType] = useState<'Venta' | 'Alquiler' | 'Anticresis'>('Venta');
  const [respaldoFileName, setRespaldoFileName] = useState('');
  const [estadoFileName, setEstadoFileName] = useState('');

  // Load closures from API with LocalStorage fallback
  useEffect(() => {
    const fetchCierres = async () => {
      try {
        const res = await fetch('/api/cierres');
        if (res.ok) {
          const data = await res.json();
          setCierres(data);
        } else {
          throw new Error('Error al consultar cierres');
        }
      } catch (err) {
        console.warn('Usando fallback local para cierres.');
        const local = localStorage.getItem('propio_cierres');
        if (local) {
          setCierres(JSON.parse(local));
        } else {
          // Mock initial closures
          const initial: Cierre[] = [
            {
              id: 'c-1',
              propiedadId: 'prop-1',
              tipoTransaccion: 'Venta',
              fechaCierre: new Date(Date.now() - 3600 * 1000).toISOString(), // Hace 1 hora
              pdfRespaldo: 'Respaldo_Minuta_CalaCala.pdf',
              pdfEstado: 'Estado_Fisico_CalaCala.pdf',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'c-2',
              propiedadId: 'prop-2',
              tipoTransaccion: 'Alquiler',
              fechaCierre: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), // Hace 3 días
              pdfRespaldo: 'Contrato_Alquiler_QueruQueru.pdf',
              pdfEstado: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ];
          setCierres(initial);
          localStorage.setItem('propio_cierres', JSON.stringify(initial));
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCierres();
  }, []);

  const getPropTitle = (id: string) => {
    const match = MOCK_PROPERTIES.find(p => p.id === id);
    return match ? match.title : `Propiedad ID ${id}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'respaldo' | 'estado') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'respaldo') {
        setRespaldoFileName(file.name);
      } else {
        setEstadoFileName(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCierre) {
      // Modificación de Cierre
      const updatedRecord: Cierre = {
        ...editingCierre,
        tipoTransaccion: transactionType,
        pdfRespaldo: respaldoFileName || editingCierre.pdfRespaldo,
        pdfEstado: estadoFileName || editingCierre.pdfEstado,
        updatedAt: new Date().toISOString(),
      };

      try {
        const res = await fetch(`/api/cierres/${editingCierre.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoTransaccion: transactionType,
            pdfRespaldo: updatedRecord.pdfRespaldo,
            pdfEstado: updatedRecord.pdfEstado
          })
        });
        if (res.ok) {
          const updated = await res.json();
          setCierres(prev => prev.map(c => c.id === editingCierre.id ? updated : c));
        } else {
          throw new Error('Servidor falló en la modificación');
        }
      } catch (err) {
        // Fallback local
        const updatedList = cierres.map(c => c.id === editingCierre.id ? updatedRecord : c);
        setCierres(updatedList);
        localStorage.setItem('propio_cierres', JSON.stringify(updatedList));
      }

      setEditingCierre(null);
    } else {
      // Creación de Nuevo Cierre
      if (!selectedPropId || !respaldoFileName) {
        alert('Debe seleccionar una propiedad y cargar el PDF de respaldo obligatorio.');
        return;
      }

      const newRecord: Cierre = {
        id: `cierre-${Date.now()}`,
        propiedadId: selectedPropId,
        tipoTransaccion: transactionType,
        fechaCierre: new Date().toISOString(),
        pdfRespaldo: respaldoFileName,
        pdfEstado: estadoFileName || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        const res = await fetch('/api/cierres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propiedadId: selectedPropId,
            tipoTransaccion: transactionType,
            pdfRespaldo: respaldoFileName,
            pdfEstado: estadoFileName || undefined
          })
        });
        if (res.ok) {
          const created = await res.json();
          setCierres(prev => [created, ...prev]);
        } else {
          throw new Error('Servidor falló al guardar');
        }
      } catch (err) {
        // Fallback local
        const updatedList = [newRecord, ...cierres];
        setCierres(updatedList);
        localStorage.setItem('propio_cierres', JSON.stringify(updatedList));
      }
    }

    // Reset Form
    setSelectedPropId('');
    setTransactionType('Venta');
    setRespaldoFileName('');
    setEstadoFileName('');
    setShowModal(false);
  };

  const startEdit = (cierre: Cierre) => {
    setEditingCierre(cierre);
    setSelectedPropId(cierre.propiedadId);
    setTransactionType(cierre.tipoTransaccion);
    setRespaldoFileName(cierre.pdfRespaldo);
    setEstadoFileName(cierre.pdfEstado || '');
    setShowModal(true);
  };

  const isEditable = (fechaCierreStr: string) => {
    const elapsedMs = Date.now() - new Date(fechaCierreStr).getTime();
    return elapsedMs <= 86400000; // 24 horas
  };

  const getHoursLeft = (fechaCierreStr: string) => {
    const elapsedMs = Date.now() - new Date(fechaCierreStr).getTime();
    const leftMs = 86400000 - elapsedMs;
    if (leftMs <= 0) return 0;
    return (leftMs / (1000 * 3600)).toFixed(1);
  };

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Mis Cierres Realizados
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Historial de ventas y alquileres cerrados. Hitos corporativos con verificación legal de documentos.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCierre(null);
            setShowModal(true);
          }}
          className="bg-[#b9fa3c] text-[#04045E] font-bold px-6 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
        >
          ➕ Registrar Nuevo Cierre
        </button>
      </div>

      {/* Tabla de Cierres */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <h3 className="font-bold text-xs text-[#04045E] uppercase tracking-wider">
            Cierres Registrados
          </h3>
          <span className="bg-[#04045E]/5 border border-[#04045E]/10 text-[#04045E] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            {cierres.length} Transacciones
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 font-semibold">
            Cargando historial de cierres...
          </div>
        ) : cierres.length === 0 ? (
          <div className="p-12 text-center text-slate-400 py-20">
            <span className="block text-4xl mb-3">📁</span>
            <p className="text-xs font-semibold">No has registrado ningún cierre de propiedad todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/20">
                  <th className="p-4 pl-6">ID Cierre</th>
                  <th className="p-4">Propiedad</th>
                  <th className="p-4">Tipo Transacción</th>
                  <th className="p-4">Fecha Firma</th>
                  <th className="p-4">Respaldo (PDF)</th>
                  <th className="p-4">Estado Físico</th>
                  <th className="p-4 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {cierres.map((c) => {
                  const editable = isEditable(c.fechaCierre);
                  const hoursLeft = getHoursLeft(c.fechaCierre);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-400">{c.id.substring(0, 8).toUpperCase()}</td>
                      <td className="p-4 font-black text-[#04045E] uppercase">{getPropTitle(c.propiedadId)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          c.tipoTransaccion === 'Venta' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : c.tipoTransaccion === 'Alquiler'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.tipoTransaccion}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-500">
                        {new Date(c.fechaCierre).toLocaleDateString()} {new Date(c.fechaCierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 font-bold text-[#0066ff] hover:underline cursor-pointer">
                        📄 {c.pdfRespaldo}
                      </td>
                      <td className="p-4 text-slate-400">
                        {c.pdfEstado ? `📄 ${c.pdfEstado}` : 'Sin registrar'}
                      </td>
                      <td className="p-4 pr-6 text-right space-y-1">
                        {editable ? (
                          <div>
                            <button
                              onClick={() => startEdit(c)}
                              className="bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded-lg transition-all"
                            >
                              Modificar
                            </button>
                            <span className="block text-[8px] text-amber-600 font-bold mt-1 uppercase tracking-widest animate-pulse">
                              ⏳ {hoursLeft}h restantes
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Bloqueado (Firmado)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REGISTRAR / EDITAR CIERRE */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <form 
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 md:p-8 space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                {editingCierre ? 'Modificar Cierre de Venta' : 'Registrar Nuevo Cierre'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-650 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Respalda la transacción de cierre asociando los documentos digitales obligatorios de validación del inmueble.
            </p>

            <div className="space-y-4">
              {/* Seleccionar propiedad */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Propiedad Asociada *</label>
                <select
                  required
                  disabled={!!editingCierre}
                  value={selectedPropId}
                  onChange={e => setSelectedPropId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E] disabled:opacity-60"
                >
                  <option value="">-- Seleccionar Propiedad Activa --</option>
                  {MOCK_PROPERTIES.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (${p.price.toLocaleString()} USD)</option>
                  ))}
                </select>
              </div>

              {/* Tipo transacción */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Tipo de Transacción *</label>
                <select
                  required
                  value={transactionType}
                  onChange={e => setTransactionType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-[#04045E]"
                >
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                  <option value="Anticresis">Anticresis</option>
                </select>
              </div>

              {/* File Input Respaldo */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Contrato / Minuta Digital (Respaldo PDF) *</label>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <input 
                      type="file"
                      accept=".pdf"
                      id="pdf-respaldo"
                      onChange={e => handleFileChange(e, 'respaldo')}
                      className="hidden"
                    />
                    <label 
                      htmlFor="pdf-respaldo"
                      className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-500 font-bold cursor-pointer text-center select-none"
                    >
                      📎 Seleccionar Archivo PDF
                    </label>
                  </div>
                  {respaldoFileName && (
                    <span className="text-[10px] font-bold text-emerald-600 block pl-1">
                      ✅ Cargado: {respaldoFileName}
                    </span>
                  )}
                </div>
              </div>

              {/* File Input Estado */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Inventario / Estado del Inmueble (Opcional PDF)</label>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <input 
                      type="file"
                      accept=".pdf"
                      id="pdf-estado"
                      onChange={e => handleFileChange(e, 'estado')}
                      className="hidden"
                    />
                    <label 
                      htmlFor="pdf-estado"
                      className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-500 font-bold cursor-pointer text-center select-none"
                    >
                      📎 Seleccionar Archivo PDF
                    </label>
                  </div>
                  {estadoFileName && (
                    <span className="text-[10px] font-bold text-slate-600 block pl-1">
                      ✅ Cargado: {estadoFileName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-[1.01]"
              >
                {editingCierre ? 'Confirmar Modificación 🚀' : 'Registrar Cierre Oficial 🚀'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
