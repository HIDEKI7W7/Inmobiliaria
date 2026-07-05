'use client';

import React from 'react';

interface ViewDocumentsButtonProps {
  entityId: string;
  entityType: 'property' | 'contract' | 'developer';
}

export const ViewDocumentsButton: React.FC<ViewDocumentsButtonProps> = ({
  entityId,
  entityType
}) => {
  const handleOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('open-entity-docs', {
      detail: { entityId, entityType }
    });
    window.dispatchEvent(event);
  };

  return (
    <button
      onClick={handleOnClick}
      className="flex items-center gap-2 bg-[#0B1354] hover:bg-[#111a66] text-white font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm whitespace-nowrap"
      title="Ver/Gestionar Documentos"
    >
      <span>📄</span> Ver Documentos
    </button>
  );
};
