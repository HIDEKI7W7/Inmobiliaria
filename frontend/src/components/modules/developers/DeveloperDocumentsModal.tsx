import React, { useState, useRef, useEffect } from 'react';
import { persistLocalDeveloper } from '@/utils/localDb';

interface DeveloperDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  developer: {
    id: string;
    empresa: string;
    nit: string;
    representante: string;
    contacto: { email: string; phone: string };
    documents?: any[];
  } | null;
  onUpdateDeveloper: (updatedDev: any) => void;
}

const defaultDeveloperDocs = [
  { id: 'NIT', name: "Número de Identificación Tributaria (NIT)", desc: "Copia legalizada o NIT activo certificado por impuestos.", file: null, mimeType: 'application/pdf' },
  { id: 'RC', name: "Matrícula de Comercio", desc: "Registro vigente ante la de comercio competente.", file: null, mimeType: 'application/pdf' },
  { id: 'PA', name: "Planos Aprobados de Obra", desc: "Planos arquitectónicos y constructivos con firma municipal.", file: null, mimeType: 'application/pdf' },
  { id: 'LA', name: "Licencia Ambiental (Ficha)", desc: "Estudio de impacto ambiental aprobado por autoridad competente.", file: null, mimeType: 'application/pdf' },
  { id: 'CI', name: "Cédula del Representante Legal", desc: "Documento de identidad vigente del representante firmante.", file: null, mimeType: 'application/pdf' },
  { id: 'OD', name: "Otros Documentos Técnicos", desc: "Planillas de avance, memorias descriptivas o planos complementarios.", file: null, mimeType: 'application/pdf' }
];

