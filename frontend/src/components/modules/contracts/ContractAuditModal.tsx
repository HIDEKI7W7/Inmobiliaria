import React, { useState, useRef, useEffect } from 'react';
import { contractsService, Contract } from '@/services/contracts.service';
import { apiClient } from '@/utils/apiClient';

interface ContractAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  token: string;
  contractDocuments: any[];
  setContractDocuments: React.Dispatch<React.SetStateAction<any[]>>;
}

export const ContractAuditModal: React.FC<ContractAuditModalProps> = ({
  isOpen,
  onClose,
  contract,
  token,
  contractDocuments,
  setContractDocuments,
}) => {
  const [activeAuditIdx, setActiveAuditIdx] = useState<number>(0);
  const [isSavingAudit, setIsSavingAudit] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize status/observations keys if they do not exist
  const getPreparedDocs = () => {
    return contractDocuments.map((doc: any) => ({
      ...doc,
      status: doc.status || 'PENDING',
      observations: doc.observations || '',
      rejectOpen: false,
      rejectText: doc.observations || '',
    }));
  };

  const [preparedDocs, setPreparedDocs] = useState<any[]>(getPreparedDocs());

  useEffect(() => {
    setPreparedDocs(getPreparedDocs());
    if (activeAuditIdx >= contractDocuments.length) {
      setActiveAuditIdx(0);
    }
  }, [contractDocuments]);

  if (!isOpen) return null;

  const activeRow = preparedDocs[activeAuditIdx];

  const updateDocRow = (index: number, patch: any) => {
    setPreparedDocs(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const handleManualDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRow) return;

    setIsUploading(true);
    updateDocRow(activeAuditIdx, { saving: true });

    try {
      // ponytail: upload via contractsService
      const res = await contractsService.uploadContractDocuments(contract.id, [file], token);
      
      // reload documents
      const docs = await contractsService.getContractDocuments(contract.id, token);
      
      // Find the newly uploaded document (usually the last one or by name match)
      const matchedNewDoc = docs.find((d: any) => d.originalName === file.name) || docs[docs.length - 1];
      
      // Update status to approved as properties modal does
      if (matchedNewDoc) {
        matchedNewDoc.status = 'APPROVED';
        matchedNewDoc.observations = '';
        
        // update local storage list to preserve status review
        const localList = docs.map((d: any) => d.id === matchedNewDoc.id ? matchedNewDoc : { ...d, status: d.status || 'PENDING' });
        localStorage.setItem(`propio_contracts_documents_${contract.id}`, JSON.stringify(localList));
        
        // patch status on backend
        await apiClient.patchWithAuth(`/contracts/${contract.id}/documents/${matchedNewDoc.id}`, {
          status: 'APPROVED',
          observations: ''
        }, token).catch(() => {});
      }

      setContractDocuments(docs);
      alert('Documento cargado correctamente.');
    } catch (err: any) {
      console.error(err);
      alert('Error al subir documento: ' + (err.message || err));
    } finally {
      setIsUploading(false);
      updateDocRow(activeAuditIdx, { saving: false });
    }
  };

  const handleDocAuditSaveRow = async (index: number, status: 'APPROVED' | 'REJECTED') => {
    const row = preparedDocs[index];
    if (status === 'REJECTED' && !row.rejectText.trim()) {
      alert('Debe escribir un motivo de rechazo antes de guardar.');
      return;
    }

    updateDocRow(index, { saving: true });
    const observations = status === 'REJECTED' ? row.rejectText.trim() : '';

    try {
      // patch on backend
      await apiClient.patchWithAuth(`/contracts/${contract.id}/documents/${row.id}`, {
        status,
        observations
      }, token).catch(() => {});

      // update local list
      const updatedDocs = contractDocuments.map((d: any) => {
        if (d.id === row.id) {
          return { ...d, status, observations };
        }
        return d;
      });
      
      localStorage.setItem(`propio_contracts_documents_${contract.id}`, JSON.stringify(updatedDocs));
      setContractDocuments(updatedDocs);

      updateDocRow(index, {
        status,
        observations,
        rejectOpen: false,
        saving: false
      });
    } catch (err) {
      console.error(err);
      updateDocRow(index, { saving: false });
    }
  };

  const handleSaveAndClose = async () => {
    const invalidRow = preparedDocs.find(row => row.status === 'REJECTED' && !row.rejectText.trim());
    if (invalidRow) {
      alert(`Debe escribir un motivo de rechazo para el documento "${invalidRow.originalName || invalidRow.fileName}" antes de cerrar.`);
      return;
    }

    setIsSavingAudit(true);
    try {
      // batch review on backend if supported, otherwise individual updates
      const items = preparedDocs.map(row => ({
        docId: row.id,
        status: row.status,
        observations: row.status === 'REJECTED' ? row.rejectText.trim() : ''
      }));

      await apiClient.patchWithAuth(`/contracts/${contract.id}/documents/batch-review`, { items }, token)
        .catch(() => console.warn('Batch review endpoint not supported on backend. saved locally.'));

      // update local list
      const updatedDocs = contractDocuments.map((d: any) => {
        const prep = preparedDocs.find(p => p.id === d.id);
        if (prep) {
          return {
            ...d,
            status: prep.status,
            observations: prep.status === 'REJECTED' ? prep.rejectText.trim() : ''
          };
        }
        return d;
      });

      localStorage.setItem(`propio_contracts_documents_${contract.id}`, JSON.stringify(updatedDocs));
      setContractDocuments(updatedDocs);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar auditoría.');
    } finally {
      setIsSavingAudit(false);
    }
  };

  const handleCreateNewDocSlot = () => {
    const title = window.prompt('Nombre del nuevo documento requerido (ej. "Anexo de Garantías firmado"):');
    if (!title || !title.trim()) return;
    const newId = `custom-${Date.now()}`;
    
    // Simulate slot in local storage list
    const newDoc = {
      id: newId,
      contractId: contract.id,
      originalName: title.trim(),
      mimeType: 'application/pdf',
      sizeBytes: 0,
      uploadedAt: new Date().toISOString(),
      status: 'PENDING',
      observations: 'Slot creado manualmente por el administrador.',
      dataBase64: ''
    };

    const updatedDocs = [...contractDocuments, newDoc];
    localStorage.setItem(`propio_contracts_documents_${contract.id}`, JSON.stringify(updatedDocs));
    setContractDocuments(updatedDocs);
    setActiveAuditIdx(contractDocuments.length); // focus new slot

    // Open file picker immediately
    setTimeout(() => fileInputRef.current?.click(), 80);
  };

  const sanitizeDocUrl = (doc: any): string => {
    const raw = doc.dataBase64 || doc.file || doc.fileUrl || '';
    if (!raw) return '';
    if (raw.startsWith('data:')) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;
    
    const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
    if (raw.startsWith('/')) return `${BACKEND}${raw}`;
    
    // contract document route
    return `${BACKEND}/api/contracts/${contract.id}/documents/${doc.id}`;
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => { if (!isSavingAudit) handleSaveAndClose(); }}
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
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Consola de Auditoría de Contrato</p>
              <h3 className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[320px]">
                CONTRATO: {contract.id.substring(0, 8).toUpperCase()} - {contract.property?.title || contract.propertyId}
              </h3>
            </div>
          </div>
          <button
            disabled={isSavingAudit}
            onClick={handleSaveAndClose}
            className="text-white/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed font-black text-sm p-2 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-row overflow-hidden h-full">
          {/* Left Column: Document Tabs */}
          <div className="w-1/3 border-r border-slate-150 flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-2.5 shrink-0">
            <div className="pb-2 border-b border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos del Contrato</span>
            </div>

            {preparedDocs.length === 0 ? (
              <div className="text-center py-12 text-slate-450 italic text-xs">
                No hay documentos vinculados a este contrato.
              </div>
            ) : (
              preparedDocs.map((row, idx) => {
                const isActive = idx === activeAuditIdx;
                return (
                  <div
                    key={row.id}
                    onClick={() => setActiveAuditIdx(idx)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 w-full cursor-pointer select-none ${
                      isActive
                        ? row.status === 'APPROVED'
                          ? 'bg-emerald-800 border-emerald-950 text-white shadow-md hover:scale-[1.01]'
                          : row.status === 'REJECTED'
                          ? 'bg-rose-800 border-rose-950 text-white shadow-md hover:scale-[1.01]'
                          : 'bg-[#04045E] border-[#04045E] text-white shadow-md hover:scale-[1.01]'
                        : row.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70 hover:scale-[1.01]'
                        : row.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100/70 hover:scale-[1.01]'
                        : 'bg-white border-slate-200 hover:border-[#04045E]/40 text-slate-700 hover:scale-[1.01]'
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                      Pestaña {idx + 1}
                    </span>
                    <span className="text-xs font-black leading-tight truncate">
                      {row.originalName || row.fileName}
                    </span>
                    <span className={`text-[9px] font-semibold leading-relaxed line-clamp-2 ${isActive ? 'text-white/85' : 'text-slate-450'}`}>
                      {row.observations || 'Auditoría y anexos legales.'}
                    </span>
                    <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        row.dataBase64 || row.file || row.fileUrl
                          ? 'bg-emerald-500/20 text-emerald-600'
                          : 'bg-slate-300/20 text-slate-400'
                      }`}>
                        {row.dataBase64 || row.file || row.fileUrl ? '✓ Con Archivo' : '⚠️ Sin Archivo'}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        row.status === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : row.status === 'REJECTED'
                          ? 'bg-rose-600 text-white'
                          : 'bg-yellow-500 text-slate-900'
                      }`}>
                        {row.status === 'APPROVED' ? 'Aprobado' : row.status === 'REJECTED' ? 'Observado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* dynamic slot creator */}
            <div className="pt-2 border-t border-slate-200 mt-1">
              <button
                onClick={handleCreateNewDocSlot}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#04045E] bg-[#04045E]/6 hover:bg-[#04045E]/12 border border-[#04045E]/20 hover:border-[#04045E]/40 px-3 py-2.5 rounded-2xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span className="text-base leading-none">＋</span>
                Crear Nuevo Archivo / Requerimiento
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Moderator Panel */}
          <div className="w-2/3 flex flex-col bg-white overflow-y-auto p-6 space-y-4">
            {activeRow ? (
              <div className="space-y-4">
                {/* Input file helper */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleManualDocumentUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />

                {/* Document Header */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black text-[#04045E] uppercase tracking-wide">
                      {activeRow.originalName || activeRow.fileName}
                    </h4>
                    <span className="text-[10px] text-slate-450 font-semibold">
                      MIME: {activeRow.mimeType || activeRow.fileType || 'Desconocido'} · Tamaño: {(activeRow.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <span className={`text-[9px] font-black border px-2.5 py-1 rounded-lg uppercase ${
                    activeRow.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    activeRow.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                      'bg-amber-50 text-amber-600 border-amber-200'
                  }`}>
                    {activeRow.status === 'APPROVED' ? '✓ Aprobado' : activeRow.status === 'REJECTED' ? '✗ Rechazado' : '⏳ Pendiente'}
                  </span>
                </div>

                {/* PDF/Image Preview Container */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px] w-full">
                  {(() => {
                    const rawUrl = sanitizeDocUrl(activeRow);
                    if (!rawUrl) {
                      return (
                        <div className="text-center p-6 space-y-3 flex flex-col items-center">
                          <span className="text-3xl text-slate-350">📂</span>
                          <p className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                            No se ha subido ningún archivo a este slot
                          </p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
                          >
                            📁 Cargar Contrato
                          </button>
                        </div>
                      );
                    }

                    const isPdf = activeRow.mimeType === 'application/pdf' || activeRow.fileType === 'application/pdf' || rawUrl.toLowerCase().endsWith('.pdf') || rawUrl.startsWith('data:application/pdf');
                    const isImage = (activeRow.mimeType && activeRow.mimeType.startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp)$/i.test(rawUrl) || rawUrl.startsWith('data:image/');

                    if (isPdf) {
                      return (
                        <div className="w-full space-y-2">
                          <object
                            key={rawUrl}
                            data={rawUrl}
                            type="application/pdf"
                            className="w-full h-[420px] rounded-xl bg-white border-none"
                            aria-label={activeRow.originalName}
                          >
                            <iframe
                              src={rawUrl}
                              className="w-full h-[420px] border-none rounded-xl bg-white"
                              title={activeRow.originalName}
                            />
                          </object>
                        </div>
                      );
                    } else if (isImage) {
                      return <img src={rawUrl} alt={activeRow.originalName} className="max-h-[420px] object-contain rounded-lg mx-auto p-4 animate-fadeIn" />;
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
                  {(activeRow.dataBase64 || activeRow.file || activeRow.fileUrl) && (
                    <a
                      href={sanitizeDocUrl(activeRow)}
                      download={activeRow.originalName}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-black border border-[#04045E]/20 text-[#04045E] bg-[#04045E]/5 hover:bg-[#04045E]/10 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider"
                    >
                      DESCARGAR ARCHIVO / CONTRATO 📥
                    </a>
                  )}

                  {/* Upload contract (replaces or uploads) */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-[10px] font-black border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95"
                  >
                    SUBIR CONTRATO 📤
                  </button>

                  {/* Approve */}
                  <button
                    disabled={activeRow.saving || activeRow.status === 'APPROVED'}
                    onClick={() => handleDocAuditSaveRow(activeAuditIdx, 'APPROVED')}
                    className={`inline-flex items-center gap-1 text-[10px] font-black px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
                      activeRow.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-105 active:scale-95'
                    }`}
                  >
                    {activeRow.saving ? '⏳' : '✓'} Aprobar Documento
                  </button>

                  {/* Reject / Observe */}
                  {!activeRow.rejectOpen ? (
                    <button
                      disabled={activeRow.saving}
                      onClick={() => updateDocRow(activeAuditIdx, { rejectOpen: true })}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-655 uppercase cursor-pointer"
                    >
                      Rechazar
                    </button>
                  ) : (
                    <button
                      onClick={() => updateDocRow(activeAuditIdx, { rejectOpen: false })}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-650 uppercase cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {/* Reject Input Area */}
                {activeRow.rejectOpen && (
                  <div className="flex gap-2 pt-2 animate-in slide-in-from-top-1 duration-150">
                    <textarea
                      rows={2}
                      value={activeRow.rejectText}
                      onChange={e => updateDocRow(activeAuditIdx, { rejectText: e.target.value })}
                      placeholder="Motivo obligatorio: ej. Firma ilegible, faltan anexos..."
                      className="flex-1 resize-none bg-rose-50 border border-rose-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 rounded-xl px-3 py-2 text-xs font-semibold text-rose-900 placeholder:text-rose-300 outline-none transition-all"
                    />
                    <button
                      disabled={activeRow.saving || !activeRow.rejectText.trim()}
                      onClick={() => handleDocAuditSaveRow(activeAuditIdx, 'REJECTED')}
                      className="shrink-0 self-end bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[10px] font-black px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                    >
                      {activeRow.saving ? '⏳' : '💾'} Guardar
                    </button>
                  </div>
                )}

                {activeRow.status === 'REJECTED' && (
                  <div className="mt-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block">Documento Rechazado / Observado</span>
                      <p className="text-[11px] font-semibold text-rose-900 leading-normal">
                        Observaciones: {activeRow.observations || 'Ninguna especificada.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 text-slate-450 italic text-xs">
                Seleccione un documento a la izquierda para previsualizarlo y auditarlo.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-between items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Contrato ID: {contract.id.substring(0, 12)}...
          </span>
          <button
            disabled={isSavingAudit}
            onClick={handleSaveAndClose}
            className="bg-[#04045E] hover:bg-[#04045E]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer active:scale-95"
          >
            {isSavingAudit ? 'Guardando...' : 'Cerrar y Guardar Auditoría'}
          </button>
        </div>
      </div>
    </div>
  );
};