export const DeveloperDocumentsModal: React.FC<DeveloperDocumentsModalProps> = ({
  isOpen,
  onClose,
  developer,
  onUpdateDeveloper
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [docRows, setDocRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !developer) return;
    const raw = localStorage.getItem(`propio_developer_documents_${developer.id}`);
    const savedDocs = raw ? JSON.parse(raw) : [];

    const initialDocs = defaultDeveloperDocs.map(def => {
      const match = savedDocs.find((d: any) => d.id === def.id);
      return match ? { ...def, ...match } : def;
    });

    savedDocs.forEach((d: any) => {
      if (!defaultDeveloperDocs.some(def => def.id === d.id)) {
        initialDocs.push(d);
      }
    });

    setDocRows(initialDocs);
    setActiveIdx(0);
  }, [isOpen, developer]);

  if (!isOpen || !developer) return null;

  const activeRow = docRows[activeIdx];

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const updatedRow = {
          ...activeRow,
          file: base64,
          fileUrl: base64,
          mimeType: file.type,
          originalName: file.name,
          fileName: file.name,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString()
        };

        const nextRows = docRows.map((r, i) => i === activeIdx ? updatedRow : r);
        setDocRows(nextRows);

        localStorage.setItem(`propio_developer_documents_${developer.id}`, JSON.stringify(nextRows));

        const updatedDev = {
          ...developer,
          documents: nextRows
        };
        await persistLocalDeveloper(updatedDev);
        onUpdateDeveloper(updatedDev);

        alert('Documento subido exitosamente.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Error al subir el archivo: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateNewDocSlot = () => {
    const title = window.prompt('Nombre del nuevo documento requerido (ej. "Planos de Instalación"):');
    if (!title || !title.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newRow = {
      id: newId,
      name: title.trim(),
      desc: "Documento complementario de la constructora.",
      file: null,
      mimeType: 'application/pdf',
      originalName: title.trim(),
      fileName: title.trim(),
      sizeBytes: 0,
      uploadedAt: new Date().toISOString()
    };
    const nextRows = [...docRows, newRow];
    setDocRows(nextRows);
    localStorage.setItem(`propio_developer_documents_${developer.id}`, JSON.stringify(nextRows));
    setActiveIdx(docRows.length);
    setTimeout(() => fileInputRef.current?.click(), 80);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ height: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 bg-[#04045E] px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest font-mono">Consola de Documentación</p>
              <h3 className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[420px]">
                CONSTRUCTORA: {developer.empresa} (NIT: {developer.nit})
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white font-black text-sm p-2 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-row overflow-hidden h-full">
          {/* Left Column: Document Tabs */}
          <div className="w-1/3 border-r border-slate-150 flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-2.5 shrink-0">
            <div className="pb-2 border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Requerimientos Legales</span>
            </div>

            {docRows.map((row, idx) => {
              const isActive = idx === activeIdx;
              return (
                <div
                  key={row.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 w-full cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#04045E] border-[#04045E] text-white shadow-md hover:scale-[1.01]'
                      : 'bg-white border-slate-200 hover:border-[#04045E]/40 text-slate-700 hover:scale-[1.01]'
                  }`}
                >
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60 font-mono">
                    Documento {idx + 1}
                  </span>
                  <span className="text-xs font-black leading-tight truncate">
                    {row.name}
                  </span>
                  <span className={`text-[9px] font-semibold leading-relaxed line-clamp-2 ${isActive ? 'text-white/85' : 'text-slate-450'}`}>
                    {row.desc}
                  </span>
                  <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                      row.file
                        ? 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-slate-300/20 text-slate-400'
                    }`}>
                      {row.file ? '✓ Cargado' : '⏳ Pendiente'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* dynamic slot creator */}
            <div className="pt-2 border-t border-slate-200 mt-1">
              <button
                onClick={handleCreateNewDocSlot}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#04045E] bg-[#04045E]/6 hover:bg-[#04045E]/12 border border-[#04045E]/20 hover:border-[#04045E]/40 px-3 py-2.5 rounded-2xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="text-base leading-none">＋</span>
                Crear Nuevo Archivo
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Moderator Panel */}
          <div className="w-2/3 flex flex-col bg-white overflow-y-auto p-6 space-y-4">
            {activeRow ? (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadFile}
                  className="hidden"
                  accept=".pdf,image/*"
                />

                {/* Document Header */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black text-[#04045E] uppercase tracking-wide">
                      {activeRow.name}
                    </h4>
                    <span className="text-[10px] text-slate-450 font-semibold">
                      {activeRow.fileName ? `${activeRow.fileName} (${(activeRow.sizeBytes / 1024).toFixed(1)} KB)` : 'Ningún archivo cargado.'}
                    </span>
                  </div>
                </div>

                {/* PDF/Image Preview Container */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px] w-full">
                  {(() => {
                    const rawUrl = activeRow.file;
                    if (!rawUrl) {
                      return (
                        <div className="text-center p-6 space-y-3 flex flex-col items-center">
                          <span className="text-3xl text-slate-350">📤</span>
                          <p className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                            No se ha subido ningún archivo a este slot
                          </p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            Seleccionar Archivo 📄
                          </button>
                        </div>
                      );
                    }

                    const isPdf = activeRow.mimeType === 'application/pdf' || rawUrl.startsWith('data:application/pdf');
                    const isImage = activeRow.mimeType?.startsWith('image/') || rawUrl.startsWith('data:image/');

                    if (isPdf) {
                      return (
                        <div className="w-full">
                          <object
                            key={rawUrl}
                            data={rawUrl}
                            type="application/pdf"
                            className="w-full h-[420px] rounded-xl bg-white border-none"
                            aria-label={activeRow.name}
                          >
                            <iframe
                              src={rawUrl}
                              className="w-full h-[420px] border-none rounded-xl bg-white"
                              title={activeRow.name}
                            />
                          </object>
                        </div>
                      );
                    } else if (isImage) {
                      return <img src={rawUrl} alt={activeRow.name} className="max-h-[420px] object-contain rounded-lg mx-auto p-4" />;
                    } else {
                      return (
                        <div className="text-center p-6 space-y-4">
                          <span className="text-5xl">📄</span>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{activeRow.originalName}</p>
                          <a
                            href={rawUrl}
                            download={activeRow.originalName}
                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition-all text-xs"
                          >
                            Descargar Archivo
                          </a>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Action Buttons Panel */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Download */}
                  {activeRow.file && (
                    <a
                      href={activeRow.file}
                      download={activeRow.originalName || activeRow.name}
                      className="inline-flex items-center gap-1.5 text-[10px] font-black border border-[#04045E]/20 text-[#04045E] bg-[#04045E]/5 hover:bg-[#04045E]/10 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider"
                    >
                      DESCARGAR ARCHIVO 📥
                    </a>
                  )}

                  {/* Upload document */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {activeRow.file ? 'REEMPLAZAR ARCHIVO 📤' : 'SUBIR ARCHIVO 📤'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-slate-450 italic text-xs">
                Seleccione un documento a la izquierda para cargarlo o previsualizarlo.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
            ID Constructor: {developer.id}
          </span>
          <button
            onClick={onClose}
            className="bg-[#04045E] hover:bg-[#04045E]/90 text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer active:scale-95"
          >
            Cerrar Consola
          </button>
        </div>
      </div>
    </div>
  );
};
