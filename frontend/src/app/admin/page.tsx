'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { DropdownFilter } from '@/components/ui/DropdownFilter';
import { ViewDocumentsButton } from '@/components/ui/ViewDocumentsButton';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { propertiesService } from '../../services/properties.service';
import { contractsService, Contract } from '../../services/contracts.service';
import { paymentsService, Payment } from '../../services/payments.service';
import { expensesService, Expense } from '../../services/expenses.service';
import { resolveApiUrl } from '../../utils/resolveApiUrl';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';
import {
  fetchLocalProperties,
  fetchLocalContracts,
  persistContract,
  deleteLocalProperty,
  deleteLocalContract,
  fetchLocalDevelopers,
  persistLocalDeveloper,
  deleteLocalDeveloper,
  fetchLocalAgents,
  persistLocalAgent,
  deleteLocalAgent,
  fetchLocalLeads,
  persistLocalLead,
  deleteLocalLead,
  fetchLocalOwners,
  persistLocalOwner,
  deleteLocalOwner,
  fetchLocalPayments,
  persistLocalPayment,
  deleteLocalPayment,
  fetchLocalExpenses,
  persistLocalExpense,
  deleteLocalExpense,
  persistProperty
} from '@/utils/localDb';
interface Property {
  id: string;
  title: string;
  price: number;
  location: {
    address: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  media: {
    photos: string[];
    documents: string[];
  };
  owner: {
    name: string;
    phone: string;
    email: string;
  };
  description?: string;
  type?: string;
  status?: string;
  createdAt?: string | Date;
  isVerified?: boolean;
  verified?: boolean;
  hasFolioReal?: boolean;
  hasCatastro?: boolean;
  hasTestimonio?: boolean;

  // Legacy compatible fields
  priceBob?: number;
  market_age?: string;
  area?: number;
  rooms?: number;
  bathrooms?: number;
  imageUrl?: string;
  image?: string;
  ownerName?: string;
  documents?: any[];
  address?: string;
  offerType?: string;
  featured?: boolean;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  plan?: string;
  hasImpuestosAlDia?: boolean;
  hasPlanoUsoSuelo?: boolean;
  hasCI?: boolean;
  hasOtrosDocumentos?: boolean;
  documentsList?: any[];
  documentStatus?: string;
  code?: string;
  priceBs?: number;
  agentId?: string;
  agent_id?: string;
  ownerId?: string | null;
  owner_id?: string | null;
}

const pathExtname = (url: string): string => {
  const parts = url.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
};

// MOCK DATA: Cartera completa del propietario René Vargas (OWN-201)
// Datos ficticios ultra-detallados para auditoría inmobiliaria en Bolivia.
// ═══════════════════════════════════════════════════════════════════════════════
const MOCK_RENE_VARGAS_DATA = [
  {
    owner: {
      name: 'René Vargas',
      phone: '+591 798 12345',
      email: 'rene@mail.com',
      ci: '4891023 C.B.',
      taxId: 'NIT-4891023011',
    },
  },
];
const MOCK_OWNER_PROPERTIES_OWN201: any[] = [];

const mapPropertyToNewSchema = (p: any): Property => {
  const planNormalized = String(p.plan || '').toLowerCase().replace(' ', '_');
  const finalPlan = planNormalized === 'gratis' ? 'gratis' : planNormalized === 'venta_pro' ? 'venta_pro' : 'gratis';
  return {
    id: p.id || '',
    title: p.title || '',
    price: Number(p.price_usd ?? p.price) || 0,
    location: {
      address: p.address || (typeof p.location === 'object' && p.location ? (p.location.address || '') : (p.location || '')),
      city: typeof p.location === 'object' && p.location ? (p.location.city || 'Cochabamba') : 'Cochabamba',
      coordinates: {
        lat: typeof p.location === 'object' && p.location?.coordinates ? (p.location.coordinates.lat || p.lat || p.latitude || -17.3895) : (p.lat || p.latitude || -17.3895),
        lng: typeof p.location === 'object' && p.location?.coordinates ? (p.location.coordinates.lng || p.lng || p.longitude || -66.1568) : (p.lng || p.longitude || -66.1568),
      }
    },
    media: {
      photos: p.media?.photos || (p.imageUrl ? [p.imageUrl] : []),
      documents: p.media?.documents || (p.documents?.map ? p.documents.map((d: any) => d.fileUrl || d) : [])
    },
    owner: {
      name: p.owner?.name || p.ownerName || 'Propietario Independiente',
      phone: p.owner?.phone || '+591 700 00000',
      email: p.owner?.email || 'propietario@mail.com'
    },
    description: p.description || '',
    type: p.type || 'casa',
    status: p.status || 'NUEVA_PUBLICACION',
    createdAt: p.createdAt || (String(p.id || '').startsWith('PROP-') ? '2026-01-01T00:00:00.000Z' : new Date().toISOString()),
    isVerified: p.isVerified ?? p.verified ?? false,
    verified: p.verified ?? p.isVerified ?? false,
    hasFolioReal: p.hasFolioReal ?? false,
    hasCatastro: p.hasCatastro ?? false,
    hasTestimonio: p.hasTestimonio ?? false,

    // Legacy compatible fields
    priceBob: (p.price_bs ?? p.priceBob ?? (Number(p.price_usd ?? p.price) * 9.76)) || 0,
    area: p.area || 0,
    rooms: p.rooms || 0,
    bathrooms: p.bathrooms || 0,
    imageUrl: p.imageUrl || (p.media?.photos?.[0] || ''),
    image: p.image || p.imageUrl || (p.media?.photos?.[0] || ''),
    ownerName: p.ownerName || p.owner?.name || 'Propietario Independiente',
    documents: p.documents || p.media?.documents || [],
    offerType: p.offerType || 'VENTA',
    featured: p.featured || false,
    latitude: p.latitude || p.lat || (typeof p.location === 'object' && p.location?.coordinates?.lat) || -17.3895,
    longitude: p.longitude || p.lng || (typeof p.location === 'object' && p.location?.coordinates?.lng) || -66.1568,
    lat: p.lat || p.latitude || (typeof p.location === 'object' && p.location?.coordinates?.lat) || -17.3895,
    lng: p.lng || p.longitude || (typeof p.location === 'object' && p.location?.coordinates?.lng) || -66.1568,
    plan: finalPlan,
    market_age: p.market_age || '',
    address: p.address || (typeof p.location === 'object' && p.location ? (p.location.address || '') : (p.location || '')),
    ownerId: p.ownerId || p.owner_id || p.owner?.id || p.userId || null,
    owner_id: p.ownerId || p.owner_id || p.owner?.id || p.userId || null
  };
};;
import PropertyFormFields from '../../components/modules/properties/PropertyFormFields';
import { AdminSidebar, Tab } from '../../components/ui/AdminSidebar';
import { removeToken, getToken } from '../../utils/session';
import { apiClient } from '../../services/api.client';
import { exportDataToExcel } from '../../utils/excelExporter';
import {
  PLAN_KEYS,
  PLAN_LABELS,
  PLAN_BADGE_CLASS,
  getPlanLabel,
  getPlanBadgeClass,
  normalizePlanKey,
  parsePlanFromProperty,
  type PlanKey,
} from '../../utils/planLabels';
import { AgentProvider, useAgents } from '../../context/AgentContext';

// --- Types & Interfaces ---
interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  commissionRate: number; // e.g. 1.5%
  splitPropio: number; // e.g. 50%
  splitAgent: number; // e.g. 50%
  salesVolume: number;
  rating: number;
  status: string;
  dateJoined: string;
  aptitude?: number;
  username?: string;
  temporaryPassword?: string;
  password?: string;
}

interface Prospect {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  budget: number;
  source: string;
  status: 'PENDIENTE' | 'CONTACTADO' | 'VISITA_AGENDADA' | 'COMPRADO';
  createdAt?: string;
  assignedAgent?: string | null;
}

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  properties: string[]; // List of property titles
  plan: PlanKey;
  status: string;
}

interface Constructora {
  id: string;
  empresa: string;
  nit: string;
  representante: string;
  contacto: {
    email: string;
    phone: string;
  };
  stock: number;
  esquemaComision: string;
  etapa: string;
}

interface Collaboration {
  id: string;
  agente1: string;          // Agente Vendedor (solicitante) — gestiona partición de cierre
  agente2: string;          // Agente Captador — compensación no tradicional Propio (fee independiente)
  propiedadId: string;
  propiedadNombre?: string; // Nombre legible del inmueble para el modal de confirmación
  porcentajePropio: number;
  porcentajeAgente1: number;  // % comisión cierre del Agente Vendedor
  porcentajeAgente2: number;  // Fee captador (aislado de comisión agencia tradicional) — ponytail: campo separado por regla de negocio
  estado: 'PENDIENTE_APROBACION' | 'APROBAR_PAGO_SOLICITADO' | 'PAGADO_CERRADO';
  // Flags de regla de negocio de comisión
  agenteVendedorGestionaCierre?: boolean; // true = Agente1 gestiona split de cierre
  captadorFeeIndependiente?: boolean;     // true = fee del Captador es NO-tradicional (plataforma Propio)
}
function AdminConsole() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [tempCommissions, setTempCommissions] = useState<Record<string, number>>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSavingAudit, setIsSavingAudit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const activeRow = docAuditRows[activeAuditIdx];
    if (!activeRow) return;

    updateDocAuditRow(activeAuditIdx, { saving: true });

    try {
      const token = getToken() || '';
      
      if (docAuditEntityType === 'contract') {
        const cleanNewName = `${activeRow.fileName.split(' - ')[0]} - ${file.name.replace(/.*[\\/]/, '')}`;
        const renamedFile = new File([file], cleanNewName, { type: file.type });
        const doc = await contractsService.uploadContractDocuments(docAuditPropId, [renamedFile], token);
        
        const docs = await contractsService.getContractDocuments(docAuditPropId, token);
        const matched = docs.find((d: any) => d.originalName === renamedFile.name) || docs[docs.length - 1];
        
        if (matched) {
          matched.status = 'APPROVED';
          matched.observations = '';
          const localList = docs.map((d: any) => d.id === matched.id ? matched : { ...d, status: d.status || 'PENDING' });
          localStorage.setItem(`propio_contracts_documents_${docAuditPropId}`, JSON.stringify(localList));
          await apiClient.patchWithAuth(`/contracts/${docAuditPropId}/documents/${matched.id}`, { status: 'APPROVED', observations: '' }, token).catch(() => {});
        }
        
        setContractDocuments(docs);
        setTimeout(() => {
          updateDocAuditRow(activeAuditIdx, {
            file: (matched?.dataBase64 || matched?.fileUrl || '#'),
            fileUrl: (matched?.fileUrl || matched?.dataBase64 || '#'),
            fileType: matched?.fileType || file.type,
            fileName: matched?.originalName || renamedFile.name,
            status: 'APPROVED',
            observations: '',
            saving: false,
            checked: true
          });
        }, 200);
        alert('Documento de contrato cargado correctamente.');
      } 
      else if (docAuditEntityType === 'developer') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = event.target?.result as string;
          const cached = localStorage.getItem(`propio_developer_documents_${docAuditPropId}`);
          const docs = cached ? JSON.parse(cached) : [];
          
          const newDoc = {
            id: activeRow.id || `dev-doc-${Date.now()}`,
            name: activeRow.fileName,
            desc: activeRow.description || 'Documento de constructora.',
            file: base64,
            fileUrl: base64,
            mimeType: file.type,
            originalName: file.name,
            fileName: file.name,
            sizeBytes: file.size,
            uploadedAt: new Date().toISOString(),
            status: 'APPROVED',
            observations: ''
          };
          
          const nextDocs = docs.filter((d: any) => d.id !== activeRow.id);
          nextDocs.push(newDoc);
          localStorage.setItem(`propio_developer_documents_${docAuditPropId}`, JSON.stringify(nextDocs));
          
          const dev = developers.find(d => d.id === docAuditPropId);
          if (dev) {
            const updatedDev = { ...dev, documents: nextDocs };
            await persistLocalDeveloper(updatedDev);
          }
          
          setTimeout(() => {
            updateDocAuditRow(activeAuditIdx, {
              file: base64,
              fileUrl: base64,
              fileType: file.type,
              fileName: file.name,
              status: 'APPROVED',
              observations: '',
              saving: false,
              checked: true
            });
          }, 200);
          alert('Documento de constructora cargado correctamente.');
        };
        reader.readAsDataURL(file);
      } 
      else {
        // Original property upload logic
        const baseCleanTitles: Record<string, string> = {
          FR: "Folio Real Actualizado (Libre Alodial)",
          CT: "Certificado Catastral Al Día",
          TS: "Testimonio de Escritura Pública",
          IM: "Impuestos Municipales Al Día",
          PU: "Plano de Uso de Suelo Aprobado",
          OD: "Otros Documentos (Ej. Planos)",
          CI: "Cédula de Identidad Vigente (CI)"
        };
        const cleanPrefix = (baseCleanTitles[activeRow.id] || (activeRow as any).name || activeRow.fileName || 'Documento').split(' - ')[0];
        const cleanNewName = `${cleanPrefix} - ${file.name.replace(/.*[\\/]/, '')}`;
        const renamedFile = new File([file], cleanNewName, { type: file.type });
        
        const doc = await propertiesService.uploadPropertyDocument(docAuditPropId, renamedFile, token);

        setProperties(prev => prev.map(p => {
          if (p.id !== docAuditPropId) return p;
          
          const newDoc = {
            id: doc.id || `doc-manual-${Date.now()}`,
            name: doc.fileName || renamedFile.name,
            file: doc.fileUrl || '#',
            fileUrl: doc.fileUrl || '#',
            fileType: doc.fileType || file.type,
            status: 'APPROVED',
            observations: '',
            checked: true
          };

          const existingDocs = p.documents ? [...p.documents] : [];
          const filteredDocs = existingDocs.filter((d: any) => {
            const searchName = (activeRow as any).name || activeRow.fileName || '';
            const docNameQuery = searchName.split(' - ')[0].substring(0, 10).toUpperCase();
            const nameMatch = (docNameQuery && String(d.name || d.fileType || d.fileName || '').toUpperCase().includes(docNameQuery)) ||
                              String(d.fileType || '').toUpperCase() === activeRow.id.toUpperCase();
            return !nameMatch;
          });

          return {
            ...p,
            documents: [...filteredDocs, newDoc]
          };
        }));

        setTimeout(() => {
          updateDocAuditRow(activeAuditIdx, {
            file: doc.fileUrl || '#',
            fileUrl: doc.fileUrl || '#',
            fileType: doc.fileType || file.type,
            fileName: doc.fileName || renamedFile.name,
            status: 'APPROVED',
            observations: '',
            saving: false,
            checked: true
          });
        }, 200);

        try {
          await apiClient.patchWithAuth<any>(
            `/properties/${docAuditPropId}/documents/${activeRow.id}`,
            { status: 'APPROVED', observations: '' },
            token
          ).catch(e => console.warn('[DocAudit] error patching status:', e));
        } catch (_) {}
        alert('Documento de inmueble cargado correctamente.');
      }

    } catch (err) {
      console.error('Error al cargar documento manual:', err);
      alert('Ocurrió un error al subir el documento.');
      updateDocAuditRow(activeAuditIdx, { saving: false });
    }
  };

  const handleApproveAgent = (agentId: string) => {
    const commission = tempCommissions[agentId] || 0;
    
    // Update local agents state
    setAgents(prev => {
      const next = prev.map(a => a.id === agentId ? { ...a, status: 'Activo', commissionRate: commission } : a);
      localStorage.setItem('propio_admin_agents', JSON.stringify(next));
      return next;
    });

    // Update propio_custom_agents in localStorage
    const storedCustom = localStorage.getItem('propio_custom_agents');
    if (storedCustom) {
      try {
        const parsed = JSON.parse(storedCustom);
        if (Array.isArray(parsed)) {
          const nextCustom = parsed.map((ca: any) => ca.id === agentId ? { ...ca, status: 'activo', basePercentage: commission } : ca);
          localStorage.setItem('propio_custom_agents', JSON.stringify(nextCustom));
        }
      } catch (e) {
        console.error(e);
      }
    }

    alert('Agente aprobado con éxito.');
  };

  // [TIPO_DE_CAMBIO_FLOTANTE]
  const [exchangeRate, setExchangeRate] = useState<{ rateBuy: number; rateSell: number }>({
    rateBuy: 6.86,
    rateSell: 9.76,
  });
  const [manualExchangeRate, setManualExchangeRate] = useState<{ rateBuy: string; rateSell: string }>({
    rateBuy: '6.86',
    rateSell: '9.76',
  });
  const [isUpdatingExchangeRate, setIsUpdatingExchangeRate] = useState(false);
  const [collaborations, setCollaborations] = useState<Collaboration[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('propio_admin_collaborations');
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

  useEffect(() => {
    localStorage.setItem('propio_admin_collaborations', JSON.stringify(collaborations));
  }, [collaborations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('propio_admin_properties');
      localStorage.removeItem('propio_properties_data');
    }
  }, []);

  // [ESTADOS_FILTROS_Y_PAGINACION]
  const [filterTab, setFilterTab] = useState<'TODOS' | 'PROPIEDADES' | 'SOLICITUDES_PAGO'>('TODOS');
  const [colabSearchQuery, setColabSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredColabs = useMemo(() => {
    let result = collaborations;
    if (filterTab === 'SOLICITUDES_PAGO') {
      result = result.filter(c => c.estado === 'APROBAR_PAGO_SOLICITADO');
    } else if (filterTab === 'PROPIEDADES') {
      result = result.filter(c => c.estado === 'PENDIENTE_APROBACION');
    }
    const q = colabSearchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.agente1.toLowerCase().includes(q) ||
          c.agente2.toLowerCase().includes(q) ||
          c.propiedadId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [collaborations, filterTab, colabSearchQuery]);

  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(filteredColabs.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedColabs = useMemo(() => {
    return filteredColabs.slice(startIdx, endIdx);
  }, [filteredColabs, startIdx, endIdx]);

  const [properties, setProperties] = useState<Property[]>([]);

  // ponytail: State variables added for commission distribution interactive flows
  const [expandedColabId, setExpandedColabId] = useState<string | null>(null);
  const [columnLocks, setColumnLocks] = useState<{
    [colabId: string]: {
      porcentajePropio?: boolean;
      porcentajeAgente1?: boolean;
      porcentajeAgente2?: boolean;
    }
  }>({});

  const toggleColumnLock = (colabId: string, campo: 'porcentajePropio' | 'porcentajeAgente1' | 'porcentajeAgente2') => {
    setColumnLocks(prev => {
      const row = prev[colabId] || {};
      return {
        ...prev,
        [colabId]: {
          ...row,
          [campo]: !row[campo]
        }
      };
    });
  };

  const applyPreset = (id: string, preset: [number, number, number]) => {
    setCollaborations(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          porcentajePropio: preset[0],
          porcentajeAgente1: preset[1],
          porcentajeAgente2: preset[2]
        };
      });
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(updated));
      return updated;
    });
    setColumnLocks(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };
  const [approvalModalData, setApprovalModalData] = useState<{
    colabId: string;
    propiedadId: string;
    propiedadNombre: string;
    propertyPrice: number;
    totalCommission: number;
    propioUsd: number;
    propioBs: number;
    agente1: string;
    agente1Usd: number;
    agente1Bs: number;
    agente2: string;
    agente2Usd: number;
    agente2Bs: number;
  } | null>(null);

  const [isNewColabModalOpen, setIsNewColabModalOpen] = useState(false);
  const [newColabPropId, setNewColabPropId] = useState('');
  const [newColabAgente1, setNewColabAgente1] = useState('');
  const [newColabAgente2, setNewColabAgente2] = useState('');
  const [newColabPctPropio, setNewColabPctPropio] = useState(50);
  const [newColabPctAgente1, setNewColabPctAgente1] = useState(25);
  const [newColabPctAgente2, setNewColabPctAgente2] = useState(25);

  // ponytail: Lookup function to retrieve property price dynamically
  const getPropertyPrice = (propiedadId: string) => {
    const cleanId = propiedadId.replace('#', '').trim().toLowerCase();
    const prop = properties.find(p => {
      const pid = p.id.replace('#', '').trim().toLowerCase();
      return pid === cleanId || pid.includes(cleanId) || cleanId.includes(pid);
    });
    if (prop) return prop.price;
    // Static mapping for mock collaborations in case properties state hasn't loaded them
    if (cleanId.includes('1024')) return 180000;
    if (cleanId.includes('3099')) return 120050;
    if (cleanId.includes('0841')) return 95000;
    if (cleanId.includes('3151')) return 150000;
    return 120000; // general fallback
  };

  const [previewDoc, setPreviewDoc] = useState<{ property: any; type: 'FR' | 'CT' | 'TS'; name: string; url: string | null; status: string; } | null>(null);
    const [activeDocType, setActiveDocType] = useState<string>('FR');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);

  const [auditStates, setAuditStates] = useState<{
    [docType: string]: {
      status: string;
      comments: string;
      fileUrl: string | null;
      fileName: string | null;
      labelName?: string;
    }
  }>({
    FR: { status: 'PENDING', comments: '', fileUrl: null, fileName: null },
    CT: { status: 'PENDING', comments: '', fileUrl: null, fileName: null },
    TS: { status: 'PENDING', comments: '', fileUrl: null, fileName: null }
  });

  const handleAddExtraDoc = () => {
    const docName = prompt('Ingrese el nombre del documento extra (ej. Certificado Alodial o Plano de Ubicación):');
    if (docName && docName.trim()) {
      const cleanName = docName.trim();
      const key = cleanName.substring(0, 2).toUpperCase() + Math.floor(Math.random() * 100);
      setAuditStates(prev => ({
        ...prev,
        [key]: {
          status: 'PENDING',
          comments: '',
          fileUrl: null,
          fileName: null,
          labelName: cleanName
        }
      }));
      setActiveDocType(key);
    }
  };

  const handleTabSwitch = (docType: string) => {
    setActiveDocType(docType);
  };

  // States for Unified Finance Audit (Ingresos, Gastos, Contratos)
  const [previewFinance, setPreviewFinance] = useState<{
    type: 'income' | 'expense' | 'contract';
    id: string;
    title: string;
  } | null>(null);

  const [activeFinanceDocType, setActiveFinanceDocType] = useState<string>('COMPROBANTE');
  const [isFinancePreviewExpanded, setIsFinancePreviewExpanded] = useState<boolean>(false);

  const [financeAuditStates, setFinanceAuditStates] = useState<{
    [docType: string]: {
      status: string;
      comments: string;
      fileUrl: string | null;
      fileName: string | null;
      labelName?: string;
    }
  }>({});

  const handleOpenFinanceAudit = (
    type: 'income' | 'expense' | 'contract',
    id: string,
    title: string,
    initialDocs: any
  ) => {
    const safeDocs = initialDocs || {};
    setFinanceAuditStates(safeDocs);
    const firstDocKey = Object.keys(safeDocs)[0] || 'COMPROBANTE';
    setActiveFinanceDocType(firstDocKey);
    setIsFinancePreviewExpanded(false);
    setPreviewFinance({
      type,
      id,
      title
    });
  };

  const handleFinanceTabSwitch = (docType: string) => {
    setActiveFinanceDocType(docType);
  };

  const handleUpdateFinanceSubStatus = (status: string) => {
    setFinanceAuditStates(prev => ({
      ...prev,
      [activeFinanceDocType]: {
        ...prev[activeFinanceDocType],
        status
      }
    }));
  };

  const handleUpdateFinanceSubComments = (comments: string) => {
    setFinanceAuditStates(prev => ({
      ...prev,
      [activeFinanceDocType]: {
        ...prev[activeFinanceDocType],
        comments
      }
    }));
  };

  const handleFinanceSubFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFinanceAuditStates(prev => ({
        ...prev,
        [activeFinanceDocType]: {
          ...prev[activeFinanceDocType],
          fileUrl: url,
          fileName: file.name
        }
      }));
    }
  };

  const handleClearFinanceSubFile = () => {
    setFinanceAuditStates(prev => ({
      ...prev,
      [activeFinanceDocType]: {
        ...prev[activeFinanceDocType],
        fileUrl: null,
        fileName: null
      }
    }));
  };

  const handleAddFinanceExtraDoc = () => {
    const docName = prompt('Título del nuevo documento:');
    if (docName && docName.trim()) {
      const cleanName = docName.trim();
      const key = cleanName.substring(0, 2).toUpperCase() + Math.floor(Math.random() * 105);
      setFinanceAuditStates(prev => ({
        ...prev,
        [key]: {
          status: 'PENDING',
          comments: '',
          fileUrl: null,
          fileName: null,
          labelName: cleanName
        }
      }));
      setActiveFinanceDocType(key);
    }
  };

  const getFinanceDocStatusDotColor = (type: string) => {
    const status = financeAuditStates?.[type]?.status;
    if (status === 'APPROVED') return 'bg-emerald-500';
    if (status === 'REJECTED') return 'bg-rose-500';
    if (status === 'PENDING') return 'bg-amber-500';
    return 'bg-slate-300';
  };

  const handleSaveFinanceAllAudits = (type: 'income' | 'expense' | 'contract', id: string) => {
    if (type === 'income') {
      const activeState = financeAuditStates['COMPROBANTE'] || { status: 'PENDING', comments: '' };
      const apiStatus = activeState.status === 'APPROVED' ? 'CONCILIADO' : activeState.status === 'REJECTED' ? 'OBSERVADO' : 'PENDING';
      handleUpdatePaymentStatus(id, apiStatus, activeState.comments);
    } else if (type === 'expense') {
      const activeState = financeAuditStates['FACTURA'] || { status: 'PENDING', comments: '' };
      const apiStatus = activeState.status === 'APPROVED' ? 'APROBADO' : activeState.status === 'REJECTED' ? 'OBSERVADO' : 'PENDING';
      handleUpdateExpenseStatus(id, apiStatus, activeState.comments);
    } else if (type === 'contract') {
      const activeState = financeAuditStates['CONTRATO_FIRMADO'] || { status: 'PENDING', comments: '' };
      const apiStatus = activeState.status === 'APPROVED' ? 'VIGENTE' : activeState.status === 'REJECTED' ? 'VENCIDO' : 'PENDING';
      setContracts(prev => {
        const updated = prev.map(c => {
          if (c.id !== id) return c;
          return { ...c, status: apiStatus as any };
        });
        localStorage.setItem('propio_admin_contracts', JSON.stringify(updated));
        return updated;
      });
    }
    setPreviewFinance(null);
  };

  const handleUpdateSubStatus = (status: string) => {
    setAuditStates(prev => ({
      ...prev,
      [activeDocType]: {
        ...prev[activeDocType],
        status
      }
    }));
  };

  const handleUpdateSubComments = (comments: string) => {
    setAuditStates(prev => ({
      ...prev,
      [activeDocType]: {
        ...prev[activeDocType],
        comments
      }
    }));
  };

  const handleSubFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAuditStates(prev => ({
        ...prev,
        [activeDocType]: {
          ...prev[activeDocType],
          fileUrl: url,
          previewUrl: url,
          fileName: file.name
        }
      }));
    }
  };

  const handleClearSubFile = () => {
    setAuditStates(prev => {
      let fallbackUrl = null;
      if (activeDocType === 'FR') fallbackUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';
      else if (activeDocType === 'CT') fallbackUrl = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80';
      else if (activeDocType === 'TS') fallbackUrl = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80';

      return {
        ...prev,
        [activeDocType]: {
          ...prev[activeDocType],
          fileUrl: null,
          previewUrl: fallbackUrl,
          fileName: null
        }
      };
    });
  };

  const getDocStatusDotColor = (type: string) => {
    const status = auditStates[type]?.status;
    if (status === 'APPROVED') return 'bg-emerald-500';
    if (status === 'REJECTED') return 'bg-rose-500';
    if (status === 'PENDING') return 'bg-amber-500';
    return 'bg-slate-300';
  };

  const handleSaveAllAudits = (propertyId: string) => {
    const updated = properties.map(p => {
      if (p.id !== propertyId) return p;

      let updatedDocs = p.documents;
      const statusMap: any = {
        'APPROVED': 'verificado',
        'PENDING': 'pendiente',
        'REJECTED': 'rechazado'
      };

      if (Array.isArray(p.documents)) {
        const updatedArr = [...p.documents];
        Object.keys(auditStates).forEach(type => {
          const state = auditStates[type];
          const rigidPrefixMap: Record<string, string> = {
            FR: 'FOLIO REAL',
            CT: 'CERTIFICAD',
            TS: 'TESTIMONIO',
            IM: 'IMPUESTOS ',
            PU: 'PLANO DE U',
            OD: 'OTROS DOCU',
            CI: 'CÉDULA DE '
          };
          const prefix = rigidPrefixMap[type];
          const idx = updatedArr.findIndex(d => 
            d.fileType?.toUpperCase() === type ||
            (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
          );
          if (idx > -1) {
            updatedArr[idx] = {
              ...updatedArr[idx],
              status: state.status,
              comments: state.comments,
              ...(state.fileUrl ? { fileUrl: state.fileUrl } : {})
            };
          } else {
            updatedArr.push({
              fileType: type,
              status: state.status,
              fileUrl: state.fileUrl || '',
              comments: state.comments
            });
          }
        });
        updatedDocs = updatedArr;
      } else {
        const obj = p.documents && typeof p.documents === 'object' && !Array.isArray(p.documents) ? { ...(p.documents as any) } : {} as any;
        Object.keys(auditStates).forEach(type => {
          const state = auditStates[type];
          obj[type] = {
            ...(obj[type] || {}),
            status: statusMap[state.status] || 'pendiente',
            comments: state.comments,
            ...(state.fileUrl ? { url: state.fileUrl } : {})
          };
        });
        updatedDocs = obj;
      }

      return {
        ...p,
        documents: updatedDocs,
        hasFolioReal: auditStates.FR.status === 'APPROVED' || auditStates.FR.status === 'PENDING',
        hasCatastro: auditStates.CT.status === 'APPROVED' || auditStates.CT.status === 'PENDING',
        hasTestimonio: auditStates.TS.status === 'APPROVED' || auditStates.TS.status === 'PENDING'
      };
    });

    setProperties(updated);
    setPreviewDoc(null);

    const targetProp = updated.find(p => p.id === propertyId);
    if (targetProp) {
      fetch(`/api/local/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetProp)
      }).catch(err => console.warn('[SaveAllAudits] Local PUT sync failed:', err));
    }
  };

  const handleOpenDocumentPreview = (property: any, docType: 'FR' | 'CT' | 'TS') => {
    const initialStates: any = {
      FR: { status: 'PENDING', comments: '', fileUrl: null, fileName: null },
      CT: { status: 'PENDING', comments: '', fileUrl: null, fileName: null },
      TS: { status: 'PENDING', comments: '', fileUrl: null, fileName: null }
    };

    const docTypes = ['FR', 'CT', 'TS'] as const;
    docTypes.forEach(type => {
      let status = 'PENDING';
      let url = null;
      let name = null;
      let comments = '';

      if (property.documents && !Array.isArray(property.documents)) {
        const docInfo = property.documents[type];
        if (docInfo) {
          status = docInfo.status === 'verificado' ? 'APPROVED' : docInfo.status === 'pendiente' ? 'PENDING' : docInfo.status === 'rechazado' ? 'REJECTED' : 'PENDING';
          url = docInfo.url || null;
          name = docInfo.name || null;
          comments = docInfo.comments || '';
        }
      } else {
        const matched = property.documents?.find((d: any) => d.fileType?.toUpperCase() === type);
        if (matched) {
          status = matched.status || 'PENDING';
          url = matched.fileUrl || null;
          name = matched.fileName || null;
          comments = matched.comments || '';
        } else {
          const legacyFlag = type === 'FR' ? property.hasFolioReal : type === 'CT' ? property.hasCatastro : type === 'TS' ? property.hasTestimonio : false;
          if (legacyFlag) status = 'PENDING';
        }
      }

      let fallbackUrl = null;
      if (type === 'FR') fallbackUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';
      else if (type === 'CT') fallbackUrl = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80';
      else if (type === 'TS') fallbackUrl = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80';

      initialStates[type] = {
        status,
        comments,
        fileUrl: url,
        previewUrl: url || fallbackUrl,
        fileName: url ? (name || 'documento_existente.pdf') : null
      };
    });

    if (Array.isArray(property.documents)) {
      property.documents.forEach((d: any) => {
        const typeUpper = d.fileType?.toUpperCase();
        if (typeUpper && !['FR', 'CT', 'TS'].includes(typeUpper)) {
          initialStates[typeUpper] = {
            status: d.status || 'PENDING',
            comments: d.comments || '',
            fileUrl: d.fileUrl || null,
            previewUrl: d.fileUrl || null,
            fileName: d.fileName || (d.fileUrl ? 'archivo_extra.pdf' : null),
            labelName: d.fileName || d.fileType
          };
        }
      });
    } else if (property.documents) {
      Object.keys(property.documents).forEach(type => {
        const typeUpper = type.toUpperCase();
        if (!['FR', 'CT', 'TS'].includes(typeUpper)) {
          const docInfo = property.documents[type];
          initialStates[typeUpper] = {
            status: docInfo.status === 'verificado' ? 'APPROVED' : docInfo.status === 'pendiente' ? 'PENDING' : docInfo.status === 'rechazado' ? 'REJECTED' : 'PENDING',
            comments: docInfo.comments || '',
            fileUrl: docInfo.url || null,
            previewUrl: docInfo.url || null,
            fileName: docInfo.name || (docInfo.url ? 'archivo_extra.pdf' : null),
            labelName: docInfo.name || type
          };
        }
      });
    }

    setAuditStates(initialStates);
    setActiveDocType(docType);
    setIsPreviewExpanded(false);

    setPreviewDoc({
      property,
      type: docType,
      name: docType === 'FR' ? 'Folio Real Alodial Actualizado' : docType === 'CT' ? 'Certificado Catastral al Día' : 'Testimonio de Escritura Pública',
      url: initialStates[docType].fileUrl,
      status: initialStates[docType].status
    });
  };
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSucursal, setSelectedSucursal] = useState('TODOS');
  const [isSucursalDropdownOpen, setIsSucursalDropdownOpen] = useState(false);
  const [agentKpis, setAgentKpis] = useState({
    totalActive: 0,
    topRated: 0,
    closuresVolume: 0,
    commissionsTotal: 0,
    avgRating: 0
  });
  const [dashboardStats, setDashboardStats] = useState<{
    activeProperties: number;
    percentVerified: number;
    agentCount: number;
    assignedAgents: number;
    monthlyIncome: number;
    cierresDelMes: number;
    recentEvents: Array<{ id: string; text: string; time: string }>;
  }>({
    activeProperties: 0,
    percentVerified: 0,
    agentCount: 0,
    assignedAgents: 0,
    monthlyIncome: 0,
    cierresDelMes: 0,
    recentEvents: []
  });
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [showAddAgentModal, setShowAddAgentModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [newAgentPhone, setNewAgentPhone] = useState('');
  const [newAgentCI, setNewAgentCI] = useState('');
  const [newAgentBirthDate, setNewAgentBirthDate] = useState('');
  const [newAgentCity, setNewAgentCity] = useState('Cochabamba');
  const [newAgentAptitude, setNewAgentAptitude] = useState<number | ''>('');
  const [newAgentCommission, setNewAgentCommission] = useState(1.5);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ username: string, password: string } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Developer Modal & Form States
  const [isNewDeveloperModalOpen, setIsNewDeveloperModalOpen] = useState(false);
  const [newDevName, setNewDevName] = useState('');
  const [newDevNit, setNewDevNit] = useState('');
  const [newDevFoundedYear, setNewDevFoundedYear] = useState('');
  const [newDevLogoUrl, setNewDevLogoUrl] = useState('');
  const [newDevRepresentative, setNewDevRepresentative] = useState('');
  const [newDevPhone, setNewDevPhone] = useState('');
  const [newDevEmail, setNewDevEmail] = useState('');
  const [newDevWebsite, setNewDevWebsite] = useState('');
  const [newDevOfficeZone, setNewDevOfficeZone] = useState('');
  const [newDevOfficeAddress, setNewDevOfficeAddress] = useState('');
  const [newDevDescription, setNewDevDescription] = useState('');
  const [newDevSpecialties, setNewDevSpecialties] = useState<string[]>([]);

  // Custom Constructora Edit/Delete and Column Filters
  const [editingConstructora, setEditingConstructora] = useState<Constructora | null>(null);
  const [deletingConstructoraId, setDeletingConstructoraId] = useState<string | null>(null);

  const [filterDevId, setFilterDevId] = useState('');
  const [filterDevEmpresa, setFilterDevEmpresa] = useState('');
  const [filterDevNit, setFilterDevNit] = useState('');
  const [filterDevRepresentante, setFilterDevRepresentante] = useState('');

  // Contract Modal & Form States
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isUploadContractModalOpen, setIsUploadContractModalOpen] = useState(false);
  const [contractPropertyId, setContractPropertyId] = useState('');
  const [contractTenantName, setContractTenantName] = useState('');
  const [contractTenantCI, setContractTenantCI] = useState('');
  const [contractTenantPhone, setContractTenantPhone] = useState('');
  const [contractMonthlyAmount, setContractMonthlyAmount] = useState<number | ''>('');
  const [contractCurrency, setContractCurrency] = useState('USD');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [contractStatus, setContractStatus] = useState<'VIGENTE' | 'VENCIDO' | 'RESCINDIDO'>('VIGENTE');
  const [contractObservations, setContractObservations] = useState('');
  const [contractFileName, setContractFileName] = useState('');

  // Contract Edit, Delete & Advanced Filters
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);

  // Document Management States
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedContractForDocs, setSelectedContractForDocs] = useState<Contract | null>(null);
  const [contractDocuments, setContractDocuments] = useState<any[]>([]);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  const handleOpenDocsModal = async (contract: Contract) => {
    setSelectedContractForDocs(contract);
    setIsDocsModalOpen(true);
    try {
      const token = getToken() || '';
      const docs = await contractsService.getContractDocuments(contract.id, token);
      setContractDocuments(docs);
    } catch (err: any) {
      alert('Error al obtener los documentos: ' + (err.message || err));
    }
  };

  const handleOpenDocsModalFromHeader = () => {
    if (contracts.length === 0) {
      alert('No hay contratos registrados para gestionar documentos.');
      return;
    }
    handleOpenDocsModal(contracts[0]);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedContractForDocs) return;
    setIsUploadingDocs(true);
    try {
      const token = getToken() || '';
      const fileArray = Array.from(files);
      const res = await contractsService.uploadContractDocuments(selectedContractForDocs.id, fileArray, token);
      alert(res.message);
      const docs = await contractsService.getContractDocuments(selectedContractForDocs.id, token);
      setContractDocuments(docs);
    } catch (err: any) {
      alert('Error al subir los documentos: ' + (err.message || err));
    } finally {
      setIsUploadingDocs(false);
    }
  };

  const handleDeleteFile = async (docId: string) => {
    if (!selectedContractForDocs) return;
    if (!window.confirm('¿Está seguro de que desea eliminar este documento?')) return;
    try {
      const token = getToken() || '';
      const res = await contractsService.deleteContractDocument(selectedContractForDocs.id, docId, token);
      alert(res.message);
      const docs = await contractsService.getContractDocuments(selectedContractForDocs.id, token);
      setContractDocuments(docs);
    } catch (err: any) {
      alert('Error al eliminar el documento: ' + (err.message || err));
    }
  };

  // Date Range and Document Status Filters (Report Style Panel)
  const [filterContractDateStart, setFilterContractDateStart] = useState('');
  const [filterContractDateEnd, setFilterContractDateEnd] = useState('');
  const [filterContractDocState, setFilterContractDocState] = useState<'Todos' | 'Vigentes' | 'Vencidos' | 'PorVencer'>('Todos');

  // Inline Table Column Filters
  const [filterContractId, setFilterContractId] = useState('');
  const [filterContractPropiedad, setFilterContractPropiedad] = useState('');
  const [filterContractArrendatario, setFilterContractArrendatario] = useState('');
  const [filterContractMonto, setFilterContractMonto] = useState('');
  const [filterContractVigencia, setFilterContractVigencia] = useState('');

  // Search and Filter States
  const [activePropertyPreview, setActivePropertyPreview] = useState<string | null>(null);
  const [previewPropertyData, setPreviewPropertyData] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [modalPropertyData, setModalPropertyData] = useState<Property | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeDropdownOwnerId, setActiveDropdownOwnerId] = useState<string | null>(null);
  const [activeOwnerPortfolio, setActiveOwnerPortfolio] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [loadingOwnerZip, setLoadingOwnerZip] = useState<string | null>(null);
  const [processingZipId, setProcessingZipId] = useState<string | null>(null);

  // Global Search Omnibox States
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);


  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.owner-portfolio-container')) {
        setActiveOwnerPortfolio(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  // Document auditing states (legacy single-doc)
   const [auditPropertyId, setAuditPropertyId] = useState<string | null>(null);
  const [auditDocType, setAuditDocType] = useState<string | null>(null);
  const [auditDocObservations, setAuditDocObservations] = useState<string>('');
  const [isRejectingDoc, setIsRejectingDoc] = useState<boolean>(false);
  const [isApprovingDoc, setIsApprovingDoc] = useState<boolean>(false);

  // [DOC_AUDIT_MODAL_STATE] — Rich multi-doc audit modal
  type DocAuditRow = {
    id: string;
    fileType: string;
    fileName: string;
    fileUrl: string;
    status: string;
    observations: string;
    rejectOpen: boolean;
    rejectText: string;
    saving: boolean;
    checked?: boolean;
    file?: string | null;
    description?: string;
  };
  const [docAuditOpen, setDocAuditOpen] = useState<boolean>(false);
  const [docAuditEntityType, setDocAuditEntityType] = useState<'property' | 'contract' | 'developer'>('property');
  const [docAuditPropId, setDocAuditPropId] = useState<string>('');
  const [docAuditPropTitle, setDocAuditPropTitle] = useState<string>('');
  const [docAuditRows, setDocAuditRows] = useState<DocAuditRow[]>([]);
  const [docAuditLoading, setDocAuditLoading] = useState<boolean>(false);
  const [docAuditExpanded, setDocAuditExpanded] = useState<boolean>(false);
  const [activeAuditIdx, setActiveAuditIdx] = useState<number>(0);

  const DOC_AUDIT_VISIBLE_LIMIT = 4;

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-06-21');
  const [selectedPlan, setSelectedPlan] = useState('todos');

  // Column Dropdown Filters States
  const [selectedAge, setSelectedAge] = useState('todos');
  const [selectedDocumentation, setSelectedDocumentation] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [activeHeaderFilter, setActiveHeaderFilter] = useState<string | null>(null);

  // Dropdown multi-select filters for Developers (Constructoras)
  const [selectedDevIds, setSelectedDevIds] = useState<string[]>([]);
  const [selectedDevEmpresas, setSelectedDevEmpresas] = useState<string[]>([]);
  const [selectedDevNits, setSelectedDevNits] = useState<string[]>([]);
  const [selectedDevRepresentantes, setSelectedDevRepresentantes] = useState<string[]>([]);

  // Dropdown multi-select filters for Contracts (Contratos)
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [selectedContractProperties, setSelectedContractProperties] = useState<string[]>([]);
  const [selectedContractTenants, setSelectedContractTenants] = useState<string[]>([]);
  const [selectedContractStatuses, setSelectedContractStatuses] = useState<string[]>([]);

  // Dropdown multi-select filters for Payments (Ingresos)
  const [selectedPayIds, setSelectedPayIds] = useState<string[]>([]);
  const [selectedPayCategories, setSelectedPayCategories] = useState<string[]>([]);
  const [selectedPayIssuers, setSelectedPayIssuers] = useState<string[]>([]);
  const [selectedPayContracts, setSelectedPayContracts] = useState<string[]>([]);
  const [selectedPayAmounts, setSelectedPayAmounts] = useState<string[]>([]);
  const [selectedPayDestinations, setSelectedPayDestinations] = useState<string[]>([]);
  const [selectedPayDates, setSelectedPayDates] = useState<string[]>([]);
  const [selectedPayMethods, setSelectedPayMethods] = useState<string[]>([]);
  const [selectedPayStatuses, setSelectedPayStatuses] = useState<string[]>([]);

  // Dropdown multi-select filters for Expenses (Gastos)
  const [selectedExpIds, setSelectedExpIds] = useState<string[]>([]);
  const [selectedExpDates, setSelectedExpDates] = useState<string[]>([]);
  const [selectedExpRequesters, setSelectedExpRequesters] = useState<string[]>([]);
  const [selectedExpCategories, setSelectedExpCategories] = useState<string[]>([]);
  const [selectedExpConcepts, setSelectedExpConcepts] = useState<string[]>([]);
  const [selectedExpVinculaciones, setSelectedExpVinculaciones] = useState<string[]>([]);
  const [selectedExpStatuses, setSelectedExpStatuses] = useState<string[]>([]);

  // Map popover state
  const [activeMapPopoverId, setActiveMapPopoverId] = useState<string | null>(null);

  useEffect(() => {
    if (activeMapPopoverId) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeMapPopoverId]);

  // Payments / Incomes Tab Specific Filters
  const [payFilterStatus, setPayFilterStatus] = useState<'ALL' | 'CONCILIADO' | 'PENDIENTE' | 'OBSERVADO'>('ALL');
  const [payFilterCategory, setPayFilterCategory] = useState<'ALL' | 'VER TODOS' | 'AGENTES' | 'PLANES PUBLICIDAD' | 'OTROS'>('ALL');
  const [paySearch, setPaySearch] = useState('');
  
  // Header inline table filter states for payments (11 columns)
  const [colFilterId, setColFilterId] = useState('');
  const [colFilterCategory, setColFilterCategory] = useState('');
  const [colFilterIssuer, setColFilterIssuer] = useState('');
  const [colFilterContract, setColFilterContract] = useState('');
  const [colFilterAmount, setColFilterAmount] = useState('');
  const [colFilterDestination, setColFilterDestination] = useState('');
  const [colFilterDate, setColFilterDate] = useState('');
  const [colFilterMethod, setColFilterMethod] = useState('');

  // Modals & Sub-states
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<Agent | null>(null);
  const [editingPlanProperty, setEditingPlanProperty] = useState<Property | null>(null);

  // Agent header filter states
  const [activeAgentHeaderFilter, setActiveAgentHeaderFilter] = useState<string | null>(null);
  const [selectedAgentNames, setSelectedAgentNames] = useState<string[]>([]);
  const [selectedAgentCommission, setSelectedAgentCommission] = useState<string>('Todos');
  const [selectedAgentSplit, setSelectedAgentSplit] = useState<string>('Todos los repartos');
  const [selectedAgentSales, setSelectedAgentSales] = useState<string>('Todos');
  const [selectedAgentRating, setSelectedAgentRating] = useState<string>('Todos');
  const [agentNameSearchQuery, setAgentNameSearchQuery] = useState('');

  // Prospect header filter states (anti-collision single-open state)
  const [activeProspectHeaderFilter, setActiveProspectHeaderFilter] = useState<string | null>(null);
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [selectedProspectNames, setSelectedProspectNames] = useState<string[]>([]);
  const [prospectContactSearch, setProspectContactSearch] = useState('');
  const [selectedProspectInterests, setSelectedProspectInterests] = useState<string[]>([]);
  const [prospectBudgetFilter, setProspectBudgetFilter] = useState('Todos');
  const [selectedProspectSources, setSelectedProspectSources] = useState<string[]>([]);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);


  // [ESTADOS_Y_EXTENSIÓN_FORMULARIO_INMUEBLE]
  // Estados del modal/drawer de edición total de propiedad
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCurrency, setEditCurrency] = useState('BOB');
  const [editPriceBOB, setEditPriceBOB] = useState('');
  const [editPriceUSD, setEditPriceUSD] = useState('');
  const [editExchangeRate, setEditExchangeRate] = useState('9.76');
  const [editLandArea, setEditLandArea] = useState('');
  const [editBuiltArea, setEditBuiltArea] = useState('');
  const [editZona, setEditZona] = useState('');
  const [editAttributes, setEditAttributes] = useState<Record<string, boolean>>({});
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editDocuments, setEditDocuments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // Sostenibilidad (flags booleanos independientes)
  type SostenibilidadFlags = { calefonSolar: boolean; panelesSolares: boolean; iluminacionLed: boolean; reciclajeAgua: boolean; };
  const [editSostenibilidad, setEditSostenibilidad] = useState<SostenibilidadFlags>({
    calefonSolar: false, panelesSolares: false, iluminacionLed: false, reciclajeAgua: false,
  });
  // Documentos adjuntos locales (previo a subida) — File[] con metadata extendida
  type DocAdjunto = { id: string; file: File; nombre: string; tipo: string; };
  const [editDocumentosAdjuntos, setEditDocumentosAdjuntos] = useState<DocAdjunto[]>([]);

  // Status notes modal state
  const [showNotesModalForPayment, setShowNotesModalForPayment] = useState<Payment | null>(null);
  const [observationInput, setObservationInput] = useState('');
  const [showRejectModalForPayment, setShowRejectModalForPayment] = useState<Payment | null>(null);

  // --- Expenses (Egreso) Tab Filter and Modal States ---
  const [expDateRange, setExpDateRange] = useState('01/05/2026 - 31/05/2026');
  const [expFilterStatus, setExpFilterStatus] = useState<string>('PENDIENTE');
  const [expFilterCategory, setExpFilterCategory] = useState<string>('Mantenimiento');
  const [expSearchQuery, setExpSearchQuery] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showRejectModalForExpense, setShowRejectModalForExpense] = useState<Expense | null>(null);
  const [showNotesModalForExpense, setShowNotesModalForExpense] = useState<Expense | null>(null);
  const [addFundsAmount, setAddFundsAmount] = useState<number>(0);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [extraFunds, setExtraFunds] = useState<number>(0);

  // Form states for registrar gasto
  const [newExpConcept, setNewExpConcept] = useState('');
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpDate, setNewExpDate] = useState('2026-05-19');
  const [newExpCategory, setNewExpCategory] = useState('Mantenimiento');
  const [newExpPropertyId, setNewExpPropertyId] = useState('');
  const [newExpRequester, setNewExpRequester] = useState('Agente: Juan P.');
  const [newExpVinculacion, setNewExpVinculacion] = useState('Prop: Torre Norte 14A');

  // Independent column filter states for expenses table
  const [expColFilterId, setExpColFilterId] = useState('');
  const [expColFilterDate, setExpColFilterDate] = useState('');
  const [expColFilterRequester, setExpColFilterRequester] = useState('');
  const [expColFilterCategory, setExpColFilterCategory] = useState('');
  const [expColFilterConcept, setExpColFilterConcept] = useState('');
  const [expColFilterVinculacion, setExpColFilterVinculacion] = useState('');
  const [expColFilterAmount, setExpColFilterAmount] = useState('');
  const [expColFilterReceipt, setExpColFilterReceipt] = useState('');
  const [expColFilterStatus, setExpColFilterStatus] = useState('');
  const [activeExpDropdownId, setActiveExpDropdownId] = useState<string | null>(null);

  // --- Reports (Reportes) Tab States ---
  const [reportSection, setReportSection] = useState<string>('PROPIEDADES');
  const [reportStartDate, setReportStartDate] = useState<string>('2026-05-01');
  const [reportEndDate, setReportEndDate] = useState<string>('2026-06-21');
  const [reportZone, setReportZone] = useState<string>('ALL');
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportSortCriterion, setReportSortCriterion] = useState<string>('DATE_DESC');

  const getSortOptionsForSection = (sec: string) => {
    switch (sec) {
      case 'PROPIEDADES':
        return [
          { value: 'DATE_DESC', label: 'Orden Cronológico Descendente' },
          { value: 'PRICE_DESC', label: 'Mayor Precio' },
          { value: 'STATUS_APPROVED', label: 'Estado Aprobado Primero' },
        ];
      case 'AGENTES':
        return [
          { value: 'VOLUME_DESC', label: 'Mayor Volumen de Cierres' },
          { value: 'RATING_DESC', label: 'Mayor Rating' },
          { value: 'DATE_DESC', label: 'Fecha de Registro' },
        ];
      case 'PROSPECTOS':
        return [
          { value: 'BUDGET_DESC', label: 'Mayor Presupuesto' },
          { value: 'DATE_DESC', label: 'Fecha de Contacto Descendente' },
        ];
      case 'PROPIETARIOS':
        return [
          { value: 'VERIFIED_FIRST', label: 'Verificados Primero' },
          { value: 'PROPERTIES_DESC', label: 'Mayor Cantidad de Propiedades' },
          { value: 'PLAN_PREMIUM', label: 'Planes Premium Primero' },
        ];
      case 'CONSTRUCTORAS':
        return [
          { value: 'STOCK_DESC', label: 'Mayor Stock de Inventario' },
          { value: 'COMMISSION_DESC', label: 'Mayor Comisión Pactada' },
        ];
      case 'CONTRATOS':
        return [
          { value: 'MONTHLY_DESC', label: 'Mayor Monto Contractual' },
          { value: 'STATUS_ACTIVE', label: 'Vigentes Primero' },
          { value: 'START_DESC', label: 'Fecha de Inicio Descendente' },
        ];
      case 'INGRESOS':
        return [
          { value: 'AMOUNT_DESC', label: 'Mayor Monto Cobrado' },
          { value: 'STATUS_PENDING', label: 'Cobros Pendientes Primero' },
          { value: 'DATE_DESC', label: 'Fecha de Cobro Descendente' },
        ];
      case 'GASTOS':
        return [
          { value: 'AMOUNT_ABS_DESC', label: 'Mayor Monto Egresado' },
          { value: 'STATUS_PENDING', label: 'Egresos Pendientes Primero' },
          { value: 'DATE_DESC', label: 'Fecha de Gasto Descendente' },
        ];
      case 'PLANES MKT':
        return [
          { value: 'BUDGET_DESC', label: 'Mayor Presupuesto Asignado' },
          { value: 'LINKED_DESC', label: 'Mayor Cantidad de Inmuebles' },
          { value: 'STATUS_ACTIVE', label: 'Planes Activos Primero' },
        ];
      case 'COLABORACIONES':
        return [
          { value: 'STATUS_APPROVED', label: 'Colaboraciones Aprobadas Primero' },
          { value: 'DATE_DESC', label: 'Fecha de Solicitud Descendente' },
        ];
      default:
        return [{ value: 'DEFAULT', label: 'Por Defecto' }];
    }
  };

  const getSortedReportData = (data: any[], section: string, criterion: string): any[] => {
    if (!data || data.length === 0) return [];
    const sorted = [...data];
    sorted.sort((a, b) => {
      const dateA = new Date(a.date || a.start || '2000-01-01').getTime();
      const dateB = new Date(b.date || b.start || '2000-01-01').getTime();
      switch (criterion) {
        case 'DATE_DESC':
          return dateB - dateA;
        case 'PRICE_DESC':
          return (b.price || 0) - (a.price || 0);
        case 'STATUS_APPROVED':
          if (section === 'PROPIEDADES' || section === 'COLABORACIONES') {
            const statA = a.status === 'APROBADO' ? 1 : 0;
            const statB = b.status === 'APROBADO' ? 1 : 0;
            return statB - statA;
          }
          return 0;
        case 'VOLUME_DESC':
          const volA = parseFloat((a.volume || '$0').replace(/[^0-9.-]+/g, '')) || 0;
          const volB = parseFloat((b.volume || '$0').replace(/[^0-9.-]+/g, '')) || 0;
          return volB - volA;
        case 'RATING_DESC':
          const ratA = parseFloat((a.rating || '0').replace(/[^0-9.-]+/g, '')) || 0;
          const ratB = parseFloat((b.rating || '0').replace(/[^0-9.-]+/g, '')) || 0;
          return ratB - ratA;
        case 'BUDGET_DESC':
          return (b.budget || 0) - (a.budget || 0);
        case 'VERIFIED_FIRST':
          const verA = a.status === 'Verificado' ? 1 : 0;
          const verB = b.status === 'Verificado' ? 1 : 0;
          return verB - verA;
        case 'PROPERTIES_DESC':
          return (b.propertiesCount || 0) - (a.propertiesCount || 0);
        case 'PLAN_PREMIUM':
          const isPremA = (a.plan === 'Venta Pro' || a.plan === 'Cierre Garantizado') ? 1 : 0;
          const isPremB = (b.plan === 'Venta Pro' || b.plan === 'Cierre Garantizado') ? 1 : 0;
          return isPremB - isPremA;
        case 'STOCK_DESC':
          return (b.stock || 0) - (a.stock || 0);
        case 'COMMISSION_DESC':
          const commA = parseFloat((a.commission || '0').replace(/[^0-9.-]+/g, '')) || 0;
          const commB = parseFloat((b.commission || '0').replace(/[^0-9.-]+/g, '')) || 0;
          return commB - commA;
        case 'MONTHLY_DESC':
          return (b.monthly || 0) - (a.monthly || 0);
        case 'STATUS_ACTIVE':
          const actA = a.status === 'VIGENTE' || a.status === 'ACTIVO' ? 1 : 0;
          const actB = b.status === 'VIGENTE' || b.status === 'ACTIVO' ? 1 : 0;
          return actB - actA;
        case 'START_DESC':
          const startA = new Date(a.start || '2000-01-01').getTime();
          const startB = new Date(b.start || '2000-01-01').getTime();
          return startB - startA;
        case 'AMOUNT_DESC':
          return (b.amount || 0) - (a.amount || 0);
        case 'AMOUNT_ABS_DESC':
          return Math.abs(b.amount || 0) - Math.abs(a.amount || 0);
        case 'STATUS_PENDING':
          const pendA = a.status === 'PENDIENTE' ? 1 : 0;
          const pendB = b.status === 'PENDIENTE' ? 1 : 0;
          return pendB - pendA;
        case 'LINKED_DESC':
          return (b.propertiesLinked || 0) - (a.propertiesLinked || 0);
        default:
          return dateB - dateA;
      }
    });
    return sorted;
  };

  const getMockDataForSectionTop = (section: string, region: string): any[] => {
    const regSuf = region === 'TODOS' ? 'Cochabamba' : region;
    switch (section) {
      case 'PROPIEDADES':
        return [
          { id: 'PROP-901', title: 'Apartamento de Lujo Queru Queru', price: 145000, zone: 'Queru Queru', status: 'APROBADO', location: regSuf, date: '2026-05-12' },
          { id: 'PROP-902', title: 'Casa Comercial El Prado', price: 380000, zone: 'El Prado', status: 'RESERVADO', location: regSuf, date: '2026-05-18' },
          { id: 'PROP-903', title: 'Penthouse Exclusivo Cala Cala', price: 210000, zone: 'Cala Cala', status: 'APROBADO', location: regSuf, date: '2026-05-24' }
        ];
      case 'AGENTES':
        return [
          { id: 'AGT-001', name: 'Roberto Claros', contact: '+591 772 34871 / roberto@propio.bo', volume: '$420,000 USD', rating: '4.8 ⭐', status: 'Activo', date: '2026-01-15' },
          { id: 'AGT-002', name: 'Lucía Arteaga', contact: '+591 601 98324 / lucia@propio.bo', volume: '$185,000 USD', rating: '4.9 ⭐', status: 'Activo', date: '2026-02-10' },
          { id: 'AGT-003', name: 'David Choque', contact: '+591 717 44901 / david@propio.bo', volume: '$95,000 USD', rating: '4.5 ⭐', status: 'Activo', date: '2026-03-05' }
        ];
      case 'PROSPECTOS':
        return [
          { id: 'PROS-201', name: 'Carlos Mendoza', phone: '+591 707 12345', budget: 185000, interest: 'Departamento 3 dorm.', date: '2026-05-10' },
          { id: 'PROS-202', name: 'Daniela Torrico', phone: '+591 712 99887', budget: 95000, interest: 'Garzonier amoblado', date: '2026-05-15' },
          { id: 'PROS-203', name: 'Mauricio Siles', phone: '+591 600 44332', budget: 320000, interest: 'Casa con jardín', date: '2026-05-20' }
        ];
      case 'PROPIETARIOS':
        return [
          { id: 'PROP-501', name: 'René Vargas', email: 'rene@mail.com', propertiesCount: 2, status: 'Verificado', plan: 'Venta Pro' },
          { id: 'PROP-502', name: 'Claudia Claure', email: 'clau@mail.com', propertiesCount: 1, status: 'Verificado', plan: 'Cierre Garantizado' },
          { id: 'PROP-503', name: 'Pedro Mendoza', email: 'pedro@mail.com', propertiesCount: 1, status: 'Pendiente', plan: 'Gratis' }
        ];
      case 'CONSTRUCTORAS':
        return [
          { id: 'DEV-301', name: 'Alianza Inmobiliaria', nit: '102938470', representative: 'Arq. Javier Ortiz', stock: 18, commission: '3%' },
          { id: 'DEV-302', name: 'Constructora Cochabamba', nit: '987654321', representative: 'Ing. Raúl Gómez', stock: 8, commission: '2.5%' }
        ];
      case 'CONTRATOS':
        return [
          { id: 'CON-101', tenant: 'Carlos Mendoza', propertyTitle: 'Torre Norte 14A', monthly: 850, start: '2026-05-01', end: '2027-05-01', status: 'VIGENTE' },
          { id: 'CON-102', tenant: 'Ana Lucía Arteaga', propertyTitle: 'Apartamento Queru Queru', monthly: 1200, start: '2026-05-10', end: '2027-05-10', status: 'VIGENTE' }
        ];
      case 'INGRESOS':
        return [
          { id: 'ING-01', category: 'PLAN_MKT_PREMIUM', issuer: 'René Vargas', amount: 450, method: 'Transferencia', status: 'CONCILIADO', date: '2026-05-15' },
          { id: 'ING-02', category: 'COMISION_VENTA', issuer: 'Claudia Claure', amount: 3200, method: 'Depósito', status: 'PENDIENTE', date: '2026-05-18' }
        ];
      case 'GASTOS':
        return [
          { id: 'EGR-401', requester: 'Admin', category: 'Oficina', concept: 'Alquiler oficina central', amount: -800, status: 'APROBADO', date: '2026-05-02' },
          { id: 'EGR-402', requester: 'Agente: Juan P.', category: 'Mantenimiento', concept: 'Plomería Torre Norte 14A', amount: -150, status: 'PENDIENTE', date: '2026-05-19' }
        ];
      case 'PLANES MKT':
        return [
          { id: 'MKT-01', name: 'Plan Contenidos Express', channel: 'TikTok/Facebook', propertiesLinked: 5, budget: 120, status: 'ACTIVO' },
          { id: 'MKT-02', name: 'Plan Venta Pro', channel: 'Fotografía/Video/Redes', propertiesLinked: 12, budget: 450, status: 'ACTIVO' }
        ];
      case 'COLABORACIONES':
        return [
          { id: 'COL-01', sellingAgent: 'Roberto Claros', capturingAgent: 'Lucía Arteaga', property: 'Casa en Cala Cala', split: '50/50', status: 'APROBADO', date: '2026-05-21' },
          { id: 'COL-02', sellingAgent: 'David Choque', capturingAgent: 'Roberto Claros', property: 'Penthouse Queru Queru', split: '45/55', status: 'PENDIENTE', date: '2026-05-25' }
        ];
      default:
        return [];
    }
  };

  // ponytail: centralized data tunnel — pull from live states first, backend fallback, then mocks
  useEffect(() => {
    if (activeTab !== 'reports') return;

    const start = reportStartDate ? new Date(reportStartDate) : new Date('2000-01-01');
    const end   = reportEndDate   ? new Date(reportEndDate)   : new Date('2100-12-31');
    if (reportStartDate) start.setHours(0, 0, 0, 0);
    if (reportEndDate)   end.setHours(23, 59, 59, 999);

    const inDateRange = (dateStr?: string | Date) => {
      if (!dateStr) return true;
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    const matchesZone = (item: any) => {
      if (reportZone === 'ALL') return true;
      const z = reportZone.toLowerCase();
      return (
        (item.zone || '').toLowerCase().includes(z) ||
        (item.location || '').toLowerCase().includes(z) ||
        (typeof item.location === 'object' ? (item.location?.city || item.location?.address || '').toLowerCase().includes(z) : false) ||
        (item.propertyTitle || '').toLowerCase().includes(z) ||
        (item.title || '').toLowerCase().includes(z) ||
        (item.officeZone || '').toLowerCase().includes(z)
      );
    };

    const matchesBranch = (item: any) => {
      if (selectedSucursal === 'TODOS') return true;
      const b = selectedSucursal.toLowerCase();
      return (
        (typeof item.location === 'string' ? item.location.toLowerCase().includes(b) : false) ||
        (typeof item.location === 'object' ? (item.location?.city || '').toLowerCase().includes(b) : false) ||
        (item.zone || '').toLowerCase().includes(b) ||
        (item.officeZone || '').toLowerCase().includes(b) ||
        (item.cityOfResidence || '').toLowerCase().includes(b)
      );
    };

    let liveData: any[] = [];
    let hasLiveData = false;

    switch (reportSection) {
      case 'PROPIEDADES':
        if (properties.length > 0) {
          hasLiveData = true;
          liveData = properties
            .filter(p => inDateRange(p.createdAt) && matchesBranch(p) && matchesZone(p))
            .map(p => ({
              id: p.id,
              title: p.title,
              price: p.price,
              zone: typeof p.location === 'object' ? (p.location?.city || p.location?.address || '') : (p.location || ''),
              status: p.status || 'APROBADO',
              date: p.createdAt ? String(p.createdAt) : '',
            }));
        }
        break;
      case 'AGENTES':
        if (agents.length > 0) {
          hasLiveData = true;
          liveData = agents
            .filter(a => inDateRange(a.dateJoined) && matchesBranch(a))
            .map(a => ({
              id: a.id,
              name: a.name,
              contact: `${a.phone} / ${a.email}`,
              volume: `$${Number(a.salesVolume || 0).toLocaleString('es-BO')} USD`,
              rating: `${a.rating || 5} ⭐`,
              status: a.status || 'Activo',
              date: a.dateJoined || '',
            }));
        }
        break;
      case 'PROSPECTOS':
        if (prospects.length > 0) {
          hasLiveData = true;
          liveData = prospects
            .filter(p => inDateRange(p.createdAt) && matchesZone(p))
            .map(p => ({
              id: p.id,
              name: p.name,
              phone: p.phone,
              email: p.email,
              budget: p.budget,
              interest: p.interest,
              status: p.status,
              date: p.createdAt || '',
            }));
        }
        break;
      case 'PROPIETARIOS':
        if (owners.length > 0) {
          hasLiveData = true;
          liveData = owners.map(o => ({
            id: o.id,
            name: o.name,
            email: o.email,
            propertiesCount: o.properties?.length || 0,
            status: o.status || 'Verificado',
            plan: getPlanLabel(o.plan),
          }));
        }
        break;
      case 'CONSTRUCTORAS':
        if (developers.length > 0) {
          hasLiveData = true;
          liveData = developers
            .filter(d => matchesBranch(d))
            .map(d => ({
              id: d.id,
              name: d.empresa || '',
              nit: d.nit || '',
              representative: d.representante || '',
              contact: d.contacto?.email || '',
              phone: d.contacto?.phone || '',
              stock: d.stock || 0,
              commission: d.esquemaComision || '3%',
            }));
        }
        break;
      case 'CONTRATOS':
        if (contracts.length > 0) {
          hasLiveData = true;
          liveData = contracts
            .filter(c => inDateRange((c as any).createdAt || (c as any).startDate) && matchesBranch(c))
            .map(c => ({
              id: c.id,
              tenant: (c as any).tenant?.name || (c as any).tenantId || 'N/A',
              propertyTitle: (c as any).property?.title || (c as any).propertyId || 'N/A',
              monthly: (c as any).monthlyRent || (c as any).monthly || 0,
              start: (c as any).startDate || '',
              end: (c as any).endDate || '',
              status: c.status || 'VIGENTE',
              date: (c as any).createdAt || (c as any).startDate || '',
            }));
        }
        break;
      case 'INGRESOS':
        if (payments.length > 0) {
          hasLiveData = true;
          liveData = payments
            .filter(p => inDateRange((p as any).paymentDate || (p as any).createdAt))
            .map(p => ({
              id: p.id,
              category: (p as any).category_type || (p as any).category || 'INGRESO',
              issuer: (p as any).payer || (p as any).issuer || 'N/A',
              amount: (p as any).amount || 0,
              method: (p as any).method || (p as any).paymentMethod || 'Transferencia',
              status: p.status || 'PENDIENTE',
              date: (p as any).paymentDate || (p as any).createdAt || '',
            }));
        }
        break;
      case 'GASTOS':
        if (expenses.length > 0) {
          hasLiveData = true;
          liveData = expenses
            .filter(e => inDateRange((e as any).date || (e as any).createdAt))
            .map(e => ({
              id: e.id,
              requester: (e as any).requester || (e as any).requestedBy || 'Admin',
              category: (e as any).category || 'General',
              concept: (e as any).concept || (e as any).description || 'N/A',
              amount: -(Math.abs(Number((e as any).amount || 0))),
              status: (e as any).status || 'APROBADO',
              date: (e as any).date || (e as any).createdAt || '',
            }));
        }
        break;
    }

    if (hasLiveData) {
      // ponytail: live state available — skip backend, inject directly
      setReportData(liveData);
      return;
    }

    // Secondary: attempt backend
    const fetchReportDataAuto = async () => {
      setReportLoading(true);
      try {
        const token = getToken() || '';
        const url = `/admin/reports/${reportSection.toLowerCase()}?branch_id=${encodeURIComponent(selectedSucursal)}&startDate=${reportStartDate}&endDate=${reportEndDate}`;
        const res = await apiClient.getWithAuth<any[]>(url, token).catch(() => {
          console.warn('Backend offline, cargando fallback de semillas locales.');
          return getMockDataForSectionTop(reportSection, selectedSucursal);
        });
        let processed = res || [];
        if (reportZone !== 'ALL') {
          const z = reportZone.toLowerCase();
          processed = processed.filter((item: any) =>
            (item.zone || '').toLowerCase().includes(z) ||
            (item.propertyTitle || '').toLowerCase().includes(z) ||
            (item.location || '').toLowerCase().includes(z) ||
            (item.title || '').toLowerCase().includes(z)
          );
        }
        if (processed.length === 0) {
          processed = getMockDataForSectionTop(reportSection, selectedSucursal);
        }
        setReportData(processed);
      } catch (err) {
        console.error(err);
        setReportData(getMockDataForSectionTop(reportSection, selectedSucursal));
      } finally {
        setReportLoading(false);
      }
    };
    fetchReportDataAuto();
  }, [activeTab, reportSection, reportStartDate, reportEndDate, reportZone, selectedSucursal,
      properties, agents, contracts, payments, expenses]);


  // Excel/PDF Simulation Alert
  const triggerExport = (format: 'Excel' | 'PDF', moduleName: string) => {
    alert(`📥 Exportando datos de ${moduleName} en formato ${format}...`);
  };

  const exportOwnersExcel = () => {
    const exported = filteredOwners.map((own: any) => ({
      ID: own.id,
      NOMBRE: own.name,
      EMAIL: own.email,
      CELULAR: own.phone,
      INMUEBLES: own.properties.join(', '),
      PLAN: getPlanLabel(own.plan),
      ESTADO: own.status,
    }));
    exportDataToExcel(exported, `Reporte_Propietarios_${selectedSucursal === 'TODOS' ? 'Nacional' : selectedSucursal}`, 'Propietarios');
  };

  const generateSecurePassword = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+~}{[]:;?><,./-=';

    const getRandomChar = (str: string) => str.charAt(Math.floor(Math.random() * str.length));

    // Length between 8 and 10
    const len = Math.floor(Math.random() * 3) + 8;

    let pwd = '';
    pwd += getRandomChar(uppercase);
    pwd += getRandomChar(lowercase);
    pwd += getRandomChar(numbers);
    pwd += getRandomChar(symbols);

    const all = uppercase + lowercase + numbers + symbols;
    for (let i = 4; i < len; i++) {
      pwd += getRandomChar(all);
    }

    const shuffled = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    setNewAgentPassword(shuffled);
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newAgentName || !newAgentEmail || !newAgentPhone || !newAgentPassword) {
      alert('Por favor complete los campos obligatorios: Nombre, Email, Contraseña y Contacto.');
      return;
    }

    const aptitudeVal = Number(newAgentAptitude) || 85;

    // Auto-generate credentials
    const cleanName = newAgentName
      .trim()
      .split(' ')[0]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");

    let corporateEmail = `${cleanName}@propio.bo`;
    let count = 1;
    while (agents.some(a => a.email === corporateEmail || a.username === corporateEmail)) {
      corporateEmail = `${cleanName}${count}@propio.bo`;
      count++;
    }
    const username = corporateEmail;
    const password = newAgentPassword;

    const lastAgentNum = agents.reduce((max, a) => {
      const parts = a.id.split('-');
      const num = parseInt(parts[parts.length - 1]);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const nextIdNum = lastAgentNum + 1;
    const newAgentId = `AGT-2026-${String(nextIdNum).padStart(3, '0')}`;

    try {
      const token = getToken() || '';
      try {
        await apiClient.postWithAuth<any>('/admin/agents', {
          fullName: newAgentName,
          email: newAgentEmail,
          phone: newAgentPhone,
          idDocument: newAgentCI || 'N/A',
          birthDate: newAgentBirthDate || '2000-01-01',
          cityOfResidence: newAgentCity,
          baseCommission: newAgentCommission,
          splitPropio: 50,
          splitAgent: 50,
          aptitude: aptitudeVal
        }, token);
      } catch (backendErr) {
        console.warn('Backend creation failed or mock mode. Proceeding locally.', backendErr);
      }

      // Add to local state
      const newAgentItem: Agent = {
        id: newAgentId,
        name: newAgentName.toUpperCase(),
        email: newAgentEmail,
        phone: newAgentPhone,
        commissionRate: newAgentCommission,
        splitPropio: 50,
        splitAgent: 50,
        salesVolume: 0,
        rating: 5.0,
        status: 'Activo',
        dateJoined: new Date().toISOString().split('T')[0],
        aptitude: aptitudeVal,
        username,
        password,
        temporaryPassword: password
      };

      const updatedAgents = [newAgentItem, ...agents];
      setAgents(updatedAgents);
      localStorage.setItem('propio_admin_agents', JSON.stringify(updatedAgents));

      // Persist in unified credentials database
      try {
        const nuevoUsuarioCredenciales = {
          id: newAgentId,
          name: newAgentName,
          email: username.trim().toLowerCase(), // the username is the corporate email
          password: password,
          role: 'agent',
          isActive: true,
          profile: {
            telefono: newAgentPhone,
            comision: newAgentCommission,
            ci: newAgentCI || 'N/A',
            ciudad: newAgentCity
          }
        };

        // Option A: Try to save the user directly in the central database
        try {
          await apiClient.postWithAuth<any>('/admin/users/create', {
            name: newAgentName,
            email: username.trim().toLowerCase(),
            password: password,
            role: 'AGENTE'
          }, token);
        } catch (backendErr) {
          console.warn('Backend user registration skipped or mock mode. Proceeding locally.', backendErr);
        }

        // Option B: Local storage fallback for local development resilience
        const usuariosLocales = JSON.parse(localStorage.getItem('propio_users_db') || '[]');
        const filtrados = usuariosLocales.filter((u: any) => u.email !== nuevoUsuarioCredenciales.email);
        filtrados.push(nuevoUsuarioCredenciales);
        localStorage.setItem('propio_users_db', JSON.stringify(filtrados));
      } catch (e) {
        console.error('Error saving agent to propio_users_db:', e);
      }

      // Reset form states
      setNewAgentName('');
      setNewAgentEmail('');
      setNewAgentPassword('');
      setNewAgentPhone('');
      setNewAgentCI('');
      setNewAgentBirthDate('');
      setNewAgentCity('Cochabamba');
      setNewAgentAptitude('');
      setNewAgentCommission(1.5);

      // Show credentials success view
      setGeneratedCredentials({ username, password });
      setCopiedCredentials(false);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al registrar el agente');
    }
  };

  const handleSpecialtyChange = (specialty: string) => {
    setNewDevSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty) 
        : [...prev, specialty]
    );
  };

  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName || !newDevNit || !newDevRepresentative || !newDevPhone || !newDevEmail || !newDevOfficeAddress) {
      alert('Por favor complete los campos obligatorios: Nombre Comercial, NIT, Representante Legal, Teléfono, Correo y Dirección.');
      return;
    }

    try {
      const adminToken = getToken() || (typeof window !== 'undefined' ? localStorage.getItem('propio_token') : '') || '';
      const response = await apiClient.postWithAuth<any>('/admin/developers', {
        name: newDevName,
        nit: newDevNit,
        foundedYear: newDevFoundedYear,
        logoUrl: newDevLogoUrl,
        representative: newDevRepresentative,
        phone: newDevPhone,
        email: newDevEmail,
        website: newDevWebsite,
        officeZone: newDevOfficeZone,
        officeAddress: newDevOfficeAddress,
        description: newDevDescription,
        specialties: newDevSpecialties
      }, adminToken);

      alert(response.message || 'Constructora registrada con éxito');
      
      const newDevId = response?.id || `DEV-${300 + developers.length + 1}`;
      const newDev: Constructora = {
        id: newDevId,
        empresa: newDevName,
        nit: newDevNit,
        representante: newDevRepresentative,
        contacto: {
          email: newDevEmail,
          phone: newDevPhone
        },
        stock: 0,
        esquemaComision: '3% Venta Escalonada',
        etapa: 'Preventa Torre A'
      };
      setDevelopers(prev => [...prev, newDev]);
      await persistLocalDeveloper(newDev);
      
      // Reset form states
      setNewDevName('');
      setNewDevNit('');
      setNewDevFoundedYear('');
      setNewDevLogoUrl('');
      setNewDevRepresentative('');
      setNewDevPhone('');
      setNewDevEmail('');
      setNewDevWebsite('');
      setNewDevOfficeZone('');
      setNewDevOfficeAddress('');
      setNewDevDescription('');
      setNewDevSpecialties([]);
      setIsNewDeveloperModalOpen(false);

      await loadAllData();
    } catch (err: any) {
      console.warn('[Admin] Failed registering developer in backend. Triggering local fallback...', err);
      
      const newDevId = `DEV-${300 + developers.length + 1}`;
      const newDev: Constructora = {
        id: newDevId,
        empresa: newDevName,
        nit: newDevNit,
        representante: newDevRepresentative,
        contacto: {
          email: newDevEmail,
          phone: newDevPhone
        },
        stock: 0,
        esquemaComision: '3% Venta Escalonada',
        etapa: 'Preventa Torre A'
      };

      // Persistencia de resguardo local
      await persistLocalDeveloper(newDev);

      // Sincronizar estado visual
      setDevelopers(prev => [...prev, newDev]);

      // Reset form states
      setNewDevName('');
      setNewDevNit('');
      setNewDevFoundedYear('');
      setNewDevLogoUrl('');
      setNewDevRepresentative('');
      setNewDevPhone('');
      setNewDevEmail('');
      setNewDevWebsite('');
      setNewDevOfficeZone('');
      setNewDevOfficeAddress('');
      setNewDevDescription('');
      setNewDevSpecialties([]);
      setIsNewDeveloperModalOpen(false);

      alert(`Servidor de producción no autorizado (${err.status || 'Red'}). La constructora se registró en la base de datos de simulación local (localStorage) con éxito.`);
    }
  };

  const handleEditDeveloperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConstructora) return;
    try {
      const token = getToken() || '';
      try {
        await apiClient.putWithAuth<any>(`/admin/developers/${editingConstructora.id}`, {
          name: editingConstructora.empresa,
          nit: editingConstructora.nit,
          representative: editingConstructora.representante,
          phone: editingConstructora.contacto.phone,
          email: editingConstructora.contacto.email,
          stock: editingConstructora.stock,
          commissionScheme: editingConstructora.esquemaComision,
          stage: editingConstructora.etapa
        }, token);
      } catch (err) {
        console.warn('Backend update failed, updating local state only:', err);
      }
      
      await persistLocalDeveloper(editingConstructora);
      setDevelopers(prev => prev.map(d => d.id === editingConstructora.id ? editingConstructora : d));
      alert('Constructora actualizada con éxito.');
      setEditingConstructora(null);
    } catch (err: any) {
      alert('Error al actualizar la constructora: ' + (err.message || err));
    }
  };

  const handleDeleteDeveloperConfirm = async () => {
    if (!deletingConstructoraId) return;
    try {
      const token = getToken() || '';
      try {
        await apiClient.deleteWithAuth<any>(`/admin/developers/${deletingConstructoraId}`, token);
      } catch (err) {
        console.warn('Backend delete failed, updating local state only:', err);
      }

      await deleteLocalDeveloper(deletingConstructoraId);
      setDevelopers(prev => prev.filter(d => d.id !== deletingConstructoraId));
      alert('Constructora de baja con éxito.');
      setDeletingConstructoraId(null);
    } catch (err: any) {
      alert('Error al dar de baja la constructora: ' + (err.message || err));
    }
  };

  const handleEditContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;
    try {
      const token = getToken() || '';
      try {
        await apiClient.putWithAuth<any>(`/contracts/${editingContract.id}`, {
          tenantId: editingContract.tenantId,
          startDate: typeof editingContract.startDate === 'string' ? editingContract.startDate : (editingContract.startDate as Date).toISOString().split('T')[0],
          endDate: typeof editingContract.endDate === 'string' ? editingContract.endDate : (editingContract.endDate as Date).toISOString().split('T')[0],
          monthlyAmount: Number(editingContract.monthlyAmount),
          status: editingContract.status,
          observations: editingContract.observations
        }, token);
      } catch (err) {
        console.warn('Backend update contract failed, updating local state only:', err);
      }
      
      setContracts(prev => prev.map(c => c.id === editingContract.id ? editingContract : c));
      
      // ponytail: persist edited contract to db.json
      persistContract(editingContract).catch(e => console.warn('[localDb] error persistiendo edicion de contrato:', e));

      alert('Contrato actualizado con éxito.');
      setEditingContract(null);
    } catch (err: any) {
      alert('Error al actualizar el contrato: ' + (err.message || err));
    }
  };

  const handleDeleteContractConfirm = async () => {
    if (!deletingContractId) return;
    try {
      const token = getToken() || '';
      try {
        await contractsService.deleteContract(deletingContractId, token);
      } catch (err) {
        console.warn('Backend delete contract failed, updating local state only:', err);
      }

      setContracts(prev => prev.filter(c => c.id !== deletingContractId));

      // ── BORRADO PERMANENTE EN db.json via helper blindado ──
      deleteLocalContract(deletingContractId).catch(e => console.warn('[localDb] deleteLocalContract error:', e));

      alert('Contrato eliminado con éxito.');
      setDeletingContractId(null);
    } catch (err: any) {
      alert('Error al eliminar el contrato: ' + (err.message || err));
    }
  };

  const handleInjectMockContract = () => {
    // Injector de prueba deshabilitado para producción
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractPropertyId || !contractTenantName || !contractMonthlyAmount || !contractStartDate || !contractEndDate) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    try {
      const selectedProp = properties.find(p => p.id === contractPropertyId);
      const ownerId = (selectedProp as any)?.ownerId || '00000000-0000-0000-0000-000000000000';
      const tenantId = '10000000-2000-3000-4000-500000000000';

      const token = getToken() || '';
      const response = await contractsService.createContract({
        propertyId: contractPropertyId,
        tenantId: tenantId,
        ownerId: ownerId,
        startDate: new Date(contractStartDate).toISOString(),
        endDate: new Date(contractEndDate).toISOString(),
        monthlyAmount: Number(contractMonthlyAmount),
        status: contractStatus,
        observations: `${contractObservations} | Arrendatario: ${contractTenantName}`
      }, token);

      alert(response.message || 'Contrato registrado con éxito');

      setContractPropertyId('');
      setContractTenantName('');
      setContractMonthlyAmount('');
      setContractStartDate('');
      setContractEndDate('');
      setContractStatus('VIGENTE');
      setContractObservations('');
      setIsContractModalOpen(false);

      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al registrar el contrato');
    }
  };
  
  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractPropertyId || !contractTenantName || !contractTenantCI || !contractTenantPhone || !contractMonthlyAmount || !contractStartDate || !contractEndDate) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      const selectedProp = properties.find(p => p.id === contractPropertyId);
      const owner = owners.find(o => o.properties.includes(contractPropertyId) || o.id === (selectedProp as any)?.ownerId);
      const ownerName = owner ? owner.name : 'René Vargas';
      const ownerId = owner ? owner.id : 'OWN-201';

      const agent = selectedProp ? agents.find(a => a.id === selectedProp.agentId || a.id === (selectedProp as any).agent_id) : null;
      const agentName = agent ? agent.name : 'Roberto Claros';

      const isRental = contractPropertyId.toLowerCase().includes('rent') || selectedProp?.type?.toLowerCase() === 'alquiler';
      const finalCurrency = isRental ? 'BOB' : 'USD';

      const token = getToken() || '';
      
      let resultContract: Contract;
      try {
        const response = await contractsService.createContract({
          propertyId: contractPropertyId,
          tenantId: '10000000-2000-3000-4000-500000000000',
          ownerId: ownerId,
          startDate: new Date(contractStartDate).toISOString(),
          endDate: new Date(contractEndDate).toISOString(),
          monthlyAmount: Number(contractMonthlyAmount),
          status: 'VIGENTE',
          observations: `CI Contraparte: ${contractTenantCI} | Tel: ${contractTenantPhone} | Moneda: ${finalCurrency} | PDF adjunto: ${contractFileName || 'contrato_firmado.pdf'}`
        }, token);
        
        resultContract = {
          id: (response as any).contract?.id || (response as any).data?.id || (response as any).id || `CON-${Date.now()}`,
          propertyId: contractPropertyId,
          property: selectedProp ? {
            id: selectedProp.id,
            title: selectedProp.title,
            location: selectedProp.location.address || '',
            address: selectedProp.location.address || '',
          } : undefined,
          tenantId: '10000000-2000-3000-4000-500000000000',
          tenant: {
            id: '10000000-2000-3000-4000-500000000000',
            name: contractTenantName,
            email: 'cliente@mail.com',
            phone: contractTenantPhone
          } as any,
          ownerId: ownerId,
          startDate: new Date(contractStartDate).toISOString(),
          endDate: new Date(contractEndDate).toISOString(),
          monthlyAmount: Number(contractMonthlyAmount),
          status: 'VIGENTE',
          observations: `CI Contraparte: ${contractTenantCI} | Tel: ${contractTenantPhone} | Moneda: ${finalCurrency} | PDF adjunto: ${contractFileName || 'contrato_firmado.pdf'}`
        };
      } catch (err) {
        console.warn('Backend call failed, generating locally', err);
        resultContract = {
          id: `CON-${Date.now()}`,
          propertyId: contractPropertyId,
          property: selectedProp ? {
            id: selectedProp.id,
            title: selectedProp.title,
            location: selectedProp.location.address || '',
            address: selectedProp.location.address || '',
          } : undefined,
          tenantId: '10000000-2000-3000-4000-500000000000',
          tenant: {
            id: '10000000-2000-3000-4000-500000000000',
            name: contractTenantName,
            email: 'cliente@mail.com',
            phone: contractTenantPhone
          } as any,
          ownerId: ownerId,
          startDate: new Date(contractStartDate).toISOString(),
          endDate: new Date(contractEndDate).toISOString(),
          monthlyAmount: Number(contractMonthlyAmount),
          status: 'VIGENTE',
          observations: `CI Contraparte: ${contractTenantCI} | Tel: ${contractTenantPhone} | Moneda: ${finalCurrency} | PDF adjunto: ${contractFileName || 'contrato_firmado.pdf'}`
        };
      }

      setContracts(prev => [resultContract, ...prev]);

      // ── PERSISTENCIA REAL EN db.json (sobrevive F5 y reinicios) ──
      try {
        const contractForDB = {
          ...resultContract,
          createdAt: new Date().toISOString(),
          agentName,
          ownerName,
          currency: finalCurrency,
          fileName: contractFileName || 'contrato_firmado.pdf',
        };
        persistContract(contractForDB).catch(e => console.warn('[localDb] persistContract error:', e));
      } catch (fetchErr) {
        console.warn('[local/contracts] Error API persistencia:', fetchErr);
      }

      alert('¡CONTRATO REGISTRADO Y ACTIVADO CON ÉXITO!');

      // Reset states
      setContractPropertyId('');
      setContractTenantName('');
      setContractTenantCI('');
      setContractTenantPhone('');
      setContractMonthlyAmount('');
      setContractStartDate('');
      setContractEndDate('');
      setContractFileName('');
      setIsUploadContractModalOpen(false);

    } catch (err: any) {
      console.error(err);
      alert('Error: ' + (err.message || err));
    }
  };

  // --- Initial Mock Data for Extended modules ---

  const filteredAgents = React.useMemo(() => {
    return agents.filter(agt => {
      // 1. Nombre filter (checkboxes)
      if (selectedAgentNames.length > 0) {
        if (!selectedAgentNames.includes(agt.name.toUpperCase())) {
          return false;
        }
      }

      // 2. Comisión base filter
      if (selectedAgentCommission !== 'Todos') {
        const rate = Number(agt.commissionRate);
        if (selectedAgentCommission === '1.5%') {
          if (rate !== 1.5) return false;
        } else if (selectedAgentCommission === '2.0%') {
          if (rate !== 2.0) return false;
        } else if (selectedAgentCommission === 'Custom') {
          if (rate === 1.5 || rate === 2.0) return false;
        }
      }

      // 3. Reparto (splitPropio / splitAgent) filter
      if (selectedAgentSplit !== 'Todos los repartos') {
        const key = `${agt.splitPropio}% / ${agt.splitAgent}%`;
        if (selectedAgentSplit !== key) {
          return false;
        }
      }

      // 4. Ventas filter
      if (selectedAgentSales !== 'Todos') {
        const sales = Number(agt.salesVolume) || 0;
        if (selectedAgentSales === 'Sin Ventas ($0 USD)') {
          if (sales !== 0) return false;
        } else if (selectedAgentSales === 'Más de $50,000 USD') {
          if (sales <= 50000) return false;
        } else if (selectedAgentSales === 'Más de $200,000 USD') {
          if (sales <= 200000) return false;
        }
      }

      // 5. Rating filter
      if (selectedAgentRating !== 'Todos') {
        const rating = Number(agt.rating) || 0;
        if (selectedAgentRating === '5.0 Estrellas') {
          if (rating !== 5.0) return false;
        } else if (selectedAgentRating === '4.5 o más') {
          if (rating < 4.5) return false;
        } else if (selectedAgentRating === 'Menos de 4.5') {
          if (rating >= 4.5) return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => String(b.id || '').localeCompare(String(a.id || '')));
  }, [agents, selectedAgentNames, selectedAgentCommission, selectedAgentSplit, selectedAgentSales, selectedAgentRating]);

  // Computed agent KPIs derived from reactive agents state
  const computedAgentKpis = React.useMemo(() => {
    const totalActive = filteredAgents.length;
    const topRated = filteredAgents.filter((a: any) => (a.rating || 0) >= 4.5).length;
    const closuresVolume = filteredAgents.reduce((acc: number, a: any) => acc + (Number(a.salesVolume) || 0), 0);
    const commissionsTotal = filteredAgents.reduce((acc: number, a: any) => acc + (Number(a.salesVolume) || 0) * ((Number(a.commissionRate) || 0) / 100), 0);
    return { totalActive, topRated, closuresVolume, commissionsTotal };
  }, [filteredAgents]);

  const [prospects, setProspects] = useState<Prospect[]>([]);

  // --- Computed Prospect Metrics ---
  const visitasCount = React.useMemo(() => prospects.filter(p => p.status === 'VISITA_AGENDADA').length, [prospects]);
  const pendientesCount = React.useMemo(() => prospects.filter(p => p.status === 'PENDIENTE').length, [prospects]);

  // ponytail: dynamic traffic sources state and computations from real-time UTM parameters
  const [trafficSources, setTrafficSources] = useState<Record<string, number>>({
    TIKTOK: 0,
    'GOOGLE MAPS': 0,
    TELEGRAM: 0,
    WEB: 0,
    RECOMENDADO: 0
  });

  const sortedTrafficEntries = React.useMemo(() => {
    return Object.entries(trafficSources).sort((a, b) => b[1] - a[1]);
  }, [trafficSources]);

  const dominantTrafficSource = React.useMemo(() => {
    if (sortedTrafficEntries.length === 0 || sortedTrafficEntries[0][1] === 0) return 'Sin datos';
    return sortedTrafficEntries[0][0].toUpperCase();
  }, [sortedTrafficEntries]);

  // filteredProspects: multi-column client-side filter derived from all prospect filter states
  const filteredProspects = React.useMemo(() => {
    return prospects.filter(pr => {
      // 1. ID filter
      if (selectedProspectIds.length > 0 && !selectedProspectIds.includes(pr.id)) return false;
      // 2. Name filter (checkboxes)
      if (selectedProspectNames.length > 0 && !selectedProspectNames.includes(pr.name.toUpperCase())) return false;
      // 3. Contact search (email or phone)
      if (prospectContactSearch.trim()) {
        const q = prospectContactSearch.toLowerCase();
        if (!pr.email.toLowerCase().includes(q) && !pr.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) return false;
      }
      // 4. Property of interest (checkboxes)
      if (selectedProspectInterests.length > 0 && !selectedProspectInterests.includes(pr.interest)) return false;
      // 5. Budget range
      if (prospectBudgetFilter !== 'Todos') {
        if (prospectBudgetFilter === 'Menos de $100,000 USD' && pr.budget >= 100000) return false;
        if (prospectBudgetFilter === '$100,000 USD - $200,000 USD' && (pr.budget < 100000 || pr.budget > 200000)) return false;
        if (prospectBudgetFilter === 'Más de $200,000 USD' && pr.budget <= 200000) return false;
      }
      // 6. Source (checkboxes)
      if (selectedProspectSources.length > 0 && !selectedProspectSources.includes(pr.source.toUpperCase())) return false;
      return true;
    }).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [prospects, selectedProspectIds, selectedProspectNames, prospectContactSearch, selectedProspectInterests, prospectBudgetFilter, selectedProspectSources]);

  const [owners, setOwners] = useState<Owner[]>([
    { id: 'OWN-201', name: 'René Vargas', email: 'rene@mail.com', phone: '+591 798 12345', properties: ['PROP-REAL-001', 'PROP-REAL-005', 'PROP-REAL-009', 'PROP-RENT-003', 'PROP-RENT-007'], plan: 'venta_pro', status: 'Verificado' },
    { id: 'OWN-202', name: 'Claudia Claure', email: 'clau@mail.com', phone: '+591 712 99887', properties: ['PROP-REAL-002', 'PROP-REAL-006', 'PROP-REAL-010', 'PROP-RENT-004', 'PROP-RENT-008'], plan: 'cierre_garantizado', status: 'Verificado' },
    { id: 'OWN-203', name: 'Pedro Mendoza', email: 'pedro@mail.com', phone: '+591 700 44332', properties: ['PROP-REAL-003', 'PROP-REAL-007', 'PROP-RENT-001', 'PROP-RENT-005', 'PROP-RENT-009'], plan: 'gratis', status: 'Pendiente' },
    { id: 'OWN-204', name: 'Gaby Solares', email: 'gaby@mail.com', phone: '+591 721 55443', properties: ['PROP-REAL-004', 'PROP-REAL-008', 'PROP-RENT-002', 'PROP-RENT-006', 'PROP-RENT-010'], plan: 'venta_pro', status: 'Verificado' }
  ]);

  const resolvedOwners = React.useMemo(() => {
    const controlMap = new Map<string, Owner>();
    const defaultBase = [
      { id: 'OWN-201', name: 'René Vargas', email: 'rene@mail.com', phone: '+591 798 12345', properties: [] as string[], plan: 'venta_pro' as PlanKey, status: 'Verificado' },
      { id: 'OWN-202', name: 'Claudia Claure', email: 'clau@mail.com', phone: '+591 712 99887', properties: [] as string[], plan: 'cierre_garantizado' as PlanKey, status: 'Verificado' },
      { id: 'OWN-203', name: 'Pedro Mendoza', email: 'pedro@mail.com', phone: '+591 700 44332', properties: [] as string[], plan: 'gratis' as PlanKey, status: 'Pendiente' },
      { id: 'OWN-204', name: 'Gaby Solares', email: 'gaby@mail.com', phone: '+591 721 55443', properties: [] as string[], plan: 'venta_pro' as PlanKey, status: 'Verificado' }
    ];

    defaultBase.forEach(o => {
      controlMap.set(o.email.toLowerCase().trim(), o);
    });

    if (Array.isArray(owners)) {
      owners.forEach(o => {
        if (o && o.email) {
          const emailKey = o.email.toLowerCase().trim();
          controlMap.set(emailKey, { ...o, properties: [] });
        }
      });
    }

    let nextIdNum = 205;

    properties.forEach((p: any) => {
      const pOwnerEmail = String(p.owner?.email || p.email || 'propietario@mail.com').toLowerCase().trim();
      const pOwnerName = p.owner?.name || p.ownerName || 'Propietario Independiente';
      const pOwnerPhone = p.owner?.phone || p.phone || '+591 700 00000';
      const pOwnerId = p.ownerId || p.owner_id || p.owner?.id || p.userId || '';

      let matched = controlMap.get(pOwnerEmail);

      if (!matched) {
        const values = Array.from(controlMap.values());
        matched = values.find(o => pOwnerId && o.id === pOwnerId);
      }

      if (!matched) {
        const generatedId = pOwnerId && String(pOwnerId).startsWith('OWN-') ? String(pOwnerId) : `OWN-${nextIdNum++}`;
        matched = {
          id: generatedId,
          name: pOwnerName,
          email: pOwnerEmail,
          phone: pOwnerPhone,
          properties: [] as string[],
          plan: (p.plan === 'venta_pro' || p.plan === 'cierre_garantizado') ? p.plan : 'gratis',
          status: p.isVerified || p.verified ? 'Verificado' : 'Pendiente'
        };
        controlMap.set(pOwnerEmail, matched);
      }

      const propRef = p.id || p.title;
      if (propRef && !matched.properties.includes(propRef)) {
        matched.properties.push(propRef);
      }
    });

    return Array.from(controlMap.values());
  }, [owners, properties]);

  const [ownerIdSearch, setOwnerIdSearch] = useState('');
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<string[]>([]);
  const [ownerNameSearch, setOwnerNameSearch] = useState('');
  const [selectedOwnerNames, setSelectedOwnerNames] = useState<string[]>([]);
  const [ownerContactSearch, setOwnerContactSearch] = useState('');

  const allOwnerIds = React.useMemo(() => {
    return Array.from(new Set(resolvedOwners.map((o: Owner) => o.id))).sort();
  }, [resolvedOwners]);

  const allOwnerNames = React.useMemo(() => {
    return Array.from(new Set(resolvedOwners.map((o: Owner) => o.name))).sort();
  }, [resolvedOwners]);

  const filteredOwners = React.useMemo(() => {
    return resolvedOwners.filter((own: Owner) => {
      // Filter by ID list
      if (selectedOwnerIds.length > 0 && !selectedOwnerIds.includes(own.id)) {
        return false;
      }
      if (ownerIdSearch && !own.id.toLowerCase().includes(ownerIdSearch.toLowerCase())) {
        return false;
      }

      // Filter by Name list
      if (selectedOwnerNames.length > 0 && !selectedOwnerNames.includes(own.name)) {
        return false;
      }
      if (ownerNameSearch && !own.name.toLowerCase().includes(ownerNameSearch.toLowerCase())) {
        return false;
      }

      // Filter by Contact
      if (ownerContactSearch) {
        const contactQuery = ownerContactSearch.toLowerCase();
        const matchesEmail = own.email.toLowerCase().includes(contactQuery);
        const matchesPhone = own.phone.toLowerCase().includes(contactQuery);
        if (!matchesEmail && !matchesPhone) {
          return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => {
      const numA = parseInt(String(a.id || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.id || '').replace(/\D/g, ''), 10) || 0;
      if (numB !== numA) {
        return numB - numA;
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [resolvedOwners, selectedOwnerIds, ownerIdSearch, selectedOwnerNames, ownerNameSearch, ownerContactSearch]);

  const calculatedRevenue = React.useMemo(() => {
    return filteredOwners.reduce((sum: number, own: Owner) => {
      if (own.plan === 'venta_pro') return sum + 4000;
      if (own.plan === 'cierre_garantizado') return sum + 8000;
      return sum;
    }, 0);
  }, [filteredOwners]);

  const calculatedProperties = React.useMemo(() => {
    return filteredOwners.reduce((sum: number, own: Owner) => sum + own.properties.length, 0);
  }, [filteredOwners]);

  const calculatedPremium = React.useMemo(() => {
    return filteredOwners.filter((own: Owner) => own.plan !== 'gratis').length;
  }, [filteredOwners]);

  const [developers, setDevelopers] = useState<Constructora[]>([
    { id: 'DEV-303', empresa: 'CONSTRUCTORA URUBÓ PREMIUM', nit: '203948571', representante: 'Lic. Mauricio Aponte', contacto: { email: 'contacto@urubopremium.bo', phone: '+59178522334' }, stock: 24, esquemaComision: '3% Neto', etapa: 'Pre-venta' },
    { id: 'DEV-302', empresa: 'TORRES EQUIPETROL S.A.', nit: '304958672', representante: 'Arq. Valeria Justiniano', contacto: { email: 'vjustiniano@equipetrolsa.bo', phone: '+59176011223' }, stock: 35, esquemaComision: '4% Compartido', etapa: 'En Construcción' },
    { id: 'DEV-301', empresa: 'INMOBILIARIA LAS PALMAS S.R.L.', nit: '405968783', representante: 'Ing. Fernando Justiniano', contacto: { email: 'fjustiniano@laspalmas.bo', phone: '+59170833445' }, stock: 15, esquemaComision: '3.5% Neto', etapa: 'Entregado' }
  ]);

  const uniqueDevIds = React.useMemo(() => Array.from(new Set(developers.map(d => d.id))), [developers]);
  const uniqueDevEmpresas = React.useMemo(() => Array.from(new Set(developers.map(d => d.empresa))), [developers]);
  const uniqueDevNits = React.useMemo(() => Array.from(new Set(developers.map(d => d.nit))), [developers]);
  const uniqueDevRepresentantes = React.useMemo(() => Array.from(new Set(developers.map(d => d.representante))), [developers]);

  const filteredDevs = React.useMemo(() => {
    // ponytail: sort chronologically descending (newest / highest ID first)
    const list = developers.filter(dev => {
      if (selectedDevIds.length > 0 && !selectedDevIds.includes(dev.id)) {
        return false;
      }
      if (selectedDevEmpresas.length > 0 && !selectedDevEmpresas.includes(dev.empresa)) {
        return false;
      }
      if (selectedDevNits.length > 0 && !selectedDevNits.includes(dev.nit)) {
        return false;
      }
      if (selectedDevRepresentantes.length > 0 && !selectedDevRepresentantes.includes(dev.representante)) {
        return false;
      }
      return true;
    });
    return list.sort((a, b) => b.id.localeCompare(a.id));
  }, [developers, selectedDevIds, selectedDevEmpresas, selectedDevNits, selectedDevRepresentantes]);

  const uniqueContractIds = React.useMemo(() => Array.from(new Set(contracts.map(c => c.id))), [contracts]);
  const uniqueContractProperties = React.useMemo(() => Array.from(new Set(contracts.map(c => c.property?.title || c.propertyId))), [contracts]);
  const uniqueContractTenants = React.useMemo(() => Array.from(new Set(contracts.map(c => c.tenant?.name || c.tenantId))), [contracts]);
  const uniqueContractStatuses = React.useMemo(() => Array.from(new Set(contracts.map(c => c.status))), [contracts]);

  // Unique options for Payments (Ingresos)
  const uniquePayIds = React.useMemo(() => Array.from(new Set(payments.map(p => p.id))), [payments]);
  const uniquePayCategories = React.useMemo(() => Array.from(new Set(payments.map(p => p.category_type || (p as any).category || ''))).filter(Boolean), [payments]);
  const uniquePayIssuers = React.useMemo(() => Array.from(new Set(payments.map(p => p.issuerName || ''))).filter(Boolean), [payments]);
  const uniquePayContracts = React.useMemo(() => Array.from(new Set(payments.map(p => p.contractId || ''))).filter(Boolean), [payments]);
  const uniquePayAmounts = React.useMemo(() => Array.from(new Set(payments.map(p => String(p.amount)))), [payments]);
  const uniquePayDestinations = React.useMemo(() => Array.from(new Set(payments.map(p => p.destinationAccount || ''))).filter(Boolean), [payments]);
  const uniquePayDates = React.useMemo(() => Array.from(new Set(payments.map(p => new Date(p.paymentDate).toLocaleDateString()))), [payments]);
  const uniquePayMethods = React.useMemo(() => Array.from(new Set(payments.map(p => p.paymentMethod || ''))).filter(Boolean), [payments]);
  const uniquePayStatuses = React.useMemo(() => Array.from(new Set(payments.map(p => p.status || ''))).filter(Boolean), [payments]);

  // Unique options for Expenses (Gastos)
  const uniqueExpIds = React.useMemo(() => Array.from(new Set(expenses.map(e => e.id))), [expenses]);
  const uniqueExpDates = React.useMemo(() => Array.from(new Set(expenses.map(e => new Date(e.date).toLocaleDateString()))), [expenses]);
  const uniqueExpRequesters = React.useMemo(() => Array.from(new Set(expenses.map(e => e.requester || ''))).filter(Boolean), [expenses]);
  const uniqueExpCategories = React.useMemo(() => Array.from(new Set(expenses.map(e => e.category || ''))).filter(Boolean), [expenses]);
  const uniqueExpConcepts = React.useMemo(() => Array.from(new Set(expenses.map(e => e.concept || ''))).filter(Boolean), [expenses]);
  const uniqueExpVinculaciones = React.useMemo(() => Array.from(new Set(expenses.map(e => e.vinculacion || ''))).filter(Boolean), [expenses]);
  const uniqueExpStatuses = React.useMemo(() => Array.from(new Set(expenses.map(e => e.status || ''))).filter(Boolean), [expenses]);

  const filteredContracts = React.useMemo(() => {
    return contracts.filter((cnt: any) => {
      // 1. Date filters
      if (filterContractDateStart && new Date(cnt.startDate) < new Date(filterContractDateStart)) {
        return false;
      }
      if (filterContractDateEnd && new Date(cnt.endDate) > new Date(filterContractDateEnd)) {
        return false;
      }

      // 2. Document state filters
      if (filterContractDocState !== 'Todos') {
        if (filterContractDocState === 'Vigentes' && cnt.status !== 'VIGENTE') {
          return false;
        }
        if (filterContractDocState === 'Vencidos' && cnt.status !== 'VENCIDO') {
          return false;
        }
        if (filterContractDocState === 'PorVencer') {
          if (cnt.status !== 'VIGENTE') return false;
          const end = new Date(cnt.endDate);
          const now = new Date();
          const diff = end.getTime() - now.getTime();
          const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (diffDays <= 0 || diffDays > 30) return false;
        }
      }

      // 3. Dropdown multi-select filters
      if (selectedContractIds.length > 0 && !selectedContractIds.includes(cnt.id)) {
        return false;
      }
      const propTitle = cnt.property?.title || cnt.propertyId;
      if (selectedContractProperties.length > 0 && !selectedContractProperties.includes(propTitle)) {
        return false;
      }
      const tenantName = cnt.tenant?.name || cnt.tenantId;
      if (selectedContractTenants.length > 0 && !selectedContractTenants.includes(tenantName)) {
        return false;
      }
      if (selectedContractStatuses.length > 0 && !selectedContractStatuses.includes(cnt.status)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.startDate ? new Date(a.startDate).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.startDate ? new Date(b.startDate).getTime() : 0);
      if (dateB !== dateA) return dateB - dateA;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [contracts, filterContractDateStart, filterContractDateEnd, filterContractDocState, selectedContractIds, selectedContractProperties, selectedContractTenants, selectedContractStatuses]);


  // Production Kanban for Marketing Planes
  const [productionStages, setProductionStages] = useState<Record<string, Property[]>>({
    Nuevo: [],
    Contactado: [],
    Grabado: [],
    Publicado: [],
  });
  const searchableItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: 'seccion' | 'constructora' | 'propiedad' | 'propietario' | 'agente';
      targetTab: Tab;
      icon: string;
      subtitle?: string;
    }> = [];

    // 1. Static Sections
    const sections: { tab: Tab; label: string }[] = [
      { tab: 'dashboard', label: 'Dashboard General' },
      { tab: 'properties', label: 'Listado de Propiedades' },
      { tab: 'agents', label: 'Administración de Agentes' },
      { tab: 'prospects', label: 'Fichas de Prospectos' },
      { tab: 'owners', label: 'Gestión de Propietarios' },
      { tab: 'developers', label: 'Módulo de Constructoras' },
      { tab: 'contracts', label: 'Contratos de Alquiler / Venta' },
      { tab: 'payments', label: 'Bitácora de Ingresos' },
      { tab: 'expenses', label: 'Control de Gastos' },
      { tab: 'reports', label: 'Reportes y Analíticas' },
      { tab: 'marketing_planes', label: 'Planes de Marketing' },
      { tab: 'config_permissions', label: 'Configuración de Permisos' },
      { tab: 'colaboraciones', label: 'Colaboraciones' },
    ];
    sections.forEach(s => {
      items.push({
        id: `sec-${s.tab}`,
        title: s.label,
        type: 'seccion',
        targetTab: s.tab,
        icon: '⚙️',
        subtitle: 'Sección del Panel'
      });
      });

    // 2. Dynamic Developers
    developers.forEach(dev => {
      items.push({
        id: `dev-${dev.id}`,
        title: dev.empresa,
        type: 'constructora',
        targetTab: 'developers',
        icon: '🏢',
        subtitle: `Constructora • NIT: ${dev.nit}`
      });
    });

    // 3. Dynamic Properties
    properties.forEach((prop: any) => {
      items.push({
        id: `prop-${prop.id}`,
        title: prop.title,
        type: 'propiedad',
        targetTab: 'properties',
        icon: '🏠',
        subtitle: `Propiedad • $${prop.price.toLocaleString()} USD`
      });
    });

    // 4. Dynamic Owners
    owners.forEach(own => {
      items.push({
        id: `own-${own.id}`,
        title: own.name,
        type: 'propietario',
        targetTab: 'owners',
        icon: '👤',
        subtitle: `Propietario • ${own.email}`
      });
    });

    // 5. Dynamic Agents
    agents.forEach((agt: any) => {
      items.push({
        id: `agt-${agt.id}`,
        title: agt.name,
        type: 'agente',
        targetTab: 'agents',
        icon: '👔',
        subtitle: `Agente • Comisión: ${agt.commissionRate}%`
      });
    });

    return items;
  }, [developers, properties, owners, agents]);

  const filteredSearchResults = React.useMemo(() => {
    const query = globalSearchQuery.trim().toLowerCase();
    if (!query) {
      return searchableItems.filter(item => item.type === 'seccion').slice(0, 5);
    }
    return searchableItems.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.subtitle?.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [globalSearchQuery, searchableItems]);


  // Load backend data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const cityQuery = selectedSucursal === 'TODOS' ? '' : `?city=${selectedSucursal}`;
      const token = getToken() || '';

      // Cargar tipo de cambio actual
      apiClient.getWithAuth<any>('/exchange-rate', token).then(rate => {
        if (rate && rate.rateBuy && rate.rateSell) {
          setExchangeRate({ rateBuy: rate.rateBuy, rateSell: rate.rateSell });
          setManualExchangeRate({ rateBuy: String(rate.rateBuy), rateSell: String(rate.rateSell) });
        }
      }).catch(err => console.error('Error fetching exchange rate:', err));
      const [propsData, contractsData, paymentsData, expensesData, agentsData, kpisData, developersData, dbStatsData, dbLeads, dbTraffic] = await Promise.all([
        propertiesService.getProperties().catch(err => { console.error('Error fetching properties:', err); return []; }),
        contractsService.getContracts().catch(err => { console.error('Error fetching contracts:', err); return []; }),
        paymentsService.getPayments().catch(err => { console.error('Error fetching payments:', err); return []; }),
        expensesService.getExpenses().catch(err => { console.error('Error fetching expenses:', err); return []; }),
        apiClient.getWithAuth<any[]>(`/admin/agents${cityQuery}`, token).catch(err => { console.error('Error fetching agents:', err); return []; }),
        apiClient.getWithAuth<any>('/admin/agents/kpis', token).catch(err => { console.error('Error fetching agent KPIs:', err); return { totalActive: 0, topRated: 0, closuresVolume: 0, commissionsTotal: 0, avgRating: 0 }; }),
        apiClient.getWithAuth<any[]>('/admin/developers', token).catch(err => { console.error('Error fetching developers:', err); return []; }),
        apiClient.getWithAuth<any>(`/dashboard/admin/stats?branch=${selectedSucursal}`, token).catch(err => { console.error('Error fetching admin dashboard stats:', err); return null; }),
        apiClient.getWithAuth<any[]>('/leads', token).catch(err => { console.error('Error fetching leads:', err); return []; }),
        apiClient.getWithAuth<any>('/market/traffic-sources', token).catch(err => { console.error('Error fetching traffic sources:', err); return null; })
      ]);
      const nowMs = Date.now();
      const defaultMockProps: any[] = ALL_REAL_PROPERTIES;

      // ponytail: prospects mapping moved after finalProps has been computed below


      // ── PISO INDESTRUCTIBLE: los 20 mocks base siempre presentes ──
      const mergeMap = new Map<string, any>();
      ALL_REAL_PROPERTIES.forEach((p: any) => {
        if (p && p.id) mergeMap.set(p.id, mapPropertyToNewSchema(p));
      });

      // ── FUSIÓN DE DB.JSON: propiedades dinámicas del propietario ──
      try {
        const localPersistedProps = await fetchLocalProperties();
        (Array.isArray(localPersistedProps) ? localPersistedProps : [])
          .filter((p: any) => p && p.id && p.title)
          .forEach((p: any) => {
            const mapped = mapPropertyToNewSchema(p);
            // ponytail: db.json siempre gana sobre el mock para ese ID (documentos, status, auditoria)
            mergeMap.set(p.id, { ...mergeMap.get(p.id), ...mapped });
          });
      } catch (dbErr) {
        console.warn('[Admin] db.json no disponible, usando solo base estática:', dbErr);
      }

      // ── DISPATCH ÚNICO Y ATÓMICO ──
      const finalProps = Array.from(mergeMap.values());
      setProperties(finalProps as any);
      setDashboardStats(prev => ({
        ...prev,
        activeProperties: finalProps.length
      }));

      // ponytail: map and sync database leads and traffic sources to frontend prospects state
      if (dbTraffic && typeof dbTraffic === 'object') {
        setTrafficSources(dbTraffic);
      }

      let finalLeads: Prospect[] = [];
      if (Array.isArray(dbLeads) && dbLeads.length > 0) {
        finalLeads = dbLeads.map(l => ({
          id: l.id || `lead-${Date.now()}`,
          name: l.name || 'Prospecto sin nombre',
          email: l.email || 'correo@mail.com',
          phone: l.phone || '+591 700 00000',
          interest: l.property?.title || 'Propiedad de Cartera',
          budget: l.property?.price || 150000,
          source: l.property ? 'WEB' : 'WHATSAPP',
          assignedAgent: l.agent?.name || null,
          status: (l.status === 'COMPRADO' ? 'COMPRADO' : l.status === 'CONTACTADO' ? 'CONTACTADO' : l.status === 'VISITA_AGENDADA' ? 'VISITA_AGENDADA' : 'PENDIENTE') as any,
          createdAt: l.createdAt || new Date().toISOString()
        }));
      }

      if (finalLeads.length === 0 && finalProps.length > 0) {
        const mockNames = ['Carlos Arandia', 'María René Claros', 'Juan de Dios Ortíz', 'Gabriela Claure', 'Claudia Mendoza', 'Pedro Vargas', 'Gaby Solares', 'Jorge Claros', 'Adriana Claure', 'Alejandro Claros', 'Rodrigo Banzer', 'Susana Solares'];
        const mockEmails = ['carlos@mail.com', 'maria.cl@gmail.com', 'juan.ortiz@outlook.com', 'gaby.c@mail.com', 'claudia.m@gmail.com', 'pedro.v@mail.com', 'gaby.solares@gmail.com', 'jorge@mail.com', 'adriana.c@mail.com', 'alejandro@mail.com', 'rodrigo.b@mail.com', 'susana@mail.com'];
        const mockPhones = ['+591 798 12345', '+591 712 99887', '+591 700 44332', '+591 721 55443', '+591 707 11223', '+591 789 65432', '+591 765 43210', '+591 750 98765', '+591 732 12345', '+591 711 22334', '+591 766 55443', '+591 799 88776'];
        const mockSources = ['TIKTOK', 'GOOGLE MAPS', 'TELEGRAM', 'WEB', 'RECOMENDADO', 'TIKTOK', 'GOOGLE MAPS', 'TELEGRAM', 'WEB', 'RECOMENDADO', 'TIKTOK', 'GOOGLE MAPS'];
        const mockStages = ['PENDIENTE', 'CONTACTADO', 'VISITA_AGENDADA', 'PENDIENTE', 'CONTACTADO', 'VISITA_AGENDADA', 'PENDIENTE', 'PENDIENTE', 'CONTACTADO', 'VISITA_AGENDADA', 'PENDIENTE', 'PENDIENTE'];
        const mockAgents = ['René Vargas', 'Claudia Claure', 'Pedro Mendoza', 'Gaby Solares'];

        finalLeads = mockNames.map((name, i) => {
          const prop = finalProps[i % finalProps.length];
          return {
            id: `MOCK-L-${100 + i}`,
            name,
            email: mockEmails[i],
            phone: mockPhones[i],
            interest: prop.title,
            budget: prop.price,
            source: mockSources[i],
            assignedAgent: mockAgents[i % mockAgents.length],
            status: mockStages[i] as any,
            createdAt: new Date(Date.now() - i * 3600000).toISOString()
          };
        });
      }
      setProspects(finalLeads);


      // ── Fusionar contratos con db.json via helper blindado ──
      let mergedContracts = Array.isArray(contractsData) ? [...contractsData] : [];
      try {
        const persistedContracts = await fetchLocalContracts();
        const existingIds = new Set(mergedContracts.map((c: any) => c.id));
        persistedContracts
          .filter((c: any) => c && c.id && !existingIds.has(c.id))
          .forEach((c: any) => mergedContracts.unshift(c));
      } catch (dbContractsErr) {
        console.warn('[Admin] Error cargando db.json contracts (no bloquea):', dbContractsErr);
      }

      // ponytail: Inyectar piso indestructible de al menos 5 contratos relacionales coherentes si el listado está vacío
      if (mergedContracts.length === 0) {
        const defaultMockContracts = [
          {
            id: 'CON-701',
            propertyId: 'PROP-REAL-023',
            property: {
              id: 'PROP-REAL-023',
              title: 'killla',
              location: '1, Cochabamba',
              address: '1'
            },
            tenantId: 'cli-1',
            tenant: {
              id: 'cli-1',
              name: 'María Quispe',
              email: 'maria@ejemplo.com',
              phone: '+591 712 34567'
            },
            ownerId: 'OWN-201',
            owner: {
              id: 'OWN-201',
              name: 'René Vargas',
              email: 'propietario@mail.com',
              phone: '+591 798 12345'
            },
            startDate: '2026-06-01T00:00:00.000Z',
            endDate: '2027-06-01T00:00:00.000Z',
            monthlyAmount: 1200,
            status: 'VIGENTE',
            observations: 'Contrato de Alquiler Residencial de Inmueble KILLLA.',
            createdAt: '2026-06-01T10:00:00.000Z',
            agentName: 'René Vargas',
            ownerName: 'René Vargas',
            currency: 'USD',
            type: 'Alquiler'
          },
          {
            id: 'CON-702',
            propertyId: 'PROP-REAL-019',
            property: {
              id: 'PROP-REAL-019',
              title: 'gokuuuuuu',
              location: '1, Cochabamba',
              address: '1'
            },
            tenantId: 'cli-2',
            tenant: {
              id: 'cli-2',
              name: 'Juan Pérez',
              email: 'juanperez@mail.com',
              phone: '+591 798 12345'
            },
            ownerId: 'OWN-201',
            owner: {
              id: 'OWN-201',
              name: 'René Vargas',
              email: 'propietario@mail.com',
              phone: '+591 798 12345'
            },
            startDate: '2026-05-15T00:00:00.000Z',
            endDate: '2026-06-15T00:00:00.000Z',
            monthlyAmount: 150000,
            status: 'VIGENTE',
            observations: 'Contrato de Compraventa de Inmueble GOKUUUUUUU.',
            createdAt: '2026-05-15T12:00:00.000Z',
            agentName: 'Claudia Claure',
            ownerName: 'René Vargas',
            currency: 'USD',
            type: 'Venta'
          },
          {
            id: 'CON-703',
            propertyId: 'PROP-REAL-021',
            property: {
              id: 'PROP-REAL-021',
              title: 'PIKACHUUUUUUUUU',
              location: 'Equipetrol, Santa Cruz de la Sierra',
              address: 'Equipetrol'
            },
            tenantId: 'cli-3',
            tenant: {
              id: 'cli-3',
              name: 'Pedro Vargas',
              email: 'pedro.vargas@mail.com',
              phone: '+591 707 11223'
            },
            ownerId: 'OWN-201',
            owner: {
              id: 'OWN-201',
              name: 'René Vargas',
              email: 'propietario@mail.com',
              phone: '+591 798 12345'
            },
            startDate: '2026-04-01T00:00:00.000Z',
            endDate: '2027-04-01T00:00:00.000Z',
            monthlyAmount: 850,
            status: 'VIGENTE',
            observations: 'Contrato de Alquiler de Departamento PIKACHUUUUUUUUU.',
            createdAt: '2026-04-01T09:00:00.000Z',
            agentName: 'Pedro Mendoza',
            ownerName: 'René Vargas',
            currency: 'USD',
            type: 'Alquiler'
          },
          {
            id: 'CON-704',
            propertyId: 'PROP-REAL-001',
            property: {
              id: 'PROP-REAL-001',
              title: 'Casa Quinta Familiar de Lujo - Equipetrol',
              location: 'Equipetrol, Santa Cruz de la Sierra',
              address: 'Equipetrol, Santa Cruz de la Sierra'
            },
            tenantId: 'cli-4',
            tenant: {
              id: 'cli-4',
              name: 'Carlos Arandia',
              email: 'carlos@mail.com',
              phone: '+591 798 12345'
            },
            ownerId: 'OWN-201',
            owner: {
              id: 'OWN-201',
              name: 'René Vargas',
              email: 'rene@mail.com',
              phone: '+591 798 12345'
            },
            startDate: '2024-01-10T00:00:00.000Z',
            endDate: '2026-01-10T00:00:00.000Z',
            monthlyAmount: 25000,
            status: 'VENCIDO',
            observations: 'Contrato de Anticrético de Casa Quinta. Devuelto y en proceso de cierre.',
            createdAt: '2024-01-10T08:00:00.000Z',
            agentName: 'René Vargas',
            ownerName: 'René Vargas',
            currency: 'USD',
            type: 'Anticrético'
          },
          {
            id: 'CON-705',
            propertyId: 'PROP-REAL-004',
            property: {
              id: 'PROP-REAL-004',
              title: 'Oficina Corporativa Completa - Barrio Sirari',
              location: 'Barrio Sirari, Santa Cruz de la Sierra',
              address: 'Barrio Sirari, Santa Cruz de la Sierra'
            },
            tenantId: 'cli-5',
            tenant: {
              id: 'cli-5',
              name: 'Gabriela Claure',
              email: 'gaby.c@mail.com',
              phone: '+591 721 55443'
            },
            ownerId: 'OWN-204',
            owner: {
              id: 'OWN-204',
              name: 'Gaby Solares',
              email: 'gaby@mail.com',
              phone: '+591 721 55443'
            },
            startDate: '2026-07-01T00:00:00.000Z',
            endDate: '2027-07-01T00:00:00.000Z',
            monthlyAmount: 1100,
            status: 'VIGENTE',
            observations: 'Contrato de Alquiler Comercial de Oficina. Renovación anual.',
            createdAt: '2026-07-01T14:00:00.000Z',
            agentName: 'Gaby Solares',
            ownerName: 'Gaby Solares',
            currency: 'USD',
            type: 'Alquiler'
          }
        ];
        defaultMockContracts.forEach(c => {
          mergedContracts.push(c as any);
          persistContract(c as any).catch(err => console.warn('[localDb] error persistiendo iniciales:', err));
        });
      }

      setContracts(contractsData);
      setContracts(mergedContracts);
      setPayments(paymentsData);
      setExpenses(expensesData);
      if (dbStatsData) {
        setDashboardStats(dbStatsData);
        setDashboardStats(prev => ({
          ...dbStatsData,
          activeProperties: prev.activeProperties
        }));
      }


      // ── Fusionar constructores con db local fallback ──
      let mergedDevs = Array.isArray(developersData) ? [...developersData] : [];
      try {
        const persistedDevs = await fetchLocalDevelopers();
        const existingIds = new Set(mergedDevs.map((d: any) => d.id));
        persistedDevs
          .filter((d: any) => d && d.id && !existingIds.has(d.id))
          .forEach((d: any) => mergedDevs.unshift(d));
      } catch (dbDevsErr) {
        console.warn('[Admin] Error cargando local developers:', dbDevsErr);
      }

      const filteredDevelopers = mergedDevs.filter((d: any) => {
        if (selectedSucursal === 'TODOS') return true;
        return (d.officeZone || d.etapa || '').toLowerCase().includes(selectedSucursal.toLowerCase());
      });

      const mappedDevelopers = filteredDevelopers.map((d: any) => ({
        id: d.id || '',
        empresa: d.name || d.empresa || '',
        nit: d.nit || '',
        representante: d.representative || d.representante || '',
        contacto: {
          email: d.email || (d.contacto?.email || ''),
          phone: d.phone || (d.contacto?.phone || '')
        },
        stock: Number(d.stock) || 0,
        esquemaComision: d.commissionScheme || d.esquemaComision || '3% Venta Escalonada',
        etapa: d.stage || d.etapa || 'Preventa Torre A'
      }));
      setDevelopers(mappedDevelopers);

      // ─── AGENT SYNC: set agents from backend directly ─
      const mappedAgents = agentsData.map((a: any) => ({
        id: a.agentCustomId || a.id,
        name: a.fullName,
        email: a.email,
        phone: a.phone,
        commissionRate: a.baseCommission || 1.5,
        splitPropio: a.splitPropio || 50,
        splitAgent: a.splitAgent || 50,
        salesVolume: a.salesVolume || 0,
        rating: a.rating || 5.0,
        status: a.status || 'Activo',
        dateJoined: a.dateJoined,
        idDocument: a.idDocument,
        birthDate: a.birthDate,
        cityOfResidence: a.cityOfResidence,
        aptitude: a.aptitude || 85
      }));

      setAgents(mappedAgents);
      const finalAgents = mappedAgents && mappedAgents.length >= 4 ? mappedAgents : [
        { id: 'AGT-001', name: 'Roberto Claros', email: 'roberto@propio.bo', phone: '+591 772 34871', commissionRate: 1.5, salesVolume: 420000, rating: 4.8, status: 'Activo' },
        { id: 'AGT-002', name: 'Lucía Arteaga', email: 'lucia@propio.bo', phone: '+591 601 98324', commissionRate: 1.5, salesVolume: 185000, rating: 4.9, status: 'Activo' },
        { id: 'AGT-003', name: 'David Choque', email: 'david@propio.bo', phone: '+591 717 44901', commissionRate: 1.5, salesVolume: 95000, rating: 4.5, status: 'Activo' },
        { id: 'AGT-2026-007', name: 'David Agente', email: 'david.agt@propio.bo', phone: '+591 700 88990', commissionRate: 1.5, salesVolume: 120000, rating: 4.7, status: 'Activo' }
      ];
      setAgents(finalAgents as any);

      setAgentKpis(kpisData);

      // Populate Marketing Kanban
      const mockNuevo = propsData.filter(p => !p.isVerified).slice(0, 2).map(mapPropertyToNewSchema);
      const mockContactado = propsData.filter(p => p.isVerified).slice(0, 1).map(mapPropertyToNewSchema);
      const mockGrabado = propsData.filter(p => p.isVerified).slice(1, 2).map(mapPropertyToNewSchema);
      const mockPublicado = propsData.filter(p => p.isVerified).slice(2).map(mapPropertyToNewSchema);
      
      setProductionStages({
        Nuevo: mockNuevo,
        Contactado: mockContactado,
        Grabado: mockGrabado,
        Publicado: mockPublicado
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (id: string, status: string, notes?: string) => {
    try {
      const token = getToken() || '';
      await paymentsService.updatePaymentStatus(id, { status, notes }, token);
      alert(`Estado del cobro actualizado a ${status} con éxito.`);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar el estado del cobro');
    }
  };

  const handleUpdateExpenseStatus = async (id: string, status: string, notes?: string) => {
    try {
      const token = getToken() || '';
      await expensesService.updateExpenseStatus(id, { status, notes }, token);
      alert(`Estado del egreso actualizado a ${status} con éxito.`);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar el estado del egreso');
    }
  };

  const handleDeleteActivityLog = async (id: string) => {
    if (!confirm('¿Deseas eliminar definitivamente este evento de la bitácora? Esta acción realizará un borrado físico permanente.')) {
      return;
    }
    try {
      const token = getToken() || '';
      await apiClient.deleteWithAuth(`/dashboard/admin/activities/${id}`, token);
      
      // Update local state reactively to prevent rendering delay
      setDashboardStats(prev => ({
        ...prev,
        recentEvents: prev.recentEvents.filter(e => e.id !== id)
      }));
      alert('Registro de actividad eliminado permanentemente.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al eliminar el registro.');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpConcept || !newExpAmount || !newExpDate || !newExpCategory) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }
    try {
      const token = getToken() || '';
      await expensesService.createExpense({
        concept: newExpConcept,
        amount: Number(newExpAmount),
        date: new Date(newExpDate).toISOString().split('T')[0],
        category: newExpCategory,
        propertyId: newExpPropertyId || undefined,
        requester: newExpRequester,
        vinculacion: newExpVinculacion,
        status: 'PENDIENTE',
        receiptUrl: '#',
      }, token);
      alert('Gasto registrado con éxito.');
      setNewExpConcept('');
      setNewExpAmount('');
      setNewExpDate('2026-05-19');
      setNewExpCategory('Mantenimiento');
      setNewExpPropertyId('');
      setShowAddExpenseModal(false);
      await loadAllData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al registrar el gasto');
    }
  };


  // 1. Mount effect: read from localStorage immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keysToClear = [
        'propio_admin_agents',
        'propio_custom_agents',
        'propio_admin_properties',
        'propio_custom_created_properties',
        'propio_admin_prospects',
        'propio_admin_owners',
        'propio_deleted_agent_ids',
        'propio_admin_collaborations',
        'propio_admin_pedidos_mkt',
        'propio_announcement_reads'
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));

      setAgents([]);
      setProspects([]);
      setOwners([]);
      setIsInitialLoading(false);

      const savedTab = localStorage.getItem('propio_admin_active_tab');
      if (savedTab) {
        try {
          setActiveTab(savedTab as Tab);
          localStorage.removeItem('propio_admin_active_tab');
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // 2. Fetch data effect: run only after initial rehydration is complete
  useEffect(() => {
    if (!isInitialLoading) {
      loadAllData();
    }
  }, [selectedSucursal, isInitialLoading]);

  // 3. Persist agents effect: write to localStorage when agents change
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialLoading) {
      localStorage.setItem('propio_admin_agents', JSON.stringify(agents));
    }
  }, [agents, isInitialLoading]);



  // ponytail: prospects are synced dynamically from backend database (see loadAllData)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('propio_admin_owners');
      let loadedOwners = [];
      if (stored) {
        setOwners(JSON.parse(stored));
        try {
          loadedOwners = JSON.parse(stored);
        } catch (e) {
          console.error(e);
        }
      }
      if (loadedOwners && loadedOwners.length >= 4) {
        setOwners(loadedOwners);
      } else {
        const defaultOwners = [
          { id: 'OWN-201', name: 'René Vargas', email: 'rene@mail.com', phone: '+591 798 12345', properties: ['PROP-REAL-001', 'PROP-REAL-005', 'PROP-REAL-009', 'PROP-RENT-003', 'PROP-RENT-007'], plan: 'venta_pro', status: 'Verificado' },
          { id: 'OWN-202', name: 'Claudia Claure', email: 'clau@mail.com', phone: '+591 712 99887', properties: ['PROP-REAL-002', 'PROP-REAL-006', 'PROP-REAL-010', 'PROP-RENT-004', 'PROP-RENT-008'], plan: 'cierre_garantizado', status: 'Verificado' },
          { id: 'OWN-203', name: 'Pedro Mendoza', email: 'pedro@mail.com', phone: '+591 700 44332', properties: ['PROP-REAL-003', 'PROP-REAL-007', 'PROP-RENT-001', 'PROP-RENT-005', 'PROP-RENT-009'], plan: 'gratis', status: 'Pendiente' },
          { id: 'OWN-204', name: 'Gaby Solares', email: 'gaby@mail.com', phone: '+591 721 55443', properties: ['PROP-REAL-004', 'PROP-REAL-008', 'PROP-RENT-002', 'PROP-RENT-006', 'PROP-RENT-010'], plan: 'venta_pro', status: 'Verificado' }
        ];
        setOwners(defaultOwners as any);
        localStorage.setItem('propio_admin_owners', JSON.stringify(defaultOwners));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && owners.length > 0) {
      localStorage.setItem('propio_admin_owners', JSON.stringify(owners));
    }
  }, [owners]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('.header-filter-trigger') || target?.closest?.('.header-filter-dropdown') ||
          target?.closest?.('.agent-header-filter-trigger') || target?.closest?.('.agent-header-filter-dropdown') ||
          target?.closest?.('.prospect-header-filter-trigger') || target?.closest?.('.prospect-header-filter-dropdown')) {
        return;
      }
      setActiveHeaderFilter(null);
      setActiveAgentHeaderFilter(null);
      setActiveProspectHeaderFilter(null);

      // Close map popover if clicking outside
      if (!target?.closest?.('.map-popover-trigger') && !target?.closest?.('.map-popover-container')) {
        setActiveMapPopoverId(null);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  useEffect(() => {
    const handleOpenDocs = (e: Event) => {
      const { entityId, entityType } = (e as CustomEvent).detail;
      if (entityType === 'property') {
        const prop = properties.find(p => p.id === entityId);
        if (prop) {
          setDocAuditEntityType('property');
          handleOpenDocAudit(prop.id, prop.title);
        }
      } else if (entityType === 'contract') {
        const contract = contracts.find(c => c.id === entityId);
        if (contract) {
          setDocAuditEntityType('contract');
          handleOpenContractDocAudit(contract);
        }
      } else if (entityType === 'developer') {
        const dev = developers.find(d => d.id === entityId);
        if (dev) {
          setDocAuditEntityType('developer');
          handleOpenDeveloperDocAudit(dev);
        }
      }
    };
    window.addEventListener('open-entity-docs', handleOpenDocs);
    return () => window.removeEventListener('open-entity-docs', handleOpenDocs);
  }, [properties, contracts, developers]);

  const handleDownloadDossier = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = getToken() || '';
      const p = await propertiesService.getPropertyById(propertyId);
      
      const ownerName = (p as any).owner?.name || 'Propietario';
      const ownerPhone = (p as any).owner?.phone || (p as any).owner?.whatsappPhone || 'No registrado';
      const ownerEmail = (p as any).owner?.email || 'No registrado';
      const ownerJoined = (p as any).owner?.dateJoined 
        ? new Date((p as any).owner.dateJoined).toLocaleDateString() 
        : 'No registrada';
        
      const getDocStatusLabel = (docType: string) => {
        const doc = (p as any).documents?.find((d: any) => d.fileType?.toUpperCase() === docType);
        if (doc) {
          if (doc.status === 'APPROVED') return 'APROBADO';
          if (doc.status === 'PENDING') return 'PENDIENTE';
          if (doc.status === 'REJECTED') return 'RECHAZADO';
        }
        const legacyFlag = docType === 'FR' ? p.hasFolioReal : docType === 'CT' ? p.hasCatastro : p.hasTestimonio;
        if (legacyFlag) return 'PENDIENTE';
        return 'NO PRESENTADO';
      };
      
      const folioRealStatus = getDocStatusLabel('FR');
      const catastroStatus = getDocStatusLabel('CT');
      const testimonioStatus = getDocStatusLabel('TS');
      
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      const primaryColor = [4, 4, 94];
      const darkSlate = [30, 41, 59];
      
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('PROPIO', 15, 22);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('PLATAFORMA INMOBILIARIA DE BOLIVIA', 15, 29);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DOSSIER COMPLETO DE PROPIEDAD', 130, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`ID PROPIEDAD: ${p.id}`, 130, 25);
      doc.text(`EXPEDIDO EL: ${new Date().toLocaleDateString()}`, 130, 30);
      
      let y = 50;
      
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 45, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('I. DATOS DEL PROPIETARIO', 20, y + 8);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y + 11, 190, y + 11);
      
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Nombre del Propietario:', 20, y + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(ownerName, 65, y + 20);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Número de Teléfono:', 20, y + 27);
      doc.setFont('helvetica', 'normal');
      doc.text(ownerPhone, 65, y + 27);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Correo Electrónico:', 20, y + 34);
      doc.setFont('helvetica', 'normal');
      doc.text(ownerEmail, 65, y + 34);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de Registro:', 20, y + 41);
      doc.setFont('helvetica', 'normal');
      doc.text(ownerJoined, 65, y + 41);
      
      y += 55;
      
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 78, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('II. FICHA TÉCNICA DEL INMUEBLE', 20, y + 8);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y + 11, 190, y + 11);
      
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Título Comercial:', 20, y + 19);
      doc.setFont('helvetica', 'normal');
      doc.text(p.title || 'Sin título', 65, y + 19);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Precio de Lista (USD):', 20, y + 26);
      doc.setFont('helvetica', 'normal');
      doc.text(`$${(p.price || 0).toLocaleString()} USD`, 65, y + 26);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Tipo de Transacción:', 20, y + 33);
      doc.setFont('helvetica', 'normal');
      doc.text(p.offerType || 'Venta', 65, y + 33);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Tipo de Inmueble:', 20, y + 40);
      doc.setFont('helvetica', 'normal');
      doc.text(p.type?.toUpperCase() || 'CASA', 65, y + 40);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Superficie Útil:', 20, y + 47);
      doc.setFont('helvetica', 'normal');
      doc.text(`${p.area || 0} m²`, 65, y + 47);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Dormitorios / Baños:', 20, y + 54);
      doc.setFont('helvetica', 'normal');
      doc.text(`${p.rooms || 0} hab. / ${p.bathrooms || 0} baños`, 65, y + 54);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Ubicación:', 20, y + 61);
      doc.setFont('helvetica', 'normal');
      const locText = typeof (p as any).location === 'object' && (p as any).location !== null
        ? `${(p as any).location.address || ''} ${(p as any).location.city || ''}`.trim()
        : p.location;
      doc.text(locText || 'Sin ubicación', 65, y + 61);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción:', 20, y + 68);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(p.description || 'Sin descripción.', 120);
      doc.text(descLines, 65, y + 68);
      
      const descHeight = descLines.length * 4.5;
      y += 80 + descHeight;
      
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 48, 'F');
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('III. EXPEDIENTE DE DOCUMENTACIÓN LEGAL', 20, y + 8);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(20, y + 11, 190, y + 11);
      
      doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Folio Real (FR):', 20, y + 19);
      doc.setFont('helvetica', 'normal');
      doc.text(folioRealStatus, 65, y + 19);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Catastro (CT):', 20, y + 26);
      doc.setFont('helvetica', 'normal');
      doc.text(catastroStatus, 65, y + 26);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Testimonio (TS):', 20, y + 33);
      doc.setFont('helvetica', 'normal');
      doc.text(testimonioStatus, 65, y + 33);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Plan de Marketing Activo:', 20, y + 40);
      doc.setFont('helvetica', 'normal');
      doc.text(getPlanLabel(parsePlanFromProperty(p as any)), 65, y + 40);
      
      let filename = '';
      if (p.id === 'prop-mock-1') {
        filename = 'DOSSIER_COMPLETO_TORRE_NORTE_penthouse14a.pdf';
      } else if (p.id === 'prop-mock-2') {
        filename = 'DOSSIER_COMPLETO_CASA_QUINTA_CALACALA.pdf';
      } else if (p.id === 'prop-mock-3') {
        filename = 'DOSSIER_COMPLETO_TERRENO_EL_PRADO.pdf';
      } else {
        const sanitizedTitle = ownerName.replace(/\s+/g, '_');
        filename = `DOSSIER_COMPLETO_${p.id}_${sanitizedTitle}.pdf`;
      }
      doc.save(filename);
      
    } catch (err: any) {
      console.error(err);
      alert('Error al generar el dossier en PDF: ' + err.message);
    }
  };

  const handleExportPropertyData = (property: Property, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const dataStr = JSON.stringify(property, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PROPIEDAD_${property.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting property data:', error);
      alert('Error al exportar los datos de la propiedad.');
    }
  };

  const handleExportOwnerZip = async (ownerId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoadingOwnerZip(ownerId);
    try {
      const owner = owners.find(o => o.id === ownerId);
      if (!owner) {
        throw new Error('Propietario no encontrado en el sistema local.');
      }

      // 1. VINCULACIÓN DINÁMICA DE LA CARTERA (Live State Reference)
      const realOwnerProperties = properties.filter((p: any) => 
        (p as any).ownerId === owner.id || 
        owner.properties.some((titleStr: string) =>
          titleStr.toLowerCase().trim() === (p.title || '').toLowerCase().trim()
        )
      );

      // 1. VINCULACIÓN REAL CONTRA LA FUENTE MAESTRA DE 20 PROPIEDADES
      const masterProperties = ALL_REAL_PROPERTIES.filter((p: any) =>
        p.ownerId === owner.id ||
        (p.owner && p.owner.name === owner.name) ||
        owner.properties.some((titleStr: string) =>
          titleStr.toLowerCase().trim() === (p.title || p.name || '').toLowerCase().trim()
        )
      );

      if (realOwnerProperties.length === 0) {
        alert('El propietario no cuenta con inmuebles en su cartera');
        setLoadingOwnerZip(null);
        return;
      }
      // Fallback: si no hay coincidencia por ownerId, tomar las primeras 5 del maestro
      let targetProperties = masterProperties.length > 0
        ? masterProperties
        : ALL_REAL_PROPERTIES.slice(0, 5);

      if (realOwnerProperties.length > 0) {
        targetProperties = realOwnerProperties;
      }
      console.info(`[ExportZIP] Preparando ${targetProperties.length} expediente(s) para ${owner.name} (${owner.id})...`);

      const [JSZip, { jsPDF }] = await Promise.all([
        import('jszip').then(m => m.default),
        import('jspdf')
      ]);
      const zip = new JSZip();

      // 1. CARPETA PADRE PRINCIPAL (Main Parent Folder)
      const mainFolderName = `${owner.name}_${owner.id}`.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
      const parentFolder = zip.folder(mainFolderName)!;

      // 2. ARQUITECTURA DE CARPETAS DENTRO DEL ZIP (Zero Data Crossing)
      const allDownloadPromises: Promise<void>[] = [];

      // Colores corporativos
      const brandPrimary: [number, number, number] = [4, 4, 94];
      const accentGold: [number, number, number] = [212, 175, 55];
      const darkSlate: [number, number, number] = [30, 41, 59];
      const lightBg: [number, number, number] = [248, 250, 252];
      const dividerColor: [number, number, number] = [226, 232, 240];

      for (const prop of targetProperties) {
        const propAny = prop as any;
        const ownerAny = owner as any;
        const propTitle = (propAny.title || propAny.id || 'Inmueble').trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');

        // ── 1_informacion_de_la_casa: GENERACIÓN DEL PDF ────────────────
        allDownloadPromises.push(
          (async () => {
            try {
              const doc = new jsPDF();

              // ▸ ENCABEZADO PREMIUM CON LOGOTIPO CORPORATIVO
              doc.setFillColor(...brandPrimary);
              doc.rect(0, 0, 210, 42, 'F');

              // Acento dorado inferior del header
              doc.setFillColor(...accentGold);
              doc.rect(0, 42, 210, 1.5, 'F');

              // Logotipo textual "PROPIO" (vector, sin dependencia de imagen externa)
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(26);
              doc.text('PROPIO', 15, 20);

              // Eslogan corporativo
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(200, 210, 255);
              doc.text('PLATAFORMA INMOBILIARIA DE BOLIVIA', 15, 27);

              // Metadata del documento (alineada a la derecha)
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.text('FICHA TÉCNICA COMERCIAL', 195, 15, { align: 'right' });

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.text(`ID: ${propAny.id}`, 195, 22, { align: 'right' });
              doc.text(`Expedido: ${new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}`, 195, 28, { align: 'right' });

              // Nombre del inmueble como subtítulo
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(11);
              doc.setTextColor(255, 255, 255);
              const titleLines = doc.splitTextToSize(propAny.title || 'Sin título', 180);
              doc.text(titleLines, 15, 36);

              // ▸ SECCIÓN I: DATOS TÉCNICOS DEL INMUEBLE
              let y = 52;

              doc.setFillColor(...lightBg);
              doc.rect(15, y, 180, 60, 'F');

              doc.setTextColor(...brandPrimary);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(12);
              doc.text('I. DATOS TÉCNICOS DEL INMUEBLE', 20, y + 8);

              doc.setDrawColor(...dividerColor);
              doc.line(20, y + 11, 190, y + 11);

              const address = propAny.location?.address || propAny.address || 'No especificada';
              const city = propAny.location?.city || propAny.city || 'Cochabamba';
              const lat = propAny.location?.coordinates?.lat ?? propAny.latitude ?? propAny.lat ?? -17.3895;
              const lng = propAny.location?.coordinates?.lng ?? propAny.longitude ?? propAny.lng ?? -66.1568;

              const techFields = [
                ['Título Comercial:', propAny.title || 'Sin título'],
                ['Identificador (ID):', propAny.id],
                ['Precio de Lista (USD):', `$${(propAny.price || 0).toLocaleString('en-US')} USD`],
                ['Dirección Completa:', address],
                ['Ciudad:', city],
                ['Coordenadas GPS:', `Lat: ${lat}, Lng: ${lng}`],
              ];

              doc.setFontSize(9);
              let fieldY = y + 18;
              techFields.forEach(([label, value]) => {
                doc.setTextColor(...darkSlate);
                doc.setFont('helvetica', 'bold');
                doc.text(label, 20, fieldY);
                doc.setFont('helvetica', 'normal');
                doc.text(String(value), 72, fieldY);
                fieldY += 7;
              });

              // ▸ SECCIÓN II: CONTACTO DEL PROPIETARIO
              y = fieldY + 8;

              doc.setFillColor(...lightBg);
              doc.rect(15, y, 180, 42, 'F');

              doc.setTextColor(...brandPrimary);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(12);
              doc.text('II. CONTACTO DEL PROPIETARIO', 20, y + 8);

              doc.setDrawColor(...dividerColor);
              doc.line(20, y + 11, 190, y + 11);

              const contactFields = [
                ['Nombre Completo:', ownerAny.name],
                ['Correo Electrónico:', ownerAny.email],
                ['Teléfono Celular:', ownerAny.phone],
              ];

              doc.setFontSize(9);
              let contactY = y + 18;
              contactFields.forEach(([label, value]) => {
                doc.setTextColor(...darkSlate);
                doc.setFont('helvetica', 'bold');
                doc.text(label, 20, contactY);
                doc.setFont('helvetica', 'normal');
                doc.text(String(value), 72, contactY);
                contactY += 7;
              });

              // ▸ PIE DE PÁGINA CORPORATIVO
              const pageHeight = doc.internal.pageSize.getHeight();
              doc.setDrawColor(...accentGold);
              doc.line(15, pageHeight - 18, 195, pageHeight - 18);

              doc.setTextColor(150, 150, 150);
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7);
              doc.text('Este documento fue generado automáticamente por PROPIO — Plataforma Inmobiliaria de Bolivia.', 105, pageHeight - 13, { align: 'center' });
              doc.text('Documento confidencial. Prohibida su reproducción parcial o total sin autorización.', 105, pageHeight - 9, { align: 'center' });

              // Serializar PDF e inyectar en ruta explícita
              const pdfBlob = doc.output('arraybuffer');
              parentFolder.folder(`${propTitle}/1_informacion_de_la_casa`)!.file('Dossier_Comercial_Y_Legal.pdf', pdfBlob);
            } catch (err) {
              console.warn(`[ZIP] Error generating PDF for: ${propAny.title}`, err);
            }
          })()
        );

        // ── 3_imagenes: DESCARGA BINARIA DE GALERÍA VISUAL ──────────────
        const photos = propAny.media?.photos || (propAny.imageUrl ? [propAny.imageUrl] : (propAny.image ? [propAny.image] : []));
        photos.forEach((photoUrl: string, index: number) => {
          if (!photoUrl) return;
          allDownloadPromises.push(
            (async () => {
              try {
                const response = await fetch(photoUrl);
                if (response.ok) {
                  const blob = await response.blob();
                  parentFolder.folder(`${propTitle}/3_imagenes`)!.file(`foto_${index + 1}.jpg`, blob);
                }
              } catch (err) {
                console.warn(`[ZIP] Could not download photo: ${photoUrl}`, err);
              }
            })()
          );
        });

        // ── 2_documentacion_legal: DOCUMENTACIÓN REAL O FALLBACK GENERADO ─────────
        const uploadedDocs = propAny.media?.documents || propAny.legalFiles || propAny.documents || [];
        
        if (uploadedDocs && uploadedDocs.length > 0) {
          // El usuario subió documentos reales: hacerles fetch y guardarlos con su extensión original
          uploadedDocs.forEach((docItem: any, index: number) => {
            const docUrl = typeof docItem === 'string' ? docItem : (docItem.fileUrl || docItem.url || '');
            if (!docUrl) return;
            allDownloadPromises.push(
              (async () => {
                try {
                  const response = await fetch(docUrl);
                  if (response.ok) {
                    const blob = await response.blob();
                    const ext = pathExtname(docUrl) || '.pdf';
                    
                    // Nombres representativos para los documentos subidos
                    const docNames = [
                      '01_Certificado_Folio_Real_Subido',
                      '02_Plano_De_Lote_Y_Uso_Suelo_Subido',
                      '03_Comprobante_Impuestos_Subido'
                    ];
                    const fileName = docNames[index] || `04_Documento_Legal_${index + 1}`;
                    parentFolder.folder(`${propTitle}/2_documentacion_legal`)!.file(`${fileName}${ext}`, blob);
                  }
                } catch (err) {
                  console.warn(`[ZIP] Could not download uploaded document: ${docUrl}`, err);
                }
              })()
            );
          });
        } else {
          // No hay documentos reales subidos: Resguardo Profesional (Fallback) con generación en caliente
          
          // Certificado 1: Folio Real
          allDownloadPromises.push(
            (async () => {
              try {
                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.getHeight();
                
                // Membrete Oficial Bolivia
                doc.setFillColor(34, 139, 34); // Verde oscuro oficial
                doc.rect(0, 0, 210, 30, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('ESTADO PLURINACIONAL DE BOLIVIA', 105, 12, { align: 'center' });
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text('CONSEJO DE LA MAGISTRATURA - DIRECCIÓN NACIONAL DE DERECHOS REALES', 105, 18, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                doc.text('CERTIFICADO DE ALODIAL Y GRAVÁMENES', 105, 24, { align: 'center' });

                let y = 45;
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.text('CERTIFICADO DE INFORMACIÓN RÁPIDA (FOLIO REAL)', 15, y);
                doc.setDrawColor(200, 200, 200);
                doc.line(15, y + 2, 195, y + 2);

                const folioReal = propAny.legal?.folioReal || '3.01.1.01.0023451';
                const type = propAny.category || 'Casa';
                const ownerCi = ownerAny.ci || (propAny.owner && propAny.owner.ci) || '4891023 C.B.';
                const address = propAny.location?.address || propAny.address || 'No especificada';
                const city = propAny.location?.city || propAny.city || 'Cochabamba';

                y += 12;
                doc.setFontSize(9);
                const dataRows = [
                  ['MATRÍCULA COMPUTARIZADA:', folioReal],
                  ['TIPO DE INMUEBLE:', type.toUpperCase()],
                  ['UBICACIÓN POLÍTICA:', `${city.toUpperCase()} - BOLIVIA`],
                  ['DIRECCIÓN FÍSICA:', address.toUpperCase()],
                  ['PROPIETARIO REGISTRADO:', ownerAny.name.toUpperCase()],
                  ['CÉDULA DE IDENTIDAD:', ownerCi.toUpperCase()],
                  ['FECHA DE EMISIÓN:', new Date().toLocaleDateString('es-BO') + ' ' + new Date().toLocaleTimeString('es-BO')],
                ];

                dataRows.forEach(([label, val]) => {
                  doc.setFont('helvetica', 'bold');
                  doc.text(label, 15, y);
                  doc.setFont('helvetica', 'normal');
                  const textLines = doc.splitTextToSize(String(val), 120);
                  doc.text(textLines, 75, y);
                  y += Math.max(7, textLines.length * 5);
                });

                y += 5;
                // Recuadro de Gravámenes Destacado
                doc.setFillColor(240, 248, 240); // Verde clarito
                doc.setDrawColor(34, 139, 34);
                doc.rect(15, y, 180, 25, 'FD');

                doc.setTextColor(34, 139, 34);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('CERTIFICACIÓN DE GRAVÁMENES:', 25, y + 10);
                doc.setFontSize(11);
                doc.text('ESTADO DE GRAVÁMENES: LIBRE ALODIAL / SIN ASIENTOS VIGENTES', 25, y + 17);

                // Firmas e información al pie
                y = pageHeight - 40;
                doc.setDrawColor(200, 200, 200);
                doc.line(15, y, 195, y);
                
                doc.setTextColor(100, 100, 100);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                doc.text('Este documento es una simulación oficial de Derechos Reales certificada digitalmente por la plataforma PROPIO.', 105, y + 8, { align: 'center' });
                
                // Sello / Firma
                doc.setDrawColor(100, 100, 200);
                doc.circle(160, y + 20, 12);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6);
                doc.setTextColor(100, 100, 200);
                doc.text('D.D.R.R.', 160, y + 18, { align: 'center' });
                doc.text('COCHABAMBA', 160, y + 22, { align: 'center' });
                doc.text('BOLIVIA', 160, y + 24, { align: 'center' });

                const pdfBlob = doc.output('arraybuffer');
                parentFolder.folder(`${propTitle}/2_documentacion_legal`)!.file('01_Certificado_Folio_Real_Actualizado.pdf', pdfBlob);
              } catch (err) {
                console.warn(`[ZIP] Error generating Folio Real PDF for: ${propAny.title}`, err);
              }
            })()
          );

          // Certificado 2: Plano de Lote y Uso de Suelo
          allDownloadPromises.push(
            (async () => {
              try {
                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.getHeight();

                // Membrete Municipal
                doc.setFillColor(0, 51, 153); // Azul municipal
                doc.rect(0, 0, 210, 30, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('GOBIERNO AUTÓNOMO MUNICIPAL DE COCHABAMBA', 105, 12, { align: 'center' });
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text('DIRECCIÓN DE URBANISMO Y CATASTRO - DEPARTAMENTO DE EDIFICACIONES', 105, 18, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                doc.text('PLANO DE USO DE SUELO Y DELIMITACIÓN DE LOTE', 105, 24, { align: 'center' });

                let y = 45;
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.text('DATOS TÉCNICOS CATASTRALES', 15, y);
                doc.setDrawColor(200, 200, 200);
                doc.line(15, y + 2, 195, y + 2);

                const catastro = propAny.legal?.codigoCatastral || '14-023-045';
                const terrainArea = propAny.specs?.terrainArea || '350 m²';
                const front = propAny.specs?.frontage || '15 metros';
                const depth = propAny.specs?.depth || '25 metros';
                const zoning = propAny.specs?.zoning || 'Comercial de Alta Densidad (H8)';
                const lat = propAny.location?.coordinates?.lat ?? propAny.latitude ?? propAny.lat ?? -17.3895;
                const lng = propAny.location?.coordinates?.lng ?? propAny.longitude ?? propAny.lng ?? -66.1568;

                y += 12;
                doc.setFontSize(9);
                const dataRows = [
                  ['CÓDIGO CATASTRAL:', catastro.toUpperCase()],
                  ['SUPERFICIE DEL LOTE:', terrainArea.toUpperCase()],
                  ['FRENTE REGISTRADO:', front.toUpperCase()],
                  ['FONDO REGISTRADO:', depth.toUpperCase()],
                  ['ZONIFICACIÓN URBANA:', zoning.toUpperCase()],
                  ['COORDENADAS GEOGRÁFICAS:', `LATITUD: ${lat}, LONGITUD: ${lng}`],
                ];

                dataRows.forEach(([label, val]) => {
                  doc.setFont('helvetica', 'bold');
                  doc.text(label, 15, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(String(val), 75, y);
                  y += 8;
                });

                // Dibujar Plano Simplificado (Vectorial)
                y += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('REPRESENTACIÓN SIMPLIFICADA DE LA PARCELA', 15, y);
                doc.setDrawColor(0, 51, 153);
                doc.setLineWidth(0.5);
                
                // Rectángulo del lote
                const plotX = 75;
                const plotY = y + 10;
                const plotW = 60;
                const plotH = 45;
                doc.rect(plotX, plotY, plotW, plotH);
                
                // Etiquetas de colindancia sin rotación
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                doc.text('CALLE INGRESO (FRENTE)', plotX + plotW/2, plotY - 2, { align: 'center' });
                doc.text('COLINDANTE FONDO', plotX + plotW/2, plotY + plotH + 4, { align: 'center' });
                doc.text('LADO IZQ', plotX - 15, plotY + plotH/2);
                doc.text('LADO DER', plotX + plotW + 2, plotY + plotH/2);
                
                // Mostrar dimensiones en el dibujo
                doc.setTextColor(0, 51, 153);
                doc.setFont('helvetica', 'bold');
                doc.text(front, plotX + plotW/2, plotY + 6, { align: 'center' });
                doc.text(depth, plotX + 4, plotY + plotH/2);

                // Pie de página
                y = pageHeight - 30;
                doc.setDrawColor(200, 200, 200);
                doc.line(15, y, 195, y);
                doc.setTextColor(120, 120, 120);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                doc.text('Este documento es una simulación del plano catastral provisto por el Municipio de Cochabamba para PROPIO.', 105, y + 6, { align: 'center' });

                const pdfBlob = doc.output('arraybuffer');
                parentFolder.folder(`${propTitle}/2_documentacion_legal`)!.file('02_Plano_De_Lote_Y_Uso_Suelo.pdf', pdfBlob);
              } catch (err) {
                console.warn(`[ZIP] Error generating Plano de Lote PDF for: ${propAny.title}`, err);
              }
            })()
          );

          // Certificado 3: Comprobante de Impuestos Al Día
          allDownloadPromises.push(
            (async () => {
              try {
                const doc = new jsPDF();
                const pageHeight = doc.internal.pageSize.getHeight();

                // Membrete RUAT
                doc.setFillColor(102, 51, 0); // Café/Oscuro fiscal
                doc.rect(0, 0, 210, 30, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text('SISTEMA DE REGISTRO ÚNICO PARA LA ADMINISTRACIÓN TRIBUTARIA MUNICIPAL', 105, 10, { align: 'center' });
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text('RECAUDACIONES TRIBUTARIAS - GOBIERNO MUNICIPAL DE COCHABAMBA', 105, 16, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                doc.text('CERTIFICADO DE PAGO DE IMPUESTOS AL BIEN INMUEBLE', 105, 23, { align: 'center' });

                let y = 45;
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.text('RESUMEN DE PAGO DE LA PROPIEDAD', 15, y);
                doc.setDrawColor(200, 200, 200);
                doc.line(15, y + 2, 195, y + 2);

                const catastro = propAny.legal?.codigoCatastral || '14-023-045';
                const price = propAny.price || 0;
                const baseImponible = price * 0.45;
                const taxAmount = baseImponible * 0.015; // 1.5% de tasa impositiva
                const ownerCi = ownerAny.ci || (propAny.owner && propAny.owner.ci) || '4891023 C.B.';
                const taxId = ownerAny.taxId || (propAny.owner && propAny.owner.taxId) || 'NIT-4891023011';

                y += 12;
                doc.setFontSize(9);
                const dataRows = [
                  ['RAZÓN SOCIAL / CONTRIBUYENTE:', ownerAny.name.toUpperCase()],
                  ['CÉDULA DE IDENTIDAD / NIT:', `${ownerCi} / ${taxId}`],
                  ['PADRÓN O CÓDIGO CATASTRAL:', catastro.toUpperCase()],
                  ['BASE IMPONIBLE CALCULADA:', `$${baseImponible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`],
                  ['IMPUESTO LIQUIDADO (EXIGIBLE):', `$${taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`],
                  ['GESTIÓN TRIBUTARIA EXIGIBLE:', '2025'],
                  ['ESTADO DE LA GESTIÓN:', 'PAGADO EN FECHA 15 DE ENERO DE 2026'],
                ];

                dataRows.forEach(([label, val]) => {
                  doc.setFont('helvetica', 'bold');
                  doc.text(label, 15, y);
                  doc.setFont('helvetica', 'normal');
                  doc.text(String(val), 80, y);
                  y += 8;
                });

                // Sello digital o código QR simulado
                y += 10;
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(1);
                
                // Contenedor QR
                const qrSize = 35;
                const qrX = 15;
                const qrY = y;
                doc.rect(qrX, qrY, qrSize, qrSize);
                
                // Dibujar un patrón simulado de QR
                doc.setFillColor(0, 0, 0);
                // Esquinas de alineación del QR
                doc.rect(qrX + 2, qrY + 2, 8, 8);
                doc.rect(qrX + qrSize - 10, qrY + 2, 8, 8);
                doc.rect(qrX + 2, qrY + qrSize - 10, 8, 8);
                // Espacios en blanco internos de las esquinas
                doc.setFillColor(255, 255, 255);
                doc.rect(qrX + 4, qrY + 4, 4, 4);
                doc.rect(qrX + qrSize - 8, qrY + 4, 4, 4);
                doc.rect(qrX + 4, qrY + qrSize - 8, 4, 4);
                // Centros negros de las esquinas
                doc.setFillColor(0, 0, 0);
                doc.rect(qrX + 5, qrY + 5, 2, 2);
                doc.rect(qrX + qrSize - 7, qrY + 5, 2, 2);
                doc.rect(qrX + 5, qrY + qrSize - 7, 2, 2);

                // Dibujar puntitos y patrones aleatorios deterministas del QR
                for (let col = 0; col < 10; col++) {
                  for (let row = 0; row < 10; row++) {
                    // Omitir zonas de esquinas de alineación
                    if ((col < 3 && row < 3) || (col > 6 && row < 3) || (col < 3 && row > 6)) continue;
                    
                    // Generar un patrón determinista
                    const pseudoRandom = Math.abs(Math.sin((col + 1) * 37 + (row + 1) * 59)) > 0.5;
                    if (pseudoRandom) {
                      doc.rect(qrX + 3 * col + 3, qrY + 3 * row + 3, 3, 3, 'F');
                    }
                  }
                }

                // Texto explicativo del QR
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(80, 80, 80);
                doc.text('CÓDIGO DE VALIDACIÓN DIGITAL RUAT-BOLIVIA', qrX + qrSize + 5, qrY + 12);
                doc.text('Escanee para verificar autenticidad en el portal tributario.', qrX + qrSize + 5, qrY + 18);
                doc.text(`HASH: RUAT-BOL-${catastro}-2025-OK`, qrX + qrSize + 5, qrY + 24);

                // Pie de página
                y = pageHeight - 30;
                doc.setDrawColor(200, 200, 200);
                doc.line(15, y, 195, y);
                doc.setTextColor(120, 120, 120);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                doc.text('Comprobante emitido de forma digital por el RUAT bajo reglamentación vigente. Simulación autorizada para PROPIO.', 105, y + 6, { align: 'center' });

                const pdfBlob = doc.output('arraybuffer');
                parentFolder.folder(`${propTitle}/2_documentacion_legal`)!.file('03_Comprobante_Impuestos_Al_Dia.pdf', pdfBlob);
              } catch (err) {
                console.warn(`[ZIP] Error generating tax payment PDF for: ${propAny.title}`, err);
              }
            })()
          );
        }
      }

      // 4. GESTIÓN DE ERRORES Y DESCARGA AUTOMÁTICA
      await Promise.all(allDownloadPromises);

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      const cleanOwnerName = owner.name.trim().replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
      const zipFileName = `CARTERA_PROPIEDADES_${cleanOwnerName}.zip`;

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      alert('Error al exportar la cartera de propiedades: ' + (err.message || err));
    } finally {
      setLoadingOwnerZip(null);
    }
  };

  const handleDownloadFullPropertyZip = async (property: Property) => {
    setProcessingZipId(property.id);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // 1. Root data file: datos_propiedad.json
      const propMetadata = {
        id: property.id,
        title: property.title,
        priceUSD: property.price,
        location: {
          address: property.location?.address || property.address || '',
          city: property.location?.city || 'Cochabamba',
          coordinates: {
            lat: property.location?.coordinates?.lat ?? property.latitude ?? property.lat ?? -17.3895,
            lng: property.location?.coordinates?.lng ?? property.longitude ?? property.lng ?? -66.1568,
          }
        },
        owner: {
          name: property.owner?.name || property.ownerName || 'Propietario Independiente',
          email: property.owner?.email || 'propietario@mail.com',
          phone: property.owner?.phone || '+591 700 00000',
        },
        description: property.description || '',
        type: property.type || 'casa',
        status: property.status || 'NUEVA_PUBLICACION',
        area: property.area || 0,
        rooms: property.rooms || 0,
        bathrooms: property.bathrooms || 0,
      };

      zip.file('datos_propiedad.json', JSON.stringify(propMetadata, null, 2));

      // 2. Photos download
      const photos = property.media?.photos || (property.imageUrl ? [property.imageUrl] : []);
      const photoPromises = photos.map(async (photoUrl, index) => {
        if (!photoUrl) return;
        try {
          const absoluteUrl = photoUrl.startsWith('http') ? photoUrl : `${window.location.origin}${photoUrl}`;
          const response = await fetch(absoluteUrl);
          if (response.ok) {
            const blob = await response.blob();
            zip.folder("fotos")!.file(`foto_${index + 1}.jpg`, blob);
          }
        } catch (err) {
          console.warn(`Could not download photo for zip: ${photoUrl}`, err);
        }
      });

      // 3. Documents download
      const documents: any[] = property.media?.documents || (property.documents || []);
      const docPromises = documents.map(async (doc, index) => {
        const docUrl = typeof doc === 'string' ? doc : (doc.fileUrl || doc.url || '');
        if (!docUrl) return;
        try {
          const absoluteUrl = docUrl.startsWith('http') ? docUrl : `${window.location.origin}${docUrl}`;
          const response = await fetch(absoluteUrl);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = docUrl.split('/').pop() || `documento_${index + 1}.pdf`;
            zip.folder("documentos")!.file(fileName, blob);
          }
        } catch (err) {
          console.warn(`Could not download document for zip: ${docUrl}`, err);
        }
      });

      // Wait for all downloads to finish concurrently
      await Promise.all([
        ...photoPromises,
        ...docPromises
      ]);

      // Generate Zip content
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      // Clean and format ZIP filename using real property data: [ID]_[TITULO-INMUEBLE]_[CIUDAD].zip
      const sanitizeFilenamePart = (str: string) => {
        if (!str) return 'sin-nombre';
        return str
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[\\/:*?"<>|]/g, ''); // Remove forbidden filename characters
      };

      const cleanTitle = sanitizeFilenamePart(property.title || 'Inmueble');
      const cleanCity = sanitizeFilenamePart(property.location?.city || 'Cochabamba');
      const zipFileName = `${property.id}_${cleanTitle}_${cleanCity}.zip`;

      // Trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      alert('Error al generar el archivo comprimido de la propiedad: ' + (err.message || err));
    } finally {
      setProcessingZipId(null);
    }
  };

  const handleApproveProperty = async (id: string) => {
    try {
      const token = getToken() || '';
      await propertiesService.approveProperty(id, token).catch(err => {
        console.warn('Backend approve failed, performing local approve only:', err);
      });
      const updated = properties.map(p => p.id === id ? { ...p, status: 'APROBADO', isVerified: true, verified: true } : p);
      setProperties(updated);
      alert('Propiedad aprobada oficialmente para aparecer en el marketplace de clientes.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al aprobar la propiedad.');
    }
  };

  const handleModerateCustomProperty = async (id: string, newStatus: string) => {
    try {
      const target = properties.find(p => p.id === id);
      if (!target) return;

      const updatedTarget = {
        ...target,
        status: newStatus,
        verified: newStatus === 'APROBADO',
        isVerified: newStatus === 'APROBADO'
      };

      // Realizar la petición PUT de sincronización transaccional al servidor local (Next.js db.json)
      const res = await fetch(`/api/local/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTarget)
      });

      if (!res.ok) {
        throw new Error('No se pudo guardar la moderación en el servidor local.');
      }

      // También sincronizar con el backend central de NestJS en paralelo
      try {
        const token = getToken() || '';
        if (newStatus === 'APROBADO') {
          await propertiesService.approveProperty(id, token);
        } else {
          await propertiesService.updatePropertyStatus(id, newStatus, undefined, token);
        }
      } catch (backendErr) {
        console.warn('[Admin] Falló la sincronización transaccional con el backend central NestJS (continuando localmente):', backendErr);
      }

      // Una vez que el servidor confirma la escritura exitosa en disco, actualizamos la UI y el almacenamiento local
      // 1. Mutar en propio_custom_created_properties
      const customRaw = localStorage.getItem('propio_custom_created_properties');
      if (customRaw) {
        const customProps = JSON.parse(customRaw);
        if (Array.isArray(customProps)) {
          const updatedCustom = customProps.map(p => 
            p.id === id ? updatedTarget : p
          );
          localStorage.setItem('propio_custom_created_properties', JSON.stringify(updatedCustom));
        }
      }

      // 2. Mutar en el estado local de propiedades
      const updatedList = properties.map(p => 
        p.id === id ? updatedTarget : p
      );
      setProperties(updatedList);

      // 3. Notificar
      alert(`Propiedad ha sido marcada como ${newStatus} exitosamente.`);
    } catch (err: any) {
      console.error('Error moderating custom property:', err);
      alert(err.message || 'Error al moderar la propiedad en el servidor local.');
    }
  };

  const parseDescription = (desc: string) => {
    const landMatch = desc.match(/Superficie Terreno:\s*(\d+)/);
    const builtMatch = desc.match(/Superficie Construida:\s*(\d+)/);
    const zonaMatch = desc.match(/Zona:\s*([^\n]+)/);
    const attrsMatch = desc.match(/Atributos:\s*([^\n]+)/);

    const landArea = landMatch ? landMatch[1] : '';
    const builtArea = builtMatch ? builtMatch[1] : '';
    const zona = zonaMatch ? zonaMatch[1] : '';
    const attrsList = attrsMatch ? attrsMatch[1].split(',').map(s => s.trim()) : [];

    const cleanDesc = desc
      .replace(/Atributos: [^\n]+/g, '')
      .replace(/Superficie Terreno: [^\n]+/g, '')
      .replace(/Superficie Construida: [^\n]+/g, '')
      .replace(/Zona: [^\n]+/g, '')
      .trim();

    return { landArea, builtArea, zona, cleanDesc, attrsList };
  };

  const handleStartEdit = (prop: any) => {
    const parsed = parseDescription(prop.description || '');
    const attrsMap: Record<string, boolean> = {};
    parsed.attrsList.forEach(a => {
      attrsMap[a] = true;
    });

    setEditingProperty(prop);
    setEditTitle(prop.title || '');
    setEditDescription(parsed.cleanDesc || '');
    setEditCurrency(prop.currency || 'BOB');
    setEditPriceBOB(String(prop.priceBob || (prop.price * 9.76)));
    setEditPriceUSD(String(prop.price || (prop.priceBob / 9.76)));
    setEditExchangeRate('9.76');
    setEditLandArea(parsed.landArea);
    setEditBuiltArea(parsed.builtArea);
    setEditZona(parsed.zona);
    setEditAttributes(attrsMap);
    setEditImages(prop.imageUrl ? [prop.imageUrl] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80']);
    setEditDocuments(prop.documents || []);
  };

  const packagedFormData = {
    title: editTitle,
    description: editDescription,
    currency: editCurrency,
    exchangeRate: editExchangeRate,
    priceBOB: editPriceBOB,
    priceUSD: editPriceUSD,
    minPrice: editingProperty?.minPrice ? String(editingProperty.minPrice) : '',
    offerType: editingProperty?.offerType || 'VENTA',
    type: editingProperty?.type || 'DEPARTAMENTO',
    landArea: editLandArea,
    builtArea: editBuiltArea,
    rooms: editingProperty?.rooms ? String(editingProperty.rooms) : '3',
    bathrooms: editingProperty?.bathrooms ? String(editingProperty.bathrooms) : '2',
    location: editingProperty?.location || 'Cochabamba',
    zona: editZona,
    address: editingProperty?.address || '',
    latitude: editingProperty?.latitude || -17.3895,
    longitude: editingProperty?.longitude || -66.1568,
  };

  const handleFormFieldsChange = (updates: Partial<typeof packagedFormData>) => {
    if (updates.title !== undefined) setEditTitle(updates.title);
    if (updates.description !== undefined) setEditDescription(updates.description);
    if (updates.currency !== undefined) setEditCurrency(updates.currency);
    if (updates.exchangeRate !== undefined) setEditExchangeRate(String(updates.exchangeRate));
    if (updates.priceBOB !== undefined) setEditPriceBOB(String(updates.priceBOB));
    if (updates.priceUSD !== undefined) setEditPriceUSD(String(updates.priceUSD));
    if (updates.landArea !== undefined) setEditLandArea(String(updates.landArea));
    if (updates.builtArea !== undefined) setEditBuiltArea(String(updates.builtArea));
    if (updates.zona !== undefined) setEditZona(updates.zona);
    
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        ...updates
      } as any);
    }
  };

  const documentsChecklist = {
    hasFolioReal: !!editingProperty?.hasFolioReal,
    hasCatastro: !!editingProperty?.hasCatastro,
    hasTestimonio: !!editingProperty?.hasTestimonio,
    hasImpuestosAlDia: !!editingProperty?.hasImpuestosAlDia,
    hasPlanoUsoSuelo: !!editingProperty?.hasPlanoUsoSuelo,
    hasCI: !!editingProperty?.hasCI,
  };

  const handleUpdateDocuments = (updates: Partial<typeof documentsChecklist>) => {
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        ...updates
      });
    }
  };

  const toggleAttribute = (attr: string) => {
    setEditAttributes(prev => ({
      ...prev,
      [attr]: !prev[attr]
    }));
  };

  const handleAddImage = () => {
    const newImg = prompt('Ingresa la URL de la nueva fotografía:');
    if (newImg && newImg.startsWith('http')) {
      setEditImages(prev => [...prev, newImg]);
    } else if (newImg) {
      alert('Por favor ingresa una URL válida que empiece con http/https');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // [LOGICA_MANEJO_DOCUMENTACION_Y_MUTACIONES]

  /** Adjunta documentos legales al estado local — valida PDF/PNG/JPG y límite 10 MB */
  const handleAdjuntarDocumento = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const ALLOWED: Record<string, string> = {
      'application/pdf': 'PDF',
      'image/jpeg': 'JPG',
      'image/png': 'PNG',
    };
    Array.from(files).forEach((file) => {
      if (!ALLOWED[file.type]) {
        alert(`Formato "${file.type}" no permitido. Solo PDF, PNG o JPG.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`"${file.name}" supera el límite de 10 MB.`);
        return;
      }
      setEditDocumentosAdjuntos((prev) => [
        ...prev,
        { id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`, file, nombre: file.name, tipo: ALLOWED[file.type] },
      ]);
    });
  };

  /** Elimina un documento del array local antes de confirmar cambios */
  const handleEliminarDocumento = (id: string) => {
    setEditDocumentosAdjuntos((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProperty || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    if (!allowedTypes.includes(file.type)) {
      alert('Formato no soportado. Por favor sube archivos PDF, Word (.doc/.docx) o imágenes (JPG/PNG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el tamaño máximo de 10 MB.');
      return;
    }

    try {
      setIsUploadingDoc(true);
      const token = getToken() || '';
      const doc = await propertiesService.uploadPropertyDocument(editingProperty.id, file, token);
      setEditDocuments(prev => [...prev, doc]);
      
      const updated = properties.map(p =>
        p.id === editingProperty.id
          ? { ...p, documents: [...(p.documents || []), doc] }
          : p
      );
      setProperties(updated);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error de red';
      alert(`Error al subir el archivo: ${msg}`);
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!editingProperty) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      const token = getToken() || '';
      await propertiesService.deletePropertyDocument(docId, token);
      setEditDocuments(prev => prev.filter(d => d.id !== docId));
      
      const updated = properties.map(p =>
        p.id === editingProperty.id
          ? { ...p, documents: (p.documents || []).filter((d: Record<string, string>) => d.id !== docId) }
          : p
      );
      setProperties(updated);
    } catch (err: unknown) {
      console.error(err);
      alert('Ocurrió un error al eliminar el documento.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingProperty) return;

    setIsSavingEdit(true);

    try {
      const activeAttrs = Object.keys(editAttributes).filter(k => editAttributes[k]);
      const attrsText = activeAttrs.length > 0 ? `\n\nAtributos: ${activeAttrs.join(', ')}` : '';
      const areaText = `\nSuperficie Terreno: ${editLandArea || 0} m²\nSuperficie Construida: ${editBuiltArea || 0} m²`;
      const zonaText = editZona ? `\nZona: ${editZona}` : '';
      // [ESTRUCTURA_REGLA_NEGOCIO] — pack sostenibilidad y documentos adjuntos locales
      const sostenibilidadText = Object.entries(editSostenibilidad)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ');
      const sostenibilidadNote = sostenibilidadText ? `\nSostenibilidad: ${sostenibilidadText}` : '';

      const updatedFields = {
        title: editTitle,
        description: editDescription + attrsText + areaText + zonaText + sostenibilidadNote,
        price: parseFloat(editPriceUSD) || 0,
        priceBob: parseFloat(editPriceBOB) || 0,
        currency: editCurrency,
        area: parseFloat(editBuiltArea) || parseFloat(editLandArea) || 0,
        imageUrl: editImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        rooms: editingProperty.rooms ? parseInt(String(editingProperty.rooms)) : 3,
        bathrooms: editingProperty.bathrooms ? parseInt(String(editingProperty.bathrooms)) : 2,
        location: editingProperty.location,
        address: editingProperty.address,
        offerType: editingProperty.offerType,
        type: editingProperty.type,
        latitude: parseFloat(String(editingProperty.latitude)) || -17.3895,
        longitude: parseFloat(String(editingProperty.longitude)) || -66.1568,
        hasFolioReal: !!editingProperty.hasFolioReal,
        hasCatastro: !!editingProperty.hasCatastro,
        hasTestimonio: !!editingProperty.hasTestimonio,
        hasImpuestosAlDia: !!editingProperty.hasImpuestosAlDia,
        hasPlanoUsoSuelo: !!editingProperty.hasPlanoUsoSuelo,
        hasCI: !!editingProperty.hasCI,
        minPrice: editingProperty.minPrice ? parseFloat(String(editingProperty.minPrice)) : null,
        // Sostenibilidad empaquetada
        sostenibilidad: { ...editSostenibilidad },
        // Documentos adjuntos locales (nombres para auditoría)
        documentosAdjuntosNombres: editDocumentosAdjuntos.map((d) => d.nombre),
      };

      const token = getToken() || '';
      const res = await propertiesService.updateProperty(editingProperty.id, updatedFields, token);

      const updated = properties.map(p =>
        p.id === editingProperty.id
          ? mapPropertyToNewSchema({ ...p, ...res.data, ...updatedFields })
          : p
      );
      setProperties(updated);
      await persistProperty(mapPropertyToNewSchema({ ...editingProperty, ...updatedFields }));

      setEditingProperty(null);
      setEditDocumentosAdjuntos([]);
      alert('Propiedad actualizada con éxito.');
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al guardar los cambios.';
      alert(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveModalProperty = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!modalPropertyData) return;

    try {
      const token = getToken() || '';
      const updatedFields = {
        title: modalPropertyData.title,
        description: modalPropertyData.description || '',
        price: Number(modalPropertyData.price) || 0,
        priceBob: modalPropertyData.price * 9.76,
        area: Number(modalPropertyData.area) || 0,
        rooms: Number(modalPropertyData.rooms) || 0,
        bathrooms: Number(modalPropertyData.bathrooms) || 0,
        location: {
          address: modalPropertyData.location.address || '',
          city: modalPropertyData.location.city || '',
          coordinates: {
            lat: Number(modalPropertyData.location.coordinates.lat) || 0,
            lng: Number(modalPropertyData.location.coordinates.lng) || 0,
          }
        },
        media: {
          photos: modalPropertyData.media.photos || [],
          documents: modalPropertyData.media.documents || []
        },
        owner: {
          name: modalPropertyData.owner.name || '',
          phone: modalPropertyData.owner.phone || '',
          email: modalPropertyData.owner.email || ''
        },
        type: modalPropertyData.type || 'casa',
        status: modalPropertyData.status || 'PENDIENTE',
        isVerified: modalPropertyData.isVerified || false,
        verified: modalPropertyData.verified || false,
        hasFolioReal: !!modalPropertyData.hasFolioReal,
        hasCatastro: !!modalPropertyData.hasCatastro,
        hasTestimonio: !!modalPropertyData.hasTestimonio,
      };

      let finalUpdatedProp: Property = mapPropertyToNewSchema({ ...modalPropertyData, ...updatedFields });

      if (!modalPropertyData.id.startsWith('prop-mock-') && !modalPropertyData.id.startsWith('fallback-')) {
        const backendPayload = {
          title: updatedFields.title,
          description: updatedFields.description,
          price: updatedFields.price,
          area: updatedFields.area,
          rooms: updatedFields.rooms,
          bathrooms: updatedFields.bathrooms,
          location: `${updatedFields.location.address}, ${updatedFields.location.city}`,
          lat: updatedFields.location.coordinates.lat,
          lng: updatedFields.location.coordinates.lng,
          type: updatedFields.type.toUpperCase(),
          status: updatedFields.status,
          ownerName: updatedFields.owner.name,
          hasFolioReal: updatedFields.hasFolioReal,
          hasCatastro: updatedFields.hasCatastro,
          hasTestimonio: updatedFields.hasTestimonio,
        };
        const res = await propertiesService.updateProperty(modalPropertyData.id, backendPayload as any, token).catch(err => {
          console.warn('Backend update failed, updating locally only:', err);
          return { data: finalUpdatedProp };
        });
        if (res && res.data) {
          finalUpdatedProp = mapPropertyToNewSchema(res.data);
        } else if (res) {
          finalUpdatedProp = mapPropertyToNewSchema(res);
        }
      }

      // 1. Update list of properties
      const updatedProperties = properties.map(p => 
        p.id === modalPropertyData.id ? finalUpdatedProp : p
      );
      setProperties(updatedProperties as any);
      await persistProperty(finalUpdatedProp);

      // 2. Update owner's properties relation if title changed
      if (selectedProperty && selectedProperty.title !== modalPropertyData.title) {
        const updatedOwners = owners.map(own => {
          if (own.properties.some(pName => pName.toLowerCase() === selectedProperty.title.toLowerCase())) {
            return {
              ...own,
              properties: own.properties.map(pName => 
                pName.toLowerCase() === selectedProperty.title.toLowerCase() ? modalPropertyData.title : pName
              )
            };
          }
          return own;
        });
        setOwners(updatedOwners);
        if (typeof window !== 'undefined') {
          localStorage.setItem('propio_admin_owners', JSON.stringify(updatedOwners));
        }
      }

      setIsPropertyModalOpen(false);
      setSelectedProperty(null);
      setModalPropertyData(null);
      alert('Ficha del inmueble guardada con éxito.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar la ficha del inmueble');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    const prop = properties.find(p => p.id === id);
    const title = prop ? prop.title : 'este inmueble';
    if (!confirm(`¿Estás seguro de eliminar permanentemente la propiedad "${title}"? Esta acción no se puede deshacer`)) {
      return;
    }
    try {
      const token = getToken() || '';
      await propertiesService.deleteProperty(id, token).catch(err => {
        console.warn('Backend delete failed, performing local delete only:', err);
      });
      
      if (typeof window !== 'undefined') {
        const deletedStored = localStorage.getItem('propio_admin_deleted_properties');
        const deletedIds: string[] = deletedStored ? JSON.parse(deletedStored) : [];
        if (!deletedIds.includes(id)) {
          deletedIds.push(id);
          localStorage.setItem('propio_admin_deleted_properties', JSON.stringify(deletedIds));
        }

        // Marcar como status: 'eliminado' en el almacenamiento de propiedades personalizadas
        const customPropsRaw = localStorage.getItem('propio_custom_created_properties');
        if (customPropsRaw) {
          try {
            const list = JSON.parse(customPropsRaw);
            if (Array.isArray(list)) {
              const updatedCustom = list.map(p => 
                p.id === id ? { ...p, status: 'eliminado' } : p
              );
              localStorage.setItem('propio_custom_created_properties', JSON.stringify(updatedCustom));
            }
          } catch (_) {}
        }
      }

      const updated = properties.filter(p => p.id !== id);
      setProperties(updated);
      // ── BORRADO PERMANENTE EN db.json via helper blindado ──
      deleteLocalProperty(id).catch(e => console.warn('[localDb] deleteLocalProperty error:', e));

      alert('Propiedad eliminada de forma permanente y física.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al eliminar la propiedad.');
    }
  };

  const handleViewDocument = async (propertyId: string, docType: string, docName: string) => {
    try {
      setPreviewDocTitle(`${docName} - Propiedad (Ref: ${propertyId.substring(0, 8)})`);
      setAuditPropertyId(propertyId);
      setAuditDocType(docType);
      setIsRejectingDoc(false);

      const token = getToken() || '';
      const docResponse = await apiClient.getWithAuth<any>(`/properties/${propertyId}/documents`, token).catch(() => null);
      const matchedDoc = docResponse?.find((d: any) => d.fileType?.toUpperCase() === docType.toUpperCase());
      
      if (matchedDoc?.fileUrl) {
        setPreviewDocUrl(matchedDoc.fileUrl);
        setAuditDocObservations(matchedDoc.observations || '');
      } else {
        const p = properties.find(x => x.id === propertyId);
        if (p?.id?.startsWith('PROP-CUSTOM-') && p?.documents) {
          const docInProp = p.documents.find((d: any) => {
            const name = String(d.name || '').toUpperCase();
            if (docType === 'FR') return name.includes('FOLIO');
            if (docType === 'CT') return name.includes('CATASTRAL');
            if (docType === 'TS') return name.includes('TESTIMONIO') || name.includes('ESCRITURA');
            if (docType === 'IM') return name.includes('IMPUESTOS');
            if (docType === 'CI' || docType === 'PL') return name.includes('PLANO') || name.includes('CEDULA') || name.includes('CÉDULA');
            return false;
          });
          if (docInProp?.file) {
            setPreviewDocUrl(docInProp.file);
            setAuditDocObservations(docInProp.observations || '');
          } else {
            setPreviewDocUrl('');
            setAuditDocObservations('');
          }
        } else {
          const docInProp = p?.documents?.find((d: any) => d.fileType?.toUpperCase() === docType.toUpperCase());
          if (docInProp?.fileUrl) {
            setPreviewDocUrl(docInProp.fileUrl);
            setAuditDocObservations(docInProp.observations || '');
          } else {
            setPreviewDocUrl('');
            setAuditDocObservations('');
          }
        }
      }
    } catch (e) {
      console.error(e);
      setPreviewDocUrl('');
      setAuditDocObservations('');
    }
  };

  const handleOpenContractDocAudit = async (cnt: any) => {
    setDocAuditPropId(cnt.id);
    setDocAuditPropTitle(`Contrato: ${cnt.id.substring(0, 8).toUpperCase()} - ${cnt.property?.title || cnt.propertyId}`);
    setDocAuditLoading(true);
    setDocAuditExpanded(false);
    setDocAuditOpen(true);
    setActiveAuditIdx(0);
    try {
      const token = getToken() || '';
      const docs = await contractsService.getContractDocuments(cnt.id, token).catch(() => []);
      
      const rigidDocs = [
        { id: 'CONTRATO_FIRMADO', name: "Contrato de Alquiler Firmado", desc: "Documento legal del contrato firmado por ambas partes.", checked: false, file: null as string | null },
        { id: 'ADENDA', name: "Adenda o Anexo del Contrato", desc: "Documento de adenda, inventario o garantías adicionales.", checked: false, file: null as string | null },
        { id: 'BOLETA_GARANTIA', name: "Boleta de Depósito de Garantía", desc: "Comprobante de pago o transferencia del depósito en garantía.", checked: false, file: null as string | null },
        { id: 'OTROS', name: "Otros Documentos", desc: "Cualquier otro documento o anexo legal adjunto al contrato.", checked: false, file: null as string | null }
      ];

      rigidDocs.forEach(item => {
        const match = docs.find((d: any) => 
          String(d.originalName || d.name || d.fileType || '').toUpperCase().includes(item.name.substring(0, 10).toUpperCase()) ||
          String(d.fileType || '').toUpperCase() === item.id.toUpperCase()
        );
        if (match) {
          item.checked = true;
          item.file = match.dataBase64 || match.fileUrl || match.file || null;
          (item as any).fileType = match.fileType ?? '';
          (item as any).fileName = match.originalName ?? match.fileName ?? '';
          (item as any).status = match.status ?? 'APPROVED';
          (item as any).observations = match.observations ?? '';
          (item as any).docId = match.id;
        }
      });

      docs.forEach((d: any) => {
        const isRigid = rigidDocs.some(rid => 
          String(d.fileType || '').toUpperCase() === rid.id.toUpperCase() ||
          String(d.originalName || d.name || d.fileType || '').toUpperCase().includes(rid.name.substring(0, 10).toUpperCase())
        );
        if (!isRigid) {
          (rigidDocs as any[]).push({
            id: d.id || `extra-${Date.now()}-${Math.random()}`,
            name: d.originalName || d.name || 'Documento adicional',
            desc: 'Documento adicional subido al contrato.',
            checked: true,
            file: d.dataBase64 || d.fileUrl || d.file || null,
            fileType: d.fileType || 'application/pdf',
            fileName: d.originalName || d.name || 'Documento adicional',
            status: d.status || 'APPROVED',
            observations: d.observations || '',
            docId: d.id
          });
        }
      });

      setDocAuditRows(
        rigidDocs.map((d: any) => ({
          id: d.docId || d.id,
          fileType: d.fileType || d.id,
          fileName: d.fileName || d.name,
          fileUrl: d.file || '',
          status: d.status || 'APPROVED',
          observations: d.observations || (d.file ? '' : 'No subió ningún documento'),
          rejectOpen: false,
          rejectText: d.observations || '',
          saving: false,
          checked: d.checked,
          file: d.file,
          description: d.desc
        }))
      );
    } catch (e) {
      console.error(e);
      setDocAuditRows([]);
    } finally {
      setDocAuditLoading(false);
    }
  };

  const handleOpenDeveloperDocAudit = async (dev: any) => {
    setDocAuditPropId(dev.id);
    setDocAuditPropTitle(`Constructora: ${dev.empresa}`);
    setDocAuditLoading(true);
    setDocAuditExpanded(false);
    setDocAuditOpen(true);
    setActiveAuditIdx(0);
    try {
      const cached = localStorage.getItem(`propio_developer_documents_${dev.id}`);
      const docs = cached ? JSON.parse(cached) : [];

      const rigidDocs = [
        { id: 'NIT', name: "Número de Identificación Tributaria (NIT)", desc: "Copia legalizada del NIT de la constructora.", checked: false, file: null as string | null },
        { id: 'FUNDEMPRESA', name: "Matrícula de Fundempresa / SEPREC", desc: "Matrícula de comercio vigente de la sociedad comercial.", checked: false, file: null as string | null },
        { id: 'PLANOS', name: "Planos Aprobados de Obra / Proyecto", desc: "Planos municipales de construcción autorizados.", checked: false, file: null as string | null },
        { id: 'LICENCIA_AMBIENTAL', name: "Licencia o Ficha Ambiental", desc: "Certificado de cumplimiento ambiental del proyecto.", checked: false, file: null as string | null },
        { id: 'REPRESENTANTE_CI', name: "CI de Representante Legal", desc: "Copia legible de Cédula de Identidad del representante.", checked: false, file: null as string | null },
        { id: 'OTROS', name: "Otros Requisitos", desc: "Documentos legales complementarios.", checked: false, file: null as string | null }
      ];

      rigidDocs.forEach(item => {
        const match = docs.find((d: any) => 
          String(d.name || d.fileType || '').toUpperCase().includes(item.name.substring(0, 10).toUpperCase()) ||
          String(d.fileType || '').toUpperCase() === item.id.toUpperCase()
        );
        if (match) {
          item.checked = true;
          item.file = match.file || match.fileData || match.fileUrl || null;
          (item as any).fileType = match.fileType ?? '';
          (item as any).fileName = match.name ?? '';
          (item as any).status = match.status ?? 'APPROVED';
          (item as any).observations = match.observations ?? '';
          (item as any).docId = match.id;
        }
      });

      docs.forEach((d: any) => {
        const isRigid = rigidDocs.some(rid => 
          String(d.fileType || '').toUpperCase() === rid.id.toUpperCase() ||
          String(d.name || d.fileType || '').toUpperCase().includes(rid.name.substring(0, 10).toUpperCase())
        );
        if (!isRigid) {
          (rigidDocs as any[]).push({
            id: d.id || `extra-${Date.now()}-${Math.random()}`,
            name: d.name || 'Documento adicional',
            desc: 'Documento adicional subido.',
            checked: true,
            file: d.file || d.fileData || d.fileUrl || null,
            fileType: d.fileType || 'application/pdf',
            fileName: d.name || 'Documento adicional',
            status: d.status || 'APPROVED',
            observations: d.observations || '',
            docId: d.id
          });
        }
      });

      setDocAuditRows(
        rigidDocs.map((d: any) => ({
          id: d.docId || d.id,
          fileType: d.fileType || d.id,
          fileName: d.fileName || d.name,
          fileUrl: d.file || '',
          status: d.status || 'APPROVED',
          observations: d.observations || (d.file ? '' : 'No subió ningún documento'),
          rejectOpen: false,
          rejectText: d.observations || '',
          saving: false,
          checked: d.checked,
          file: d.file,
          description: d.desc
        }))
      );
    } catch (e) {
      console.error(e);
      setDocAuditRows([]);
    } finally {
      setDocAuditLoading(false);
    }
  };

  // [DOC_AUDIT_OPEN_HANDLER] — Carga todos los documentos de la propiedad en el modal rico
  const handleOpenDocAudit = async (propertyId: string, propertyTitle: string) => {
    setDocAuditPropId(propertyId);
    setDocAuditPropTitle(propertyTitle);
    setDocAuditLoading(true);
    setDocAuditExpanded(false);
    setDocAuditOpen(true);
    setActiveAuditIdx(0);
    try {
      const token = getToken() || '';
      const p = properties.find(x => x.id === propertyId) as any;

      // Definiendo las 6 opciones oficiales rígidas
      const rigidDocs = [
        { id: 'FR', name: "Folio Real Actualizado (Libre Alodial)", desc: "Certifica que el inmueble está libre de hipotecas, anotaciones o deudas.", checked: false, file: null as string | null },
        { id: 'CT', name: "Certificado Catastral Al Día", desc: "Registro y plano catastral aprobado por el municipio correspondiente.", checked: false, file: null as string | null },
        { id: 'TS', name: "Testimonio de Escritura Pública", desc: "Escritura de compraventa notariada que acredita la propiedad.", checked: false, file: null as string | null },
        { id: 'IM', name: "Impuestos Municipales Al Día", desc: "Comprobante de pago del último impuesto a la propiedad municipal.", checked: false, file: null as string | null },
        { id: 'PU', name: "Plano de Uso de Suelo Aprobado", desc: "Plano municipal de zonificación, dimensiones y uso permitido.", checked: false, file: null as string | null },
        { id: 'OD', name: "Otros Documentos (Ej. Planos)", desc: "Planos arquitectónicos, estructurales o documentación técnica adicional del inmueble.", checked: false, file: null as string | null },
        { id: 'CI', name: "Cédula de Identidad Vigente (CI)", desc: "Copia de CI legible del propietario legal para contratación y verificación de identidad.", checked: false, file: null as string | null }
      ];
    
      // Rellenar desde el estado del inmueble
      if (p) {
        if (Array.isArray(p.documents)) {
          rigidDocs.forEach(item => {
            const match = p.documents.find((d: any) => 
              String(d.name || d.fileType || '').toUpperCase().includes(item.name.substring(0, 10).toUpperCase()) ||
              String(d.fileType || '').toUpperCase() === item.id.toUpperCase()
            );
            if (match) {
              item.checked = match.checked ?? match.isMarked ?? false;
              item.file = match.file ?? match.fileData ?? match.fileUrl ?? null;
              (item as any).fileType = match.fileType ?? '';
              (item as any).fileName = match.fileName ?? '';
              (item as any).status = match.status ?? 'PENDING';
              (item as any).observations = match.observations ?? '';
            }
          });
        } 
        else if (Array.isArray(p.documentsList)) {
          rigidDocs.forEach(item => {
            const match = p.documentsList.find((d: any) => 
              String(d.name || d.fileType || '').toUpperCase().includes(item.name.substring(0, 10).toUpperCase()) ||
              String(d.fileType || '').toUpperCase() === item.id.toUpperCase()
            );
            if (match) {
              item.checked = match.isMarked ?? match.checked ?? false;
              item.file = match.fileData ?? match.file ?? match.fileUrl ?? null;
              (item as any).fileType = match.fileType ?? '';
              (item as any).fileName = match.fileName ?? '';
              (item as any).status = match.status ?? 'PENDING';
              (item as any).observations = match.observations ?? '';
            }
          });
        }
      }

      // Append extra dynamic documents (uploaded by owner outside rigid slots)
      const rigidIds = ['FR', 'CT', 'TS', 'IM', 'PU', 'OD', 'CI'];
      const rigidPrefixMapFull: Record<string, string> = {
        FR: 'FOLIO REAL', CT: 'CERTIFICAD', TS: 'TESTIMONIO',
        IM: 'IMPUESTOS ', PU: 'PLANO DE U', OD: 'OTROS DOCU', CI: 'CÉDULA DE '
      };
      const allDocs: any[] = Array.isArray(p?.documents) ? p.documents
                            : Array.isArray(p?.documentsList) ? p.documentsList
                            : [];
      allDocs.forEach((d: any) => {
        const isRigid = rigidIds.some(rid => {
          const prefix = rigidPrefixMapFull[rid];
          return String(d.fileType || '').toUpperCase() === rid.toUpperCase() ||
                 (prefix && String(d.name || d.docName || d.fileType || '').toUpperCase().includes(prefix));
        });
        if (!isRigid) {
          (rigidDocs as any[]).push({
            id: d.id || `extra-${Date.now()}-${Math.random()}`,
            name: d.fileName || d.docName || d.name || 'Documento adicional',
            desc: 'Documento adicional subido por el propietario.',
            checked: true,
            file: d.file ?? d.fileData ?? d.fileUrl ?? null,
            fileType: d.fileType || 'application/pdf',
            fileName: d.fileName || d.docName || d.name || 'Documento adicional',
            status: d.status || 'PENDING',
            observations: d.observations || ''
          });
        }
      });

      setDocAuditRows(
        rigidDocs.map((d: any) => ({
          id: d.id,
          fileType: d.fileType || d.id,
          fileName: d.fileName || d.name,
          fileUrl: d.file || '',
          status: d.status || 'PENDING',
          observations: d.observations || (d.file ? '' : 'No subió ningún documento'),
          rejectOpen: false,
          rejectText: d.observations || '',
          saving: false,
          checked: d.checked,
          file: d.file,
          description: d.desc
        }))
      );
    } catch (e) {
      console.error('[DocAudit] Error cargando documentos:', e);
      setDocAuditRows([]);
    } finally {
      setDocAuditLoading(false);
    }
  };

  // Helpers para mutar filas del modal
  const updateDocAuditRow = (index: number, patch: Partial<DocAuditRow>) =>
    setDocAuditRows(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));

  const handleDocAuditSaveRow = async (index: number, status: 'APPROVED' | 'REJECTED') => {
    const row = docAuditRows[index];
    if (status === 'REJECTED' && !row.rejectText.trim()) {
      alert('Debe escribir un motivo de rechazo antes de guardar.');
      return;
    }
    updateDocAuditRow(index, { saving: true });
    const observations = status === 'REJECTED' ? row.rejectText.trim() : '';
    try {
      const token = getToken() || '';
      await apiClient.patchWithAuth<any>(
        `/properties/${docAuditPropId}/documents/${row.id}`,
        { status, observations },
        token
      ).catch(e => console.warn('[DocAudit] Backend warn:', e));
      
      let targetProp: any = null;
      // Actualizar state de properties localmente
      const nextProps = properties.map(p => {
        if (p.id !== docAuditPropId) return p;
        const docs = p.documents ? [...p.documents] : [];
        const rigidPrefixMap: Record<string, string> = {
          FR: 'FOLIO REAL',
          CT: 'CERTIFICAD',
          TS: 'TESTIMONIO',
          IM: 'IMPUESTOS ',
          PU: 'PLANO DE U',
          OD: 'OTROS DOCU',
          CI: 'CÉDULA DE '
        };
        const prefix = rigidPrefixMap[row.id];
        const idx = docs.findIndex((d: any) => 
          d.id === row.id ||
          d.fileType?.toUpperCase() === row.id.toUpperCase() ||
          (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
        );
        if (idx !== -1) {
          docs[idx] = { ...docs[idx], status, observations: observations || null };
        } else {
          docs.push({
            id: row.id || `doc-${Date.now()}`,
            propertyId: docAuditPropId,
            fileName: row.fileName,
            fileUrl: row.fileUrl || '',
            fileType: row.fileType,
            status,
            observations: observations || null
          });
        }

        const requiredTypes = ['FR', 'CT', 'TS', 'IM', 'PU', 'CI'];
        const allRequiredApproved = requiredTypes.every(type => {
          const reqPrefix = rigidPrefixMap[type];
          const doc = docs.find((d: any) => 
            d.fileType?.toUpperCase() === type ||
            (reqPrefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(reqPrefix))
          );
          return doc?.status === 'APPROVED';
        });

        const updatedP = {
          ...p,
          documents: docs,
          hasVerifiedDocuments: allRequiredApproved,
          isGoldSealed: allRequiredApproved,
          isVerified: allRequiredApproved,
          verified: allRequiredApproved
        };
        targetProp = updatedP;
        return updatedP;
      });

      setProperties(nextProps);

      if (targetProp) {
        await fetch(`/api/local/properties/${docAuditPropId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetProp)
        }).catch(err => console.warn('Local PUT sync failed:', err));
      }

      updateDocAuditRow(index, { status, observations, rejectOpen: false, saving: false });
    } catch (e) {
      console.error('[DocAudit] Error guardando:', e);
      updateDocAuditRow(index, { saving: false });
    }
  };

  const handleSaveAndClose = async () => {
    if (!docAuditPropId) return;

    if (docAuditEntityType === 'contract') {
      const updatedDocs = docAuditRows.map(row => ({
        id: row.id,
        contractId: docAuditPropId,
        originalName: row.fileName,
        fileType: row.fileType,
        mimeType: row.fileType,
        sizeBytes: 0,
        uploadedAt: new Date().toISOString(),
        status: row.status,
        observations: row.observations,
        dataBase64: row.fileUrl
      }));
      localStorage.setItem(`propio_contracts_documents_${docAuditPropId}`, JSON.stringify(updatedDocs));
      setDocAuditOpen(false);
      return;
    }

    if (docAuditEntityType === 'developer') {
      const updatedDocs = docAuditRows.map(row => ({
        id: row.id,
        name: row.fileName,
        desc: row.description,
        file: row.fileUrl,
        fileUrl: row.fileUrl,
        mimeType: row.fileType,
        originalName: row.fileName,
        fileName: row.fileName,
        sizeBytes: 0,
        uploadedAt: new Date().toISOString(),
        status: row.status,
        observations: row.observations
      }));
      localStorage.setItem(`propio_developer_documents_${docAuditPropId}`, JSON.stringify(updatedDocs));
      const dev = developers.find(d => d.id === docAuditPropId);
      if (dev) {
        const updatedDev = { ...dev, documents: updatedDocs };
        await persistLocalDeveloper(updatedDev);
      }
      setDocAuditOpen(false);
      return;
    }
    
    const invalidRow = docAuditRows.find(row => row.status === 'REJECTED' && !row.rejectText.trim());
    if (invalidRow) {
      alert(`Debe escribir un motivo de rechazo para el documento "${invalidRow.fileName}" antes de cerrar.`);
      return;
    }

    setIsSavingAudit(true);

    try {
      const token = getToken() || '';
      
      const items = docAuditRows.map(row => ({
        docId: row.id,
        fileType: row.id,
        status: row.status,
        observations: row.status === 'REJECTED' ? row.rejectText.trim() : ''
      }));

      await apiClient.patchWithAuth<any>(
        `/properties/${docAuditPropId}/documents/batch-review`,
        { items },
        token
      ).catch(e => console.warn('[DocAudit] Batch update warning:', e));

      let targetProp: any = null;
      const nextProps = properties.map(p => {
        if (p.id !== docAuditPropId) return p;
        const docs = p.documents ? [...p.documents] : [];
        
        const rigidPrefixMap: Record<string, string> = {
          FR: 'FOLIO REAL',
          CT: 'CERTIFICAD',
          TS: 'TESTIMONIO',
          IM: 'IMPUESTOS ',
          PU: 'PLANO DE U',
          OD: 'OTROS DOCU',
          CI: 'CÉDULA DE '
        };

        docAuditRows.forEach(row => {
          const prefix = rigidPrefixMap[row.id];
          const idx = docs.findIndex((d: any) => 
            d.id === row.id ||
            d.fileType?.toUpperCase() === row.id.toUpperCase() ||
            (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
          );

          const observations = row.status === 'REJECTED' ? row.rejectText.trim() : '';

          if (idx !== -1) {
            docs[idx] = { 
              ...docs[idx], 
              status: row.status, 
              observations: observations || null,
              file: row.file || docs[idx].file || docs[idx].fileUrl || null
            };
          } else {
            docs.push({
              id: row.id || `doc-${Date.now()}`,
              propertyId: docAuditPropId,
              fileName: row.fileName,
              fileUrl: row.file || '',
              fileType: row.fileType || row.id,
              status: row.status,
              observations: observations || null
            });
          }
        });

        const requiredTypes = ['FR', 'CT', 'TS', 'IM', 'PU', 'CI'];
        const allRequiredApproved = requiredTypes.every(type => {
          const reqPrefix = rigidPrefixMap[type];
          const doc = docs.find((d: any) => 
            d.fileType?.toUpperCase() === type ||
            (reqPrefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(reqPrefix))
          );
          return doc?.status === 'APPROVED';
        });

        const updatedP = {
          ...p,
          documents: docs,
          hasVerifiedDocuments: allRequiredApproved,
          isGoldSealed: allRequiredApproved,
          isVerified: allRequiredApproved,
          verified: allRequiredApproved
        };
        targetProp = updatedP;
        return updatedP;
      });

      setProperties(nextProps);

      if (targetProp) {
        await fetch(`/api/local/properties/${docAuditPropId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'cache-control': 'no-cache' },
          body: JSON.stringify(targetProp),
          cache: 'no-store'
        } as any).catch(err => console.warn('Local PUT sync failed:', err));
      }

      setDocAuditOpen(false);

    } catch (err) {
      console.error('[DocAudit] Error during batch save:', err);
      alert('Ocurrió un error al guardar los cambios de auditoría.');
    } finally {
      setIsSavingAudit(false);
    }
  };

  const handleCreateNewDocSlot = () => {
    const title = window.prompt('Nombre del nuevo documento requerido (ej. "Recibo de Agua Al Día"):');
    if (!title || !title.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newRow = {
      id: newId,
      fileType: newId,
      fileName: title.trim(),
      fileUrl: '',
      status: 'PENDING',
      observations: 'Slot creado manualmente por el administrador.',
      rejectOpen: false,
      rejectText: '',
      saving: false,
      checked: false,
      file: null,
      description: 'Documento adicional solicitado al propietario por el administrador.'
    };
    setDocAuditRows(prev => [...prev, newRow]);
    setActiveAuditIdx(docAuditRows.length); // focus on the new tab
    // Open file picker immediately for this new slot
    setTimeout(() => fileInputRef.current?.click(), 80);
  };

  const handleResolveDocument = async (status: 'APPROVED' | 'REJECTED', observations?: string) => {
    if (!auditPropertyId || !auditDocType) return;
    try {
      const token = getToken() || '';
      const response = await apiClient.patchWithAuth<any>(
        `/properties/${auditPropertyId}/documents/${auditDocType}`,
        { status, observations },
        token
      ).catch(e => {
        console.warn('Backend document resolution failed, resolving locally:', e);
        return {
          id: `doc-${Date.now()}`,
          message: `Documento ${auditDocType} actualizado a ${status} localmente.`
        };
      });
      
      let targetProp: any = null;
      const updated = properties.map(p => {
        if (p.id === auditPropertyId) {
          const docs = p.documents ? [...p.documents] : [];
          const rigidPrefixMap: Record<string, string> = {
            FR: 'FOLIO REAL',
            CT: 'CERTIFICAD',
            TS: 'TESTIMONIO',
            IM: 'IMPUESTOS ',
            PU: 'PLANO DE U',
            OD: 'OTROS DOCU',
            CI: 'CÉDULA DE '
          };
          const prefix = rigidPrefixMap[auditDocType.toUpperCase()];
          const idx = docs.findIndex(d => 
            d.fileType?.toUpperCase() === auditDocType.toUpperCase() ||
            (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
          );
          if (idx !== -1) {
            docs[idx] = { ...docs[idx], status, observations: observations || null };
          } else {
            docs.push({
              id: (response && response.id) || `doc-${Date.now()}`,
              propertyId: auditPropertyId,
              fileName: `${auditDocType.toLowerCase()}_updated.pdf`,
              fileUrl: previewDocUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              fileType: auditDocType.toUpperCase(),
              status,
              observations: observations || null
            });
          }

          const requiredTypes = ['FR', 'CT', 'TS', 'IM', 'PU', 'CI'];
          const allRequiredApproved = requiredTypes.every(type => {
            const reqPrefix = rigidPrefixMap[type];
            const doc = docs.find((d: any) => 
              d.fileType?.toUpperCase() === type ||
              (reqPrefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(reqPrefix))
            );
            return doc?.status === 'APPROVED';
          });

          const updatedP = {
            ...p,
            documents: docs,
            hasVerifiedDocuments: allRequiredApproved,
            isGoldSealed: allRequiredApproved,
            isVerified: allRequiredApproved,
            verified: allRequiredApproved
          };
          targetProp = updatedP;
          return updatedP;
        }
        return p;
      });

      setProperties(updated);

      if (targetProp) {
        await fetch(`/api/local/properties/${auditPropertyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetProp)
        }).catch(err => console.warn('Local PUT sync failed:', err));
      }

      alert((response && response.message) || `Documento ${auditDocType} actualizado a ${status} con éxito.`);

      if (status === 'APPROVED') {
        setPreviewDocUrl(null);
        setPreviewDocTitle('');
        setAuditPropertyId(null);
        setAuditDocType(null);
        setAuditDocObservations('');
        setIsRejectingDoc(false);
      } else {
        setIsRejectingDoc(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar el estado del documento.');
    }
  };
  const handleUpdatePropertyPlan = async (propertyId: string, newPlanRaw: string) => {
    const planKey = normalizePlanKey(newPlanRaw);
    try {
      const token = getToken() || '';
      await apiClient.patchWithAuth<any>(`/admin/properties/${propertyId}/plan`, { plan: planKey }, token).catch(e => {
        console.warn('Backend plan update failed, updating state locally:', e);
      });

      setProperties(prev => prev.map(p => {
        if (p.id === propertyId) {
          return {
            ...p,
            isVerified: planKey !== 'gratis',
            plan: planKey,
          } as any;
        }
        return p;
      }));

      alert(`Plan actualizado a "${PLAN_LABELS[planKey]}" exitosamente.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al actualizar el plan.');
    }
  };

  const handleOpenPreview = async (propTitle: string) => {
    let prop = properties.find(p => p.title.toLowerCase() === propTitle.toLowerCase());
    if (!prop) {
      prop = mapPropertyToNewSchema({
        id: 'prop-fallback-' + Date.now(),
        title: propTitle,
        location: 'Cochabamba, Bolivia',
        price: 150000,
        priceBob: 1500000,
        area: 120,
        rooms: 3,
        bathrooms: 2,
        type: 'casa',
        verified: true,
        offerType: 'VENTA',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        featured: false
      });
    }

    setActivePropertyPreview(prop.id);
    setLoadingPreview(true);
    try {
      const fetched = await propertiesService.getPropertyById(prop.id);
      setPreviewPropertyData(mapPropertyToNewSchema(fetched));
    } catch (err) {
      setPreviewPropertyData(prop);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Document checklist traffic lights color mapping
  const getDocBadgeClass = (hasDoc: boolean) => {
    return hasDoc 
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
      : 'bg-rose-100 text-rose-800 border-rose-300';
  };

  // Time in market colors (Verde < 30d, Amarillo 30-60d, Rojo > 60d)
  const getMarketTimeClass = (createdAtStr?: string) => {
    if (!createdAtStr) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    const elapsedDays = (Date.now() - new Date(createdAtStr).getTime()) / (1000 * 3600 * 24);
    if (elapsedDays < 30) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (elapsedDays < 60) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-rose-50 border-rose-200 text-rose-700';
  };

  const getMarketTimeBadge = (createdAtStr?: string) => {
    if (!isMounted) {
      return {
        text: 'Cargando...',
        className: 'inline-flex items-center justify-center px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[11px] font-bold shrink-0 whitespace-nowrap border border-slate-100'
      };
    }
    if (!createdAtStr) {
      return {
        text: 'Sin registro',
        className: 'bg-slate-50 text-slate-500 border border-slate-200/60 font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 inline-flex items-center justify-center whitespace-nowrap'
      };
    }
    const createdDate = new Date(createdAtStr);
    if (isNaN(createdDate.getTime())) {
      return {
        text: 'Sin registro',
        className: 'bg-slate-50 text-slate-500 border border-slate-200/60 font-bold px-2.5 py-1 rounded-lg text-[11px] shrink-0 inline-flex items-center justify-center whitespace-nowrap'
      };
    }

    const elapsedMs = Date.now() - createdDate.getTime();
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    
    let text = '';
    if (elapsedDays <= 0) {
      text = 'Subido hoy';
    } else if (elapsedDays === 1) {
      text = 'Subido ayer';
    } else if (elapsedDays < 7) {
      text = `Subido hace ${elapsedDays} días`;
    } else if (elapsedDays < 30) {
      const weeks = Math.floor(elapsedDays / 7);
      text = `Subido hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      const months = Math.floor(elapsedDays / 30);
      text = `Subido hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }

    let className = 'inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 whitespace-nowrap border ';
    if (elapsedDays < 30) {
      className += 'bg-emerald-50 text-emerald-700 border-emerald-100';
    } else if (elapsedDays < 60) {
      className += 'bg-amber-50 text-amber-700 border-amber-100';
    } else {
      className += 'bg-rose-50 text-rose-700 border-rose-100';
    }

    return { text, className };
  };

  const filteredProperties = properties.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const addressStr = p.location && typeof p.location === 'object' ? (p.location as any).address || '' : String(p.location || '');
    const cityStr = p.location && typeof p.location === 'object' ? (p.location as any).city || '' : String(p.location || '');
    const matchesSearch =
      query === '' ||
      p.title.toLowerCase().includes(query) ||
      addressStr.toLowerCase().includes(query) ||
      cityStr.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query);

    const matchesSucursal =
      selectedSucursal.toString().toUpperCase().trim() === 'TODOS' ?
        true :
        cityStr.toString().toUpperCase().trim() === selectedSucursal.toString().toUpperCase().trim();

    const currentPlan = parsePlanFromProperty(p as any);
    const matchesPlan =
      selectedPlan === 'todos' ||
      currentPlan === selectedPlan;
    const createdDate = p.createdAt ? new Date(p.createdAt) : null;
    let ageText = 'Sin registro';
    if (createdDate && !isNaN(createdDate.getTime())) {
      const elapsedDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedMonths = elapsedDays / 30;
      if (elapsedMonths <= 1) {
        ageText = '1 Mes en mercado';
      } else if (elapsedMonths <= 2) {
        ageText = '2 Meses en mercado';
      } else {
        ageText = '3+ Meses en mercado';
      }
    }

    const matchesAge =
      selectedAge === 'todos' ||
      ageText === selectedAge;

    // --- Status Filter Match ---
    const statusVal = (p.status || '').toUpperCase();
    const inclusiveStatusArray = ['APROBADO', 'PENDIENTE', 'NUEVA_PUBLICACION', 'RECHAZADO', 'OBSERVADO'];
    let matchesStatus = inclusiveStatusArray.includes(statusVal) || statusVal === '';
    if (selectedStatus !== 'todos') {
      let filterVal = selectedStatus;
      if (selectedStatus === 'Aprobado') filterVal = 'APROBADO';
      if (selectedStatus === 'Nueva Publicación') filterVal = 'NUEVA_PUBLICACION';
      if (selectedStatus === 'Pendiente') filterVal = 'PENDIENTE';
      if (selectedStatus === 'Rechazado') filterVal = 'RECHAZADO';
      
      matchesStatus = statusVal === filterVal.toUpperCase();
    }

    // --- Documentation Filter Match ---
    let matchesDocumentation = true;
    if (selectedDocumentation !== 'todos') {
      const docTypes = ['FR', 'CT', 'TS'];
      const docStatuses = docTypes.map(docType => {
        const matched = p.documents?.find((d: any) => d.fileType?.toUpperCase() === docType);
        if (matched) {
          return matched.status || 'PENDING';
        } else {
          const legacyFlag = docType === 'FR' ? p.hasFolioReal : docType === 'CT' ? p.hasCatastro : p.hasTestimonio;
          if (legacyFlag) {
            return 'PENDING';
          }
        }
        return 'NOT_UPLOADED';
      });

      if (selectedDocumentation === 'expedientes_completos') {
        matchesDocumentation = docStatuses.every(st => st === 'APPROVED');
      } else if (selectedDocumentation === 'con_pendientes') {
        matchesDocumentation = docStatuses.some(st => st === 'PENDING');
      } else if (selectedDocumentation === 'con_observaciones') {
        matchesDocumentation = docStatuses.some(st => st === 'REJECTED');
      } else if (selectedDocumentation === 'sin_cargar') {
        matchesDocumentation = docStatuses.some(st => st === 'NOT_UPLOADED');
      }
    }

    return matchesSearch && matchesPlan && matchesAge && matchesStatus && matchesDocumentation && matchesSucursal;
  }).sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return String(b.id || '').localeCompare(String(a.id || ''));
  });

  // [LOGICA_CALCULO_Y_MUTACION_COMISIONES - AUTO-BALANCE EN CALIENTE]
  const handleUpdatePorcentaje = (
    id: string,
    campo: 'porcentajePropio' | 'porcentajeAgente1' | 'porcentajeAgente2',
    nuevoValor: number
  ) => {
    const clampedValue = Math.min(100, Math.max(0, nuevoValor));
    
    setCollaborations(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;

        const currentVals = {
          porcentajePropio: c.porcentajePropio ?? 0,
          porcentajeAgente1: c.porcentajeAgente1 ?? 0,
          porcentajeAgente2: c.porcentajeAgente2 ?? 0
        };

        const locks = columnLocks[id] || {};
        const isLocked = {
          porcentajePropio: !!locks.porcentajePropio,
          porcentajeAgente1: !!locks.porcentajeAgente1,
          porcentajeAgente2: !!locks.porcentajeAgente2
        };

        if (isLocked[campo]) return c;

        const nextVals = { ...currentVals, [campo]: clampedValue };
        const remainder = 100 - clampedValue;

        const otherFields = (['porcentajePropio', 'porcentajeAgente1', 'porcentajeAgente2'] as const).filter(f => f !== campo);
        const unlockedOtherFields = otherFields.filter(f => !isLocked[f]);

        if (unlockedOtherFields.length === 2) {
          const val1 = Math.round(remainder / 2);
          const val2 = remainder - val1;
          nextVals[unlockedOtherFields[0]] = Math.max(0, val1);
          nextVals[unlockedOtherFields[1]] = Math.max(0, val2);
        } else if (unlockedOtherFields.length === 1) {
          nextVals[unlockedOtherFields[0]] = Math.max(0, remainder);
        }

        return {
          ...c,
          porcentajePropio: nextVals.porcentajePropio,
          porcentajeAgente1: nextVals.porcentajeAgente1,
          porcentajeAgente2: nextVals.porcentajeAgente2
        };
      });

      localStorage.setItem('propio_admin_collaborations', JSON.stringify(updated));
      return updated;
    });
  };

  // [COMPONENTE_ANILLO_PROGRESO_INTERACTIVO]
  const renderComisionRing = (
    colabId: string,
    campo: 'porcentajePropio' | 'porcentajeAgente1' | 'porcentajeAgente2',
    valor: number,
    isAgent: boolean,
    isLocked: boolean
  ) => {
    const radius = 16;
    const circumference = 2 * Math.PI * radius; // ~100.53
    const strokeDashoffset = circumference - (circumference * valor) / 100;
    const color = isAgent ? 'stroke-blue-500' : 'stroke-slate-800';

    return (
      <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-2xl border border-slate-205/50 shadow-3xs shrink-0 select-none">
        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="stroke-slate-200/80"
              strokeWidth="3.5"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="22"
              cy="22"
              r={radius}
              className={`${color} transition-all duration-300`}
              strokeWidth="3.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[9px] font-black text-slate-800 tracking-tighter">{valor}%</span>
        </div>
        {isAgent && !isLocked && (
          <div className="flex flex-col text-[10px] text-slate-400 select-none leading-none">
            <button
              onClick={() => handleUpdatePorcentaje(colabId, campo, valor + 5)}
              className="hover:text-blue-600 font-black px-1.5 py-0.5 transition-colors cursor-pointer text-center"
              title="Incrementar 5%"
            >
              ▲
            </button>
            <button
              onClick={() => handleUpdatePorcentaje(colabId, campo, valor - 5)}
              className="hover:text-blue-600 font-black px-1.5 py-0.5 transition-colors cursor-pointer text-center"
              title="Decrementar 5%"
            >
              ▼
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleAprobacionGeneral = (id: string) => {
    setCollaborations(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;

        // Registrar egreso/ingreso correspondiente en localStorage e historial financiero (expenses)
        const newExpense: Expense = {
          id: `EXP-${Date.now()}`,
          propertyId: c.propiedadId,
          amount: 500,
          date: new Date().toISOString().split('T')[0],
          concept: `Comisión Co-broking Liberada - ${c.id} (${c.agente1} / ${c.agente2})`,
          status: 'APROBADO',
          category: 'COMISIONES',
          requester: 'Administrador',
          vinculacion: `Propiedad ${c.propiedadId}`,
          receiptUrl: '#'
        };

        const cachedExpenses = localStorage.getItem('propio_admin_expenses');
        let expensesList: any[] = [];
        if (cachedExpenses) {
          try {
            expensesList = JSON.parse(cachedExpenses);
          } catch (e) {
            console.error(e);
          }
        }
        localStorage.setItem('propio_admin_expenses', JSON.stringify([newExpense, ...expensesList]));
        setExpenses(prevExpenses => [newExpense, ...prevExpenses]);

        return {
          ...c,
          estado: 'PAGADO_CERRADO' as const,
        };
      });
      localStorage.setItem('propio_admin_collaborations', JSON.stringify(updated));
      return updated;
    });
  };

  // [LOGICA_ENVIO_COLABORACION_Y_NOTIFICACION]
  // Estado del modal de confirmación de solicitud exitosa
  const [colabConfirmModal, setColabConfirmModal] = useState<{ visible: boolean; propiedadNombre: string } | null>(null);
  const [colabSending, setColabSending] = useState(false);

  /**
   * Envía una solicitud de colaboración (co-broking) al backend.
   * Registra al Agente Vendedor (solicitante), el ID de propiedad y el ID del Agente Captador.
   * El backend inserta automáticamente una alerta en la bandeja del Agente Captador.
   *
   * [ESTRUCTURA_REGLA_NEGOCIO_COMISION_CAPTADOR]
   * - agenteVendedorGestionaCierre: true  → Agente Vendedor gestiona la partición de cierre
   * - captadorFeeIndependiente: true       → Fee del Captador es NO-tradicional (modelo Propio)
   */
  const handleEnviarSolicitudColaboracion = async (
    propiedadId: string,
    captadorId: string,
    propiedadNombre: string,
    agenteVendedorNombre: string,
  ) => {
    if (colabSending) return;
    setColabSending(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const token = typeof window !== 'undefined' ? (localStorage.getItem('propio_token') || '') : '';

    // Objeto de colaboración con flags de regla de negocio aislados
    const payload = {
      propiedadId,
      captadorId,
      agenteVendedorNombre,
      // [ESTRUCTURA_REGLA_NEGOCIO_COMISION_CAPTADOR]
      agenteVendedorGestionaCierre: true,   // ponytail: separación de responsabilidad por diseño
      captadorFeeIndependiente: true,        // fee captador calculado independiente a comisión tradicional
    };

    try {
      // Intento POST al backend — fire-and-forget si el endpoint aún no existe
      await fetch(`${apiBase}/colaboraciones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      }).catch(() => null); // ponytail: no bloquear UI si el endpoint no está listo aún

      // Insertar la colaboración en estado local con flags de negocio
      const newColab: Collaboration = {
        id: `COLAB-${Date.now()}`,
        agente1: agenteVendedorNombre,
        agente2: captadorId,
        propiedadId,
        propiedadNombre,
        porcentajePropio: 50,
        porcentajeAgente1: 25, // partición cierre del Agente Vendedor
        porcentajeAgente2: 25, // fee captador modelo Propio (independiente)
        estado: 'PENDIENTE_APROBACION',
        agenteVendedorGestionaCierre: true,
        captadorFeeIndependiente: true,
      };

      setCollaborations(prev => {
        const updated = [newColab, ...prev];
        localStorage.setItem('propio_admin_collaborations', JSON.stringify(updated));
        return updated;
      });

      // Mostrar modal de confirmación exitosa
      setColabConfirmModal({ visible: true, propiedadNombre });
    } catch (err) {
      console.error('[ColabRequest] Error al enviar solicitud:', err);
    } finally {
      setColabSending(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="text-white text-xs font-mono uppercase tracking-widest animate-pulse">
          Cargando configuración inicial...
        </div>
      </div>
    );
  }

  return (
    <AgentProvider value={{ agents, setAgents }}>
    <>
      <div className="flex w-full min-h-screen md:h-screen md:overflow-hidden bg-[#fbf9f9] text-slate-800 font-sans antialiased select-none flex-col md:flex-row">
      
      {/* 1. LEFT SIDEBAR */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        counts={{
          properties: properties.length,
          prospects: prospects.length,
          owners: owners.length,
          developers: developers.length,
          contracts: contracts.length,
          payments: payments.length,
          expenses: expenses.length,
          agents: agents.length
        }}
      />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen md:h-full md:overflow-hidden relative">
        
        {/* Fixed Header */}
        {/* Fixed Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center z-20 shrink-0 select-none gap-4">
          <h1 className="text-sm font-black text-[#04045E] uppercase tracking-wider shrink-0">
            Consola del Administrador: <span className="text-[#04045E]/60">{activeTab}</span>
          </h1>

          {/* Omnibox / Navigation Search */}
          <div className="flex-1 max-w-md mx-auto relative">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Buscar propiedad, constructora o sección..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-[#04045E]/5 border border-[#04045E]/10 rounded-xl px-4 py-1.5 pl-4 text-xs font-bold text-[#04045E] placeholder-[#04045E]/40 focus:outline-hidden focus:border-[#04045E]/30 focus:bg-white transition-all shadow-2xs"
              />
            </div>

            {/* Float Dropdown Command Panel */}
            {isSearchFocused && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsSearchFocused(false)} 
                />
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-45 py-2.5 max-h-80 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {globalSearchQuery ? 'Resultados de Búsqueda' : 'Accesos Rápidos a Secciones'}
                  </div>
                  <div className="py-1">
                    {filteredSearchResults.length === 0 ? (
                      <p className="text-xs text-slate-400 italic px-3.5 py-2">
                        No se encontraron resultados para "{globalSearchQuery}"
                      </p>
                    ) : (
                      filteredSearchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
                            setActiveTab(result.targetTab);
                            if (result.type === 'propiedad') {
                              const propObj = properties.find(p => p.id === result.id.replace('prop-', ''));
                              if (propObj) {
                                setSelectedProperty(propObj);
                                setModalPropertyData(propObj);
                                setIsPropertyModalOpen(true);
                              }
                            } else if (result.type === 'constructora') {
                              setFilterDevEmpresa(result.title);
                            } else if (result.type === 'propietario') {
                              setOwnerNameSearch(result.title);
                            } else if (result.type === 'agente') {
                              setSelectedAgentNames([result.title.toUpperCase()]);
                            }
                            setGlobalSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-center gap-3 cursor-pointer group"
                        >
                          <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                            {result.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#04045E] truncate group-hover:text-black transition-colors">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate mt-0.5">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                          <span className="text-[9px] font-black text-slate-350 uppercase opacity-0 group-hover:opacity-100 transition-opacity tracking-wider">
                            Ir ➜
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setIsSucursalDropdownOpen(!isSucursalDropdownOpen)}
              className="bg-[#04045E]/5 border border-[#04045E]/10 text-[#04045E] px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider focus:outline-hidden cursor-pointer flex items-center gap-1 hover:bg-[#04045E]/10 transition-all select-none"
            >
              🌐 SUCURSAL: {selectedSucursal === 'TODOS' ? 'TODOS' : selectedSucursal.toUpperCase()}
              <span className="text-[9px] ml-1">▼</span>
            </button>
            {isSucursalDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsSucursalDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 py-2 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      setSelectedSucursal('TODOS');
                      setIsSucursalDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#04045E] hover:bg-slate-50 transition-all uppercase tracking-wider block"
                  >
                    Todos los Departamentos
                  </button>
                  {['Cochabamba', 'La Paz', 'Santa Cruz', 'Tarija', 'Oruro', 'Potosi', 'Chuquisaca', 'Beni', 'Pando'].map((dep) => (
                    <button
                      key={dep}
                      onClick={() => {
                        setSelectedSucursal(dep);
                        setIsSucursalDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#04045E] hover:bg-slate-50 transition-all uppercase tracking-wider block"
                    >
                      {dep === 'Potosi' ? 'Potosí' : dep}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 bg-[#f4f4fa] pb-16 scroll-smooth relative">
          
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
                <p className="text-xs font-black text-[#04045E] uppercase tracking-widest animate-pulse">Cargando base de datos central...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              
              {/* ========================================== */}
              {/* TAB: DASHBOARD (Home KPIs) */}
              {/* ========================================== */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Toolbar & Exchange Rate Control */}
                  <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
                    {/* ponytail: Hidden exchange rate controls visually to keep layout intact without breaking logic */}
                    <div className="flex items-center gap-4 flex-wrap hidden">
                      <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 text-xs font-semibold">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TC Oficial Dólar:</span>
                        <span className="font-extrabold text-[#04045E]">Compra: {exchangeRate.rateBuy} Bs.</span>
                        <span className="text-slate-300">|</span>
                        <span className="font-extrabold text-[#04045E]">Venta: {exchangeRate.rateSell} Bs.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Compra"
                          value={manualExchangeRate.rateBuy}
                          onChange={e => setManualExchangeRate(prev => ({ ...prev, rateBuy: e.target.value }))}
                          className="w-16 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-hidden focus:border-[#04045E]"
                          title="Manual rate buy (Bs.)"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Venta"
                          value={manualExchangeRate.rateSell}
                          onChange={e => setManualExchangeRate(prev => ({ ...prev, rateSell: e.target.value }))}
                          className="w-16 px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-hidden focus:border-[#04045E]"
                          title="Manual rate sell (Bs.)"
                        />
                        <button
                          onClick={async () => {
                            if (!manualExchangeRate.rateBuy || !manualExchangeRate.rateSell) return;
                            setIsUpdatingExchangeRate(true);
                            try {
                              const token = getToken() || '';
                              const res = await apiClient.postWithAuth<any>('/exchange-rate/manual', {
                                rateBuy: parseFloat(manualExchangeRate.rateBuy),
                                rateSell: parseFloat(manualExchangeRate.rateSell),
                              }, token);
                              setExchangeRate({
                                rateBuy: parseFloat(manualExchangeRate.rateBuy),
                                rateSell: parseFloat(manualExchangeRate.rateSell),
                              });
                              alert(res?.message || 'Tipo de cambio actualizado manualmente.');
                            } catch (err: any) {
                              alert('Error al guardar tipo de cambio manual: ' + (err.message || err));
                            } finally {
                              setIsUpdatingExchangeRate(false);
                            }
                          }}
                          disabled={isUpdatingExchangeRate}
                          className="bg-[#04045E] hover:bg-opacity-95 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50 hover:scale-105 active:scale-95"
                          title="Guardar tipo de cambio manual en la BD"
                        >
                          Guardar TC 💾
                        </button>
                        <button
                          onClick={async () => {
                            setIsUpdatingExchangeRate(true);
                            try {
                              const token = getToken() || '';
                              const res = await apiClient.postWithAuth<any>('/exchange-rate/sync', {}, token);
                              if (res && res.rateBuy && res.rateSell) {
                                setExchangeRate({ rateBuy: res.rateBuy, rateSell: res.rateSell });
                                setManualExchangeRate({ rateBuy: String(res.rateBuy), rateSell: String(res.rateSell) });
                                alert('Sincronización con el BCB completada con éxito.');
                              } else {
                                alert('Error al sincronizar con el BCB. Se mantuvieron los tipos de cambio previos.');
                              }
                            } catch (err: any) {
                              alert('Error al sincronizar con el BCB: ' + (err.message || err));
                            } finally {
                              setIsUpdatingExchangeRate(false);
                            }
                          }}
                          disabled={isUpdatingExchangeRate}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50 hover:scale-105 active:scale-95"
                          title="Sincronizar ahora con la web oficial del BCB"
                        >
                          Sincronizar BCB 🔄
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const summary = [
                          { METRICA: 'Inmuebles Activos', VALOR: dashboardStats.activeProperties, DETALLE: `${dashboardStats.percentVerified}% verificados` },
                          { METRICA: 'Fuerza de Ventas', VALOR: dashboardStats.agentCount, DETALLE: `${dashboardStats.assignedAgents} Agentes asignados` },
                          { METRICA: 'Ingresos del Mes', VALOR: `$${dashboardStats.monthlyIncome.toLocaleString()} USD`, DETALLE: '100% conciliado' },
                          { METRICA: 'Contratos Registrados', VALOR: dashboardStats.cierresDelMes, DETALLE: '100% vigentes' }
                        ];
                        const logSection = dashboardStats.recentEvents.map(e => ({
                          METRICA: `Bitácora: ${e.text}`,
                          VALOR: e.time,
                          DETALLE: 'Registro histórico'
                        }));
                        exportDataToExcel([...summary, ...logSection], `Dashboard_Resumen_${selectedSucursal}`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 text-center lg:self-auto shrink-0"
                    >
                      Exportar Resumen Excel 📊
                    </button>
                  </div>
                  {/* KPI Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Inmuebles Activos</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{properties.length}</span>
                        <div className="mt-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${properties.length > 0 && (properties.filter(p => p.verified).length / properties.length * 100) > 80 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
                            {properties.length > 0 ? Math.round((properties.filter(p => p.verified).length / properties.length) * 100) : 0}% verificados
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                        🏠
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fuerza de Ventas</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{agents.length}</span>
                        <div className="mt-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${agents.filter(a => properties.some(p => (p as any).agentId === a.id)).length > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'}`}>
                            {agents.filter(a => properties.some(p => (p as any).agentId === a.id)).length} Agentes asignados
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                        👥
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ingresos del Mes</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">${payments.filter(p => p.status === 'CONCILIADO').reduce((sum, p) => sum + p.amount, 0).toLocaleString()} <span className="text-sm text-slate-400 font-bold">USD</span></span>
                        <div className="mt-2">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            100% conciliado
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                        💸
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between relative overflow-hidden hover:shadow-md transition-shadow">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contratos Registrados</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">{contracts.length}</span>
                        <div className="mt-2">
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            100% vigentes
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                        📋
                      </div>
                    </div>
                  </div>

                  {/* Operational Summary */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Bitácora de Eventos Recientes</h3>
                    {dashboardStats.recentEvents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No hay eventos registrados en esta sucursal.</p>
                    ) : (
                      <div className="space-y-3 divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {dashboardStats.recentEvents.map((event) => (
                          <div key={event.id} className="pt-2 flex justify-between items-center group">
                            <span className="flex-1">{event.text}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-slate-400">{event.time}</span>
                              <button
                                onClick={() => handleDeleteActivityLog(event.id)}
                                title="Eliminar permanentemente de la base de datos"
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 hover:bg-rose-100 text-rose-600 p-1 rounded-md text-xs cursor-pointer border border-rose-200"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PROPERTIES */}
              {/* ========================================== */}
              {activeTab === 'properties' && (
                <div className="space-y-6">
                  {/* Toolbar & Filters */}
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                    <div className="flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Buscar propiedad..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const exported = filteredProperties.map(p => {
                            const plan = parsePlanFromProperty(p as any);
                            return {
                              ID: p.id,
                              TITULO: p.title,
                              PRECIO_USD: p.price,
                              UBICACION: p.location,
                              PLAN: getPlanLabel(plan),
                              ESTADO: p.status,
                              HABITACIONES: p.rooms,
                              BAÑOS: p.bathrooms,
                              AREA_M2: p.area,
                              VERIFICADO: p.isVerified ? 'SI' : 'NO',
                              PROPIETARIO: (p as any).owner?.name || 'No asignado',
                              CELULAR_PROPIETARIO: (p as any).owner?.phone || (p as any).owner?.whatsappPhone || '',
                              CREADO: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
                            };
                          });
                          exportDataToExcel(exported, 'Reporte_Propiedades', 'Propiedades');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                      >
                        Exportar Excel 📊
                      </button>
                    </div>
                  </div>

                  {/* List / Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-visible shadow-sm">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
                  <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                        Vista Previa de Propiedades
                      </h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        ({filteredProperties.length} ENCONTRADOS)
                      </span>
                    </div>
                    {/* [PROTECCION_ANTI_APLASTAMIENTO_FILAS_TABLA] */}
                    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                      <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
                        <thead className="relative z-40 bg-slate-50">
                          <tr className="bg-slate-50 text-[13px] font-semibold uppercase text-slate-600 border-b border-slate-200/80 select-none">
                            <th className="py-5 px-6 border-b border-slate-200/80 font-semibold text-[13px] tracking-wide">Detalles Inmueble</th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'age' ? null : 'age');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Antigüedad Mercado {selectedAge !== 'todos' ? `(${selectedAge})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeHeaderFilter === 'age' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['todos', '1 Mes en mercado', '2 Meses en mercado', '3+ Meses en mercado', 'Sin registro'] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          setSelectedAge(opt);
                                          setActiveHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                          selectedAge === opt 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                      >
                                        {opt === 'todos' ? 'Todos' : opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-3 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'plan' ? null : 'plan');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Plan {selectedPlan !== 'todos' ? `(${selectedPlan})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeHeaderFilter === 'plan' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['todos', ...PLAN_KEYS] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          setSelectedPlan(opt);
                                          setActiveHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                                          selectedPlan === opt
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                      >
                                        {opt === 'todos' ? 'Todos los planes' : PLAN_LABELS[opt as PlanKey]}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'documentation' ? null : 'documentation');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span>
                                  Documentación
                                  {selectedDocumentation !== 'todos' && (
                                    <span className="text-[10px] text-slate-900 font-bold ml-1">
                                      ({selectedDocumentation === 'expedientes_completos' ? 'Completos' :
                                        selectedDocumentation === 'con_pendientes' ? 'Pendientes' :
                                        selectedDocumentation === 'con_observaciones' ? 'Observados' : 'Sin Cargar'}
                                      )
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeHeaderFilter === 'documentation' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {[
                                      { value: 'todos', label: 'Todos los documentos', icon: '📄' },
                                      { value: 'expedientes_completos', label: 'Expedientes Completos', icon: '🟢' },
                                      { value: 'con_pendientes', label: 'Con Pendientes', icon: '🟡' },
                                      { value: 'con_observaciones', label: 'Con Observaciones', icon: '🔴' },
                                      { value: 'sin_cargar', label: 'Sin Cargar', icon: '⚫' }
                                    ].map(opt => (
                                      <button
                                        key={opt.value}
                                        onClick={() => {
                                          setSelectedDocumentation(opt.value);
                                          setActiveHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                                          selectedDocumentation === opt.value
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-600'
                                        }`}
                                      >
                                        <span>{opt.icon}</span>
                                        <span>{opt.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'status' ? null : 'status');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Estado {selectedStatus !== 'todos' ? `(${selectedStatus})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeHeaderFilter === 'status' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {[
                                      { value: 'todos', label: 'Todos los estados', icon: '🌐' },
                                      { value: 'Aprobado', label: 'Aprobado', icon: '🟢' },
                                      { value: 'Nueva Publicación', label: 'Nueva Publicación', icon: '🔵' },
                                      { value: 'Pendiente', label: 'Pendiente', icon: '🟡' },
                                      { value: 'Rechazado', label: 'Rechazado', icon: '🔴' }
                                    ].map(opt => (
                                      <button
                                        key={opt.value}
                                        onClick={() => {
                                          setSelectedStatus(opt.value);
                                          setActiveHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                                          selectedStatus === opt.value
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-600'
                                        }`}
                                      >
                                        <span>{opt.icon}</span>
                                        <span>{opt.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 pr-6 text-right font-semibold text-[13px] tracking-wide border-b border-slate-200/80">Herramientas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                           {filteredProperties.map((p, index) => {
                              const dynamicId = p.id || `temp-prop-${index}-${p.createdAt ? new Date(p.createdAt).getTime() : Date.now()}`;
                              if (!p.id) {
                                p.id = dynamicId;
                              }
                              const timeClass = getMarketTimeClass(p.createdAt?.toString());
                              const plan = parsePlanFromProperty(p as any);
                              
                              // Check actual owner phone format and prefill WhatsApp text
                              const ownerPhone = (p as any).owner?.phone || (p as any).owner?.whatsappPhone || '59170000000';
                              let formattedPhone = ownerPhone.replace(/\D/g, '');
                              if (formattedPhone.length === 8) {
                                formattedPhone = '591' + formattedPhone;
                              }
                              const ownerName = (p as any).owner?.name || 'Propietario';
                              const auditMessage = `Hola ${ownerName}, te saluda el equipo de administración de Propio. Estamos revisando los documentos de tu inmueble "${p.title}".`;
                              const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(auditMessage)}`;
 
                              return (
                                <tr key={`${p.id}-${p.ownerId || 'admin'}`} className="hover:bg-slate-50/60 border-b border-slate-100 transition-all duration-150">
                                  <td className="py-5 px-6">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <p className="font-black text-[#04045E] uppercase tracking-tight">{p.title}</p>
                                      {(() => {
                                        const requiredTypes = ['FR', 'CT', 'TS', 'IM', 'PU', 'CI'];
                                        const rigidPrefixMap: Record<string, string> = {
                                          FR: 'FOLIO REAL',
                                          CT: 'CERTIFICAD',
                                          TS: 'TESTIMONIO',
                                          IM: 'IMPUESTOS ',
                                          PU: 'PLANO DE U',
                                          OD: 'OTROS DOCU',
                                          CI: 'CÉDULA DE '
                                        };
                                        const docs = p.documents || [];
                                        const allApproved = Array.isArray(docs) && requiredTypes.every(type => {
                                          const prefix = rigidPrefixMap[type];
                                          const doc = docs.find((d: any) => 
                                            d.fileType?.toUpperCase() === type ||
                                            (prefix && String(d.docName || d.name || d.fileType || '').toUpperCase().includes(prefix))
                                          );
                                          return doc?.status === 'APPROVED';
                                        });

                                        return allApproved ? (
                                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs" title="Documentación Verificada al 100%">
                                            🛡️ Verificada
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">📍 {p.location && typeof p.location === 'object' ? (p.location as any).address : (p.location || 'Cochabamba')}</p>
                                  </td>
                                  <td className="py-5 px-6">
                                    {(() => {
                                      const badge = getMarketTimeBadge(p.createdAt?.toString());
                                      return (
                                        <span className={badge.className}>
                                          {badge.text}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="py-5 px-3">
                                    {(() => {
                                      const planKey = parsePlanFromProperty(p as any);
                                      let badgeClass = '';
                                      let label = '';
                                      if (planKey === 'gratis') {
                                        badgeClass = 'bg-slate-50 text-slate-700 border border-slate-200/60';
                                        label = 'Gratis';
                                      } else if (planKey === 'venta_pro') {
                                        badgeClass = 'bg-blue-50 text-blue-600 border border-blue-200/40';
                                        label = 'Venta Pro';
                                      } else if (planKey === 'contenidos') {
                                        badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200/40';
                                        label = 'Contenidos';
                                      } else if (planKey === 'cierre_garantizado') {
                                        badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200/40';
                                        label = 'Cierre Garantizado';
                                      }
                                      return (
                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-block ${badgeClass}`}>
                                          {label}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  {/* [DOC_AUDIT_SINGLE_BUTTON] — Botón único VER DOCUMENTOS */}
                                  <td className="py-5 px-6">
                                    <ViewDocumentsButton entityId={p.id} entityType="property" />
                                  </td>
                                  <td className="py-5 px-6">
                                    {p.status === 'borrada_por_propietario' ? (
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider inline-block">
                                          PROPIEDAD_BORRADA
                                        </span>
                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block" title="Esta propiedad fue borrada">
                                          Esta propiedad fue borrada ⚠️
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                          p.status === 'APROBADO' 
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                            : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                        }`}>
                                          {p.status}
                                        </span>
                                        {p.status === 'pendiente' && (
                                          <p className="text-[9px] text-red-500 font-extrabold mt-1 uppercase tracking-wider leading-tight">
                                            Modificado por el dueño - Requiere Re-aprobación
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </td>
                                  <td className="py-5 px-6 text-right pr-6">
                                    <div className="relative flex justify-end gap-2.5 items-center">
                                      {/* Controles de Moderación para propiedades pendientes o personalizadas */}
                                      {p.status === 'borrada_por_propietario' ? (
                                        <div className="flex gap-1.5 items-center mr-1">
                                          <button
                                            disabled
                                            className="px-2.5 py-1.5 bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none rounded-lg font-bold text-[10px] tracking-wide"
                                          >
                                            Permitir
                                          </button>
                                          <button
                                            disabled
                                            className="px-2.5 py-1.5 bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none rounded-lg font-bold text-[10px] tracking-wide"
                                          >
                                            Rechazar
                                          </button>
                                          <button
                                            disabled
                                            className="px-2.5 py-1.5 bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none rounded-lg font-bold text-[10px] tracking-wide"
                                          >
                                            Observar
                                          </button>
                                        </div>
                                      ) : (
                                        (p.status === 'PENDIENTE' || p.status === 'NUEVA_PUBLICACION' || !p.status || p.status.toLowerCase() === 'pendiente' || p.id.startsWith('PROP-CUSTOM-')) && p.status !== 'APROBADO' && p.status !== 'RECHAZADO' && p.status !== 'OBSERVADO' && (
                                          <div className="flex gap-1.5 items-center mr-1">
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleModerateCustomProperty(p.id, 'APROBADO');
                                              }}
                                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] tracking-wide shadow-xs cursor-pointer transition-all"
                                              title="Permitir / Aprobar"
                                            >
                                              Permitir
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleModerateCustomProperty(p.id, 'RECHAZADO');
                                              }}
                                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] tracking-wide shadow-xs cursor-pointer transition-all"
                                              title="Rechazar"
                                            >
                                              Rechazar
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleModerateCustomProperty(p.id, 'OBSERVADO');
                                              }}
                                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] tracking-wide shadow-xs cursor-pointer transition-all"
                                              title="Observar"
                                            >
                                              Observar
                                            </button>
                                          </div>
                                        )
                                      )}
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleStartEdit(p);
                                        }}
                                        className="text-slate-400 hover:text-[#04045E] text-xs font-bold transition-all hover:scale-110 active:scale-90"
                                        title="Editar Ficha de Inmueble"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteProperty(p.id);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 text-xs font-bold transition-all hover:scale-110 active:scale-90"
                                        title="Eliminar permanentemente"
                                      >
                                        🗑️
                                      </button>
                                      <a
                                        href={whatsappLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        }}
                                        className="w-7 h-7 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-xl flex items-center justify-center shadow-xs transition-all hover:scale-105 active:scale-95"
                                        title="Contactar al Propietario vía WhatsApp"
                                      >
                                        💬
                                      </a>

                                      {/* Export Property Data Button (📥) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleExportPropertyData(p);
                                        }}
                                        className="hidden w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs"
                                        title="Exportar datos JSON"
                                      >
                                        📥
                                      </button>

                                      {/* Download Full Property Zip Button (📥) */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          handleDownloadFullPropertyZip(p);
                                        }}
                                        disabled={processingZipId === p.id}
                                        className={`hidden w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs ${
                                          processingZipId === p.id
                                            ? 'bg-amber-600 text-white pointer-events-none'
                                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                                        }`}
                                        title="Descargar ZIP completo (Datos + Fotos + Docs)"
                                      >
                                        {processingZipId === p.id ? (
                                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                          </svg>
                                        ) : (
                                          '📥'
                                        )}
                                      </button>

                                      {/* Map Action Button (🗺️) */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setActiveMapPopoverId(activeMapPopoverId === p.id ? null : p.id);
                                        }}
                                        className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/60 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer text-sm map-popover-trigger"
                                        title="Vista previa cartográfica"
                                      >
                                        🗺️
                                      </button>

                                      {/* Download Dossier Action Button (📥) */}
                                      <button
                                        onClick={(e) => handleDownloadDossier(p.id, e)}
                                        className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200/60 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer text-sm"
                                        title="Descargar Dossier Completo (PDF)"
                                      >
                                        📥
                                      </button>

                                      {/* Contextual Map Popover */}
                                      {activeMapPopoverId === p.id && (() => {
                                        const lat = p.location?.coordinates?.lat ?? p.latitude ?? p.lat ?? -17.3895;
                                        const lng = p.location?.coordinates?.lng ?? p.longitude ?? p.lng ?? -66.1568;
                                        return (
                                          <div
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                            }}
                                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center text-left font-normal"
                                          >
                                            <div className="relative w-[500px] h-[430px] bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex flex-col">
                                              {/* Close Button */}
                                              <button 
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  setActiveMapPopoverId(null);
                                                }}
                                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 font-bold z-50 cursor-pointer text-base bg-transparent border-0"
                                                title="Cerrar"
                                              >
                                                ✕
                                              </button>
                                              
                                              {/* Micro-banner */}
                                              <div className="bg-slate-900 text-white rounded-xl p-3 text-xs mb-3 flex justify-between items-center pr-8">
                                                <span className="font-bold truncate max-w-[250px]" title={p.title}>{p.title}</span>
                                                <span className="font-extrabold text-[#b9fa3c] shrink-0 ml-1">
                                                  ${Number(p.price || 0).toLocaleString()} USD
                                                </span>
                                              </div>

                                              {/* Map Engine - Iframe OpenStreetMap (Ponytail approach: robust, lightweight, native) */}
                                              <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-100 bg-slate-50">
                                                <iframe
                                                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.003}%2C${lat - 0.002}%2C${lng + 0.003}%2C${lat + 0.002}&layer=mapnik&marker=${lat}%2C${lng}`}
                                                  className="w-full h-full border-none"
                                                  title={`Ubicación de ${p.title}`}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })()}

                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: AGENTES */}
              {/* ========================================== */}
              {activeTab === 'agents' && (
                <div className="space-y-6">
                  {/* KPI row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">TOTAL AGENTES DE LA RED</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{computedAgentKpis.totalActive} Agentes</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Top Destacados (★4.5 para mas+)</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{computedAgentKpis.topRated} Asesores</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Volumen de Cierres (Mes)</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">${computedAgentKpis.closuresVolume.toLocaleString()} USD</span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Comisiones Liquidadas</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">${computedAgentKpis.commissionsTotal.toLocaleString()} USD</span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        exportDataToExcel(filteredAgents, 'Reporte_Agentes');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      Exportar Excel 📊
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddAgentModal(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      Añadir Nuevo Agente 👤
                    </button>
                  </div>

                  {/* Dual Tables: Fuerza de ventas & Historial Colaboración */}
                  <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider border-b pb-3 mb-4">Fuerza de Ventas</h3>
                    <div className="overflow-x-auto pb-32 scrollbar-thin scrollbar-thumb-slate-200">
                      <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
                        <thead className="relative z-40 bg-slate-50">
                          <tr className="bg-slate-50 text-[13px] font-semibold uppercase text-slate-600 border-b border-slate-200/80 select-none">
                            <th className="py-5 px-6 border-b border-slate-200/80 font-semibold text-[13px] tracking-wide">ID Agente</th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveAgentHeaderFilter(prev => prev === 'nombre' ? null : 'nombre');
                                }}
                                className="agent-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Nombre {selectedAgentNames.length > 0 ? `(${selectedAgentNames.length})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeAgentHeaderFilter === 'nombre' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="agent-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    <input
                                      type="text"
                                      placeholder="Buscar agente..."
                                      value={agentNameSearchQuery}
                                      onChange={(e) => setAgentNameSearchQuery(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal normal-case tracking-normal"
                                    />
                                    <div className="max-h-[150px] overflow-y-auto flex flex-col gap-1.5 pr-1">
                                      {Array.from(new Set(agents.map(a => a.name.toUpperCase()))).filter(name =>
                                        name.toLowerCase().includes(agentNameSearchQuery.toLowerCase())
                                      ).map(name => {
                                        const isChecked = selectedAgentNames.includes(name);
                                        return (
                                          <label key={name} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {
                                                if (isChecked) {
                                                  setSelectedAgentNames(prev => prev.filter(n => n !== name));
                                                } else {
                                                  setSelectedAgentNames(prev => [...prev, name]);
                                                }
                                              }}
                                              className="rounded border-slate-350 text-[#04045E] focus:ring-[#04045E]"
                                            />
                                            {name}
                                          </label>
                                        );
                                      })}
                                    </div>
                                    {selectedAgentNames.length > 0 && (
                                      <button
                                        onClick={() => setSelectedAgentNames([])}
                                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold text-left hover:underline cursor-pointer"
                                      >
                                        Limpiar filtros
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 border-b border-slate-200/80 font-semibold text-[13px] tracking-wide">Contacto</th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveAgentHeaderFilter(prev => prev === 'comision' ? null : 'comision');
                                }}
                                className="agent-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Comisión Base {selectedAgentCommission !== 'Todos' ? `(${selectedAgentCommission})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeAgentHeaderFilter === 'comision' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="agent-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['Todos', '1.5%', '2.0%', 'Custom'] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          setSelectedAgentCommission(opt);
                                          setActiveAgentHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                                          selectedAgentCommission === opt 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'text-slate-600'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveAgentHeaderFilter(prev => prev === 'reparto' ? null : 'reparto');
                                }}
                                className="agent-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Reparto {selectedAgentSplit !== 'Todos los repartos' ? `(${selectedAgentSplit})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeAgentHeaderFilter === 'reparto' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="agent-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['Todos los repartos', '50% / 50%', '45% / 55%', '70% / 30%'] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          setSelectedAgentSplit(opt);
                                          setActiveAgentHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                                          selectedAgentSplit === opt 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'text-slate-600'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveAgentHeaderFilter(prev => prev === 'ventas' ? null : 'ventas');
                                }}
                                className="agent-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Ventas {selectedAgentSales !== 'Todos' ? `(Filtrado)` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeAgentHeaderFilter === 'ventas' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="agent-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['Todos', 'Sin Ventas ($0 USD)', 'Más de $50,000 USD', 'Más de $200,000 USD'] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          setSelectedAgentSales(opt);
                                          setActiveAgentHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                                          selectedAgentSales === opt 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'text-slate-600'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveAgentHeaderFilter(prev => prev === 'rating' ? null : 'rating');
                                }}
                                className="agent-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-semibold text-[13px] tracking-wide">Rating {selectedAgentRating !== 'Todos' ? `(${selectedAgentRating})` : ''}</span>
                                <span className="text-[11px] font-bold ml-1.5">▼</span>
                                {activeAgentHeaderFilter === 'rating' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="agent-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['Todos', '5.0 Estrellas', '4.5 o más', 'Menos de 4.5'] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          setSelectedAgentRating(opt);
                                          setActiveAgentHeaderFilter(null);
                                        }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${
                                          selectedAgentRating === opt 
                                            ? 'bg-slate-100 text-slate-900' 
                                            : 'text-slate-600'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>
                            <th className="py-5 px-6 border-b border-slate-200/80 font-semibold text-[13px] tracking-wide text-center">APTITUD</th>
                            <th className="py-5 px-6 pr-6 text-right font-semibold text-[13px] tracking-wide border-b border-slate-200/80">Herramientas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                          {filteredAgents.length === 0 && (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold text-xs">
                                No hay registros registrados en el sistema.
                              </td>
                            </tr>
                          )}
                          {filteredAgents.map(agt => (
                            <tr key={agt.id} className="hover:bg-slate-50/60 border-b border-slate-100 transition-all duration-150">
                              <td className="py-5 px-6 font-bold text-slate-400">{agt.id}</td>
                              <td className="py-5 px-6 font-black text-[#04045E] uppercase">
                                {agt.name}
                                {agt.status === 'pendiente' && (
                                  <span className="ml-2 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                                    POSTULANTE PENDING
                                  </span>
                                )}
                              </td>
                              <td className="py-5 px-6 text-[10px] text-slate-500">
                                <span className="font-bold">{agt.email}</span>
                                <br/>
                                <span className="text-slate-400">{agt.phone}</span>
                              </td>
                              <td className="py-5 px-6 font-black">
                                {agt.status === 'pendiente' ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      placeholder="%"
                                      value={tempCommissions[agt.id] !== undefined ? tempCommissions[agt.id] : ''}
                                      onChange={(e) => setTempCommissions({ ...tempCommissions, [agt.id]: Number(e.target.value) })}
                                      className="w-16 h-8 px-2 border rounded text-center text-sm"
                                    />
                                    <span>%</span>
                                  </div>
                                ) : (
                                  `${agt.commissionRate}%`
                                )}
                              </td>
                              <td className="py-5 px-6">
                                <div className="flex items-center gap-1">
                                  <span className="bg-blue-50 text-[#0066ff] px-2 py-0.5 rounded text-[10px] font-black">🏢 {agt.splitPropio}%</span>
                                  <span className="text-slate-300">/</span>
                                  <span className="bg-[#b9fa3c]/20 text-[#04045E] px-2 py-0.5 rounded text-[10px] font-black">👤 {agt.splitAgent}%</span>
                                </div>
                              </td>
                              <td className="py-5 px-6 font-bold">${agt.salesVolume.toLocaleString()} USD</td>
                              <td className="py-5 px-6 font-black text-amber-600">⭐ {agt.rating}</td>
                              <td className="text-center font-mono font-semibold text-slate-700 text-xs px-3 py-2">
                                {agt.aptitude ?? '--'}
                              </td>
                              <td className="py-5 px-6 text-right pr-6">
                                <div className="flex items-center justify-end gap-2.5">
                                  {agt.status === 'pendiente' ? (
                                    <button
                                      onClick={() => handleApproveAgent(agt.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      Permitir / Aprobar
                                    </button>
                                  ) : (
                                    <>
                                      {/* BOTÓN 1: EDICIÓN COMPLETA DE FICHA */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditingAgent(agt);
                                        }}
                                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-sm"
                                        title="Editar Ficha"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                      </button>

                                      {/* BOTÓN 2: ELIMINACIÓN PERMANENTE */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDeletingAgent(agt);
                                        }}
                                        className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer text-sm"
                                        title="Eliminar Agente"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                      </button>
                                    </>
                                  )}

                                  {/* BOTÓN 3: CONEXIÓN AUTOMATIZADA POR WHATSAPP */}
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${agt.phone.replace(/[^\d+]/g, '')}&text=${encodeURIComponent('Hola , nos comunicamos de propioinmuebles.com , nos gustaria saber ')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(e.currentTarget.href, '_blank');
                                    }}
                                    className="w-7 h-7 bg-[#25D366] hover:brightness-105 rounded-full shadow-sm text-white flex items-center justify-center transition-all"
                                    title="Enviar WhatsApp"
                                  >
                                    <span className="text-sm">💬</span>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PROSPECTOS */}
              {/* ========================================== */}
              {activeTab === 'prospects' && (
                <div className="space-y-6">
                  {/* KPI cards — reactive from filteredProspects */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* TARJETA 1: TOTAL LEADS */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Leads Último Mes</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{filteredProspects.length} Prospectos</span>
                    </div>

                    {/* TARJETA 2: VISITAS AGENDADAS */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Visitas Agendadas</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">
                        {filteredProspects.filter(p => p.status === 'VISITA_AGENDADA').length} Visita{filteredProspects.filter(p => p.status === 'VISITA_AGENDADA').length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* TARJETA 3: PROCEDENCIA PRINCIPAL */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Procedencia Principal</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">{dominantTrafficSource}</span>
                      {sortedTrafficEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
                          {sortedTrafficEntries.map(([src, cnt]) => {
                            const isWA = src === 'WHATSAPP' || src === 'WEB';
                            const isRec = src === 'RECOMENDADO';
                            const cls = isWA
                              ? 'bg-green-50 text-green-600 border border-green-200/40'
                              : isRec
                              ? 'bg-blue-50 text-blue-600 border border-blue-200/40'
                              : 'bg-slate-50 text-slate-600 border border-slate-200/40';
                            return (
                              <span key={src} className={`${cls} px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase`}>
                                {src}: {cnt}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* TARJETA 4: LEADS PENDIENTES */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Leads Pendientes</span>
                      <span className="text-2xl font-black text-rose-500 mt-1 block">
                        {filteredProspects.filter(p => p.status === 'PENDIENTE').length} Lead{filteredProspects.filter(p => p.status === 'PENDIENTE').length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    {/* Active filter chips */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedProspectIds.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-[#04045E]/8 text-[#04045E] border border-[#04045E]/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          ID: {selectedProspectIds.join(', ')}
                          <button onClick={() => setSelectedProspectIds([])} className="ml-0.5 text-[#04045E]/60 hover:text-[#04045E] cursor-pointer">✕</button>
                        </span>
                      )}
                      {selectedProspectNames.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Nombre: {selectedProspectNames.length}
                          <button onClick={() => setSelectedProspectNames([])} className="ml-0.5 text-blue-500 hover:text-blue-800 cursor-pointer">✕</button>
                        </span>
                      )}
                      {prospectContactSearch && (
                        <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Contacto: &quot;{prospectContactSearch}&quot;
                          <button onClick={() => setProspectContactSearch('')} className="ml-0.5 cursor-pointer">✕</button>
                        </span>
                      )}
                      {selectedProspectInterests.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Propiedad: {selectedProspectInterests.length}
                          <button onClick={() => setSelectedProspectInterests([])} className="ml-0.5 cursor-pointer">✕</button>
                        </span>
                      )}
                      {prospectBudgetFilter !== 'Todos' && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {prospectBudgetFilter}
                          <button onClick={() => setProspectBudgetFilter('Todos')} className="ml-0.5 cursor-pointer">✕</button>
                        </span>
                      )}
                      {selectedProspectSources.length > 0 && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          Origen: {selectedProspectSources.join(', ')}
                          <button onClick={() => setSelectedProspectSources([])} className="ml-0.5 cursor-pointer">✕</button>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); exportDataToExcel(filteredProspects, 'Reporte_Prospectos'); }}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      Exportar Excel 📊
                    </button>
                  </div>

                  {/* Table — VISTA PREVIA DE PROSPECTOS with interactive column filters */}
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <div className="overflow-x-auto pb-32">
                      <table className="w-full text-left border-collapse">
                        <thead className="relative z-40 bg-slate-50">
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200/80 select-none">

                            {/* ── COL: ID PROSPECTO ▼ ── */}
                            <th className="p-4 pl-6 relative">
                              <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProspectHeaderFilter(prev => prev === 'id' ? null : 'id'); }}
                                className="prospect-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-black text-[9px] tracking-wide">ID Prospecto {selectedProspectIds.length > 0 ? `(${selectedProspectIds.length})` : ''}</span>
                                <span className="text-[10px] font-bold">▼</span>
                                {activeProspectHeaderFilter === 'id' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="prospect-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {prospects.map(pr => {
                                      const isChecked = selectedProspectIds.includes(pr.id);
                                      return (
                                        <label key={pr.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => setSelectedProspectIds(prev => isChecked ? prev.filter(x => x !== pr.id) : [...prev, pr.id])}
                                            className="rounded border-slate-300 text-[#04045E] focus:ring-[#04045E]"
                                          />
                                          {pr.id}
                                        </label>
                                      );
                                    })}
                                    {selectedProspectIds.length > 0 && (
                                      <button onClick={() => setSelectedProspectIds([])} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold text-left px-2.5 pt-1 hover:underline cursor-pointer">Limpiar filtros</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>

                            {/* ── COL: NOMBRE ▼ ── */}
                            <th className="p-4 relative">
                              <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProspectHeaderFilter(prev => prev === 'nombre' ? null : 'nombre'); }}
                                className="prospect-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-black text-[9px] tracking-wide">Nombre {selectedProspectNames.length > 0 ? `(${selectedProspectNames.length})` : ''}</span>
                                <span className="text-[10px] font-bold">▼</span>
                                {activeProspectHeaderFilter === 'nombre' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="prospect-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {Array.from(new Set(prospects.map(p => p.name.toUpperCase()))).map(name => {
                                      const isChecked = selectedProspectNames.includes(name);
                                      return (
                                        <label key={name} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => setSelectedProspectNames(prev => isChecked ? prev.filter(x => x !== name) : [...prev, name])}
                                            className="rounded border-slate-300 text-[#04045E] focus:ring-[#04045E]"
                                          />
                                          {name}
                                        </label>
                                      );
                                    })}
                                    {selectedProspectNames.length > 0 && (
                                      <button onClick={() => setSelectedProspectNames([])} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold text-left px-2.5 pt-1 hover:underline cursor-pointer">Limpiar filtros</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>

                            {/* ── COL: CONTACTO ▼ ── */}
                            <th className="p-4 relative">
                              <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProspectHeaderFilter(prev => prev === 'contacto' ? null : 'contacto'); }}
                                className="prospect-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-black text-[9px] tracking-wide">Contacto {prospectContactSearch ? '(1)' : ''}</span>
                                <span className="text-[10px] font-bold">▼</span>
                                {activeProspectHeaderFilter === 'contacto' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="prospect-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buscar por email o teléfono</span>
                                    <input
                                      type="text"
                                      placeholder="ej: mateo@mail.com o +591..."
                                      value={prospectContactSearch}
                                      onChange={(e) => setProspectContactSearch(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal normal-case tracking-normal"
                                    />
                                    {prospectContactSearch && (
                                      <button onClick={() => setProspectContactSearch('')} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold text-left hover:underline cursor-pointer">Limpiar</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>

                            {/* ── COL: PROPIEDAD DE INTERÉS ▼ ── */}
                            <th className="p-4 relative">
                              <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProspectHeaderFilter(prev => prev === 'propiedad' ? null : 'propiedad'); }}
                                className="prospect-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-black text-[9px] tracking-wide">Propiedad de Interés {selectedProspectInterests.length > 0 ? `(${selectedProspectInterests.length})` : ''}</span>
                                <span className="text-[10px] font-bold">▼</span>
                                {activeProspectHeaderFilter === 'propiedad' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="prospect-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {Array.from(new Set(prospects.map(p => p.interest))).map(interest => {
                                      const isChecked = selectedProspectInterests.includes(interest);
                                      return (
                                        <label key={interest} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => setSelectedProspectInterests(prev => isChecked ? prev.filter(x => x !== interest) : [...prev, interest])}
                                            className="rounded border-slate-300 text-[#04045E] focus:ring-[#04045E]"
                                          />
                                          {interest}
                                        </label>
                                      );
                                    })}
                                    {selectedProspectInterests.length > 0 && (
                                      <button onClick={() => setSelectedProspectInterests([])} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold text-left px-2.5 pt-1 hover:underline cursor-pointer">Limpiar filtros</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>

                            {/* ── COL: PRESUPUESTO ▼ ── */}
                            <th className="p-4 relative">
                              <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProspectHeaderFilter(prev => prev === 'presupuesto' ? null : 'presupuesto'); }}
                                className="prospect-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-black text-[9px] tracking-wide">Presupuesto {prospectBudgetFilter !== 'Todos' ? '(Filtrado)' : ''}</span>
                                <span className="text-[10px] font-bold">▼</span>
                                {activeProspectHeaderFilter === 'presupuesto' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="prospect-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['Todos', 'Menos de $100,000 USD', '$100,000 USD - $200,000 USD', 'Más de $200,000 USD'] as const).map(opt => (
                                      <button
                                        key={opt}
                                        onClick={() => { setProspectBudgetFilter(opt); setActiveProspectHeaderFilter(null); }}
                                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer ${prospectBudgetFilter === opt ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </th>

                            {/* ── COL: ORIGEN ▼ ── */}
                            <th className="p-4 relative">
                              <div
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setActiveProspectHeaderFilter(prev => prev === 'origen' ? null : 'origen'); }}
                                className="prospect-header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 px-2 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg"
                              >
                                <span className="font-black text-[9px] tracking-wide">Origen {selectedProspectSources.length > 0 ? `(${selectedProspectSources.length})` : ''}</span>
                                <span className="text-[10px] font-bold">▼</span>
                                {activeProspectHeaderFilter === 'origen' && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="prospect-header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                  >
                                    {(['TIKTOK', 'WHATSAPP', 'RECOMENDADO'] as const).map(src => {
                                      const isChecked = selectedProspectSources.includes(src);
                                      return (
                                        <label key={src} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => setSelectedProspectSources(prev => isChecked ? prev.filter(x => x !== src) : [...prev, src])}
                                            className="rounded border-slate-300 text-[#04045E] focus:ring-[#04045E]"
                                          />
                                          {src}
                                        </label>
                                      );
                                    })}
                                    {selectedProspectSources.length > 0 && (
                                      <button onClick={() => setSelectedProspectSources([])} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold text-left px-2.5 pt-1 hover:underline cursor-pointer">Limpiar filtros</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </th>

                            {/* ── COL: RESPONSABLE ───────────────── */}
                            <th className="p-4 font-black text-[9px] tracking-wide">Responsable</th>

                            {/* ── COL: ESTADO (no filter) ───────── */}
                            <th className="p-4 text-right font-black text-[9px] tracking-wide border-b-0">Estado</th>

                            {/* ── COL: HERRAMIENTAS ───────────────── */}
                            <th className="p-4 pr-6 text-right font-black text-[9px] tracking-wide">HERRAMIENTAS</th>

                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {filteredProspects.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 text-xs font-semibold">
                                No hay prospectos que coincidan con los filtros activos.
                              </td>
                            </tr>
                          ) : filteredProspects.map(pr => (
                            <tr key={pr.id} className="hover:bg-slate-50/60 transition-all duration-150">
                              <td className="p-4 pl-6 font-bold text-slate-400">{pr.id}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{pr.name}</td>
                              <td className="p-4 text-[10px] text-slate-500">{pr.email}<br/>{pr.phone}</td>
                              <td className="p-4 font-bold text-slate-600">{pr.interest}</td>
                              <td className="p-4 font-black">${pr.budget.toLocaleString()} USD</td>
                              {/* ORIGEN */}
                              <td className="p-4">
                                <span className="bg-[#b9fa3c]/20 text-[#04045E] text-[8px] font-black px-2 py-0.5 rounded uppercase">
                                  {pr.source}
                                </span>
                              </td>
                              {/* RESPONSABLE */}
                              <td className="p-4">
                                {pr.assignedAgent
                                  ? (
                                    <span className="font-semibold text-slate-800 text-xs">
                                      {pr.assignedAgent}
                                      <span className="bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono ml-2">
                                        Agente
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-md text-xs font-bold inline-flex items-center justify-center">
                                      Sin Asignar
                                    </span>
                                  )
                                }
                              </td>
                              <td className="p-4 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  pr.status === 'VISITA_AGENDADA'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : pr.status === 'CONTACTADO'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}>
                                  {pr.status}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  {/* WhatsApp circular button */}
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${pr.phone.replace(/[^\d+]/g, '')}&text=${encodeURIComponent('Hola, nos comunicamos de Propio Inmuebles. Quisiera ponerme en contacto contigo referente al inmueble de tu interés.')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(e.currentTarget.href, '_blank');
                                    }}
                                    className="w-7 h-7 bg-[#25D366] hover:brightness-105 rounded-full shadow-sm text-white flex items-center justify-center transition-all hover:scale-115 active:scale-90"
                                    title="Iniciar Conversación WhatsApp"
                                  >
                                    <span className="text-xs">💬</span>
                                  </a>

                                  {/* Edit circular button */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingProspect(pr);
                                    }}
                                    className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full shadow-sm flex items-center justify-center transition-all hover:scale-115 active:scale-90 cursor-pointer"
                                    title="Editar Prospecto"
                                  >
                                    <span className="text-xs">✏️</span>
                                  </button>

                                  {/* Location circular button */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const matched = properties.find(p => p.title === pr.interest || p.id === (pr as any).propertyId);
                                      alert(`📍 Centroide del Inmueble de Interés:\n\nInmueble: ${pr.interest}\nCoordenadas: ${matched && matched.latitude ? `${matched.latitude}, ${matched.longitude}` : 'No parametrizadas'}\nUbicación: ${matched ? matched.address || matched.location : 'Cochabamba, Bolivia'}`);
                                    }}
                                    className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full border border-blue-200/50 shadow-sm flex items-center justify-center transition-all hover:scale-115 active:scale-90 cursor-pointer"
                                    title="Ver Ubicación del Inmueble"
                                  >
                                    <span className="text-xs">📍</span>
                                  </button>

                                  {/* Delete circular button */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (window.confirm(`¿Estás seguro de eliminar el prospecto comercial de ${pr.name}?`)) {
                                        const token = getToken() || '';
                                        apiClient.deleteWithAuth(`/leads/${pr.id}`, token).catch(err => console.error(err));
                                        setProspects(prospects.filter(p => p.id !== pr.id));
                                      }
                                    }}
                                    className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-full border border-red-200/50 shadow-sm flex items-center justify-center transition-all hover:scale-115 active:scale-90 cursor-pointer"
                                    title="Eliminar Prospecto"
                                  >
                                    <span className="text-xs">🗑️</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              )}

              {/* ========================================== */}
              {/* TAB: PROPIETARIOS */}
              {/* ========================================== */}
              {activeTab === 'owners' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Propietarios</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">
                        {filteredOwners.length} Cliente{filteredOwners.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Ganancia para PROPIO</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">
                        ${calculatedRevenue.toLocaleString()} USD
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Propiedades Activas Propietarios</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">
                        {calculatedProperties} Propiedade{calculatedProperties !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Planes Premium Activos</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">
                        {calculatedPremium} Premium
                      </span>
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex justify-end gap-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <button
                      onClick={exportOwnersExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      Exportar Excel 📊
                    </button>
                  </div>

                  {/* Table */}
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
                    <div className="overflow-x-auto pb-32">
                      <table className="w-full text-left border-collapse">
                        <thead className="relative z-40 bg-slate-50">
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b select-none">
                            <th className="p-4 pl-6 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'id' ? null : 'id');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg px-2"
                              >
                                <span className="font-semibold text-[9px] tracking-wide">ID Propietario {selectedOwnerIds.length > 0 ? `(${selectedOwnerIds.length})` : ''}</span>
                                <span className="text-[9px] font-bold ml-1">▼</span>
                              </div>
                              {activeHeaderFilter === 'id' && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                >
                                  <div className="px-1 py-0.5">
                                    <input
                                      type="text"
                                      placeholder="Buscar ID..."
                                      value={ownerIdSearch}
                                      onChange={(e) => setOwnerIdSearch(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal normal-case tracking-normal"
                                    />
                                  </div>
                                  <div className="max-h-36 overflow-y-auto pr-1 space-y-0.5">
                                    {allOwnerIds
                                      .filter((id: string) => id.toLowerCase().includes(ownerIdSearch.toLowerCase()))
                                      .map((id: string) => {
                                        const isChecked = selectedOwnerIds.includes(id);
                                        return (
                                          <label
                                            key={id}
                                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {
                                                setSelectedOwnerIds(prev => 
                                                  isChecked 
                                                    ? prev.filter(x => x !== id) 
                                                    : [...prev, id]
                                                );
                                              }}
                                              className="rounded border-slate-350 text-[#04045E] focus:ring-[#04045E]"
                                            />
                                            <span>{id}</span>
                                          </label>
                                        );
                                      })}
                                  </div>
                                  {selectedOwnerIds.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedOwnerIds([]);
                                        setOwnerIdSearch('');
                                      }}
                                      className="w-full text-center py-1 text-[10px] font-black uppercase text-red-500 hover:bg-red-550 rounded-lg transition-all"
                                    >
                                      Limpiar Filtro
                                    </button>
                                  )}
                                </div>
                              )}
                            </th>
                            <th className="p-4 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'nombre' ? null : 'nombre');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg px-2"
                              >
                                <span className="font-semibold text-[9px] tracking-wide">Nombre {selectedOwnerNames.length > 0 ? `(${selectedOwnerNames.length})` : ''}</span>
                                <span className="text-[9px] font-bold ml-1">▼</span>
                              </div>
                              {activeHeaderFilter === 'nombre' && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                >
                                  <div className="px-1 py-0.5">
                                    <input
                                      type="text"
                                      placeholder="Buscar Nombre..."
                                      value={ownerNameSearch}
                                      onChange={(e) => setOwnerNameSearch(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal normal-case tracking-normal"
                                    />
                                  </div>
                                  <div className="max-h-36 overflow-y-auto pr-1 space-y-0.5">
                                    {allOwnerNames
                                      .filter((name: string) => name.toLowerCase().includes(ownerNameSearch.toLowerCase()))
                                      .map((name: string) => {
                                        const isChecked = selectedOwnerNames.includes(name);
                                        return (
                                          <label
                                            key={name}
                                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2 cursor-pointer uppercase"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => {
                                                setSelectedOwnerNames(prev => 
                                                  isChecked 
                                                    ? prev.filter(x => x !== name) 
                                                    : [...prev, name]
                                                );
                                              }}
                                              className="rounded border-slate-350 text-[#04045E] focus:ring-[#04045E]"
                                            />
                                            <span>{name}</span>
                                          </label>
                                        );
                                      })}
                                  </div>
                                  {selectedOwnerNames.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedOwnerNames([]);
                                        setOwnerNameSearch('');
                                      }}
                                      className="w-full text-center py-1 text-[10px] font-black uppercase text-red-500 hover:bg-red-555 rounded-lg transition-all"
                                    >
                                      Limpiar Filtro
                                    </button>
                                  )}
                                </div>
                              )}
                            </th>
                            <th className="p-4 relative border-b border-slate-200/80">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setActiveHeaderFilter(prev => prev === 'contacto' ? null : 'contacto');
                                }}
                                className="header-filter-trigger inline-flex items-center gap-1.5 cursor-pointer select-none text-slate-500 hover:text-slate-900 transition-all duration-150 py-1 -mx-2 hover:bg-slate-100/60 rounded-lg px-2"
                              >
                                <span className="font-semibold text-[9px] tracking-wide">Contacto {ownerContactSearch ? '(Activo)' : ''}</span>
                                <span className="text-[9px] font-bold ml-1">▼</span>
                              </div>
                              {activeHeaderFilter === 'contacto' && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="header-filter-dropdown absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 min-w-[240px] w-64 max-w-xs z-50 text-left normal-case tracking-normal font-normal flex flex-col gap-1.5"
                                >
                                  <div className="px-1 py-0.5">
                                    <input
                                      type="text"
                                      placeholder="Buscar email / cel..."
                                      value={ownerContactSearch}
                                      onChange={(e) => setOwnerContactSearch(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal normal-case tracking-normal"
                                    />
                                  </div>
                                  {ownerContactSearch && (
                                    <button
                                      onClick={() => setOwnerContactSearch('')}
                                      className="w-full text-center py-1 text-[10px] font-black uppercase text-red-500 hover:bg-red-555 rounded-lg transition-all"
                                    >
                                      Limpiar Búsqueda
                                    </button>
                                  )}
                                </div>
                              )}
                            </th>
                            <th className="p-4 border-b border-slate-200/80 font-semibold text-[9px] tracking-wide">Cartera de Propiedades</th>
                            <th className="p-4 border-b border-slate-200/80 font-semibold text-[9px] tracking-wide">Plan Activo</th>
                            <th className="p-4 pr-6 text-right border-b border-slate-200/80 font-semibold text-[9px] tracking-wide">HERRAMIENTAS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {filteredOwners.map((own: Owner) => (
                            <tr key={own.id}>
                              <td className="p-4 pl-6 font-bold text-slate-400">{own.id}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{own.name}</td>
                              <td className="p-4 text-[10px] text-slate-500">{own.email}<br/>{own.phone}</td>
                              <td className="p-4 relative owner-portfolio-container">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setActiveOwnerPortfolio(activeOwnerPortfolio === own.id ? null : own.id);
                                  }}
                                  className="bg-slate-50 border border-slate-200/60 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer inline-flex items-center gap-1.5"
                                >
                                  🏠 {own.properties.length} {own.properties.length === 1 ? 'Inmueble' : 'Inmuebles'}
                                </button>

                                {activeOwnerPortfolio === own.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-full right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[220px] z-50 text-left normal-case"
                                  >
                                    {own.properties.length === 0 ? (
                                      <div className="px-2.5 py-1.5 text-xs text-slate-400 italic">
                                        Sin propiedades
                                      </div>
                                    ) : (
                                      <div className="space-y-0.5">
                                        {own.properties.map((propTitle, idx) => {
                                          const property = properties.find(p => p.id === propTitle || p.code === propTitle || p.title.toLowerCase() === propTitle.toLowerCase());
                                          return (
                                            <button
                                              key={idx}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (property) {
                                                  setSelectedProperty(property);
                                                  setModalPropertyData(mapPropertyToNewSchema(property));
                                                  setIsPropertyModalOpen(true);
                                                } else {
                                                  const fallbackProp: any = {
                                                    id: `fallback-${idx}`,
                                                    idLegacy: propTitle,
                                                    title: `Propiedad ${propTitle}`,
                                                    titleLegacy: propTitle,
                                                    description: 'Sin descripción registrada.',
                                                    price: 0,
                                                    priceBob: 0,
                                                    area: 0,
                                                    rooms: 0,
                                                    bathrooms: 0,
                                                    locationLegacy: 'Ubicación no especificada',
                                                    location: {
                                                      address: 'Santa Cruz de la Sierra',
                                                      city: 'Santa Cruz'
                                                    },
                                                    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
                                                    type: 'departamento',
                                                    verified: false,
                                                    status: 'PENDIENTE',
                                                    latLegacy: -17.3895,
                                                    lngLegacy: -66.1568,
                                                    lat: -17.7833,
                                                    lng: -63.1833
                                                  };
                                                  const mappedFallback = mapPropertyToNewSchema(fallbackProp);
                                                  setSelectedProperty(mappedFallback);
                                                  setModalPropertyData(mappedFallback);
                                                  setIsPropertyModalOpen(true);
                                                }
                                              }}
                                              className="w-full block text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors truncate cursor-pointer"
                                            >
                                              🏢 {propTitle}
                                              🏢 {property ? property.title : propTitle}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getPlanBadgeClass(own.plan)}`}>
                                  {getPlanLabel(own.plan)}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex items-center gap-2 justify-end">
                                  <a
                                    href={`https://api.whatsapp.com/send?phone=${own.phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent("Hola , nos comunicamos de propioinmuebles.com , nos gustaria saber ")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      window.open(e.currentTarget.getAttribute('href') || '', '_blank');
                                    }}
                                    className="w-7 h-7 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm hover:brightness-105 transition-all text-xs"
                                    title="WhatsApp"
                                  >
                                    💬
                                  </a>

                                  <button
                                    onClick={(e) => handleExportOwnerZip(own.id, e)}
                                    disabled={loadingOwnerZip === own.id}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all text-xs ${
                                      loadingOwnerZip === own.id
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                                    }`}
                                    title="Exportar cartera completa (ZIP)"
                                  >
                                    {loadingOwnerZip === own.id ? (
                                      <svg className="animate-spin h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                      </svg>
                                    ) : (
                                      '📦'
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setEditingOwner({ ...own });
                                    }}
                                    className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-sm mx-1.5"
                                    title="Editar"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      if (confirm("¿Estás seguro de eliminar permanentemente este registro?")) {
                                        const updated = owners.filter(o => o.id !== own.id);
                                        setOwners(updated);
                                        if (typeof window !== 'undefined') {
                                          localStorage.setItem('propio_admin_owners', JSON.stringify(updated));
                                        }
                                      }
                                    }}
                                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer text-sm"
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                </div>

                                {/* EDIT OWNER MODAL */}
                                {editingOwner && editingOwner.id === own.id && (
                                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden text-left normal-case font-semibold text-slate-700">
                                      <div className="absolute top-0 left-0 right-0 h-2 bg-[#04045E]" />
                                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                        <h3 className="text-sm font-black text-[#04045E] uppercase">Editar Propietario ({editingOwner.id})</h3>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setEditingOwner(null);
                                          }}
                                          className="text-slate-400 hover:text-slate-650 font-bold cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                      <div className="space-y-3">
                                        <div>
                                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Nombre Completo</label>
                                          <input
                                            type="text"
                                            value={editingOwner.name}
                                            onChange={(e) => setEditingOwner({ ...editingOwner, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Correo Electrónico</label>
                                          <input
                                            type="email"
                                            value={editingOwner.email}
                                            onChange={(e) => setEditingOwner({ ...editingOwner, email: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Teléfono</label>
                                          <input
                                            type="text"
                                            value={editingOwner.phone}
                                            onChange={(e) => setEditingOwner({ ...editingOwner, phone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Plan de Suscripción</label>
                                          <select
                                            value={editingOwner.plan}
                                            onChange={(e) => setEditingOwner({ ...editingOwner, plan: e.target.value as any })}
                                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all cursor-pointer"
                                          >
                                            <option value="gratis">Gratuito</option>
                                            <option value="venta_pro">Venta Pro</option>
                                            <option value="cierre_garantizado">Cierre Garantizado</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Estado</label>
                                          <select
                                            value={editingOwner.status}
                                            onChange={(e) => setEditingOwner({ ...editingOwner, status: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all cursor-pointer"
                                          >
                                            <option value="Verificado">Verificado</option>
                                            <option value="Pendiente">Pendiente</option>
                                          </select>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 pt-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setEditingOwner(null);
                                          }}
                                          className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold uppercase hover:bg-slate-50 transition-all cursor-pointer"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const updated = owners.map(o => o.id === editingOwner.id ? editingOwner : o);
                                            setOwners(updated);
                                            if (typeof window !== 'undefined') {
                                              localStorage.setItem('propio_admin_owners', JSON.stringify(updated));
                                            }
                                            setEditingOwner(null);
                                            alert('¡Propietario actualizado con éxito!');
                                          }}
                                          className="flex-1 py-2 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase hover:opacity-95 transition-all cursor-pointer"
                                        >
                                          Guardar Cambios
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: CONSTRUCTORAS */}
              {/* ========================================== */}
              {/* ========================================== */}
              {/* TAB: CONSTRUCTORAS */}
              {/* ========================================== */}
              {activeTab === 'developers' && (() => {
                const stockSum = developers.reduce((sum, d) => sum + d.stock, 0);
                // ponytail: count only projects not delivered as active towers
                const activeProyectosCount = developers.filter(d => d.etapa && !d.etapa.toLowerCase().includes('entregado') && !d.etapa.toLowerCase().includes('finalizado')).length;
                const averageCommissionText = (() => {
                  if (developers.length === 0) return '0% Neto';
                  let sum = 0;
                  let count = 0;
                  developers.forEach(d => {
                    const match = d.esquemaComision.match(/(\d+(\.\d+)?)/);
                    if (match) {
                      sum += parseFloat(match[1]);
                      count++;
                    }
                  });
                  if (count === 0) return '2.75% Neto';
                  return `${(sum / count).toFixed(2).replace(/\.00$/, '')}% Neto`;
                })();

                return (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Constructoras Registradas</span>
                        <span className="text-2xl font-black text-[#04045E] mt-1 block">{developers.length} Empresas</span>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Stock Total Asignado</span>
                        <span className="text-2xl font-black text-[#04045E] mt-1 block">{stockSum} Departamentos</span>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Proyectos Activos</span>
                        <span className="text-2xl font-black text-[#04045E] mt-1 block">{activeProyectosCount} Torres</span>
                      </div>
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Comisión Promedio Pactada</span>
                        <span className="text-2xl font-black text-emerald-600 mt-1 block">{averageCommissionText}</span>
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                      <div>
                        <h2 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                          Módulo de Constructoras
                        </h2>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          Administración y asignación comercial de constructoras asociadas.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsNewDeveloperModalOpen(true)}
                          className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                        >
                          + Añadir constructora
                        </button>
                        <button
                          onClick={() => exportDataToExcel(filteredDevs, 'Reporte_Constructoras')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Exportar Excel 📊
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b select-none">
                              <th className="p-4 pl-6 w-28 relative">
                                <DropdownFilter
                                  title="ID Corporativo"
                                  options={uniqueDevIds}
                                  selectedValues={selectedDevIds}
                                  onFilterChange={setSelectedDevIds}
                                  isOpen={activeHeaderFilter === 'dev-id'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'dev-id' ? null : 'dev-id')}
                                  placeholder="Buscar ID..."
                                />
                              </th>
                              <th className="p-4 w-48 relative">
                                <DropdownFilter
                                  title="Empresa"
                                  options={uniqueDevEmpresas}
                                  selectedValues={selectedDevEmpresas}
                                  onFilterChange={setSelectedDevEmpresas}
                                  isOpen={activeHeaderFilter === 'dev-empresa'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'dev-empresa' ? null : 'dev-empresa')}
                                  placeholder="Buscar Empresa..."
                                />
                              </th>
                              <th className="p-4 w-36 relative">
                                <DropdownFilter
                                  title="NIT"
                                  options={uniqueDevNits}
                                  selectedValues={selectedDevNits}
                                  onFilterChange={setSelectedDevNits}
                                  isOpen={activeHeaderFilter === 'dev-nit'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'dev-nit' ? null : 'dev-nit')}
                                  placeholder="Buscar NIT..."
                                />
                              </th>
                              <th className="p-4 w-40 relative">
                                <DropdownFilter
                                  title="Representante"
                                  options={uniqueDevRepresentantes}
                                  selectedValues={selectedDevRepresentantes}
                                  onFilterChange={setSelectedDevRepresentantes}
                                  isOpen={activeHeaderFilter === 'dev-rep'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'dev-rep' ? null : 'dev-rep')}
                                  placeholder="Buscar Rep..."
                                />
                              </th>
                              <th className="p-4 w-52">Contacto</th>
                              <th className="p-4 w-24">Stock</th>
                              <th className="p-4 w-44">Esquema Comisión</th>
                              <th className="p-4 w-40">Etapa</th>
                              <th className="p-4 pr-6 text-right w-36">Herramientas</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {filteredDevs.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                                  No se encontraron constructoras con los filtros aplicados.
                                </td>
                              </tr>
                            ) : (
                              filteredDevs.map(dev => (
                                <tr key={dev.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-4 pl-6 font-bold text-slate-400">{dev.id}</td>
                                  <td className="p-4 font-black text-[#04045E] uppercase">{dev.empresa}</td>
                                  <td className="p-4 font-mono">{dev.nit}</td>
                                  <td className="p-4 font-bold text-slate-600">{dev.representante}</td>
                                  <td className="p-4 text-[10px] text-slate-400 font-medium">
                                    <div className="flex flex-col">
                                      <span>{dev.contacto.email}</span>
                                      <span className="text-slate-500 mt-0.5">{dev.contacto.phone}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 font-black text-emerald-600">{dev.stock} un.</td>
                                  <td className="p-4 font-bold text-slate-700">{dev.esquemaComision}</td>
                                  <td className="p-4 text-slate-600 font-medium">{dev.etapa}</td>
                                  <td className="p-4 text-right pr-6">
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        onClick={() => setEditingConstructora(dev)}
                                        className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full flex items-center justify-center border border-slate-200/60 shadow-2xs transition-all hover:scale-110 active:scale-90 cursor-pointer"
                                        title="Editar Constructora"
                                      >
                                        ✏️
                                      </button>

                                      {/* Ver Documentos */}
                                      <ViewDocumentsButton entityId={dev.id} entityType="developer" />

                                      {/* WhatsApp */}
                                      <a
                                        href={`https://wa.me/${dev.contacto.phone.replace(/[^\d]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-7 h-7 bg-[#25D366] hover:bg-[#22c35e] text-white rounded-full flex items-center justify-center shadow-xs transition-all hover:scale-110 active:scale-90 cursor-pointer"
                                        title="Contactar al Representante por WhatsApp"
                                      >
                                        💬
                                      </a>

                                      {/* Eliminar */}
                                      <button
                                        onClick={() => setDeletingConstructoraId(dev.id)}
                                        className="w-7 h-7 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full flex items-center justify-center border border-rose-200/60 shadow-2xs transition-all hover:scale-110 active:scale-90 cursor-pointer"
                                        title="Eliminar Constructora"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                              )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* ========================================== */}
              {/* TAB: CONTRATOS */}
              {/* ========================================== */}
              {activeTab === 'contracts' && (
                <div className="space-y-6">
                  {/* KPI cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Volumen Financiero Total</span>
                      <span className="text-2xl font-black text-[#04045E] mt-1 block">
                        ${filteredContracts.reduce((sum, c) => sum + (c.monthlyAmount || 0), 0).toLocaleString()} USD
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Contratos Vigentes</span>
                      <span className="text-2xl font-black text-emerald-600 mt-1 block">
                        {filteredContracts.filter(c => c.status === 'VIGENTE' || (c as any).status === 'Activo').length} Activos
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Renovaciones Pendientes</span>
                      <span className="text-2xl font-black text-amber-500 mt-1 block">
                        {filteredContracts.filter(c => c.status === 'VENCIDO' || (c.status === 'VIGENTE' && (() => { const end = new Date(c.endDate); const now = new Date(); const diff = end.getTime() - now.getTime(); const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24)); return diffDays > 0 && diffDays <= 30; })())).length} Contratos
                      </span>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Contratos Vencidos</span>
                      <span className="text-2xl font-black text-rose-500 mt-1 block">
                        {filteredContracts.filter(c => c.status === 'VENCIDO').length} Vencidos
                      </span>
                    </div>
                  </div>

                  {/* Panel Superior de Filtrado Analítico (Estilo Módulo de Reportes) */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                      <div>
                        <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Auditoría y Vigencia de Contratos</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Supervise la vigencia de contratos e identifique alertas comerciales</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
                        {/* Rango de Fechas */}
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Inicio</span>
                          <input 
                            type="date" 
                            value={filterContractDateStart} 
                            onChange={e => setFilterContractDateStart(e.target.value)} 
                            className="bg-transparent font-bold text-[#04045E] focus:outline-none"
                          />
                          <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Fin</span>
                          <input 
                            type="date" 
                            value={filterContractDateEnd} 
                            onChange={e => setFilterContractDateEnd(e.target.value)} 
                            className="bg-transparent font-bold text-[#04045E] focus:outline-none"
                          />
                        </div>

                        {/* Tipo de Filtro / Estado Documental */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                          <span className="text-[9px] font-black text-slate-400 uppercase mr-1">Vigencia</span>
                          <select
                            value={filterContractDocState}
                            onChange={e => setFilterContractDocState(e.target.value as any)}
                            className="bg-transparent font-bold text-[#04045E] focus:outline-none cursor-pointer text-xs uppercase"
                          >
                            <option value="Todos">Todos</option>
                            <option value="Vigentes">Vigentes / Activos</option>
                            <option value="Vencidos">Vencidos</option>
                            <option value="PorVencer">Por Vencer (30 días)</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => exportDataToExcel(filteredContracts, 'Reporte_Contratos_Filtrados')}
                            className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                          >
                            Exportar Excel 📊
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table with Actions */}
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b select-none">
                            <th className="p-4 pl-6 relative">
                              <DropdownFilter
                                title="ID Contrato"
                                options={uniqueContractIds}
                                selectedValues={selectedContractIds}
                                onFilterChange={setSelectedContractIds}
                                isOpen={activeHeaderFilter === 'con-id'}
                                onToggle={() => setActiveHeaderFilter(prev => prev === 'con-id' ? null : 'con-id')}
                                placeholder="Buscar ID..."
                              />
                            </th>
                            <th className="p-4 relative">
                              <DropdownFilter
                                title="Propiedad"
                                options={uniqueContractProperties}
                                selectedValues={selectedContractProperties}
                                onFilterChange={setSelectedContractProperties}
                                isOpen={activeHeaderFilter === 'con-prop'}
                                onToggle={() => setActiveHeaderFilter(prev => prev === 'con-prop' ? null : 'con-prop')}
                                placeholder="Buscar Prop..."
                              />
                            </th>
                            <th className="p-4 relative">
                              <DropdownFilter
                                title="Arrendatario"
                                options={uniqueContractTenants}
                                selectedValues={selectedContractTenants}
                                onFilterChange={setSelectedContractTenants}
                                isOpen={activeHeaderFilter === 'con-tenant'}
                                onToggle={() => setActiveHeaderFilter(prev => prev === 'con-tenant' ? null : 'con-tenant')}
                                placeholder="Buscar Inquilino..."
                              />
                            </th>
                            <th className="p-4">Monto Mensual</th>
                            <th className="p-4">Vigencia</th>
                            <th className="p-4 text-center">Documentación</th>
                            <th className="p-4 text-center relative">
                              <DropdownFilter
                                title="Estado"
                                options={uniqueContractStatuses}
                                selectedValues={selectedContractStatuses}
                                onFilterChange={setSelectedContractStatuses}
                                isOpen={activeHeaderFilter === 'con-status'}
                                onToggle={() => setActiveHeaderFilter(prev => prev === 'con-status' ? null : 'con-status')}
                                placeholder="Buscar Estado..."
                              />
                            </th>
                            <th className="p-4 pr-6 text-right">Herramientas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-semibold text-slate-700">
                          {[...filteredContracts]
                            .sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())
                            .map(cnt => (
                            <tr key={cnt.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-4 pl-6 font-bold text-slate-400">{cnt.id.substring(0, 8).toUpperCase()}</td>
                              <td className="p-4 font-black text-[#04045E] uppercase">{cnt.property?.title || cnt.propertyId}</td>
                              <td className="p-4 text-slate-700">{cnt.tenant?.name || cnt.tenantId}</td>
                              <td className="p-4 font-black">
                                <span className="block">${cnt.monthlyAmount.toLocaleString()} USD</span>
                                <span className="block text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                  Bs. {(cnt.monthlyAmount * exchangeRate.rateSell).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BOB (TC: {exchangeRate.rateSell})
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 font-medium">
                                {new Date(cnt.startDate).toLocaleDateString()} - {new Date(cnt.endDate).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-center">
                                <ViewDocumentsButton entityId={cnt.id} entityType="contract" />
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                  cnt.status === 'VIGENTE' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : cnt.status === 'VENCIDO'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                }`}>
                                  {cnt.status}
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Botón 1: Editar (Lápiz) */}
                                  <button
                                    onClick={() => setEditingContract(cnt)}
                                    title="Editar Contrato"
                                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-[#04045E] hover:border-slate-350 hover:bg-slate-50 flex items-center justify-center transition-all hover:scale-110 shadow-2xs hover:shadow-xs cursor-pointer"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>

                                  {/* Botón 2: Ver PDF (Ojo) */}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setAuditPropertyId(cnt.propertyId || 'CONTRACT');
                                      setAuditDocType('CONTRACT');
                                      setPreviewDocTitle(`Documento Contractual: ${cnt.property?.title || 'Contrato'}`);
                                      setPreviewDocUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf?t=' + Date.now());
                                    }}
                                    title="Ver Documento PDF"
                                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-emerald-650 hover:border-emerald-350 hover:bg-emerald-50 flex items-center justify-center transition-all hover:scale-110 shadow-2xs hover:shadow-xs cursor-pointer"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                  </button>

                                  {/* Botón 3: Notificar Cobro (Campana) */}
                                  <button
                                    onClick={() => {
                                      const tenantName = cnt.tenant?.name || 'Inquilino';
                                      const ownerName = cnt.owner?.name || (cnt as any).ownerName || 'Propietario';
                                      const propertyTitle = cnt.property?.title || 'Inmueble';
                                      alert(`🔔 Simulación de Notificación de Cobro Enviada\n\n` +
                                            `Destinatario (Inquilino): ${tenantName} (${cnt.tenant?.email || 'inquilino@mail.com'})\n` +
                                            `Copia a (Propietario): ${ownerName} (${cnt.owner?.email || 'propietario@mail.com'})\n` +
                                            `Mensaje de Alerta: Recordatorio de cobro mensual de $USD ${cnt.monthlyAmount.toLocaleString()} correspondiente al inmueble "${propertyTitle}".`);
                                    }}
                                    title="Notificar Cobro"
                                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-350 hover:bg-amber-50 flex items-center justify-center transition-all hover:scale-110 shadow-2xs hover:shadow-xs cursor-pointer"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                    </svg>
                                  </button>

                                  {/* Botón 4: Eliminar (Basurero) */}
                                  <button
                                    onClick={() => setDeletingContractId(cnt.id)}
                                    title="Eliminar Contrato"
                                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-all hover:scale-110 shadow-2xs hover:shadow-xs cursor-pointer"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: PAYMENTS (Ingresos) */}
              {/* ========================================== */}
              {activeTab === 'payments' && (() => {
                // 1. KPI Calculations (mesh with real payments data + sucursal selected)
                const branchFilteredPayments = payments.filter(p => {
                  if (selectedSucursal === 'TODOS') return true;
                  const loc = p.contract?.property?.location || '';
                  return loc.toLowerCase() === selectedSucursal.toLowerCase();
                });

                // Apply dynamic date-range / region / text search & pills / column headers
                const fullyFilteredPayments = branchFilteredPayments.filter(p => {
                  // Text search
                  const matchesText = !paySearch || 
                    p.id.toLowerCase().includes(paySearch.toLowerCase()) ||
                    p.issuerName?.toLowerCase().includes(paySearch.toLowerCase()) ||
                    p.contractId.toLowerCase().includes(paySearch.toLowerCase());

                  // Date range
                  const pDate = new Date(p.paymentDate);
                  const startLimit = startDate ? new Date(startDate) : null;
                  const endLimit = endDate ? new Date(endDate) : null;
                  const matchesStart = !startLimit || pDate >= startLimit;
                  const matchesEnd = !endLimit || pDate <= endLimit;

                  // State badges filter [Conciliado | Pendiente | Observado]
                  const matchesStatus = payFilterStatus === 'ALL' || p.status === payFilterStatus;

                  // Category pills [VER TODOS, AGENTES, PLANES PUBLICIDAD, OTROS]
                  let matchesPill = true;
                  if (payFilterCategory === 'AGENTES') {
                    matchesPill = p.category_type === 'COMISION_VENTA';
                  } else if (payFilterCategory === 'PLANES PUBLICIDAD') {
                    matchesPill = p.category_type?.startsWith('PLAN_MKT') || false;
                  } else if (payFilterCategory === 'OTROS') {
                    matchesPill = p.category_type !== 'COMISION_VENTA' && !p.category_type?.startsWith('PLAN_MKT');
                  }

                  // Inline column dropdown multi-select filters
                  if (selectedPayIds.length > 0 && !selectedPayIds.includes(p.id)) return false;
                  const catVal = p.category_type || (p as any).category || '';
                  if (selectedPayCategories.length > 0 && !selectedPayCategories.includes(catVal)) return false;
                  const issuerVal = p.issuerName || '';
                  if (selectedPayIssuers.length > 0 && !selectedPayIssuers.includes(issuerVal)) return false;
                  const contractVal = p.contractId || '';
                  if (selectedPayContracts.length > 0 && !selectedPayContracts.includes(contractVal)) return false;
                  const destVal = p.destinationAccount || '';
                  if (selectedPayDestinations.length > 0 && !selectedPayDestinations.includes(destVal)) return false;
                  const dateVal = new Date(p.paymentDate).toLocaleDateString();
                  if (selectedPayDates.length > 0 && !selectedPayDates.includes(dateVal)) return false;
                  const methodVal = p.paymentMethod || '';
                  if (selectedPayMethods.length > 0 && !selectedPayMethods.includes(methodVal)) return false;
                  const statusVal = p.status || '';
                  if (selectedPayStatuses.length > 0 && !selectedPayStatuses.includes(statusVal)) return false;

                  return matchesText && matchesStart && matchesEnd && matchesStatus && matchesPill;
                }).sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.paymentDate ? new Date(a.paymentDate).getTime() : 0);
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.paymentDate ? new Date(b.paymentDate).getTime() : 0);
                  if (dateB !== dateA) return dateB - dateA;
                  return String(b.id || '').localeCompare(String(a.id || ''));
                });

                // Calculate KPIs dynamically
                const totalYTD = branchFilteredPayments
                  .filter(p => p.status === 'CONCILIADO')
                  .reduce((acc, curr) => acc + curr.amount, 0);

                const pendingIncomes = branchFilteredPayments.filter(p => p.status === 'PENDIENTE');
                const pendingCount = pendingIncomes.length;
                const pendingSum = pendingIncomes.reduce((acc, curr) => acc + curr.amount, 0);

                const totalConciliated = branchFilteredPayments
                  .filter(p => p.status === 'CONCILIADO')
                  .reduce((acc, curr) => acc + curr.amount, 0);

                const totalMktPlans = branchFilteredPayments
                  .filter(p => p.category_type?.startsWith('PLAN_MKT'))
                  .reduce((acc, curr) => acc + curr.amount, 0);

                return (
                  <div className="space-y-6">
                    {/* 1. BLOCK DE TARJETAS DE MÉTRICAS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      
                      {/* Card 1 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">INGRESO TOTAL MES (YTD)</span>
                            <span className="text-2xl font-black text-[#04045E] mt-2 block">${totalYTD.toLocaleString('es-BO', { minimumFractionDigits: 2 })} USD</span>
                          </div>
                          {/* Sparkline mini SVG */}
                          <div className="w-16 h-10">
                            <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none stroke-2">
                              <path d="M0,25 Q15,5 30,20 T60,10 T90,28 T100,5" />
                            </svg>
                          </div>
                        </div>
                        <span className="block text-[8px] font-bold text-emerald-600 mt-2">Tendencia ascendente +12%</span>
                      </div>

                      {/* Card 2 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">CONCILIACIONES PENDIENTES</span>
                        <span className="text-2xl font-black text-[#04045E] mt-2 block">{pendingCount} Transacciones</span>
                        <span className="block text-[9px] font-black text-orange-600 bg-orange-50/70 border border-orange-200/50 rounded-lg px-2 py-1 mt-2 inline-block">
                          ⚠️ {pendingCount} Pagos - TOTAL: ${pendingSum.toLocaleString('es-BO', { minimumFractionDigits: 2 })} USD
                        </span>
                      </div>

                      {/* Card 3 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow flex justify-between items-center">
                        <div>
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">INGRESOS CONCILIADOS</span>
                          <span className="text-2xl font-black text-emerald-600 mt-2 block">${totalConciliated.toLocaleString('es-BO', { minimumFractionDigits: 2 })} USD</span>
                          <span className="block text-[8px] font-bold text-slate-400 mt-1">Cobros validados con éxito</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">✓</div>
                      </div>

                      {/* Card 4 */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">INGRESOS POR PLANES MKT</span>
                        <span className="text-2xl font-black text-purple-600 mt-2 block">${totalMktPlans.toLocaleString('es-BO', { minimumFractionDigits: 2 })} USD</span>
                        <span className="block text-[8px] font-bold text-slate-400 mt-1">Planes de visibilidad</span>
                      </div>
                    </div>

                    {/* 2. BARRA DE CONTROLES, FILTROS Y PÍLDORAS DE NAVEGACIÓN */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      
                      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
                        <h3 className="text-xs font-black text-[#0a1931] uppercase tracking-wider">Historial de Ingresos</h3>
                        
                        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto xl:justify-end">
                          
                          {/* Rango de Fechas */}
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Desde</span>
                              <input 
                                type="date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0a1931] text-[#0a1931]"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase">Hasta</span>
                              <input 
                                type="date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0a1931] text-[#0a1931]"
                              />
                            </div>
                          </div>

                          {/* Regional/Sucursal Selector */}
                          <select
                            value={selectedSucursal}
                            onChange={e => setSelectedSucursal(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase text-[#0a1931] focus:outline-none focus:ring-2 focus:ring-[#0a1931] cursor-pointer"
                          >
                            <option value="TODOS">Todos</option>
                            <option value="Cochabamba">Cochabamba</option>
                            <option value="La Paz">La Paz</option>
                            <option value="Santa Cruz">Santa Cruz</option>
                          </select>

                          {/* Quick Status Filter Badges */}
                          <div className="flex border border-slate-200 rounded-xl overflow-hidden text-[10px] font-black shadow-2xs">
                            {(['ALL', 'CONCILIADO', 'PENDIENTE', 'OBSERVADO'] as const).map(st => (
                              <button
                                key={st}
                                onClick={() => setPayFilterStatus(st)}
                                className={`px-3 py-2 uppercase transition-all border-0 ${
                                  payFilterStatus === st 
                                    ? 'bg-[#0a1931] text-white' 
                                    : 'bg-white text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {st === 'ALL' ? 'Todos' : st}
                              </button>
                            ))}
                          </div>

                          {/* Text Search Input */}
                          <input
                            type="text"
                            placeholder="Buscar..."
                            value={paySearch}
                            onChange={e => setPaySearch(e.target.value)}
                            className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#0a1931] w-44"
                          />

                          {/* Generate Excel Button */}
                          <button
                            onClick={() => exportDataToExcel(fullyFilteredPayments, 'Reporte_Ingresos_Auditoria')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer ml-auto xl:ml-0 border-0"
                          >
                            Generar Reporte Excel 📊
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. MAQUETACIÓN PIXEL-PERFECT DE LA TABLA DE INGRESOS (11 Columnas Estrictas) */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1280px]">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b border-slate-200 tracking-widest select-none">
                              <th className="p-3 pl-6 relative">
                                <DropdownFilter
                                  title="ID INGRESO"
                                  options={uniquePayIds}
                                  selectedValues={selectedPayIds}
                                  onFilterChange={setSelectedPayIds}
                                  isOpen={activeHeaderFilter === 'pay-id'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-id' ? null : 'pay-id')}
                                  placeholder="Buscar ID..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="CATEGORÍA"
                                  options={uniquePayCategories}
                                  selectedValues={selectedPayCategories}
                                  onFilterChange={setSelectedPayCategories}
                                  isOpen={activeHeaderFilter === 'pay-cat'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-cat' ? null : 'pay-cat')}
                                  placeholder="Categoría..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="EMISOR"
                                  options={uniquePayIssuers}
                                  selectedValues={selectedPayIssuers}
                                  onFilterChange={setSelectedPayIssuers}
                                  isOpen={activeHeaderFilter === 'pay-issuer'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-issuer' ? null : 'pay-issuer')}
                                  placeholder="Emisor..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="CONTRATO REL."
                                  options={uniquePayContracts}
                                  selectedValues={selectedPayContracts}
                                  onFilterChange={setSelectedPayContracts}
                                  isOpen={activeHeaderFilter === 'pay-contract'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-contract' ? null : 'pay-contract')}
                                  placeholder="Contrato..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="MONTO COBRADO"
                                  options={uniquePayAmounts}
                                  selectedValues={selectedPayAmounts}
                                  onFilterChange={setSelectedPayAmounts}
                                  isOpen={activeHeaderFilter === 'pay-amount'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-amount' ? null : 'pay-amount')}
                                  placeholder="Monto..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="CUENTA DESTINO"
                                  options={uniquePayDestinations}
                                  selectedValues={selectedPayDestinations}
                                  onFilterChange={setSelectedPayDestinations}
                                  isOpen={activeHeaderFilter === 'pay-dest'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-dest' ? null : 'pay-dest')}
                                  placeholder="Cuenta..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="FECHA PAGO"
                                  options={uniquePayDates}
                                  selectedValues={selectedPayDates}
                                  onFilterChange={setSelectedPayDates}
                                  isOpen={activeHeaderFilter === 'pay-date'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-date' ? null : 'pay-date')}
                                  placeholder="Fecha..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="MÉTODO"
                                  options={uniquePayMethods}
                                  selectedValues={selectedPayMethods}
                                  onFilterChange={setSelectedPayMethods}
                                  isOpen={activeHeaderFilter === 'pay-method'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-method' ? null : 'pay-method')}
                                  placeholder="Método..."
                                />
                              </th>
                              <th className="p-3">COMPROBANTE</th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="ESTADO"
                                  options={uniquePayStatuses}
                                  selectedValues={selectedPayStatuses}
                                  onFilterChange={setSelectedPayStatuses}
                                  isOpen={activeHeaderFilter === 'pay-status'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'pay-status' ? null : 'pay-status')}
                                  placeholder="Estado..."
                                />
                              </th>
                              <th className="p-3 pr-6 text-right">ACCIÓN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {fullyFilteredPayments.length === 0 && (
                              <tr>
                                <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold text-xs">
                                  Sin registros financieros para los filtros seleccionados.
                                </td>
                              </tr>
                            )}
                            {fullyFilteredPayments.map(pay => {
                              const contractNum = pay.contractId?.substring(0, 8).toUpperCase() || '—';
                              const location = pay.contract?.property?.location || 'General';

                              // Micro-icono descriptivo
                              const isMkt = pay.category_type?.startsWith('PLAN_MKT');
                              const catIcon = isMkt ? '⚙️' : '🏠';
                              const categoryName = pay.category_type === 'COMISION_VENTA' 
                                ? 'Comisión Venta' 
                                : pay.category_type === 'PLAN_MKT_PREMIUM' 
                                  ? 'Plan MKT Premium' 
                                  : pay.category_type === 'PLAN_MKT_BASICO' 
                                    ? 'Plan MKT Básico' 
                                    : pay.category_type || 'Otros';

                              return (
                                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                                  {/* 1. ID INGRESO */}
                                  <td className="p-3 pl-6 font-mono font-bold text-slate-400">{pay.id.substring(0, 8).toUpperCase()}</td>

                                  {/* 2. CATEGORÍA */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] select-none">{catIcon}</span>
                                      <span className="font-bold text-[#04045E]">{categoryName}</span>
                                    </div>
                                  </td>

                                  {/* 3. EMISOR */}
                                  <td className="p-3">
                                    <span className="font-black text-slate-800">{pay.issuerName}</span>
                                    <span className="block text-[8px] text-slate-400 uppercase mt-0.5">({pay.issuer_type})</span>
                                  </td>

                                  {/* 4. CONTRATO REL. */}
                                  <td className="p-3">
                                    <span className="font-black text-[#04045E]">{contractNum}</span>
                                    <span className="block text-[8px] text-slate-400 uppercase mt-0.5">({location})</span>
                                  </td>

                                  {/* 5. MONTO COBRADO */}
                                  <td className="p-3 font-black text-emerald-600 text-sm">
                                    ${pay.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })} USD
                                  </td>

                                  {/* 6. CUENTA DESTINO */}
                                  <td className="p-3 font-medium text-slate-600">{pay.destinationAccount}</td>

                                  {/* 7. FECHA PAGO */}
                                  <td className="p-3 text-slate-500">{new Date(pay.paymentDate).toLocaleDateString('es-BO')}</td>

                                  {/* 8. MÉTODO */}
                                  <td className="p-3 text-slate-500 font-bold">{pay.paymentMethod}</td>

                                  {/* 9. COMPROBANTE */}
                                  <td className="p-3">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleOpenFinanceAudit('income', pay.id, `Auditoría de Ingreso #${pay.id.substring(0, 8).toUpperCase()}`, {
                                          COMPROBANTE: {
                                            status: pay.status === 'CONCILIADO' ? 'APPROVED' : pay.status === 'OBSERVADO' ? 'REJECTED' : 'PENDING',
                                            comments: pay.notes || '',
                                            fileUrl: pay.receiptUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                                            fileName: pay.receiptUrl ? 'comprobante_pago.pdf' : null,
                                            labelName: 'Comprobante de Transferencia Primario'
                                          },
                                          RESPALDO: {
                                            status: 'PENDING',
                                            comments: '',
                                            fileUrl: null,
                                            fileName: null,
                                            labelName: 'Captura de Respaldo'
                                          }
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#0a1931] hover:underline cursor-pointer bg-transparent border-0"
                                    >
                                      📄 Comprobante
                                    </button>
                                  </td>

                                  {/* 10. ESTADO */}
                                  <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                                      pay.status === 'CONCILIADO'
                                        ? 'bg-green-50 text-green-600 border-green-200'
                                        : pay.status === 'PENDIENTE'
                                          ? 'bg-orange-50 text-orange-600 border-orange-200 animate-pulse'
                                          : 'bg-red-50 text-red-600 border-red-200'
                                    }`}>
                                      {pay.status}
                                    </span>
                                  </td>

                                  {/* 11. ACCIÓN */}
                                  <td className="p-3 pr-6 text-right">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Auditar vía recibo</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}


              {/* ========================================== */}
              {/* TAB: EXPENSES (Gastos) */}
              {/* ========================================== */}
              {/* ========================================== */}
              {/* TAB: EXPENSES (Gastos) */}
              {/* ========================================== */}
              {activeTab === 'expenses' && (() => {
                // Calc KPIs in real-time reactively
                const approvedSum = expenses
                  .filter(e => e.status === 'APROBADO')
                  .reduce((acc, curr) => acc + curr.amount, 0);

                const pendingCount = expenses.filter(e => e.status === 'PENDIENTE').length;
                const pendingSum = expenses
                  .filter(e => e.status === 'PENDIENTE')
                  .reduce((acc, curr) => acc + curr.amount, 0);

                const baseCajaChica = 5000;
                const totalRemanente = baseCajaChica - approvedSum + extraFunds;

                // Category badges / Filter pills count
                const countCategory = (cat: string) => {
                  if (cat === 'ALL') return expenses.length;
                  return expenses.filter(e => e.category === cat).length;
                };

                // Perform client side filters
                const filteredExpenses = expenses.filter(exp => {
                  // Search query
                  const matchSearch = expSearchQuery
                    ? exp.concept.toLowerCase().includes(expSearchQuery.toLowerCase()) ||
                      (exp.requester || '').toLowerCase().includes(expSearchQuery.toLowerCase()) ||
                      (exp.vinculacion || '').toLowerCase().includes(expSearchQuery.toLowerCase())
                    : true;

                  // Master status filter dropdown
                  const matchStatus = expFilterStatus === 'ALL' ? true : exp.status === expFilterStatus;

                  // Category filter dropdown
                  const matchCategory = expFilterCategory === 'ALL' ? true : exp.category === expFilterCategory;

                  // Independent columns dropdown multi-select filters
                  if (selectedExpIds.length > 0 && !selectedExpIds.includes(exp.id)) return false;
                  const dateVal = new Date(exp.date).toLocaleDateString();
                  if (selectedExpDates.length > 0 && !selectedExpDates.includes(dateVal)) return false;
                  const reqVal = exp.requester || '';
                  if (selectedExpRequesters.length > 0 && !selectedExpRequesters.includes(reqVal)) return false;
                  const catVal = exp.category || '';
                  if (selectedExpCategories.length > 0 && !selectedExpCategories.includes(catVal)) return false;
                  const conceptVal = exp.concept || '';
                  if (selectedExpConcepts.length > 0 && !selectedExpConcepts.includes(conceptVal)) return false;
                  const vincVal = exp.vinculacion || '';
                  if (selectedExpVinculaciones.length > 0 && !selectedExpVinculaciones.includes(vincVal)) return false;
                  const statusVal = exp.status || '';
                  if (selectedExpStatuses.length > 0 && !selectedExpStatuses.includes(statusVal)) return false;

                  return matchSearch && matchStatus && matchCategory;
                }).sort((a, b) => {
                  const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.date ? new Date(a.date).getTime() : 0);
                  const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.date ? new Date(b.date).getTime() : 0);
                  if (dateB !== dateA) return dateB - dateA;
                  return String(b.id || '').localeCompare(String(a.id || ''));
                });

                return (
                  <div className="space-y-6">
                    {/* KPI cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      
                      {/* CARD 1: PRESUPUESTO CONSUMIDO MES */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Presupuesto Consumido Mes</span>
                        <div className="flex justify-between items-baseline">
                          <span className="text-2xl font-black text-[#04045E]">-${approvedSum.toLocaleString()} USD</span>
                          <span className="text-[10px] font-bold text-teal-600">48%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full" style={{ width: '48%' }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>Meta Mensual</span>
                          <span>Target $3,000</span>
                        </div>
                      </div>

                      {/* CARD 2: GASTOS APROBADOS */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Gastos Aprobados (Mes)</span>
                          <span className="text-2xl font-black text-emerald-600">${approvedSum.toLocaleString()} USD</span>
                          <span className="block text-[9px] text-slate-400 font-semibold">Consolidado en cuenta</span>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black">
                          ✓
                        </div>
                      </div>

                      {/* CARD 3: POR APROBAR */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Por Aprobar</span>
                          <span className="text-2xl font-black text-amber-500">{pendingCount} {pendingCount === 1 ? 'Gasto' : 'Gastos'}</span>
                          <span className="block text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            ⚠️ ${pendingSum.toLocaleString()} USD Pendiente
                          </span>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xs">
                          ⚠️
                        </div>
                      </div>

                      {/* CARD 4: CAJA CHICA REMANENTE */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex justify-between items-start">
                        <div className="space-y-1.5 w-full">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Caja Chica Remanente</span>
                          <span className="text-2xl font-black text-emerald-600 block">${totalRemanente.toLocaleString()} USD</span>
                          <button
                            onClick={() => setShowAddFundsModal(true)}
                            className="text-[9px] text-emerald-600 font-black uppercase tracking-wider bg-emerald-50/50 hover:bg-emerald-50 px-2 py-1 rounded-md transition-all active:scale-95 border border-emerald-250 cursor-pointer"
                          >
                            [+] Añadir Fondos
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Filter controls row */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                        
                        {/* Date range picker */}
                        <div className="w-full md:w-auto">
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rango Registro</label>
                          <input
                            type="text"
                            value={expDateRange}
                            onChange={(e) => setExpDateRange(e.target.value)}
                            placeholder="01/05/2026 - 31/05/2026"
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs w-full focus:outline-hidden font-semibold text-[#04045E]"
                          />
                        </div>

                        {/* Dropdown status */}
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Estado</label>
                          <select
                            value={expFilterStatus}
                            onChange={(e) => setExpFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs w-full focus:outline-hidden font-semibold text-[#04045E] cursor-pointer"
                          >
                            <option value="ALL">TODOS</option>
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="APROBADO">APROBADO</option>
                            <option value="OBSERVADO">OBSERVADO</option>
                          </select>
                        </div>

                        {/* Dropdown category */}
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Categoría</label>
                          <select
                            value={expFilterCategory}
                            onChange={(e) => setExpFilterCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs w-full focus:outline-hidden font-semibold text-[#04045E] cursor-pointer"
                          >
                            <option value="ALL">TODAS</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Impuestos">Impuestos</option>
                            <option value="Oficina">Oficina</option>
                            <option value="Publicidad">Publicidad</option>
                            <option value="Otros">Otros</option>
                          </select>
                        </div>

                        {/* Search input */}
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Búsqueda rápida</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">🔍</span>
                            <input
                              type="text"
                              value={expSearchQuery}
                              onChange={(e) => setExpSearchQuery(e.target.value)}
                              placeholder="Buscar Solicitante/Propiedad..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-[#04045E] placeholder:text-slate-400 focus:outline-hidden"
                            />
                          </div>
                        </div>

                      </div>
                      {/* Add button */}
                      <div className="flex items-end">
                        <button
                          onClick={() => setShowAddExpenseModal(true)}
                          className="w-full md:w-auto bg-[#0B1354] hover:bg-opacity-95 text-white font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          REGISTRAR GASTO
                        </button>
                      </div>
                    </div>

                    {/* Table container */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-5 border-b flex justify-between items-center bg-slate-50/40">
                        <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Historial de Auditoría de Gastos</h3>
                        <button
                          onClick={() => exportDataToExcel(expenses, 'Auditoria_Gastos')}
                          className="bg-white border hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                        >
                          Exportar Excel 📊
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            {/* Main headers */}
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b select-none">
                              <th className="p-3 pl-5 relative">
                                <DropdownFilter
                                  title="ID EGR"
                                  options={uniqueExpIds}
                                  selectedValues={selectedExpIds}
                                  onFilterChange={setSelectedExpIds}
                                  isOpen={activeHeaderFilter === 'exp-id'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-id' ? null : 'exp-id')}
                                  placeholder="Buscar ID..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="Fecha Registro"
                                  options={uniqueExpDates}
                                  selectedValues={selectedExpDates}
                                  onFilterChange={setSelectedExpDates}
                                  isOpen={activeHeaderFilter === 'exp-date'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-date' ? null : 'exp-date')}
                                  placeholder="Fecha..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="Solicitante"
                                  options={uniqueExpRequesters}
                                  selectedValues={selectedExpRequesters}
                                  onFilterChange={setSelectedExpRequesters}
                                  isOpen={activeHeaderFilter === 'exp-requester'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-requester' ? null : 'exp-requester')}
                                  placeholder="Solicitante..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="Categoría"
                                  options={uniqueExpCategories}
                                  selectedValues={selectedExpCategories}
                                  onFilterChange={setSelectedExpCategories}
                                  isOpen={activeHeaderFilter === 'exp-category'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-category' ? null : 'exp-category')}
                                  placeholder="Categoría..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="Concepto / Detalle"
                                  options={uniqueExpConcepts}
                                  selectedValues={selectedExpConcepts}
                                  onFilterChange={setSelectedExpConcepts}
                                  isOpen={activeHeaderFilter === 'exp-concept'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-concept' ? null : 'exp-concept')}
                                  placeholder="Concepto..."
                                />
                              </th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="Vinculación (Prop/Ctr)"
                                  options={uniqueExpVinculaciones}
                                  selectedValues={selectedExpVinculaciones}
                                  onFilterChange={setSelectedExpVinculaciones}
                                  isOpen={activeHeaderFilter === 'exp-vinculacion'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-vinculacion' ? null : 'exp-vinculacion')}
                                  placeholder="Vinculación..."
                                />
                              </th>
                              <th className="p-3 font-black text-slate-500 uppercase tracking-widest text-[9px] align-middle">Monto</th>
                              <th className="p-3 font-black text-slate-500 uppercase tracking-widest text-[9px] align-middle">Comprobante</th>
                              <th className="p-3 relative">
                                <DropdownFilter
                                  title="Estado"
                                  options={uniqueExpStatuses}
                                  selectedValues={selectedExpStatuses}
                                  onFilterChange={setSelectedExpStatuses}
                                  isOpen={activeHeaderFilter === 'exp-status'}
                                  onToggle={() => setActiveHeaderFilter(prev => prev === 'exp-status' ? null : 'exp-status')}
                                  placeholder="Estado..."
                                />
                              </th>
                              <th className="p-3 pr-5 text-right font-black text-slate-500 uppercase tracking-widest text-[9px] align-middle">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {filteredExpenses.map(exp => {
                              // Conditionally pick colors for state tags
                              let statusClass = 'bg-slate-100 text-slate-600';
                              if (exp.status === 'PENDIENTE') statusClass = 'bg-amber-50 text-amber-600';
                              else if (exp.status === 'APROBADO') statusClass = 'bg-green-50 text-green-600';
                              else if (exp.status === 'OBSERVADO') statusClass = 'bg-red-50 text-red-600';

                              return (
                                <tr key={exp.id} className="hover:bg-slate-50/50 group/row relative">
                                  {/* 1. ID EGR */}
                                  <td className="p-3 pl-5 font-bold text-slate-400">
                                    {exp.id.startsWith('EGR-') ? exp.id : `EGR-${exp.id.substring(0, 5).toUpperCase()}`}
                                  </td>
                                  
                                  {/* 2. FECHA REGISTRO */}
                                  <td className="p-3 text-slate-400">
                                    {new Date(exp.date).toLocaleDateString()}
                                  </td>

                                  {/* 3. SOLICITANTE */}
                                  <td className="p-3 font-bold text-slate-600">
                                    {exp.requester || 'Admin'}
                                  </td>

                                  {/* 4. CATEGORÍA */}
                                  <td className="p-3 text-slate-500">
                                    {exp.category}
                                  </td>

                                  {/* 5. CONCEPTO / DETALLE */}
                                  <td className="p-3 font-black text-[#04045E] uppercase max-w-[200px] truncate">
                                    {exp.concept}
                                  </td>

                                  {/* 6. VINCULACIÓN */}
                                  <td className="p-3 text-slate-500 italic">
                                    {exp.vinculacion || 'Gasto General'}
                                  </td>

                                  {/* 7. MONTO */}
                                  <td className="p-3 font-black text-slate-900">
                                    -${exp.amount.toLocaleString()} USD
                                  </td>

                                {/* 8. COMPROBANTE */}
                                  <td className="p-3">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleOpenFinanceAudit('expense', exp.id, `Auditoría de Gasto #${exp.id.toUpperCase()}`, {
                                          FACTURA: {
                                            status: exp.status === 'APROBADO' ? 'APPROVED' : exp.status === 'OBSERVADO' ? 'REJECTED' : 'PENDING',
                                            comments: exp.notes || '',
                                            fileUrl: exp.receiptUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                                            fileName: exp.receiptUrl ? 'recibo.pdf' : null,
                                            labelName: 'Factura / Recibo Oficial'
                                          },
                                          RESPALDO: {
                                            status: 'PENDING',
                                            comments: '',
                                            fileUrl: null,
                                            fileName: null,
                                            labelName: 'Captura de Respaldo'
                                          }
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#0a1931] hover:underline cursor-pointer bg-transparent border-0"
                                    >
                                      📄 Ver Recibo
                                    </button>
                                  </td>

                                  {/* 9. ESTADO WITH FLOATING REVIEW NOTES FOR OBSERVADO */}
                                  <td className="p-3 relative">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusClass}`}>
                                      {exp.status}
                                    </span>

                                    {/* COMPONENTE DE REVISIÓN tooltip flotante tipo popover */}
                                    {exp.status === 'OBSERVADO' && (
                                      <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 z-[99] max-w-xs w-64 p-3 bg-[#0B1354] text-white rounded-xl shadow-xl text-[10px] space-y-1">
                                        <p className="font-black uppercase tracking-widest text-[#00E5FF]">⚠️ REVISAR NOTA:</p>
                                        <p className="font-semibold leading-relaxed text-slate-100">
                                          {exp.notes || 'Falta factura de compra u observaciones pendientes de revisión.'}
                                        </p>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0B1354]" />
                                      </div>
                                    )}
                                  </td>

                                  {/* 10. ACCION */}
                                  <td className="p-3 pr-5 text-right whitespace-nowrap">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Auditar vía recibo</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ========================================== */}
              {/* TAB: REPORTS */}
              {/* ========================================== */}
              {activeTab === 'reports' && (() => {
                // Zone listing mapping based on sucursal
                const getZonesBySucursal = (suc: string): string[] => {
                  switch (suc) {
                    case 'Cochabamba':
                      return ['Zona Norte', 'Recoleta', 'Cala Cala', 'Muyurina', 'Queru Queru', 'El Prado'];
                    case 'La Paz':
                      return ['Sopocachi', 'Miraflores', 'Calacoto', 'San Pedro', 'Obrajes'];
                    case 'Santa Cruz':
                      return ['Equipetrol', 'Urubó', 'Las Palmas', 'Rama I', 'Norte'];
                    default:
                      return ['Zona General', 'Centro', 'Distrito 1', 'Distrito 2'];
                  }
                };

                const zonesList = getZonesBySucursal(selectedSucursal);

                // Structured local seeds fallbacks for all 10 sections
                const getMockDataForSection = (section: string, region: string): any[] => {
                  const regSuf = region === 'TODOS' ? 'Cochabamba' : region;
                  switch (section) {
                    case 'PROPIEDADES':
                      return [
                        { id: 'PROP-901', title: 'Apartamento de Lujo Queru Queru', price: 145000, zone: 'Queru Queru', status: 'APROBADO', location: regSuf, date: '2026-05-12' },
                        { id: 'PROP-902', title: 'Casa Comercial El Prado', price: 380000, zone: 'El Prado', status: 'RESERVADO', location: regSuf, date: '2026-05-18' },
                        { id: 'PROP-903', title: 'Penthouse Exclusivo Cala Cala', price: 210000, zone: 'Cala Cala', status: 'APROBADO', location: regSuf, date: '2026-05-24' }
                      ];
                    case 'AGENTES':
                      return [
                        { id: 'AGT-001', name: 'Roberto Claros', contact: '+591 772 34871 / roberto@propio.bo', volume: '$420,000 USD', rating: '4.8 ⭐', status: 'Activo', date: '2026-01-15' },
                        { id: 'AGT-002', name: 'Lucía Arteaga', contact: '+591 601 98324 / lucia@propio.bo', volume: '$185,000 USD', rating: '4.9 ⭐', status: 'Activo', date: '2026-02-10' },
                        { id: 'AGT-003', name: 'David Choque', contact: '+591 717 44901 / david@propio.bo', volume: '$95,000 USD', rating: '4.5 ⭐', status: 'Activo', date: '2026-03-05' }
                      ];
                    case 'PROSPECTOS':
                      return [
                        { id: 'PROS-201', name: 'Carlos Mendoza', phone: '+591 707 12345', budget: 185000, interest: 'Departamento 3 dorm.', date: '2026-05-10' },
                        { id: 'PROS-202', name: 'Daniela Torrico', phone: '+591 712 99887', budget: 95000, interest: 'Garzonier amoblado', date: '2026-05-15' },
                        { id: 'PROS-203', name: 'Mauricio Siles', phone: '+591 600 44332', budget: 320000, interest: 'Casa con jardín', date: '2026-05-20' }
                      ];
                    case 'PROPIETARIOS':
                      return [
                        { id: 'PROP-501', name: 'René Vargas', email: 'rene@mail.com', propertiesCount: 2, status: 'Verificado', plan: 'Venta Pro' },
                        { id: 'PROP-502', name: 'Claudia Claure', email: 'clau@mail.com', propertiesCount: 1, status: 'Verificado', plan: 'Cierre Garantizado' },
                        { id: 'PROP-503', name: 'Pedro Mendoza', email: 'pedro@mail.com', propertiesCount: 1, status: 'Pendiente', plan: 'Gratis' }
                      ];
                    case 'CONSTRUCTORAS':
                      return [
                        { id: 'DEV-301', name: 'Alianza Inmobiliaria', nit: '102938470', representative: 'Arq. Javier Ortiz', stock: 18, commission: '3%' },
                        { id: 'DEV-302', name: 'Constructora Cochabamba', nit: '987654321', representative: 'Ing. Raúl Gómez', stock: 8, commission: '2.5%' }
                      ];
                    case 'CONTRATOS':
                      return [
                        { id: 'CON-101', tenant: 'Carlos Mendoza', propertyTitle: 'Torre Norte 14A', monthly: 850, start: '2026-05-01', end: '2027-05-01', status: 'VIGENTE' },
                        { id: 'CON-102', tenant: 'Ana Lucía Arteaga', propertyTitle: 'Apartamento Queru Queru', monthly: 1200, start: '2026-05-10', end: '2027-05-10', status: 'VIGENTE' }
                      ];
                    case 'INGRESOS':
                      return [
                        { id: 'ING-01', category: 'PLAN_MKT_PREMIUM', issuer: 'René Vargas', amount: 450, method: 'Transferencia', status: 'CONCILIADO', date: '2026-05-15' },
                        { id: 'ING-02', category: 'COMISION_VENTA', issuer: 'Claudia Claure', amount: 3200, method: 'Depósito', status: 'PENDIENTE', date: '2026-05-18' }
                      ];
                    case 'GASTOS':
                      return [
                        { id: 'EGR-401', requester: 'Admin', category: 'Oficina', concept: 'Alquiler oficina central', amount: -800, status: 'APROBADO', date: '2026-05-02' },
                        { id: 'EGR-402', requester: 'Agente: Juan P.', category: 'Mantenimiento', concept: 'Plomería Torre Norte 14A', amount: -150, status: 'PENDIENTE', date: '2026-05-19' }
                      ];
                    case 'PLANES MKT':
                      return [
                        { id: 'MKT-01', name: 'Plan Contenidos Express', channel: 'TikTok/Facebook', propertiesLinked: 5, budget: 120, status: 'ACTIVO' },
                        { id: 'MKT-02', name: 'Plan Venta Pro', channel: 'Fotografía/Video/Redes', propertiesLinked: 12, budget: 450, status: 'ACTIVO' }
                      ];
                    case 'COLABORACIONES':
                      return [
                        { id: 'COL-01', sellingAgent: 'Roberto Claros', capturingAgent: 'Lucía Arteaga', property: 'Casa en Cala Cala', split: '50/50', status: 'APROBADO', date: '2026-05-21' },
                        { id: 'COL-02', sellingAgent: 'David Choque', capturingAgent: 'Roberto Claros', property: 'Penthouse Queru Queru', split: '45/55', status: 'PENDIENTE', date: '2026-05-25' }
                      ];
                    default:
                      return [];
                  }
                };

                // Extract data from backend Reports polymorphic endpoint
                const handleExtractReport = async (downloadFormat?: 'xlsx' | 'pdf') => {
                  setReportLoading(true);
                  try {
                    const token = getToken() || '';
                    let url = `/admin/reports/${reportSection.toLowerCase()}?branch_id=${encodeURIComponent(selectedSucursal)}&startDate=${reportStartDate}&endDate=${reportEndDate}`;
                    if (downloadFormat) {
                      url += `&download=${downloadFormat}`;
                    }

                    if (downloadFormat === 'xlsx') {
                      if (reportData.length > 0) {
                        exportDataToExcel(reportData, `Reporte_${reportSection}_${selectedSucursal}`);
                      } else {
                        const localMock = getMockDataForSection(reportSection, selectedSucursal);
                        exportDataToExcel(localMock, `Reporte_${reportSection}_${selectedSucursal}`);
                      }
                      alert('Descargando archivo XLSX exitosamente.');
                    } else if (downloadFormat === 'pdf') {
                      alert(`📥 Generando reporte PDF en caliente para la sección ${reportSection}...`);
                      const res = await apiClient.getWithAuth<any>(url, token).catch(() => ({
                        pdfReportSimulated: true,
                        simulatedUrl: 'https://propioinmuebles.com/downloads/simulated_pdf.pdf'
                      }));
                      if (res.pdfReportSimulated) {
                        window.open(res.simulatedUrl, '_blank');
                      } else {
                        alert('Reporte PDF descargado exitosamente.');
                      }
                    } else {
                      // Standard fetch preview
                      const res = await apiClient.getWithAuth<any[]>(url, token).catch(() => {
                        console.warn('Backend offline, cargando inyector mock robusto de desarrollo.');
                        return getMockDataForSection(reportSection, selectedSucursal);
                      });
                      
                      // Filter contextual by zone locally if selected
                      let processed = res || [];
                      if (reportZone !== 'ALL') {
                        processed = processed.filter((item: any) => 
                          (item.zone || '').toLowerCase().includes(reportZone.toLowerCase()) ||
                          (item.propertyTitle || '').toLowerCase().includes(reportZone.toLowerCase()) ||
                          (item.location || '').toLowerCase().includes(reportZone.toLowerCase()) ||
                          (item.title || '').toLowerCase().includes(reportZone.toLowerCase())
                        );
                      }
                      setReportData(processed);
                    }
                  } catch (err: any) {
                    console.error(err);
                    alert(err.message || 'Error al extraer reporte');
                  } finally {
                    setReportLoading(false);
                  }
                };

                // Render specific column headers and cells based on activeSection
                const renderDataGrid = () => {
                  const sorted = getSortedReportData(reportData, reportSection, reportSortCriterion);
                  return (() => {
                    const reportData = sorted;
                    if (reportData.length === 0) {
                      return (
                        <div className="p-12 text-center space-y-2">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Sin registros para el rango y filtros seleccionados.</p>
                          <p className="text-[10px] text-slate-300 font-semibold">Cambia la sección, fechas o zona para ampliar la búsqueda.</p>
                        </div>
                      );
                    }
                    switch (reportSection) {
                    case 'PROPIEDADES':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID</th>
                              <th className="p-3">Título</th>
                              <th className="p-3">Precio</th>
                              <th className="p-3">Zona</th>
                              <th className="p-3 pr-5 text-right">Estado Listing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `PRP-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase truncate max-w-xs">{row.title || row.concept || 'N/A'}</td>
                                <td className="p-3 text-slate-900 font-bold">${Number(row.price || row.amount || 0).toLocaleString()} USD</td>
                                <td className="p-3 text-slate-500 font-semibold">{row.zone || row.location || 'General'}</td>
                                <td className="p-3 pr-5 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${row.status === 'APROBADO' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {row.status || 'APROBADO'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'AGENTES':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Agente</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Contacto</th>
                              <th className="p-3">Volumen Cierres</th>
                              <th className="p-3 pr-5 text-right">Rating</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `AGT-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.name || row.fullName || 'N/A'}</td>
                                <td className="p-3 text-slate-500">{row.contact || row.email || 'N/A'}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.volume || '$0 USD'}</td>
                                <td className="p-3 pr-5 text-right font-black text-amber-650">{row.rating || '5.0 ⭐'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'PROSPECTOS':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Prospecto</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Contacto / Fono</th>
                              <th className="p-3">Presupuesto</th>
                              <th className="p-3 pr-5 text-right">Interés</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `PROS-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.name}</td>
                                <td className="p-3 text-slate-500">{row.phone || row.email}</td>
                                <td className="p-3 text-slate-950 font-bold">${Number(row.budget || 0).toLocaleString()} USD</td>
                                <td className="p-3 pr-5 text-right font-semibold text-slate-500 italic">{row.interest || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'PROPIETARIOS':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Propietario</th>
                              <th className="p-3">Nombre</th>
                              <th className="p-3">Correo</th>
                              <th className="p-3">Cant. Propiedades</th>
                              <th className="p-3 pr-5 text-right">Plan Asignado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `PROP-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.name}</td>
                                <td className="p-3 text-slate-500">{row.email}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.propertiesCount || 1} Propiedades</td>
                                <td className="p-3 pr-5 text-right">
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-650 rounded-full text-[9px] font-black uppercase tracking-wider">
                                    {row.plan || 'Gratis'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'CONSTRUCTORAS':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID NIT</th>
                              <th className="p-3">Constructora</th>
                              <th className="p-3">Representante</th>
                              <th className="p-3">Stock Unidades</th>
                              <th className="p-3 pr-5 text-right">Esquema Comisión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-450 uppercase">{row.nit || `DEV-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.name}</td>
                                <td className="p-3 text-slate-500 font-semibold">{row.representative}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.stock || 0} Deptos</td>
                                <td className="p-3 pr-5 text-right text-emerald-600 font-black">{row.commission || '3.0%'} commission</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'CONTRATOS':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Contrato</th>
                              <th className="p-3">Inquilino</th>
                              <th className="p-3">Inmueble Vinculado</th>
                              <th className="p-3">Monto Mensual</th>
                              <th className="p-3 pr-5 text-right">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `CON-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.tenant || 'N/A'}</td>
                                <td className="p-3 text-slate-500">{row.propertyTitle || 'N/A'}</td>
                                <td className="p-3 text-slate-950 font-bold">${Number(row.monthly || 0).toLocaleString()} USD</td>
                                <td className="p-3 pr-5 text-right">
                                  <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase">
                                    {row.status || 'VIGENTE'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'INGRESOS':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Ingreso</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Emisor</th>
                              <th className="p-3">Monto Cobrado</th>
                              <th className="p-3 pr-5 text-right">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `ING-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.category}</td>
                                <td className="p-3 text-slate-500 font-bold">{row.issuer || 'N/A'}</td>
                                <td className="p-3 text-emerald-600 font-black">+${Number(row.amount || 0).toLocaleString()} USD</td>
                                <td className="p-3 pr-5 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${row.status === 'CONCILIADO' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'GASTOS':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID EGR</th>
                              <th className="p-3">Solicitante</th>
                              <th className="p-3">Categoría</th>
                              <th className="p-3">Concepto</th>
                              <th className="p-3 pr-5 text-right">Monto Negativo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id || `EGR-${idx}`}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.requester}</td>
                                <td className="p-3 text-slate-500">{row.category}</td>
                                <td className="p-3 text-slate-500 font-semibold truncate max-w-xs">{row.concept}</td>
                                <td className="p-3 pr-5 text-right text-rose-600 font-black">-${Math.abs(row.amount).toLocaleString()} USD</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'PLANES MKT':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Plan</th>
                              <th className="p-3">Plan</th>
                              <th className="p-3">Canales Extra</th>
                              <th className="p-3">Inmuebles Vinculados</th>
                              <th className="p-3 pr-5 text-right">Caja de Inversión</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.name}</td>
                                <td className="p-3 text-slate-500 font-semibold">{row.channel}</td>
                                <td className="p-3 text-slate-900 font-bold">{row.propertiesLinked} Inmuebles</td>
                                <td className="p-3 pr-5 text-right font-black text-slate-900">${row.budget} USD</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    case 'COLABORACIONES':
                      return (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                              <th className="p-3 pl-5">ID Solicitud</th>
                              <th className="p-3">Agente Captador</th>
                              <th className="p-3">Agente Vendedor</th>
                              <th className="p-3">Inmueble</th>
                              <th className="p-3 pr-5 text-right">Split Acordado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-xs font-semibold text-slate-700">
                            {reportData.map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/40">
                                <td className="p-3 pl-5 font-bold text-slate-400">{row.id}</td>
                                <td className="p-3 font-black text-[#04045E] uppercase">{row.capturingAgent || 'N/A'}</td>
                                <td className="p-3 text-slate-500">{row.sellingAgent || 'N/A'}</td>
                                <td className="p-3 text-slate-900 font-semibold">{row.property}</td>
                                <td className="p-3 pr-5 text-right font-black text-indigo-600">{row.split}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    default:
                      return null;
                  }
                })();
              };

                return (
                  <div className="space-y-6">
                    {/* KPI cards — reactive from reportData */}
                    {reportData.length > 0 && (() => {
                      const total = reportData.length;
                      const financialSum = reportData.reduce((s: number, r: any) => {
                        const v = r.price || r.amount || r.monthly || r.budget || 0;
                        return s + Math.abs(Number(v));
                      }, 0);
                      const activeCount = reportData.filter((r: any) =>
                        ['APROBADO','VIGENTE','ACTIVO','CONCILIADO','Activo','Verificado'].includes(r.status || '')
                      ).length;
                      const sectionIcon: Record<string,string> = {
                        PROPIEDADES:'🏠', AGENTES:'👤', PROSPECTOS:'🎯', PROPIETARIOS:'🔑',
                        CONSTRUCTORAS:'🏗️', CONTRATOS:'📄', INGRESOS:'💰', GASTOS:'💸',
                        'PLANES MKT':'📣', COLABORACIONES:'🤝'
                      };
                      const financialLabel: Record<string,string> = {
                        PROPIEDADES:'Valor total', CONTRATOS:'Renta mensual total',
                        INGRESOS:'Ingresos totales', GASTOS:'Egresos totales',
                        PROSPECTOS:'Presupuesto total', AGENTES:'Volumen estimado'
                      };
                      const showFinancial = ['PROPIEDADES','CONTRATOS','INGRESOS','GASTOS','PROSPECTOS'].includes(reportSection);
                      return (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              {sectionIcon[reportSection] || '📋'} Total {reportSection}
                            </span>
                            <span className="text-2xl font-black text-[#04045E] mt-1 block">{total}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">registros encontrados</span>
                          </div>
                          {showFinancial && (
                            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                                💵 {financialLabel[reportSection] || 'Suma financiera'}
                              </span>
                              <span className={`text-2xl font-black mt-1 block ${reportSection === 'GASTOS' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                ${financialSum.toLocaleString('es-BO')} USD
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">acumulado del período</span>
                            </div>
                          )}
                          <div className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm ${showFinancial ? '' : 'col-span-2'}`}>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              ✅ Estado activo / aprobado
                            </span>
                            <span className="text-2xl font-black text-indigo-600 mt-1 block">{activeCount}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              de {total} registros ({total > 0 ? Math.round(activeCount/total*100) : 0}%)
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Filters & Action controls panel */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleExtractReport();
                      }}
                      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        
                        {/* Rango de fechas */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-400">Rango de registro (Inicio/Fin)</label>
                          <div className="flex gap-2">
                            <input
                              type="date"
                              required
                              value={reportStartDate}
                              onChange={e => setReportStartDate(e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs w-full focus:outline-hidden text-[#04045E] font-bold"
                            />
                            <input
                              type="date"
                              required
                              value={reportEndDate}
                              onChange={e => setReportEndDate(e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs w-full focus:outline-hidden text-[#04045E] font-bold"
                            />
                          </div>
                        </div>

                        {/* Selector Maestro de Sección (Oculto en CSS para preservar código) */}
                        <div className="space-y-1" style={{ display: 'none' }}>
                          <label className="block text-[10px] font-black uppercase text-slate-400">Sección Ecosistema</label>
                          <select
                            value={reportSection}
                            onChange={e => {
                              setReportSection(e.target.value);
                              setReportData([]);
                            }}
                            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs w-full focus:outline-hidden text-[#04045E] font-bold cursor-pointer"
                          >
                            <option value="PROPIEDADES">PROPIEDADES</option>
                            <option value="AGENTES">AGENTES</option>
                            <option value="PROSPECTOS">PROSPECTOS</option>
                            <option value="PROPIETARIOS">PROPIETARIOS</option>
                            <option value="CONSTRUCTORAS">CONSTRUCTORAS</option>
                            <option value="CONTRATOS">CONTRATOS</option>
                            <option value="INGRESOS">INGRESOS (COBROS)</option>
                            <option value="GASTOS">GASTOS (EGRESOS)</option>
                            <option value="PLANES MKT">PLANES MKT</option>
                            <option value="COLABORACIONES">COLABORACIONES</option>
                          </select>
                        </div>

                        {/* Filtro de Zona Contextual */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-400">Zona Contextual ({selectedSucursal})</label>
                          <select
                            value={reportZone}
                            onChange={e => setReportZone(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs w-full focus:outline-hidden text-[#04045E] font-bold cursor-pointer"
                          >
                            <option value="ALL">Todas las Zonas</option>
                            {zonesList.map(z => (
                              <option key={z} value={z}>{z}</option>
                            ))}
                          </select>
                        </div>

                        {/* Extraction buttons */}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-[#0B1354] hover:bg-opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            Filtrar 🔍
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleExtractReport('xlsx'); }}
                            className="py-2.5 bg-[#00A86B] hover:bg-opacity-90 text-white font-bold text-xs uppercase tracking-wider px-4 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            Descargar (.xlsx) 📊
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleExtractReport('pdf'); }}
                            className="py-2.5 bg-[#E31B23] hover:bg-opacity-90 text-white font-bold text-xs uppercase tracking-wider px-4 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            Descargar (.pdf) 📄
                          </button>
                        </div>

                      </div>

                      {/* Contenedor de controles alineados para los nuevos filtros interactivos de ordenación */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        {/* Selector "Sección Origen" */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-400 font-bold">Sección Origen</label>
                          <select
                            value={reportSection}
                            onChange={e => {
                              const newSec = e.target.value;
                              setReportSection(newSec);
                              const opts = getSortOptionsForSection(newSec);
                              setReportSortCriterion(opts[0]?.value || 'DATE_DESC');
                            }}
                            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs w-full focus:outline-hidden text-[#04045E] font-bold cursor-pointer transition-all hover:bg-slate-100/50"
                          >
                            <option value="PROPIEDADES">PROPIEDADES</option>
                            <option value="AGENTES">AGENTES</option>
                            <option value="PROSPECTOS">PROSPECTOS</option>
                            <option value="PROPIETARIOS">PROPIETARIOS</option>
                            <option value="CONSTRUCTORAS">CONSTRUCTORAS</option>
                            <option value="CONTRATOS">CONTRATOS</option>
                            <option value="INGRESOS">INGRESOS</option>
                            <option value="GASTOS">GASTOS</option>
                            <option value="PLANES MKT">PLANES MKT</option>
                            <option value="COLABORACIONES">COLABORACIONES</option>
                          </select>
                        </div>

                        {/* Selector "Criterio de Ordenamiento" */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-400 font-bold">Criterio de Ordenamiento</label>
                          <select
                            value={reportSortCriterion}
                            onChange={e => setReportSortCriterion(e.target.value)}
                            className="bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs w-full focus:outline-hidden text-[#04045E] font-bold cursor-pointer transition-all hover:bg-slate-100/50"
                          >
                            {getSortOptionsForSection(reportSection).map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </form>

                    {/* Report Data Preview Table Canvas */}
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-5 border-b flex justify-between items-center bg-slate-50/40">
                        <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">
                          Vista Previa de Registros: {reportSection} ({reportData.length} encontrados)
                        </h3>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Sucursal Activa: {selectedSucursal === 'TODOS' ? 'Nacional' : selectedSucursal}
                        </span>
                      </div>

                      {reportLoading ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-[#04045E]" />
                          <p className="text-[10px] font-black text-[#04045E] uppercase tracking-widest">Extrayendo registros agregados...</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          {renderDataGrid()}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })()}

              {/* ========================================== */}
              {/* TAB: MARKETING PLANES */}
              {/* ========================================== */}
              {activeTab === 'marketing_planes' && (
                <div className="space-y-6">
                  {/* Digital Contracts Repository */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Repositorio de Contratos Digitales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#04045E]">Contrato_Planes_CalaCala.pdf</p>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">24/05/2026</span>
                        </div>
                        <button onClick={() => alert('Descargando contrato digital...')} className="text-xs font-bold text-[#0066ff]">Descargar</button>
                      </div>
                      <div className="p-3 border rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#04045E]">Contrato_Exclusividad_Queru.pdf</p>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">10/06/2026</span>
                        </div>
                        <button onClick={() => alert('Descargando contrato digital...')} className="text-xs font-bold text-[#0066ff]">Descargar</button>
                      </div>
                    </div>
                  </div>

                  {/* Production Kanban */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Kanban de Producción (Marketing)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {Object.keys(productionStages).map(stageKey => {
                        const items = productionStages[stageKey];
                        return (
                          <div key={stageKey} className="bg-white border rounded-2xl p-4 flex flex-col min-h-[300px] border-t-4 border-t-[#04045E]">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                              <span className="font-black text-xs text-[#04045E] uppercase tracking-wider">{stageKey}</span>
                              <span className="bg-slate-100 text-[#04045E] px-2 py-0.5 rounded text-[10px] font-black">{items.length}</span>
                            </div>
                            <div className="space-y-3 flex-1 overflow-y-auto">
                              {items.map(prop => (
                                <div key={prop.id} className="p-3 border border-slate-100 rounded-xl bg-[#F8FAFC] space-y-2 relative group hover:border-[#b9fa3c]">
                                  <h4 className="text-[11px] font-black text-[#04045E] uppercase tracking-tight leading-tight">{prop.title}</h4>
                                  <div className="flex gap-2 items-center justify-between">
                                    <span className="text-[8px] text-slate-400 font-bold">📍 {(prop.location.address || '').split(',')[0]}</span>
                                    <a
                                      href="https://wa.me/59170000000"
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-5 h-5 bg-[#25D366] text-white rounded-full flex items-center justify-center text-[10px]"
                                    >
                                      💬
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: CONFIG PERMISSIONS */}
              {/* ========================================== */}
              {activeTab === 'config_permissions' && (
                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider border-b pb-3 mb-4">Matriz de Privilegios y Roles</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                          <th className="p-3">Módulo del Sistema</th>
                          <th className="p-3 text-center">Administrador</th>
                          <th className="p-3 text-center">Agente</th>
                          <th className="p-3 text-center">Propietario</th>
                          <th className="p-3 text-center">Cliente / Inquilino</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-bold text-slate-700">
                        <tr>
                          <td className="p-3 font-black text-[#04045E] uppercase">Validación de Propiedades</td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled /></td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-black text-[#04045E] uppercase">Módulo "Mis Cierres"</td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled /></td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                        </tr>
                        <tr>
                          <td className="p-3 font-black text-[#04045E] uppercase">Conciliación de Ingresos</td>
                          <td className="p-3 text-center"><input type="checkbox" defaultChecked disabled /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                          <td className="p-3 text-center"><input type="checkbox" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: COLABORACIONES (Co-broking) */}
              {/* ========================================== */}
              {activeTab === 'colaboraciones' && (
                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                        Distribución de Comisiones y Co-Broking
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                        Matriz de asignación de honorarios compartidos por cierre de venta
                      </p>
                    </div>
                    {/* [LOGICA_ENVIO_COLABORACION_Y_NOTIFICACION] — CTA principal */}
                    <button
                      id="btn-nueva-solicitud-colaboracion"
                      disabled={colabSending}
                      onClick={() => setIsNewColabModalOpen(true)}
                      className="flex items-center gap-2 rounded-full bg-[#006673] hover:bg-[#004d57] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors shadow-md cursor-pointer active:scale-95"
                    >
                      {colabSending ? (
                        <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        '🤝'
                      )}
                      Nueva Solicitud
                    </button>
                  </div>


                  {/* JSX_BARRA_FILTROS_SUPERIOR */}
                  <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-100/60 p-3 rounded-2xl gap-3 border border-slate-200/40">
                    {/* Left: Pills */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setFilterTab('TODOS'); setCurrentPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          filterTab === 'TODOS'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => { setFilterTab('PROPIEDADES'); setCurrentPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          filterTab === 'PROPIEDADES'
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        Propiedades
                      </button>
                      <button
                        onClick={() => { setFilterTab('SOLICITUDES_PAGO'); setCurrentPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          filterTab === 'SOLICITUDES_PAGO'
                            ? 'bg-amber-100 border border-amber-300 text-amber-800 shadow-xs animate-pulse'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        Solicitudes de Pago ⚠️
                      </button>
                    </div>

                    {/* Right: Search */}
                    <div className="relative w-full sm:w-64">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none text-[11px]">
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={colabSearchQuery}
                        onChange={(e) => { setColabSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full rounded-full bg-white border border-slate-200 pl-8 pr-4 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-slate-400 transition-all shadow-3xs"
                      />
                    </div>
                  </div>

                  {/* JSX_PESTAÑA_TABLA_COLABORACIONES */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b">
                          <th className="p-3">ID COLAB</th>
                          <th className="p-3">AGENTE 1</th>
                          <th className="p-3">AGENTE 2</th>
                          <th className="p-3">ID PROPIEDAD</th>
                          <th className="p-3 text-center">% PROPIO (PLATAFORMA)</th>
                          <th className="p-3 text-center">% COMISIÓN AGENTE 1</th>
                          <th className="p-3 text-center">% COMISIÓN AGENTE 2</th>
                          <th className="p-3 text-center">ESTADO / ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-bold text-slate-700">
                        {paginatedColabs.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 border-none">
                              No hay colaboraciones registradas que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          paginatedColabs.map((colab) => {
                            const isLocked = colab.estado === 'PAGADO_CERRADO';
                            const rowSum = (colab.porcentajePropio || 0) + (colab.porcentajeAgente1 || 0) + (colab.porcentajeAgente2 || 0);
                            const isSumError = rowSum !== 100;
                            return (
                              <React.Fragment key={colab.id}>
                                <tr className="hover:bg-slate-50/80 transition-all duration-200">
                                  <td 
                                    className="p-3 font-mono font-black text-slate-800 cursor-pointer hover:underline text-blue-600"
                                    onClick={() => setExpandedColabId(expandedColabId === colab.id ? null : colab.id)}
                                    title="Ver desglose monetario"
                                  >
                                    {colab.id}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-[#04045E] text-white flex items-center justify-center font-black text-[9px] shrink-0 border border-[#04045E]/30">
                                        {colab.agente1.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="font-black text-[#04045E]">{colab.agente1}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[9px] shrink-0 border border-blue-600/30">
                                        {colab.agente2.slice(0, 2).toUpperCase()}
                                      </div>
                                      <span className="font-black text-slate-700">{colab.agente2}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="font-mono font-black text-[11px] text-[#04045E] bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/50">
                                      {colab.propiedadId}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={colab.porcentajePropio}
                                        disabled={isLocked || !!columnLocks[colab.id]?.porcentajePropio}
                                        readOnly={!!columnLocks[colab.id]?.porcentajePropio}
                                        onChange={(e) => handleUpdatePorcentaje(colab.id, 'porcentajePropio', Number(e.target.value))}
                                        className={`w-14 p-1 border rounded text-center font-semibold text-gray-700 disabled:bg-slate-100 disabled:text-slate-400 bg-white focus:outline-hidden ${isSumError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 focus:border-slate-400'}`}
                                      />
                                      <button
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => toggleColumnLock(colab.id, 'porcentajePropio')}
                                        className="text-xs p-1 hover:bg-slate-100 rounded cursor-pointer transition-colors bg-transparent border-0"
                                        title={columnLocks[colab.id]?.porcentajePropio ? 'Desbloquear columna' : 'Bloquear columna'}
                                      >
                                        {columnLocks[colab.id]?.porcentajePropio ? '🔒' : '🔓'}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={colab.porcentajeAgente1}
                                        disabled={isLocked || !!columnLocks[colab.id]?.porcentajeAgente1}
                                        readOnly={!!columnLocks[colab.id]?.porcentajeAgente1}
                                        onChange={(e) => handleUpdatePorcentaje(colab.id, 'porcentajeAgente1', Number(e.target.value))}
                                        className={`w-14 p-1 border rounded text-center font-semibold text-gray-700 disabled:bg-slate-100 disabled:text-slate-400 bg-white focus:outline-hidden ${isSumError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 focus:border-slate-400'}`}
                                      />
                                      <button
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => toggleColumnLock(colab.id, 'porcentajeAgente1')}
                                        className="text-xs p-1 hover:bg-slate-100 rounded cursor-pointer transition-colors bg-transparent border-0"
                                        title={columnLocks[colab.id]?.porcentajeAgente1 ? 'Desbloquear columna' : 'Bloquear columna'}
                                      >
                                        {columnLocks[colab.id]?.porcentajeAgente1 ? '🔒' : '🔓'}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={colab.porcentajeAgente2}
                                        disabled={isLocked || !!columnLocks[colab.id]?.porcentajeAgente2}
                                        readOnly={!!columnLocks[colab.id]?.porcentajeAgente2}
                                        onChange={(e) => handleUpdatePorcentaje(colab.id, 'porcentajeAgente2', Number(e.target.value))}
                                        className={`w-14 p-1 border rounded text-center font-semibold text-gray-700 disabled:bg-slate-100 disabled:text-slate-400 bg-white focus:outline-hidden ${isSumError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-slate-200 focus:border-slate-400'}`}
                                      />
                                      <button
                                        type="button"
                                        disabled={isLocked}
                                        onClick={() => toggleColumnLock(colab.id, 'porcentajeAgente2')}
                                        className="text-xs p-1 hover:bg-slate-100 rounded cursor-pointer transition-colors bg-transparent border-0"
                                        title={columnLocks[colab.id]?.porcentajeAgente2 ? 'Desbloquear columna' : 'Bloquear columna'}
                                      >
                                        {columnLocks[colab.id]?.porcentajeAgente2 ? '🔒' : '🔓'}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {colab.estado === 'PENDIENTE_APROBACION' && (
                                        <>
                                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full tracking-wider shrink-0 select-none">
                                            ⏳ Pendiente
                                          </span>
                                          <button
                                            onClick={() => {
                                              const price = getPropertyPrice(colab.propiedadId);
                                              const totalComm = price * 0.03;
                                              const propioUsd = totalComm * (colab.porcentajePropio / 100);
                                              const propioBs = propioUsd * 9.76;
                                              const agente1Usd = totalComm * (colab.porcentajeAgente1 / 100);
                                              const agente1Bs = agente1Usd * 9.76;
                                              const agente2Usd = totalComm * (colab.porcentajeAgente2 / 100);
                                              const agente2Bs = agente2Usd * 9.76;
                                              setApprovalModalData({
                                                colabId: colab.id,
                                                propiedadId: colab.propiedadId,
                                                propiedadNombre: colab.propiedadNombre || `Propiedad ${colab.propiedadId}`,
                                                propertyPrice: price,
                                                totalCommission: totalComm,
                                                propioUsd,
                                                propioBs,
                                                agente1: colab.agente1,
                                                agente1Usd,
                                                agente1Bs,
                                                agente2: colab.agente2,
                                                agente2Usd,
                                                agente2Bs
                                              });
                                            }}
                                            className="bg-[#04045E] hover:bg-[#04045E]/90 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-xs shrink-0 hover:scale-105 active:scale-95"
                                          >
                                            Aprobar Cierre
                                          </button>
                                        </>
                                      )}
                                      {colab.estado === 'APROBAR_PAGO_SOLICITADO' && (
                                        <>
                                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full tracking-wider animate-pulse shrink-0 select-none">
                                            ⚠️ Pago Solicitado
                                          </span>
                                          <button
                                            onClick={() => {
                                              const price = getPropertyPrice(colab.propiedadId);
                                              const totalComm = price * 0.03;
                                              const propioUsd = totalComm * (colab.porcentajePropio / 100);
                                              const propioBs = propioUsd * 9.76;
                                              const agente1Usd = totalComm * (colab.porcentajeAgente1 / 100);
                                              const agente1Bs = agente1Usd * 9.76;
                                              const agente2Usd = totalComm * (colab.porcentajeAgente2 / 100);
                                              const agente2Bs = agente2Usd * 9.76;
                                              setApprovalModalData({
                                                colabId: colab.id,
                                                propiedadId: colab.propiedadId,
                                                propiedadNombre: colab.propiedadNombre || `Propiedad ${colab.propiedadId}`,
                                                propertyPrice: price,
                                                totalCommission: totalComm,
                                                propioUsd,
                                                propioBs,
                                                agente1: colab.agente1,
                                                agente1Usd,
                                                agente1Bs,
                                                agente2: colab.agente2,
                                                agente2Usd,
                                                agente2Bs
                                              });
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider py-1.5 px-3 rounded-lg cursor-pointer transition-all shadow-xs shrink-0 hover:scale-105 active:scale-95"
                                            >
                                            Pagar Comisión
                                          </button>
                                        </>
                                      )}
                                      {colab.estado === 'PAGADO_CERRADO' && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-1 rounded-full tracking-wider shrink-0 select-none">
                                          🔒 TRANSACTION ARCHIVADA
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {expandedColabId === colab.id && (() => {
                                  const price = getPropertyPrice(colab.propiedadId);
                                  const totalComm = price * 0.03;
                                  const propioUsd = totalComm * (colab.porcentajePropio / 100);
                                  const propioBs = propioUsd * 9.76;
                                  const agente1Usd = totalComm * (colab.porcentajeAgente1 / 100);
                                  const agente1Bs = agente1Usd * 9.76;
                                  const agente2Usd = totalComm * (colab.porcentajeAgente2 / 100);
                                  const agente2Bs = agente2Usd * 9.76;
                                  return (
                                    <tr className="bg-slate-50/60 animate-in fade-in duration-200">
                                      <td colSpan={8} className="p-4 border-t border-b border-slate-100">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                                          <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-black text-[#04045E] uppercase tracking-wider text-xs">📊 Desglose Monetario en Caliente (Comisión 3%)</span>
                                            <span className="text-[10px] font-bold text-slate-400">ID PROPIEDAD: {colab.propiedadId}</span>
                                          </div>
                                          <div className="flex items-center gap-2 border-b pb-2 text-xs">
                                            <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Plantillas Rápidas:</span>
                                            <button
                                              type="button"
                                              onClick={() => applyPreset(colab.id, [50, 25, 25])}
                                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg border border-slate-250 cursor-pointer transition-all active:scale-95"
                                            >
                                              [50 / 25 / 25]
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => applyPreset(colab.id, [40, 30, 30])}
                                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg border border-slate-250 cursor-pointer transition-all active:scale-95"
                                            >
                                              [40 / 30 / 30]
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => applyPreset(colab.id, [100, 0, 0])}
                                              className="bg-[#04045E]/10 hover:bg-[#04045E]/20 text-[#04045E] text-[9px] font-black uppercase tracking-wider py-1 px-2.5 rounded-lg border border-[#04045E]/20 cursor-pointer transition-all active:scale-95"
                                            >
                                              [Directo 100%]
                                            </button>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                                            <div className="space-y-1">
                                              <p>Precio Comercial Propiedad: <span className="font-extrabold text-slate-900">${price.toLocaleString()} USD</span></p>
                                              <p>Comisión Estándar Agencia (3%): <span className="font-extrabold text-slate-900">${totalComm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</span></p>
                                              <p className="text-emerald-700 font-extrabold">Monto total de comisión a distribuir: ${totalComm.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
                                            </div>
                                            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                                              <p className="flex justify-between">
                                                <span>Propio Plataforma ({colab.porcentajePropio}%):</span>
                                                <span className="font-extrabold text-slate-900">${propioUsd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD <span className="text-slate-400 font-normal">(~Bs. {propioBs.toLocaleString(undefined, {minimumFractionDigits: 2})})</span></span>
                                              </p>
                                              <p className="flex justify-between">
                                                <span>Agente 1 ({colab.porcentajeAgente1}%):</span>
                                                <span className="font-extrabold text-blue-600">${agente1Usd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD <span className="text-slate-400 font-normal">(~Bs. {agente1Bs.toLocaleString(undefined, {minimumFractionDigits: 2})})</span></span>
                                              </p>
                                              <p className="flex justify-between">
                                                <span>Agente 2 ({colab.porcentajeAgente2}%):</span>
                                                <span className="font-extrabold text-[#04045E]">${agente2Usd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD <span className="text-slate-400 font-normal">(~Bs. {agente2Bs.toLocaleString(undefined, {minimumFractionDigits: 2})})</span></span>
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })()}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* JSX_PAGINACION_FOOTER */}
                  <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-3">
                    {/* Left: Info */}
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Mostrando {filteredColabs.length === 0 ? 0 : startIdx + 1}-{Math.min(endIdx, filteredColabs.length)} de {filteredColabs.length} colaboraciones
                    </span>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        &lt; Anterior
                      </button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 border rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              isActive
                                ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Siguiente &gt;
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* [JSX_MODAL_ALERT_CONFIRMACION] — Modal de Solicitud de Colaboración Enviada */}
      {colabConfirmModal?.visible && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
          onClick={() => setColabConfirmModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Solicitud de colaboración enviada"
        >
          <div
            className="rounded-3xl bg-white shadow-2xl p-6 border border-gray-100 max-w-sm w-full flex flex-col items-center gap-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ícono principal */}
            <div className="w-16 h-16 rounded-full bg-[#006673]/10 flex items-center justify-center text-3xl select-none">
              🤝
            </div>

            {/* Encabezado */}
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#006673] uppercase tracking-wide">
                ¡Solicitud Enviada!
              </h3>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                ¡Solicitud de colaboración enviada con éxito para la propiedad:{' '}
                <span className="font-black text-[#04045E]">
                  &ldquo;{colabConfirmModal.propiedadNombre}&rdquo;
                </span>
                ! Se notificará al agente captador.
              </p>
            </div>

            {/* Detalle de regla de negocio */}
            <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-3 space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#006673] inline-block shrink-0" />
                Agente Vendedor · Partición de cierre asignada
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block shrink-0" />
                Agente Captador · Fee independiente modelo Propio
              </div>
            </div>

            {/* CTA */}
            <button
              id="btn-cerrar-colab-confirm"
              onClick={() => setColabConfirmModal(null)}
              className="rounded-full bg-[#006673] hover:bg-[#004d57] text-white px-6 py-2 text-sm font-bold tracking-wide transition-colors w-full mt-1 cursor-pointer active:scale-95"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ponytail: Approval Confirmation Modal */}
      {approvalModalData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Confirmar Cierre de Colaboración</h3>
              <button onClick={() => setApprovalModalData(null)} className="text-slate-400 hover:text-slate-650 font-bold text-sm">✕</button>
            </div>
            <div className="space-y-3 text-xs font-semibold text-slate-700">
              <div className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl space-y-1">
                <p>ID Colaboración: <span className="font-extrabold text-slate-900">{approvalModalData.colabId}</span></p>
                <p>Propiedad: <span className="font-extrabold text-slate-900">{approvalModalData.propiedadNombre} ({approvalModalData.propiedadId})</span></p>
                <p>Precio Comercial: <span className="font-extrabold text-slate-900">${approvalModalData.propertyPrice.toLocaleString()} USD</span></p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-black text-emerald-700">Monto total de comisión a distribuir (3%): ${approvalModalData.totalCommission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
                
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <p className="flex justify-between border-b pb-1">
                    <span>Propio Plataforma:</span>
                    <span className="font-extrabold text-slate-900">${approvalModalData.propioUsd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD <span className="text-slate-400 font-normal">(~Bs. {approvalModalData.propioBs.toLocaleString(undefined, {minimumFractionDigits: 2})})</span></span>
                  </p>
                  <p className="flex justify-between border-b pb-1">
                    <span>Agente 1 ({approvalModalData.agente1}):</span>
                    <span className="font-extrabold text-blue-600">${approvalModalData.agente1Usd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD <span className="text-slate-400 font-normal">(~Bs. {approvalModalData.agente1Bs.toLocaleString(undefined, {minimumFractionDigits: 2})})</span></span>
                  </p>
                  <p className="flex justify-between">
                    <span>Agente 2 ({approvalModalData.agente2}):</span>
                    <span className="font-extrabold text-[#04045E]">${approvalModalData.agente2Usd.toLocaleString(undefined, {minimumFractionDigits: 2})} USD <span className="text-slate-400 font-normal">(~Bs. {approvalModalData.agente2Bs.toLocaleString(undefined, {minimumFractionDigits: 2})})</span></span>
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setApprovalModalData(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleAprobacionGeneral(approvalModalData.colabId);
                  setApprovalModalData(null);
                }}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                Confirmar Aprobación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ponytail: New Collaboration Request Modal */}
      {isNewColabModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#006673]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">Nueva Solicitud de Colaboración</h3>
              <button 
                onClick={() => {
                  setIsNewColabModalOpen(false);
                  setNewColabPropId('');
                  setNewColabAgente1('');
                  setNewColabAgente2('');
                  setNewColabPctPropio(50);
                  setNewColabPctAgente1(25);
                  setNewColabPctAgente2(25);
                }} 
                className="text-slate-400 hover:text-slate-650 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Inmueble</label>
                <select
                  value={newColabPropId}
                  onChange={(e) => setNewColabPropId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#006673] focus:outline-none transition-all"
                >
                  <option value="">Seleccione una propiedad...</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.id}) - ${p.price?.toLocaleString()} USD
                    </option>
                  ))}
                  {/* Fallback mock options if properties empty */}
                  {properties.length === 0 && (
                    <>
                      <option value="#PR-1024">Casa de Lujo en Cala Cala (#PR-1024) - $180,000 USD</option>
                      <option value="#PR-3099">Departamento en Queru Queru (#PR-3099) - $900,000 USD</option>
                      <option value="#PR-0841">Casa en Zona Norte (#PR-0841) - $95,000 USD</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Agente 1 (Vendedor)</label>
                  <select
                    value={newColabAgente1}
                    onChange={(e) => setNewColabAgente1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#006673] focus:outline-none transition-all"
                  >
                    <option value="">Seleccione Agente 1...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                    <option value="Carlos Mendoza">Carlos Mendoza</option>
                    <option value="Jorge Villa">Jorge Villa</option>
                    <option value="Ricardo Paz">Ricardo Paz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Agente 2 (Captador)</label>
                  <select
                    value={newColabAgente2}
                    onChange={(e) => setNewColabAgente2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#006673] focus:outline-none transition-all"
                  >
                    <option value="">Seleccione Agente 2...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                    <option value="Marta López">Marta López</option>
                    <option value="Elena Rostova">Elena Rostova</option>
                    <option value="Sofía Gómez">Sofía Gómez</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribución de Porcentajes (%)</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">% Propio</label>
                    <input
                      type="number"
                      value={newColabPctPropio}
                      onChange={(e) => setNewColabPctPropio(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-xs text-center font-bold text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">% Agente 1</label>
                    <input
                      type="number"
                      value={newColabPctAgente1}
                      onChange={(e) => setNewColabPctAgente1(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-xs text-center font-bold text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">% Agente 2</label>
                    <input
                      type="number"
                      value={newColabPctAgente2}
                      onChange={(e) => setNewColabPctAgente2(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 px-2 py-1.5 rounded-xl text-xs text-center font-bold text-slate-700 bg-white"
                    />
                  </div>
                </div>
                {(() => {
                  const sum = newColabPctPropio + newColabPctAgente1 + newColabPctAgente2;
                  const isErr = sum !== 100;
                  return (
                    <div className="flex justify-between items-center pt-1 border-t text-[10px] font-bold">
                      <span className={isErr ? 'text-red-500 animate-pulse' : 'text-emerald-700'}>
                        Suma Total: {sum}% {isErr ? '(Debe ser exactamente 100%)' : '✓'}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  setIsNewColabModalOpen(false);
                  setNewColabPropId('');
                  setNewColabAgente1('');
                  setNewColabAgente2('');
                  setNewColabPctPropio(50);
                  setNewColabPctAgente1(25);
                  setNewColabPctAgente2(25);
                }}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={!newColabPropId || !newColabAgente1 || !newColabAgente2 || (newColabPctPropio + newColabPctAgente1 + newColabPctAgente2 !== 100)}
                onClick={() => {
                  const propObj = properties.find(p => p.id === newColabPropId) || { title: 'Propiedad Seleccionada' };
                  const newColab: Collaboration = {
                    id: `COLAB-${Date.now()}`,
                    agente1: newColabAgente1,
                    agente2: newColabAgente2,
                    propiedadId: newColabPropId,
                    propiedadNombre: propObj.title,
                    porcentajePropio: newColabPctPropio,
                    porcentajeAgente1: newColabPctAgente1,
                    porcentajeAgente2: newColabPctAgente2,
                    estado: 'PENDIENTE_APROBACION',
                    agenteVendedorGestionaCierre: true,
                    captadorFeeIndependiente: true,
                  };
                  setCollaborations(prev => {
                    const updated = [newColab, ...prev];
                    localStorage.setItem('propio_admin_collaborations', JSON.stringify(updated));
                    return updated;
                  });
                  setIsNewColabModalOpen(false);
                  setNewColabPropId('');
                  setNewColabAgente1('');
                  setNewColabAgente2('');
                  setNewColabPctPropio(50);
                  setNewColabPctAgente1(25);
                  setNewColabPctAgente2(25);
                }}
                className="py-2 px-4 bg-[#006673] hover:bg-[#004d57] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Crear Colaboración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECEIPT VIEWER */}

      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Comprobante de Pago</h3>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <img src={selectedReceipt} alt="Comprobante" className="w-full h-64 object-cover rounded-xl border" />
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT SPLIT COMMISSION MODAL */}
      {editingAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Editar Ficha del Asesor</h3>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingAgent(null); }} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-500 w-full mb-4">
                ID AGENTE: {editingAgent.id}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Nombre del Agente</label>
                  <input
                    type="text"
                    value={editingAgent.name}
                    onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingAgent.email}
                    onChange={e => setEditingAgent({ ...editingAgent, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingAgent.phone}
                    onChange={e => setEditingAgent({ ...editingAgent, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Comisión Base (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingAgent.commissionRate}
                    onChange={e => setEditingAgent({ ...editingAgent, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Rating ⭐ (0 - 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={editingAgent.rating}
                    onChange={e => setEditingAgent({ ...editingAgent, rating: Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Reparto PROPIO (%)</label>
                  <input
                    type="number"
                    value={editingAgent.splitPropio}
                    onChange={e => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setEditingAgent({ ...editingAgent, splitPropio: val, splitAgent: 100 - val });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Reparto AGENTE (%)</label>
                  <input
                    type="number"
                    value={editingAgent.splitAgent}
                    onChange={e => {
                      const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                      setEditingAgent({ ...editingAgent, splitAgent: val, splitPropio: 100 - val });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Aptitud (0 - 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingAgent.aptitude ?? ''}
                    onChange={e => setEditingAgent({ ...editingAgent, aptitude: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingAgent(null); }}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const updated = agents.map(a => a.id === editingAgent.id ? editingAgent : a);
                  setAgents(updated);
                  localStorage.setItem('propio_admin_agents', JSON.stringify(updated));
                  setEditingAgent(null);
                  alert('¡Ficha del asesor actualizada con éxito!');
                }}
                className="flex-1 py-2 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-red-600 uppercase">Confirmar Eliminación</h3>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingAgent(null); }} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                ¿Estás seguro de eliminar permanentemente al agente <strong>{deletingAgent.name}</strong>? Esta acción es irreversible y purgará su registro del panel.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingAgent(null); }}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const targetId = deletingAgent.id;

                  // 1. DELETE from backend
                  const token = getToken() || '';
                  try {
                    await apiClient.deleteWithAuth(`/admin/agents/${targetId}`, token);
                  } catch (err) {
                    console.error('Error deleting agent from backend:', err);
                  }

                  // 2. Add to local exclusion list
                  let excludedIds: string[] = [];
                  const savedExcluded = localStorage.getItem('propio_deleted_agent_ids');
                  if (savedExcluded) {
                    try {
                      excludedIds = JSON.parse(savedExcluded);
                    } catch (e) {
                      console.error('Error parsing deleted agents exclusion list', e);
                    }
                  }
                  if (!excludedIds.includes(targetId)) {
                    excludedIds.push(targetId);
                  }
                  localStorage.setItem('propio_deleted_agent_ids', JSON.stringify(excludedIds));

                  // 3. Reactively update local state (zero page refresh)
                  const updatedAgents = agents.filter(agent => agent.id !== targetId);
                  setAgents(updatedAgents);
                  localStorage.setItem('propio_admin_agents', JSON.stringify(updatedAgents));
                  setDeletingAgent(null);
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROSPECT MODAL */}
      {editingProspect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Editar Prospecto ({editingProspect.id})</h3>
              <button onClick={() => setEditingProspect(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingProspect.name}
                    onChange={e => setEditingProspect({ ...editingProspect, name: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editingProspect.email}
                    onChange={e => setEditingProspect({ ...editingProspect, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingProspect.phone}
                    onChange={e => setEditingProspect({ ...editingProspect, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Propiedad de Interés</label>
                  <input
                    type="text"
                    value={editingProspect.interest}
                    onChange={e => setEditingProspect({ ...editingProspect, interest: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Presupuesto (USD)</label>
                  <input
                    type="number"
                    value={editingProspect.budget}
                    onChange={e => setEditingProspect({ ...editingProspect, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Origen</label>
                  <select
                    value={editingProspect.source}
                    onChange={e => setEditingProspect({ ...editingProspect, source: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  >
                    <option value="TIKTOK">TIKTOK</option>
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="RECOMENDADO">RECOMENDADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Estado</label>
                  <select
                    value={editingProspect.status}
                    onChange={e => setEditingProspect({ ...editingProspect, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  >
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="CONTACTADO">CONTACTADO</option>
                    <option value="VISITA_AGENDADA">VISITA_AGENDADA</option>
                    <option value="COMPRADO">COMPRADO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Responsable</label>
                  <select
                    value={editingProspect.assignedAgent || ''}
                    onChange={e => setEditingProspect({ ...editingProspect, assignedAgent: e.target.value || null })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:border-[#04045E] focus:outline-none transition-all"
                  >
                    <option value="">Sin Asignar</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingProspect(null)}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    const token = getToken() || '';
                    await apiClient.patchWithAuth(`/leads/${editingProspect.id}`, {
                      name: editingProspect.name,
                      email: editingProspect.email,
                      phone: editingProspect.phone,
                      interest: editingProspect.interest,
                      budget: editingProspect.budget,
                      status: editingProspect.status,
                      assignedAgent: editingProspect.assignedAgent
                    }, token);
                    
                    const updated = prospects.map(p => p.id === editingProspect.id ? editingProspect : p);
                    setProspects(updated);
                    setEditingProspect(null);
                    alert('¡Prospecto actualizado con éxito en la base de datos!');
                  } catch (err) {
                    console.error('Error saving prospect to DB:', err);
                    alert('No se pudo guardar en el servidor. Reintentando localmente.');
                    const updated = prospects.map(p => p.id === editingProspect.id ? editingProspect : p);
                    setProspects(updated);
                    setEditingProspect(null);
                  }
                }}
                className="flex-1 py-2 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlanProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-[#04045E] uppercase">Modificar Plan Inmueble</h3>
              <button onClick={() => setEditingPlanProperty(null)} className="text-slate-400 hover:text-slate-655 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold">
                Cambia el plan publicitario del cliente para: <strong>{editingPlanProperty.title}</strong>
              </p>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Plan Publicitario</label>
<select
                  defaultValue={parsePlanFromProperty(editingPlanProperty as any)}
                  onChange={e => {
                    const planKey = normalizePlanKey(e.target.value);
                    setEditingPlanProperty({
                      ...editingPlanProperty,
                      plan: planKey,
                      isVerified: planKey !== 'gratis',
                      verified: planKey !== 'gratis',
                    } as any);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs text-[#04045E] font-black uppercase"
                >
                  {PLAN_KEYS.map(k => (
                    <option key={k} value={k}>Plan {PLAN_LABELS[k]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingPlanProperty(null)}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const planKey = normalizePlanKey((editingPlanProperty as any).plan);
                  await handleUpdatePropertyPlan(editingPlanProperty.id, planKey);
                  setEditingPlanProperty(null);
                }}
                className="flex-1 py-2 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase"
              >
                Guardar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER LATERAL DE EDICIÓN DE PROPIEDAD */}
      {editingProperty && (
        <div className="fixed inset-0 z-[100] bg-[#04045E]/40 backdrop-blur-xs flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div className="absolute inset-0" onClick={() => setEditingProperty(null)} />

          {/* Drawer principal */}
          <div className="relative fixed inset-y-0 right-0 max-w-2xl w-full bg-white shadow-2xl z-[110] flex flex-col h-full animate-slideInRight">

            {/* ── HEADER ── */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="space-y-0.5">
                <h2 className="text-sm font-black text-[#04045E] uppercase tracking-tight">Editar Ficha de Inmueble</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  ID: <span className="text-[#04045E]">{editingProperty.id}</span> · Modificación total de datos
                </p>
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProperty(null); }}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-2 hover:bg-slate-100 rounded-full transition-all active:scale-95"
              >✕</button>
            </div>

            {/* ── CUERPO SCROLLABLE ── */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* [JSX_LAYOUT_EXPANDIDO_FORMULARIO] ── Sección: Información Básica */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Información General</p>

                  {/* Título */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Título del Inmueble</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] transition-colors bg-slate-50"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Descripción</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] transition-colors bg-slate-50 resize-none"
                    />
                  </div>

                  {/* Fila Tipo + Oferta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Tipo de Propiedad</label>
                      <select
                        value={editingProperty.type || 'casa'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, type: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#04045E]"
                      >
                        {['casa','departamento','terreno','oficina'].map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Tipo de Oferta</label>
                      <select
                        value={editingProperty.offerType || 'VENTA'}
                        onChange={(e) => setEditingProperty({ ...editingProperty, offerType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#04045E]"
                      >
                        <option value="VENTA">Venta</option>
                        <option value="ALQUILER">Alquiler</option>
                        <option value="ANTICRÉTICO">Anticrético</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* ── Sección: Precios (grid 2 cols) ── */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Precios</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Precio ($ USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">$</span>
                        <input
                          type="number"
                          min={0}
                          value={editPriceUSD}
                          onChange={(e) => setEditPriceUSD(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Precio (Bs.)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">Bs</span>
                        <input
                          type="number"
                          min={0}
                          value={editPriceBOB}
                          onChange={(e) => setEditPriceBOB(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── Sección: Dimensiones + Zona (grid) ── */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Dimensiones y Ubicación</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Sup. Terreno (M²)</label>
                      <input
                        type="number"
                        min={0}
                        value={editLandArea}
                        onChange={(e) => setEditLandArea(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Sup. Construida (M²)</label>
                      <input
                        type="number"
                        min={0}
                        value={editBuiltArea}
                        onChange={(e) => setEditBuiltArea(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                        placeholder="0"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Zona / Barrio</label>
                      <input
                        type="text"
                        value={editZona}
                        onChange={(e) => setEditZona(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                        placeholder="Ej: Cala Cala, Zona Norte..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Habitaciones</label>
                      <input
                        type="number"
                        min={0}
                        value={editingProperty.rooms || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, rooms: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Baños</label>
                      <input
                        type="number"
                        min={0}
                        value={editingProperty.bathrooms || ''}
                        onChange={(e) => setEditingProperty({ ...editingProperty, bathrooms: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#04045E] bg-slate-50"
                      />
                    </div>
                  </div>
                </section>
                

                {/* ── Sección: Amenidades (pills interactivos) ── */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Amenidades del Inmueble</p>
                  <div className="flex flex-wrap gap-2">
                    {['Piscina','Jardín','Garaje','Ascensor','Seguridad 24/7','Gimnasio','Sala de Juegos','Terraza','Bodega','Churrasquera'].map(am => {
                      const isActive = !!editAttributes[am];
                      return (
                        <button
                          key={am}
                          type="button"
                          onClick={() => toggleAttribute(am)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-[#04045E] text-white border-[#04045E] shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#04045E]/40 hover:bg-slate-50'
                          }`}
                        >
                          {isActive ? '✓ ' : ''}{am}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── Sección: Sostenibilidad (flags booleanos) ── */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">🌱 Sostenibilidad</p>
                  <div className="flex flex-wrap gap-2">
                    {([ ['calefonSolar','☀️ Calefón Solar'], ['panelesSolares','⚡ Paneles Solares'], ['iluminacionLed','💡 Iluminación LED'], ['reciclajeAgua','💧 Reciclaje de Agua'] ] as const).map(([key, label]) => {
                      const isOn = editSostenibilidad[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditSostenibilidad(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer active:scale-95 ${
                            isOn
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* ── Sección: Documentación Legal (checklist) ── */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Documentación Legal</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ['hasFolioReal','Folio Real'],
                      ['hasCatastro','Código Catastral'],
                      ['hasTestimonio','Testimonio'],
                      ['hasImpuestosAlDia','Impuestos al Día'],
                      ['hasPlanoUsoSuelo','Plano de Uso de Suelo'],
                      ['hasCI','CI del Propietario'],
                    ] as [string, string][]).map(([field, label]) => (
                      <label key={field} className="flex items-center gap-2 text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!editingProperty[field]}
                          onChange={(e) => setEditingProperty({ ...editingProperty, [field]: e.target.checked })}
                          className="w-3.5 h-3.5 rounded accent-[#04045E] cursor-pointer"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </section>

                {/* [JSX_SECCION_ADJUNTAR_DOCUMENTACION] ── Documentación de Respaldo */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Documentación de Respaldo del Inmueble</p>

                  {/* Botón adjuntar */}
                  <div>
                    <label
                      htmlFor="input-adjuntar-doc"
                      className="inline-flex items-center gap-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-[#04045E]/40 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-[#04045E] transition-all active:scale-95"
                    >
                      <span className="text-base">📎</span>
                      + Adjuntar Documento Legal
                    </label>
                    <input
                      id="input-adjuntar-doc"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAdjuntarDocumento(e.target.files)}
                    />
                  </div>

                  {/* Lista de documentos adjuntos locales */}
                  {editDocumentosAdjuntos.length > 0 && (
                    <ul className="space-y-1.5">
                      {editDocumentosAdjuntos.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#04045E]/10 text-[#04045E] shrink-0">{doc.tipo}</span>
                            <span className="text-[10px] font-bold text-slate-700 truncate">{doc.nombre}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEliminarDocumento(doc.id)}
                            className="text-slate-300 hover:text-red-500 font-black text-xs shrink-0 transition-colors cursor-pointer"
                            aria-label={`Eliminar ${doc.nombre}`}
                          >✕</button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Documentos ya subidos al backend */}
                  {editDocuments.length > 0 && (
                    <ul className="space-y-1.5">
                      {editDocuments.map((doc: { id: string; fileName?: string; fileUrl?: string }) => (
                        <li key={doc.id} className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">BD</span>
                            <span className="text-[10px] font-bold text-slate-700 truncate">{doc.fileName || doc.fileUrl || doc.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-slate-300 hover:text-red-500 font-black text-xs shrink-0 transition-colors cursor-pointer"
                            aria-label="Eliminar documento"
                          >✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* ── Sección: Galería de Fotos ── */}
                <section className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-1">Galería de Fotos del Anuncio</p>
                  <div className="flex flex-wrap gap-2">
                    {editImages.map((img, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >✕</button>
                        {idx === 0 && (
                          <span className="absolute bottom-0.5 left-0.5 bg-[#04045E]/80 text-white text-[7px] font-black px-1 rounded">PORTADA</span>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#04045E]/40 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-400 hover:text-[#04045E] transition-all cursor-pointer shrink-0 active:scale-95"
                    >
                      <span className="text-xl">+</span>
                      <span className="text-[8px] font-black uppercase">URL</span>
                    </button>
                  </div>
                </section>

              </div>

              {/* [JSX_FOOTER_BOTONES_ACCION] */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                  Los cambios se guardan de forma permanente
                </p>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingProperty(null); }}
                    className="bg-gray-100 text-gray-700 rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all active:scale-95 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="bg-[#a3e635] text-slate-900 font-bold rounded-xl px-6 py-2.5 text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-md"
                  >
                    {isSavingEdit
                      ? <><span className="animate-spin inline-block w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full" /> Guardando...</>
                      : 'Guardar Cambios 🚀'
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* QUICK VIEW PROPERTY MODAL */}
      {activePropertyPreview && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200" 
          onClick={() => {
            setActivePropertyPreview(null);
            setPreviewPropertyData(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar */}
            <button 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-lg font-bold transition-colors cursor-pointer" 
              onClick={() => {
                setActivePropertyPreview(null);
                setPreviewPropertyData(null);
              }}
            >
              ✕
            </button>

            {loadingPreview ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]" />
                <p className="text-xs font-black text-[#04045E] uppercase tracking-widest animate-pulse">Cargando datos...</p>
              </div>
            ) : previewPropertyData ? (
              <div className="animate-in fade-in duration-200">
                {/* Contenido de la Ficha */}
                <img 
                  src={previewPropertyData.media?.photos?.[0] || previewPropertyData.imageUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'} 
                  className="w-full h-44 object-cover rounded-xl mb-3 border border-slate-100" 
                  alt="Inmueble" 
                />
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  #{previewPropertyData.id.substring(0, 8).toUpperCase()}
                </span>
                <h3 className="font-bold text-[#04045E] text-base mt-2 leading-snug">{previewPropertyData.title}</h3>
                <p className="text-xs text-slate-500 mb-4 mt-1">📍 {previewPropertyData.location?.address || 'Cochabamba'}</p>
                
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-lg font-extrabold text-[#0B1354]">
                    ${previewPropertyData.price?.toLocaleString()} USD
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    Plan: {previewPropertyData.verified ? 'Venta Pro' : 'Gratis'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-500 text-center py-6">No se encontraron datos de la propiedad.</p>
            )}
          </div>
        </div>
      )}

      {/* FORMULARIO PARA AÑADIR NUEVO AGENTE MODAL */}
      {showAddAgentModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => {
            setGeneratedCredentials(null);
            setShowAddAgentModal(false);
          }}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {generatedCredentials === null ? (
              <>
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b mb-4">
                  <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                    Añadir Nuevo Asesor
                  </h3>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAddAgentModal(false); }} 
                    className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddAgent} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Completo del Asesor *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Roberto Claros"
                      value={newAgentName}
                      onChange={(e) => setNewAgentName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Correo Personal/Contacto *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="Ej: roberto@propio.bo"
                      value={newAgentEmail}
                      onChange={(e) => setNewAgentEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>

                  {/* Password Generator Component */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contraseña de Acceso *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder="Contraseña autogenerada o personalizada"
                        value={newAgentPassword}
                        onChange={(e) => setNewAgentPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono font-bold text-slate-700 tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button 
                        type="button"
                        onClick={(e) => generateSecurePassword(e)}
                        className="inline-flex items-center justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-slate-200 shrink-0 select-none"
                      >
                        Generar Contraseña 🔑
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono de Contacto *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="Ej: +591 772 34871"
                        value={newAgentPhone}
                        onChange={(e) => setNewAgentPhone(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Comisión Base Inicial (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        required
                        value={newAgentCommission}
                        onChange={(e) => setNewAgentCommission(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CI O PASAPORTE</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 8372461 L.P."
                        value={newAgentCI}
                        onChange={(e) => setNewAgentCI(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ciudad de Residencia</label>
                      <select
                        value={newAgentCity}
                        onChange={(e) => setNewAgentCity(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                      >
                        <option value="Cochabamba">Cochabamba</option>
                        <option value="La Paz">La Paz</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Tarija">Tarija</option>
                        <option value="Sucre">Sucre</option>
                        <option value="Oruro">Oruro</option>
                        <option value="Potosí">Potosí</option>
                        <option value="Beni">Beni</option>
                        <option value="Pando">Pando</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Calificación de Aptitud (1 al 100) *</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="100"
                      placeholder="Ej: 92"
                      value={newAgentAptitude}
                      onChange={(e) => setNewAgentAptitude(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddAgentModal(false);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    >
                      Crear Cuenta
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                  ¡Cuenta de Asesor Creada!
                </h3>
                <p className="text-xs text-slate-500 font-semibold px-2">
                  Las credenciales de acceso se han autogenerado exitosamente para <strong>{newAgentName}</strong>.
                </p>

                <div className="space-y-3 text-left">
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">USUARIO</span>
                    <div className="bg-slate-50 border border-slate-200 text-slate-800 font-mono p-2.5 rounded-lg text-xs">
                      {generatedCredentials.username}
                    </div>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CONTRASEÑA TEMPORAL</span>
                    <div className="bg-slate-50 border border-slate-200 text-slate-800 font-mono p-2.5 rounded-lg text-xs font-bold tracking-wider">
                      {generatedCredentials.password}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const text = `*¡Hola, Bienvenido al equipo de propioinmuebles.com!* 🚀\n\nAquí tienes tus credenciales de acceso para la Consola de Asesores:\n\n*Usuario:* ${generatedCredentials.username}\n*Contraseña:* ${generatedCredentials.password}\n\nIngresa al sistema y recuerda cambiar tu contraseña en tu primer inicio de sesión.`;
                      navigator.clipboard.writeText(text);
                      setCopiedCredentials(true);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      copiedCredentials 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {copiedCredentials ? '📋 ¡Copiado al Portapapeles!' : 'Copiar Credenciales 📋'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setGeneratedCredentials(null);
                      setShowAddAgentModal(false);
                      setNewAgentName('');
                      setNewAgentEmail('');
                      setNewAgentPhone('');
                      setNewAgentCI('');
                      setNewAgentBirthDate('');
                      setNewAgentCity('Cochabamba');
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE SUBIR CONTRATO MAESTRO */}
      {isUploadContractModalOpen && (() => {
        const selectedProp = properties.find(p => p.id === contractPropertyId);
        const owner = owners.find(o => o.properties.includes(contractPropertyId) || o.id === (selectedProp as any)?.ownerId);
        const ownerName = owner ? owner.name : (selectedProp ? 'René Vargas' : '');
        
        const agent = selectedProp ? agents.find(a => a.id === selectedProp.agentId || a.id === (selectedProp as any).agent_id) : null;
        const agentName = agent ? agent.name : (selectedProp ? 'Roberto Claros' : '');

        const isRental = !!selectedProp && (contractPropertyId.toLowerCase().includes('rent') || selectedProp?.type?.toLowerCase() === 'alquiler');

        return (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setIsUploadContractModalOpen(false)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b mb-4">
                <div>
                  <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                    Subir y Registrar Contrato Firmado
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Expediente de alquiler / venta vinculado al ERP</p>
                </div>
                <button 
                  onClick={() => setIsUploadContractModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-655 text-lg font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUploadContract} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* A) MENÚ DESPLEGABLE DE SELECCIÓN DE PROPIEDAD */}
                  <div className="col-span-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      PROPIEDAD ASOCIADA *
                    </label>
                    <select
                      required
                      value={contractPropertyId}
                      onChange={(e) => setContractPropertyId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E] bg-slate-50"
                    >
                      <option value="">Seleccione una propiedad...</option>
                      {properties.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.id} - {p.title || 'Sin Título'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* B) AUTOHIDRATACIÓN RELACIONAL SÍNCRONA */}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      PROPIETARIO (ERP)
                    </label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Autohidratado..."
                      value={ownerName}
                      className="w-full border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 cursor-not-allowed outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      AGENTE ENLACE (ERP)
                    </label>
                    <input
                      type="text"
                      readOnly
                      placeholder="Autohidratado..."
                      value={agentName}
                      className="w-full border border-slate-100 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-100 cursor-not-allowed outline-hidden"
                    />
                  </div>

                  {/* C) SECCIÓN CONTRAPARTE */}
                  <div className="col-span-2 border-t pt-3">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      👤 Datos de la Contraparte (Arrendatario / Comprador)
                    </span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          NOMBRE COMPLETO *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Juan Pérez"
                          value={contractTenantName}
                          onChange={(e) => setContractTenantName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          C.I. *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="CI"
                          value={contractTenantCI}
                          onChange={(e) => setContractTenantCI(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          TELÉFONO DE CONTACTO *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. +591 700 12345"
                          value={contractTenantPhone}
                          onChange={(e) => setContractTenantPhone(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* D) PARÁMETROS ECONÓMICOS Y VIGENCIA COMERCIAL */}
                  <div className="col-span-2 border-t pt-3">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      💼 Parámetros de Vigencia y Montos
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          FECHA DE INICIO *
                        </label>
                        <input
                          type="date"
                          required
                          value={contractStartDate}
                          onChange={(e) => setContractStartDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          FECHA DE VENCIMIENTO *
                        </label>
                        <input
                          type="date"
                          required
                          value={contractEndDate}
                          onChange={(e) => setContractEndDate(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          MONTO DEL CONTRATO ({isRental ? 'Bs. Bolivianos' : '$ USD'}) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder={isRental ? 'Monto en Bs.' : 'Monto en USD'}
                          value={contractMonthlyAmount}
                          onChange={(e) => setContractMonthlyAmount(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* E) ZONA DE ADJUNTAR CONTRATO FÍSICO */}
                  <div className="col-span-2 border-t pt-3">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      ADJUNTAR DOCUMENTO FIRMADO (PDF) *
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100/55 transition-all relative">
                      <input
                        type="file"
                        accept=".pdf"
                        required
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setContractFileName(e.target.files[0].name);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span className="text-2xl mb-1">📄</span>
                      <span className="text-[10px] font-black text-[#04045E] uppercase tracking-wider">
                        {contractFileName || 'Seleccionar o arrastrar PDF firmado'}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold uppercase mt-1">Máximo 10MB</span>
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadContractModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#0B1354] hover:bg-opacity-90 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    GUARDAR Y ACTIVAR CONTRATO
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* FORMULARIO PARA AÑADIR NUEVO CONTRATO MODAL */}
      {isContractModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsContractModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b mb-4">
              <div>
                <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                  Crear Nuevo Contrato
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Registre un arrendamiento de manera segura en el sistema</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleInjectMockContract}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-black text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  ⚡ Generar Datos Ficticios
                </button>
                <button 
                  onClick={() => setIsContractModalOpen(false)} 
                  className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateContract} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Propiedad */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PROPIEDAD ASOCIADA *</label>
                  <select
                    required
                    value={contractPropertyId}
                    onChange={(e) => setContractPropertyId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  >
                    <option value="">Seleccione una propiedad...</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.type?.toUpperCase() || 'INMUEBLE'}] {p.title || 'Sin Título'} ({p.location.address || 'Sin Ubicación'}) - ${Number(p.price || 0).toLocaleString()} USD
                      </option>
                    ))}
                  </select>
                </div>

                {/* Arrendatario */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ARRENDATARIO / INQUILINO *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nombre completo"
                    value={contractTenantName}
                    onChange={(e) => setContractTenantName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Monto y Moneda */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MONTO MENSUAL *</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      required
                      placeholder="Monto"
                      value={contractMonthlyAmount}
                      onChange={(e) => setContractMonthlyAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                    <select
                      value={contractCurrency}
                      onChange={(e) => setContractCurrency(e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    >
                      <option value="USD">USD</option>
                      <option value="BOB">BOB</option>
                    </select>
                  </div>
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FECHA DE INICIO *</label>
                  <input 
                    type="date" 
                    required
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Fecha de Fin */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FECHA DE FIN *</label>
                  <input 
                    type="date" 
                    required
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Estado Inicial */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ESTADO DEL CONTRATO</label>
                  <select
                    value={contractStatus}
                    onChange={(e) => setContractStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  >
                    <option value="VIGENTE">Vigente</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="RESCINDIDO">Rescindido</option>
                  </select>
                </div>

                {/* Observaciones */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">OBSERVACIONES</label>
                  <textarea 
                    placeholder="Detalles o notas del acuerdo..."
                    value={contractObservations}
                    onChange={(e) => setContractObservations(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E] resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0B1354] hover:bg-opacity-90 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  Guardar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORMULARIO PARA AÑADIR NUEVA CONSTRUCTORA MODAL */}
      {isNewDeveloperModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsNewDeveloperModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b mb-6">
              <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                FORMULARIO PARA AÑADIR NUEVA CONSTRUCTORA
              </h3>
              <button 
                onClick={() => setIsNewDeveloperModalOpen(false)} 
                className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDeveloper} className="space-y-6 text-left">
              {/* Sección 1: Identidad */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 1: Datos de Identidad de la Empresa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Comercial *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Constructora Innova S.R.L."
                      value={newDevName}
                      onChange={(e) => setNewDevName(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Razón Social / NIT *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="NIT: 102938470"
                      value={newDevNit}
                      onChange={(e) => setNewDevNit(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Año de Fundación / Experiencia</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Más de 15 años de experiencia"
                      value={newDevFoundedYear}
                      onChange={(e) => setNewDevFoundedYear(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Logotipo de la Empresa (PNG/SVG)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: https://midominio.com/logo.png"
                      value={newDevLogoUrl}
                      onChange={(e) => setNewDevLogoUrl(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Contacto */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 2: Información de Contacto y Canales Oficiales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Representante Legal *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Arq. Javier Ortiz"
                      value={newDevRepresentative}
                      onChange={(e) => setNewDevRepresentative(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="Ej: +591 772 34871"
                      value={newDevPhone}
                      onChange={(e) => setNewDevPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="contacto@alianza.bo"
                      value={newDevEmail}
                      onChange={(e) => setNewDevEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                    </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sitio Web (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://alianza.bo"
                      value={newDevWebsite}
                      onChange={(e) => setNewDevWebsite(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Ubicación */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 3: Ubicación de las Oficinas Centrales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ciudad / Zona</label>
                    <input 
                      type="text" 
                      placeholder="Cochabamba - Zona Norte / Recoleta"
                      value={newDevOfficeZone}
                      onChange={(e) => setNewDevOfficeZone(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dirección de Oficina Principal *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Av. América #123, Edificio Recoleta"
                      value={newDevOfficeAddress}
                      onChange={(e) => setNewDevOfficeAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 4: Perfil */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 4: Perfil Institucional y Especialidad</h4>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción / Historia de la Empresa</label>
                  <textarea 
                    rows={3}
                    placeholder="Cuéntanos más sobre la trayectoria, misión y valores de la empresa..."
                    value={newDevDescription}
                    onChange={(e) => setNewDevDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Especialidad del Mercado (Selección Múltiple)</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#04045E]">
                    {[
                      'Edificios Residenciales (Departamentos)',
                      'Condominios Cerrados (Casas)',
                      'Proyectos Comerciales / Oficinas',
                      'Urbanizaciones / Loteamientos'
                    ].map((specialty) => (
                      <label key={specialty} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-all border border-slate-100">
                        <input 
                          type="checkbox"
                          checked={newDevSpecialties.includes(specialty)}
                          onChange={() => handleSpecialtyChange(specialty)}
                          className="rounded-md border-slate-300 text-[#04045E] focus:ring-[#04045E] h-4 w-4"
                        />
                        <span>{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewDeveloperModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  Registrar Constructora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CONSTRUCTORA MODAL */}
      {editingConstructora && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingConstructora(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b mb-6">
              <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                EDITAR CONSTRUCTORA: {editingConstructora.id}
              </h3>
              <button 
                onClick={() => setEditingConstructora(null)} 
                className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditDeveloperSubmit} className="space-y-6 text-left">
              {/* Sección 1: Identidad */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 1: Datos de Identidad de la Empresa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Comercial *</label>
                    <input 
                      type="text" 
                      required
                      value={editingConstructora.empresa}
                      onChange={(e) => editingConstructora && setEditingConstructora({ ...editingConstructora, empresa: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Razón Social / NIT *</label>
                    <input 
                      type="text" 
                      required
                      value={editingConstructora.nit}
                      onChange={(e) => editingConstructora && setEditingConstructora({ ...editingConstructora, nit: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Contacto */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 2: Información de Contacto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Representante Legal *</label>
                    <input 
                      type="text" 
                      required
                      value={editingConstructora.representante}
                      onChange={(e) => editingConstructora && setEditingConstructora({ ...editingConstructora, representante: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono / WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      value={editingConstructora.contacto.phone}
                      onChange={(e) => editingConstructora && setEditingConstructora({ 
                        ...editingConstructora, 
                        contacto: { ...editingConstructora.contacto, phone: e.target.value } 
                      })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico *</label>
                    <input 
                      type="email" 
                      required
                      value={editingConstructora.contacto.email}
                      onChange={(e) => editingConstructora && setEditingConstructora({ 
                        ...editingConstructora, 
                        contacto: { ...editingConstructora.contacto, email: e.target.value } 
                      })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Datos de Stock y Comisión */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Sección 3: Asignación Comercial y Comisión</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Asignado *</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={editingConstructora.stock}
                      onChange={(e) => editingConstructora && setEditingConstructora({ ...editingConstructora, stock: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Esquema Comisión *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: 3% Venta Escalonada"
                      value={editingConstructora.esquemaComision}
                      onChange={(e) => editingConstructora && setEditingConstructora({ ...editingConstructora, esquemaComision: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Etapa Comercial *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: Preventa Torre A"
                      value={editingConstructora.etapa}
                      onChange={(e) => editingConstructora && setEditingConstructora({ ...editingConstructora, etapa: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingConstructora(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONSTRUCTORA CONFIRMATION MODAL */}
      {deletingConstructoraId && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-red-650 uppercase">Confirmar Eliminación</h3>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingConstructoraId(null); }} 
                className="text-slate-400 hover:text-slate-650 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                ¿Estás seguro de dar de baja la constructora <strong>{developers.find(d => d.id === deletingConstructoraId)?.empresa}</strong>? Esta acción es irreversible y purgará su registro del panel.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingConstructoraId(null); }}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await handleDeleteDeveloperConfirm();
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL DETALLE / REVISAR NOTA DE OBSERVACIÓN */}
      {showNotesModalForPayment && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Nota de Observación Financiera</h3>
              <button onClick={() => setShowNotesModalForPayment(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID Ingreso: {showNotesModalForPayment.id}</p>
              <p className="text-xs text-slate-700 font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                {showNotesModalForPayment.notes || 'No se registraron observaciones específicas para esta transacción.'}
              </p>
            </div>
            <button
              onClick={() => setShowNotesModalForPayment(null)}
              className="w-full py-2.5 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL RECHAZAR / REGISTRAR MOTIVO DE OBSERVACIÓN */}
      {showRejectModalForPayment && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Observar Transacción</h3>
              <button onClick={() => { setShowRejectModalForPayment(null); setObservationInput(''); }} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Especifique el motivo de la observación del comprobante de cobro #{showRejectModalForPayment.id}:
              </p>
              <textarea
                rows={3}
                required
                placeholder="Ej: Comprobante borroso / ilegible o el monto no coincide."
                value={observationInput}
                onChange={e => setObservationInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModalForPayment(null); setObservationInput(''); }}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!observationInput.trim()) {
                     alert('Debe ingresar un motivo de observación.');
                     return;
                  }
                  handleUpdatePaymentStatus(showRejectModalForPayment.id, 'OBSERVADO', observationInput);
                  setShowRejectModalForPayment(null);
                  setObservationInput('');
                }}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR NUEVO GASTO */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#0B1354]" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">REGISTRAR NUEVO GASTO</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Concepto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Plomería Torre Norte"
                  value={newExpConcept}
                  onChange={e => setNewExpConcept(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto (USD) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Monto"
                    value={newExpAmount}
                    onChange={e => setNewExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Registro *</label>
                  <input
                    type="date"
                    required
                    value={newExpDate}
                    onChange={e => setNewExpDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoría *</label>
                  <select
                    value={newExpCategory}
                    onChange={e => setNewExpCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
                  >
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Impuestos">Impuestos</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Publicidad">Publicidad</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitante</label>
                  <input
                    type="text"
                    value={newExpRequester}
                    onChange={e => setNewExpRequester(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vinculación (Propiedad/Contrato)</label>
                <input
                  type="text"
                  value={newExpVinculacion}
                  onChange={e => setNewExpVinculacion(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0B1354] hover:bg-opacity-90 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL OBSERVAR GASTO */}
      {showRejectModalForExpense && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Observar Egreso / Gasto</h3>
              <button onClick={() => { setShowRejectModalForExpense(null); setObservationInput(''); }} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Especifique la nota de rechazo u observación del egreso #{showRejectModalForExpense.id}:
              </p>
              <textarea
                rows={3}
                required
                placeholder="Falta factura de compra, comprobante borroso, etc."
                value={observationInput}
                onChange={e => setObservationInput(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowRejectModalForExpense(null); setObservationInput(''); }}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!observationInput.trim()) {
                    alert('Debe ingresar un motivo de observación.');
                    return;
                  }
                  handleUpdateExpenseStatus(showRejectModalForExpense.id, 'OBSERVADO', observationInput);
                  setShowRejectModalForExpense(null);
                  setObservationInput('');
                }}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                Confirmar Observación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE OBSERVACION GASTO */}
      {showNotesModalForExpense && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Nota de Observación de Egreso</h3>
              <button onClick={() => setShowNotesModalForExpense(null)} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID Egreso: {showNotesModalForExpense.id}</p>
              <p className="text-xs text-slate-700 font-semibold bg-slate-50 border border-slate-200 rounded-xl p-3 leading-relaxed">
                {showNotesModalForExpense.notes || 'No se registraron notas de rechazo específicas para este egreso.'}
              </p>
            </div>
            <button
              onClick={() => setShowNotesModalForExpense(null)}
              className="w-full py-2.5 bg-[#04045E] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL AÑADIR FONDOS A CAJA CHICA */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-[#04045E]/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-500" />
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">Añadir Fondos a Caja Chica</h3>
              <button onClick={() => { setShowAddFundsModal(false); setAddFundsAmount(0); }} className="text-slate-400 hover:text-slate-650 font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Especifique la cantidad de fondos extra a inyectar en la caja chica disponible:
              </p>
              <input
                type="number"
                placeholder="Monto USD"
                value={addFundsAmount || ''}
                onChange={e => setAddFundsAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddFundsModal(false); setAddFundsAmount(0); }}
                className="flex-1 py-2 border rounded-xl text-slate-500 text-xs font-bold uppercase hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setExtraFunds(prev => prev + addFundsAmount);
                  setShowAddFundsModal(false);
                  setAddFundsAmount(0);
                  alert('Fondos inyectados reactivamente con éxito.');
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* [DOC_AUDIT_MODAL_JSX] ── Modal Rico de Auditoría de Documentos ─────────────────── */}
      {docAuditOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => { if (!isSavingAudit) handleSaveAndClose(); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
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
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Consola de Auditoría</p>
                  <h3 className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[320px]">{docAuditPropTitle}</h3>
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

            {/* Dos Columnas Body */}
            <div className="flex-1 flex flex-row overflow-hidden h-full">
              {/* Columna Izquierda: Pestañas */}
              <div className="w-1/3 border-r border-slate-150 flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-2.5 shrink-0">
                <div className="pb-2 border-b border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentos del Inmueble</span>
                </div>
                {docAuditLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-[#04045E] animate-spin" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Cargando...</span>
                  </div>
                ) : (
                  docAuditRows.map((row, idx) => {
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
                        <span className="text-xs font-black leading-tight">
                          {row.fileName}
                        </span>
                        <span className={`text-[9px] font-semibold leading-relaxed line-clamp-2 ${isActive ? 'text-white/85' : 'text-slate-450'}`}>
                          {row.description}
                        </span>
                        <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                            row.checked 
                              ? (row.file ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600') 
                              : 'bg-slate-300/20 text-slate-400'
                          }`}>
                            {row.checked ? (row.file ? '✓ Con Archivo' : '⚠️ Declarado Vacío') : '✕ Sin marcar'}
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
                        {row.status === 'REJECTED' && (
                          <div className="mt-2 pt-1.5 border-t border-rose-200/50 flex justify-end">
                            <a
                              href={(() => {
                                const auditedProperty = properties.find(p => p.id === docAuditPropId) as any;
                                const ownerPhone = auditedProperty?.owner?.phone || auditedProperty?.owner?.whatsappPhone || auditedProperty?.contactPhone || '+59170000000';
                                const ownerName = auditedProperty?.owner?.name || auditedProperty?.ownerName || 'Propietario';
                                const formattedPhone = ownerPhone.replace(/[^\d+]/g, '');
                                const cleanPhone = formattedPhone.startsWith('+') ? formattedPhone.substring(1) : formattedPhone;
                                const message = `Hola ${ownerName}, le escribimos de la administración de la Inmobiliaria. Su documento "${row.fileName}" ha sido observado/rechazado en la auditoría debido a: ${row.observations || 'Faltan datos o firma'}. Por favor, reenvíelo modificado lo antes posible.`;
                                return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                              })()}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all ${
                                isActive
                                  ? 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                                  : 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                              }`}
                            >
                              Contactar Propietario 💬
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* ── Botón persistente: Crear nuevo slot documental ── */}
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

              {/* Columna Derecha: Previsualización & Acciones */}
              <div className="w-2/3 flex flex-col bg-white overflow-y-auto p-6 space-y-4">
                {/* Banner de alerta global inline */}
                {(() => {
                  const auditedProperty = properties.find(p => p.id === docAuditPropId) as any;
                  const hasDocs = auditedProperty?.documents && Array.isArray(auditedProperty.documents);
                  const allFilesNull = hasDocs && auditedProperty.documents.every((d: any) => !d.file || d.file === null);

                  if (allFilesNull) {
                    return (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 font-black text-center p-4 rounded-2xl text-[10px] uppercase tracking-wider leading-relaxed">
                        Alerta: No se subió ninguno de los 6 documentos al sistema
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Vista del documento activo */}
                {(() => {
                  if (docAuditLoading || docAuditRows.length === 0) return null;
                  const activeRow = docAuditRows[activeAuditIdx];
                  if (!activeRow) return null;

                  const statusColor =
                    activeRow.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    activeRow.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    activeRow.status === 'PENDING'  ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                 'bg-slate-50 text-slate-500 border-slate-200';
                  const statusLabel =
                    activeRow.status === 'APPROVED' ? '✓ Aprobado' :
                    activeRow.status === 'REJECTED' ? '✗ Rechazado' :
                    activeRow.status === 'PENDING'  ? '⏳ Pendiente' : '— Sin cargar';

                  return (
                    <div className="space-y-4">
                      {/* Input oculto de uso compartido para todas las cargas manuales y reemplazos */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleManualDocumentUpload}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />

                      {/* Cabecera del Documento Activo */}
                      <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                        <div>
                          <h4 className="text-xs font-black text-[#04045E] uppercase tracking-wide">{activeRow.fileName}</h4>
                          <span className="text-[10px] text-slate-450 font-semibold">{activeRow.description}</span>
                        </div>
                        <span className={`text-[9px] font-black border px-2.5 py-1 rounded-lg uppercase ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Visor de Archivo */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex items-center justify-center min-h-[420px] w-full">
                        {activeRow.checked && (!activeRow.file || activeRow.file.trim() === '') ? (
                          <div className="text-center p-6 space-y-3 flex flex-col items-center">
                            <span className="text-3xl">⚠️</span>
                            <p className="text-xs font-black text-rose-600 uppercase tracking-wider">
                              El propietario declaró haber subido este documento, pero el archivo está vacío
                            </p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
                            >
                              📁 Cargar Archivo Manual
                            </button>
                          </div>
                        ) : activeRow.file && activeRow.file.trim() !== '' ? (
                          (() => {
                            const raw = activeRow.file.trim();
                            const fileType = activeRow.fileType || '';
                            const fileName = activeRow.fileName || 'documento';

                            // ponytail: resolve URL — prevents iframe loop when file is a relative /api path
                            const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
                            const sanitizeDocUrl = (url: string): string => {
                              if (!url) return '';
                              if (url.startsWith('data:')) return url;           // base64 blob — already absolute
                              if (/^https?:\/\//i.test(url)) return url;         // already absolute HTTP(S)
                              if (url.startsWith('/')) return `${BACKEND}${url}`; // relative /api/... path
                              // bare filename with no path → assume uploads folder on backend
                              return `${BACKEND}/api/properties/documents/${encodeURIComponent(url)}`;
                            };

                            const sanitized = sanitizeDocUrl(raw);
                            // If we still can't build a usable URL, fall through to empty state
                            if (!sanitized) return null;

                            const isDataUrl = sanitized.startsWith('data:');
                            const cacheBust = isDataUrl ? '' : `${sanitized.includes('?') ? '&' : '?'}t=${activeAuditIdx}-${activeRow.status}`;
                            const fileUrl = sanitized + cacheBust;

                            const isPdf = fileType === 'application/pdf' || raw.includes('data:application/pdf') || raw.toLowerCase().endsWith('.pdf') || raw.includes('/documents/');
                            const isImage = fileType.startsWith('image/') || raw.includes('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(raw) || raw.includes('unsplash.com');

                            if (isPdf) {
                              // ponytail: key forces iframe remount on tab/file switch; object fallback for restrictive browsers; add emergency helper link
                              return (
                                <div className="w-full space-y-2">
                                  <object
                                    key={fileUrl}
                                    data={fileUrl}
                                    type="application/pdf"
                                    className="w-full h-[420px] rounded-xl bg-white border-none"
                                    aria-label={fileName}
                                  >
                                    <iframe
                                      key={`if-${fileUrl}`}
                                      src={fileUrl}
                                      className="w-full h-[420px] border-none rounded-xl bg-white"
                                      title={fileName}
                                    />
                                  </object>
                                  <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-100 p-3.5 rounded-2xl border border-slate-200">
                                    <span>¿Problemas para previsualizar el documento?</span>
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="font-black text-[#04045E] hover:underline"
                                    >
                                      Abrir PDF en pestaña nueva ↗
                                    </a>
                                  </div>
                                </div>
                              );
                            } else if (isImage) {
                              return <img src={fileUrl} alt={fileName} className="max-h-[420px] object-contain rounded-lg mx-auto p-4" />;
                            } else {
                              return (
                                <div className="text-center p-6 space-y-4">
                                  <span className="text-5xl">📄</span>
                                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{fileName}</p>
                                  <a
                                    href={fileUrl}
                                    download={fileName}
                                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition-all text-xs"
                                  >
                                    Descargar {fileName}
                                  </a>
                                </div>
                              );
                            }
                          })()
                        ) : (
                          <div className="text-center p-6 space-y-3 flex flex-col items-center">
                            <span className="text-3xl text-slate-300">📂</span>
                            <p className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                              No subió ningún documento
                            </p>
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer hover:scale-105 active:scale-95"
                            >
                              📁 Cargar Archivo Manual
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Controles de Moderación del Documento Activo */}
                      <div className="flex items-center gap-3 pt-2">
                        {/* Descargar */}
                        {activeRow.fileUrl && !(activeRow.checked && (!activeRow.file || activeRow.file === null)) && (
                          <a
                            href={activeRow.fileUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] font-black border border-[#04045E]/20 text-[#04045E] bg-[#04045E]/5 hover:bg-[#04045E]/10 px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
                          >
                            Descargar Archivo 📥
                          </a>
                        )}

                        {/* Reemplazar PDF (sólo si ya tiene un archivo y no está aprobado) */}
                        {activeRow.file && activeRow.file.trim() !== '' && activeRow.status !== 'APPROVED' && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95"
                          >
                            🔄 Reemplazar PDF
                          </button>
                        )}

                        {/* Aprobar & Rechazar (sólo para propiedades) */}
                        {docAuditEntityType === 'property' && (
                          <>
                            {/* Aprobar */}
                            <button
                              disabled={activeRow.saving || activeRow.status === 'APPROVED'}
                              onClick={() => handleDocAuditSaveRow(activeAuditIdx, 'APPROVED')}
                              className={`inline-flex items-center gap-1 text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
                                activeRow.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:scale-105 active:scale-95'
                              }`}
                            >
                              {activeRow.saving ? '⏳' : '✓'} Aprobar Documento
                            </button>

                            {/* Rechazar */}
                            {!activeRow.rejectOpen ? (
                              <button
                                disabled={activeRow.saving}
                                onClick={() => updateDocAuditRow(activeAuditIdx, { rejectOpen: true })}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-655 uppercase cursor-pointer"
                              >
                                Rechazar
                              </button>
                            ) : (
                              <button
                                onClick={() => updateDocAuditRow(activeAuditIdx, { rejectOpen: false })}
                                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase cursor-pointer"
                              >
                                Cancelar
                              </button>
                            )}
                          </>
                        )}

                        {/* Subir Archivo (sólo para contratos y constructoras) */}
                        {(docAuditEntityType === 'contract' || docAuditEntityType === 'developer') && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 text-[10px] font-black border border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                          >
                            📤 SUBIR ARCHIVO
                          </button>
                        )}
                      </div>

                      {/* Formulario de Rechazo */}
                      {docAuditEntityType === 'property' && activeRow.rejectOpen && (
                        <div className="flex gap-2 pt-2 animate-in slide-in-from-top-1 duration-150">
                          <textarea
                            rows={2}
                            value={activeRow.rejectText}
                            onChange={e => updateDocAuditRow(activeAuditIdx, { rejectText: e.target.value })}
                            placeholder="Motivo obligatorio: ej. Plano borroso, firma omitida..."
                            className="flex-1 resize-none bg-rose-50 border border-rose-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 rounded-xl px-3 py-2 text-xs font-semibold text-rose-900 placeholder:text-rose-300 outline-none transition-all"
                          />
                          <button
                            disabled={activeRow.saving || !activeRow.rejectText.trim()}
                            onClick={() => handleDocAuditSaveRow(activeAuditIdx, 'REJECTED')}
                            className="shrink-0 self-end bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                          >
                            {activeRow.saving ? '⏳' : '💾'} Guardar
                          </button>
                        </div>
                      )}
                      {docAuditEntityType === 'property' && activeRow.status === 'REJECTED' && (
                        <div className="mt-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest block">Documento Rechazado / Observado</span>
                            <p className="text-[11px] font-semibold text-rose-900 leading-normal">
                              Observaciones: {activeRow.observations || 'Ninguna especificada.'}
                            </p>
                          </div>
                          <a
                            href={(() => {
                              const auditedProperty = properties.find(p => p.id === docAuditPropId) as any;
                              const ownerPhone = auditedProperty?.owner?.phone || auditedProperty?.owner?.whatsappPhone || auditedProperty?.contactPhone || '+59170000000';
                              const ownerName = auditedProperty?.owner?.name || auditedProperty?.ownerName || 'Propietario';
                              const formattedPhone = ownerPhone.replace(/[^\d+]/g, '');
                              const cleanPhone = formattedPhone.startsWith('+') ? formattedPhone.substring(1) : formattedPhone;
                              const message = `Hola ${ownerName}, le escribimos de la administración de la Inmobiliaria. Su documento "${activeRow.fileName}" ha sido observado/rechazado en la auditoría debido a: ${activeRow.observations || 'Faltan datos o firma'}. Por favor, reenvíelo modificado lo antes posible.`;
                              return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                            })()}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm flex items-center gap-1.5 shrink-0"
                          >
                            Contactar Propietario 💬
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0 flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Propiedad ID: {docAuditPropId.substring(0, 12)}...
              </span>
              <button
                disabled={isSavingAudit}
                onClick={handleSaveAndClose}
                className="bg-[#04045E] hover:bg-[#04045E]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black px-5 py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                {isSavingAudit ? 'Guardando cambios...' : 'Cerrar Panel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA DOCUMENTO (FR, CT, TS) — Legacy single-doc preview */}
      {(auditPropertyId && auditDocType) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col relative animate-scaleUp">
            <div className="h-14 bg-slate-50 border-b border-slate-100 px-6 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-black text-[#04045E] uppercase tracking-wider">{previewDocTitle}</h3>
              <div className="flex items-center gap-3">
                {previewDocUrl && previewDocUrl.trim() !== '' && (
                  <a
                    href={previewDocUrl}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#04045E] hover:bg-[#04045E]/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all uppercase tracking-wider flex items-center gap-1 shadow-xs"
                  >
                    Descargar Original 📥
                  </a>
                )}
                <button
                  onClick={() => {
                    setPreviewDocUrl(null);
                    setPreviewDocTitle('');
                    setAuditPropertyId(null);
                    setAuditDocType(null);
                    setAuditDocObservations('');
                    setIsRejectingDoc(false);
                  }}
                  className="text-slate-400 hover:text-slate-650 font-black text-sm p-2 cursor-pointer"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-hidden w-full h-full">
              {previewDocUrl && previewDocUrl.trim() !== '' ? (
                previewDocUrl.startsWith('data:application/pdf') || previewDocUrl.endsWith('.pdf') || previewDocUrl.includes('dummy.pdf') || previewDocUrl.includes('sample.pdf') ? (
                  <iframe src={previewDocUrl} className="w-full h-full border-none rounded-xl bg-white" title={previewDocTitle} />
                ) : previewDocUrl.startsWith('data:image/') || previewDocUrl.endsWith('.png') || previewDocUrl.endsWith('.jpg') || previewDocUrl.endsWith('.jpeg') ? (
                  <img src={previewDocUrl} alt={previewDocTitle} className="max-w-full max-h-full object-contain rounded-xl shadow-md" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm text-center">
                    <span className="text-4xl text-rose-500">📄</span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{previewDocTitle || 'Documento PDF'}</span>
                    <a
                      href={previewDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition-all uppercase tracking-wider shadow-sm"
                    >
                      Abrir / Descargar Documento PDF
                    </a>
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center border border-slate-200 rounded-xl text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Selecciona un documento del panel izquierdo para auditar
                </div>
              )}
            </div>

            {/* AUDIT WORKFLOW ACTIONS BAR */}
            {auditDocType && (
              <div className="bg-slate-50 border-t border-slate-100 p-5 flex flex-col gap-4 shrink-0 select-none">
                {!isRejectingDoc ? (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dictamen:</span>
                      {auditDocObservations && (
                        <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">
                          Observación: {auditDocObservations}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveDocument('APPROVED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        Aprobar ✓ / Aprobar Documento ✓
                      </button>
                      <button
                        onClick={() => setIsRejectingDoc(true)}
                        className="bg-rose-550 hover:bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                      >
                        Rechazar / Observar 🚫 / Rechazar / Observar ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escriba las observaciones de rechazo:</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={auditDocObservations}
                        onChange={(e) => setAuditDocObservations(e.target.value)}
                        placeholder="Ej: Firma ilegible, Folio Real desactualizado..."
                        className="flex-grow bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-450"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleResolveDocument('REJECTED', auditDocObservations)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                        >
                          Guardar Observación 💾
                        </button>
                        <button
                          onClick={() => setIsRejectingDoc(false)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* PORTFOLIO PROPERTY DETAILS MODAL */}
      {isPropertyModalOpen && modalPropertyData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsPropertyModalOpen(false);
                setSelectedProperty(null);
                setModalPropertyData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-xl font-bold z-10"
            >
              ✕
            </button>

            {/* Modal Body */}
            <div className="p-6">
              <h2 className="text-xl font-black text-[#04045E] mb-1 flex items-center gap-2">
                🏢 Ficha Completa del Inmueble
              </h2>
              <p className="text-[10px] text-slate-400 font-mono mb-6 uppercase tracking-wider">
                ID Inmueble (legacy): {modalPropertyData.id}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mb-4 uppercase tracking-wider">
                ID Inmueble: {modalPropertyData.id}
              </p>

              {/* Selector de Inmuebles del Propietario (Tabs/Buttons) */}
              {(() => {
                const owner = owners.find(o => o.properties.includes(modalPropertyData.id));
                if (!owner || owner.properties.length <= 1) return null;
                return (
                  <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#04045E] uppercase tracking-wider">
                      Propiedades de {owner.name}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {owner.properties.map((pId) => {
                        const isCurrent = pId === modalPropertyData.id;
                        const propObj = properties.find(p => p.id === pId);
                        return (
                          <button
                            key={pId}
                            onClick={(e) => {
                              e.preventDefault();
                              if (propObj) {
                                setModalPropertyData(mapPropertyToNewSchema(propObj));
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isCurrent 
                                ? 'bg-[#04045E] text-[#b9fa3c] shadow-sm' 
                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {pId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda: Visual / Descriptiva */}
                <div className="space-y-4">
                  {/* Imagen */}
                  <div className="w-full h-64 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-200">
                    <img
                      src={modalPropertyData.media?.photos?.[0] || modalPropertyData.imageUrl || modalPropertyData.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                      alt={modalPropertyData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Estado Badge / Select */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Estado Actual
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        modalPropertyData.status === 'APROBADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        modalPropertyData.status === 'PENDIENTE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        modalPropertyData.status === 'RECHAZADO' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {modalPropertyData.status || 'PENDIENTE'}
                      </span>
                      <select
                        value={modalPropertyData.status || 'PENDIENTE'}
                        onChange={(e) => setModalPropertyData({ ...modalPropertyData, status: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="APROBADO">APROBADO</option>
                        <option value="RECHAZADO">RECHAZADO</option>
                        <option value="NUEVA_PUBLICACION">NUEVA PUBLICACIÓN</option>
                      </select>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Descripción Comercial Completa
                    </label>
                    <textarea
                      value={modalPropertyData.description || ''}
                      onChange={(e) => setModalPropertyData({ ...modalPropertyData, description: e.target.value })}
                      className="w-full h-36 bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400 font-normal"
                      placeholder="Ingrese la descripción completa del inmueble..."
                    />
                  </div>
                </div>

                {/* Columna Derecha: Datos Técnicos y Financieros */}
                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Título del Inmueble
                    </label>
                    <input
                      type="text"
                      value={modalPropertyData.title || ''}
                      onChange={(e) => setModalPropertyData({ ...modalPropertyData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Tipo */}
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Tipo de Inmueble
                      </label>
                      <select
                        value={modalPropertyData.type?.toUpperCase() || 'DEPARTAMENTO'}
                        onChange={(e) => setModalPropertyData({ ...modalPropertyData, type: e.target.value.toLowerCase() as any })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                      >
                        <option value="casa">Casa</option>
                        <option value="departamento">Departamento</option>
                        <option value="terreno">Terreno</option>
                        <option value="oficina">Oficina</option>
                      </select>
                    </div>

                    {/* Precio destacando USD y Bolivianos (Bs.) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Precio (USD)
                        </label>
                        <input
                          type="number"
                          value={modalPropertyData.price || 0}
                          onChange={(e) => setModalPropertyData({ ...modalPropertyData, price: Number(e.target.value) })}
                          className="w-full text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Precio (Bs.)
                        </label>
                        <input
                          type="number"
                          value={modalPropertyData.priceBob || modalPropertyData.priceBs || 0}
                          onChange={(e) => setModalPropertyData({ ...modalPropertyData, priceBob: Number(e.target.value), priceBs: Number(e.target.value) })}
                          className="w-full text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Dirección */}
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Dirección (Calle, Nro)
                      </label>
                      <input
                        type="text"
                        value={modalPropertyData.location?.address || ''}
                        onChange={(e) => setModalPropertyData({
                          ...modalPropertyData,
                          location: { ...modalPropertyData.location, address: e.target.value }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                      />
                    </div>

                    {/* Ciudad */}
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={modalPropertyData.location?.city || ''}
                        onChange={(e) => setModalPropertyData({
                          ...modalPropertyData,
                          location: { ...modalPropertyData.location, city: e.target.value }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Latitud */}
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Latitud (Coordenada)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={modalPropertyData.location?.coordinates?.lat || 0}
                        onChange={(e) => setModalPropertyData({
                          ...modalPropertyData,
                          location: {
                            ...modalPropertyData.location,
                            coordinates: { ...modalPropertyData.location.coordinates, lat: Number(e.target.value) }
                          }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                      />
                    </div>

                    {/* Longitud */}
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Longitud (Coordenada)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={modalPropertyData.location?.coordinates?.lng || 0}
                        onChange={(e) => setModalPropertyData({
                          ...modalPropertyData,
                          location: {
                            ...modalPropertyData.location,
                            coordinates: { ...modalPropertyData.location.coordinates, lng: Number(e.target.value) }
                          }
                        })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Responsable */}
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Responsable Asignado (Agente)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Propietario Asignado */}
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Responsable Asignado (Propietario)
                          </label>
                          <select
                            value={modalPropertyData.ownerName || ''}
                            onChange={(e) => setModalPropertyData({ ...modalPropertyData, ownerName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                          >
                            <option value="">Sin Asignar</option>
                            {owners.map((own) => (
                              <option key={own.id} value={own.name}>
                                {own.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Agente Asignado */}
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            Responsable Asignado (Agente)
                          </label>
                          <select
                            value={modalPropertyData.agentId || modalPropertyData.agent_id || ''}
                            onChange={(e) => setModalPropertyData({ ...modalPropertyData, agentId: e.target.value, agent_id: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                          >
                            <option value="">Sin Asignar</option>
                            {agents.map((agt) => (
                              <option key={agt.id} value={agt.id}>
                                {agt.name} ({agt.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Características Específicas Grid */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      Características Técnicas
                    </span>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          🛏️ Dormitorios
                        </label>
                        <input
                          type="number"
                          value={modalPropertyData.rooms || 0}
                          onChange={(e) => setModalPropertyData({ ...modalPropertyData, rooms: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          🚿 Baños
                        </label>
                        <input
                          type="number"
                          value={modalPropertyData.bathrooms || 0}
                          onChange={(e) => setModalPropertyData({ ...modalPropertyData, bathrooms: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          📐 Sup. (m²)
                        </label>
                        <input
                          type="number"
                          value={modalPropertyData.area || 0}
                          onChange={(e) => setModalPropertyData({ ...modalPropertyData, area: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ficha Privada del Propietario */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3 mt-4 animate-fadeIn">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      👤 Ficha del Propietario (Privada)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre</label>
                        <input
                          type="text"
                          value={modalPropertyData.owner?.name || ''}
                          onChange={(e) => setModalPropertyData({
                            ...modalPropertyData,
                            owner: { ...modalPropertyData.owner, name: e.target.value }
                          })}
                          className="w-full bg-white border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal animate-pulse"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={modalPropertyData.owner?.phone || ''}
                          onChange={(e) => setModalPropertyData({
                            ...modalPropertyData,
                            owner: { ...modalPropertyData.owner, phone: e.target.value }
                          })}
                          className="w-full bg-white border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</label>
                        <input
                          type="email"
                          value={modalPropertyData.owner?.email || ''}
                          onChange={(e) => setModalPropertyData({
                            ...modalPropertyData,
                            owner: { ...modalPropertyData.owner, email: e.target.value }
                          })}
                          className="w-full bg-white border border-slate-200 focus:border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multimedia y Documentación */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3 mt-4 animate-fadeIn">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      📁 Archivos y Multimedia (URLs separadas por comas)
                    </span>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Galería de Fotos</label>
                      <textarea
                        value={modalPropertyData.media?.photos?.join(', ') || ''}
                        onChange={(e) => setModalPropertyData({
                          ...modalPropertyData,
                          media: { ...modalPropertyData.media, photos: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                        })}
                        className="w-full h-16 bg-white border border-slate-200 focus:border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Documentos / Contratos</label>
                      <textarea
                        value={modalPropertyData.media?.documents?.join(', ') || ''}
                        onChange={(e) => setModalPropertyData({
                          ...modalPropertyData,
                          media: { ...modalPropertyData.media, documents: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                        })}
                        className="w-full h-16 bg-white border border-slate-200 focus:border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-normal"
                        placeholder="https://example.com/contract1.pdf, https://example.com/folio.pdf"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón inferior Guardar Cambios - Sticky y shrink-0 para asegurar visibilidad al 100% zoom */}
              <div className="sticky bottom-0 bg-white flex justify-end gap-2 mt-6 pt-4 pb-2 border-t border-slate-100 shrink-0 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsPropertyModalOpen(false);
                    setSelectedProperty(null);
                    setModalPropertyData(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalProperty}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Guardar Cambios en Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE CONTRATO */}
      {editingContract && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingContract(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b mb-4">
              <div>
                <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                  Editar Contrato
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Modifique las condiciones y vigencia del documento administrativo</p>
              </div>
              <button 
                onClick={() => setEditingContract(null)} 
                className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditContractSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Propiedad (Lectura) */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PROPIEDAD ASOCIADA (NO MODIFICABLE)</label>
                  <input 
                    type="text" 
                    disabled 
                    value={editingContract.property?.title || editingContract.propertyId || ''} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E]/70 focus:outline-none cursor-not-allowed"
                  />
                </div>

                {/* Arrendatario */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ARRENDATARIO / INQUILINO *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nombre completo"
                    value={editingContract.tenant?.name || editingContract.tenantId || ''}
                    onChange={(e) => {
                      setEditingContract({
                        ...editingContract,
                        tenantId: editingContract.tenantId || 'tenant-id',
                        tenant: {
                          id: editingContract.tenant?.id || editingContract.tenantId || 'tenant-id',
                          name: e.target.value,
                          email: editingContract.tenant?.email || 'tenant@mail.com'
                        }
                      });
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Monto Mensual */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MONTO MENSUAL (USD) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="Monto"
                    value={editingContract.monthlyAmount || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, monthlyAmount: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Fecha de Inicio */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FECHA DE INICIO *</label>
                  <input 
                    type="date" 
                    required
                    value={(() => {
                      try {
                        const d = editingContract.startDate;
                        if (!d) return '';
                        const s = typeof d === 'string' ? d : d.toISOString();
                        return s.split('T')[0];
                      } catch { return ''; }
                    })()}
                    onChange={(e) => setEditingContract({ ...editingContract, startDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Fecha de Fin */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">FECHA DE FIN *</label>
                  <input 
                    type="date" 
                    required
                    value={(() => {
                      try {
                        const d = editingContract.endDate;
                        if (!d) return '';
                        const s = typeof d === 'string' ? d : d.toISOString();
                        return s.split('T')[0];
                      } catch { return ''; }
                    })()}
                    onChange={(e) => setEditingContract({ ...editingContract, endDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  />
                </div>

                {/* Estado */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ESTADO DEL CONTRATO *</label>
                  <select
                    value={editingContract.status}
                    onChange={(e) => setEditingContract({ ...editingContract, status: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E]"
                  >
                    <option value="VIGENTE">Vigente</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="RESCINDIDO">Rescindido</option>
                  </select>
                </div>

                {/* Observaciones */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">OBSERVACIONES</label>
                  <textarea 
                    placeholder="Detalles o notas de la edición..."
                    value={editingContract.observations || ''}
                    onChange={(e) => setEditingContract({ ...editingContract, observations: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-[#04045E] focus:outline-hidden focus:border-[#04045E] resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#0B1354] hover:bg-opacity-95 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE CONTRATO */}
      {deletingContractId && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDeletingContractId(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b mb-4">
              <div>
                <h3 className="text-sm font-black text-rose-600 uppercase tracking-wider">
                  ⚠️ Dar de Baja Contrato
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Esta acción es irreversible y retirará el contrato del sistema</p>
              </div>
              <button 
                onClick={() => setDeletingContractId(null)} 
                className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Warning Body */}
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Está seguro de que desea eliminar y dar de baja el contrato con ID <span className="font-mono font-bold text-slate-800">{deletingContractId.toUpperCase()}</span>? 
                Los ingresos y egresos asociados podrían requerir conciliación manual.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 flex justify-end gap-2 border-t mt-4">
              <button
                type="button"
                onClick={() => setDeletingContractId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteContractConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Confirmar Baja 🗑️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GESTIÓN DE DOCUMENTOS DE CONTRATO */}
      {isDocsModalOpen && selectedContractForDocs && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsDocsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b mb-4 shrink-0">
              <div>
                <h3 className="text-sm font-black text-[#04045E] uppercase tracking-wider">
                  Gestionar Documentos de Contrato
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Suba o administre los anexos legales y contratos firmados del inmueble</p>
              </div>
              <button 
                onClick={() => setIsDocsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-650 text-lg font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

             {/* Selector de Contrato (si se abrió desde la cabecera) */}
            <div className="mb-4 shrink-0">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Contrato Seleccionado
              </label>
              <select
                value={selectedContractForDocs.id}
                onChange={async (e) => {
                  const selected = contracts.find(c => c.id === e.target.value);
                  if (selected) {
                    setSelectedContractForDocs(selected);
                    try {
                      const token = getToken() || '';
                      const docs = await contractsService.getContractDocuments(selected.id, token);
                      setContractDocuments(docs);
                    } catch (err: any) {
                      alert('Error al obtener los documentos: ' + (err.message || err));
                    }
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#000033] text-[#000033]"
              >
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.id.substring(0, 8).toUpperCase()} - {c.property?.title || c.propertyId} ({c.tenant?.name || c.tenantId})
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Document Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
              
              {/* 1. DOCUMENTOS DEL PROPIETARIO (DE LA PROPIEDAD) */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  📄 Documentos del Inmueble (Subidos por Propietario)
                </span>
                
                {(!(selectedContractForDocs.property as any)?.documents || (selectedContractForDocs.property as any).documents.length === 0) ? (
                  <p className="text-[10px] text-slate-450 italic font-medium">No se registran documentos de propiedad subidos por el propietario.</p>
                ) : (
                  <div className="space-y-1.5">
                    {(selectedContractForDocs.property as any).documents.map((doc: any, index: number) => (
                      <div key={doc.id || index} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-base">📄</span>
                          <div className="truncate">
                            <p className="text-[11px] font-black text-slate-700 truncate uppercase">{doc.fileName || doc.name || 'documento'}</p>
                            <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider">MIME: {doc.fileType || 'Desconocido'}</p>
                          </div>
                        </div>
                        <a 
                          href={doc.fileUrl || doc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all active:scale-95 cursor-pointer shadow-3xs flex items-center justify-center gap-1 shrink-0"
                        >
                          👁️ Descargar/Ver
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. DOCUMENTOS Y ANEXOS DEL CONTRATO (GESTIÓN Y CARGA MASIVA) */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  ⚖️ Gestión de Contrato y Anexos Legales (Carga Masiva)
                </span>

                {/* File Dropzone/Selector */}
                <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-450 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white group">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleUploadFiles(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploadingDocs}
                  />
                  <div className="space-y-1">
                    <span className="text-2xl block">📤</span>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {isUploadingDocs ? 'Subiendo archivos...' : 'Arrastre o seleccione archivos'}
                    </p>
                    <p className="text-[8px] text-slate-400 font-medium">Soporta múltiples contratos firmados, adendas, cláusulas en PDF, Imágenes o Word (Max 50MB)</p>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                <div className="space-y-2">
                  <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest">
                    Archivos Cargados en este Contrato ({contractDocuments.length})
                  </span>

                  {contractDocuments.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic font-medium py-2">No se han subido documentos adicionales para este contrato.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {contractDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base">⚖️</span>
                            <div className="truncate">
                              <p className="text-[11px] font-black text-slate-700 truncate uppercase">{doc.originalName}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                                {(doc.sizeBytes / 1024).toFixed(1)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {/* Download Button */}
                            <button
                              onClick={() => {
                                if (doc.dataBase64) {
                                  const link = document.createElement('a');
                                  link.href = doc.dataBase64;
                                  link.download = doc.originalName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  // Fallback URL
                                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                                  window.open(`${apiBaseUrl}/contracts/${selectedContractForDocs.id}/documents/${doc.id}`, '_blank');
                                }
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition-all active:scale-95 cursor-pointer shadow-3xs flex items-center justify-center"
                              title="Descargar"
                            >
                              📥
                            </button>
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteFile(doc.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1.5 rounded-lg border border-rose-200 transition-all active:scale-95 cursor-pointer shadow-3xs flex items-center justify-center"
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t mt-4 flex justify-end shrink-0">
              <button
                onClick={() => setIsDocsModalOpen(false)}
                className="bg-[#0B1354] hover:bg-opacity-95 text-white font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative border border-slate-100 flex flex-col animate-scaleUp max-h-[90vh]">
            {/* A. CABECERA */}
            <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Panel de Auditoría Documental</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  ID Propiedad: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{previewDoc.property.id}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors text-lg font-bold cursor-pointer border-0 bg-transparent"
                title="Cerrar Panel"
              >
                ✕
              </button>
            </div>

            {/* B. CUERPO EN DOS COLUMNAS */}
            <div className="flex flex-1 overflow-hidden min-h-0">
              {/* COLUMNA IZQUIERDA: Lista de Documentos (1/3) */}
              <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/60">
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {Object.keys(auditStates).map((docKey) => {
                    const docLabel = ['FR', 'CT', 'TS'].includes(docKey)
                      ? (docKey === 'FR' ? 'Folio Real' : docKey === 'CT' ? 'Catastro' : 'Testimonio')
                      : (auditStates[docKey]?.labelName || docKey);
                    return (
                      <div
                        key={docKey}
                        onClick={() => handleTabSwitch(docKey)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                          activeDocType === docKey ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                            activeDocType === docKey ? 'bg-[#0a1931] text-white' : 'bg-slate-200 text-slate-600'
                          }`}>{docKey.substring(0, 3)}</span>
                          <span className="text-[11px] font-semibold text-slate-700 truncate">{docLabel}</span>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getDocStatusDotColor(docKey)}`} />
                      </div>
                    );
                  })}
                </div>
                {/* Botón SUBIR DOCUMENTO */}
                <div className="p-4 border-t border-slate-200/60">
                  {isPreviewExpanded ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Título del documento..."
                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1931]/30 font-sans"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            const name = (e.target as HTMLInputElement).value.trim();
                            const key = name.substring(0, 2).toUpperCase() + Math.floor(Math.random() * 100);
                            setAuditStates(prev => ({
                              ...prev,
                              [key]: { status: 'PENDING', comments: '', fileUrl: null, fileName: null, labelName: name }
                            }));
                            setActiveDocType(key);
                            setIsPreviewExpanded(false);
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsPreviewExpanded(false)}
                          className="flex-1 text-[10px] font-bold text-slate-500 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-0"
                        >Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsPreviewExpanded(true)}
                      className="w-full text-[11px] font-bold text-[#0a1931] py-2.5 rounded-xl border-2 border-dashed border-[#0a1931]/20 hover:border-[#0a1931]/40 hover:bg-[#0a1931]/5 transition-all cursor-pointer bg-transparent"
                    >
                      + Subir Documento
                    </button>
                  )}
                </div>
              </div>

              {/* COLUMNA DERECHA: Panel de Control y Auditoría (2/3) */}
              <div className="w-2/3 flex flex-col overflow-y-auto p-6 space-y-4">
                {/* Zona de Previsualización */}
                {(() => {
                  const activoDoc = auditStates[activeDocType];
                  const previewUrl = (activoDoc as any)?.previewUrl || (activoDoc as any)?.fileUrl;
                  const name = (activoDoc?.fileName || '').toLowerCase();
                  const isPdf = previewUrl?.toLowerCase().includes('.pdf') || name.endsWith('.pdf');
                  return (
                    <div className="w-full h-80 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden relative">
                      {previewUrl ? (
                        isPdf ? (
                          <iframe
                            src={previewUrl}
                            className="w-full h-full rounded-2xl border-0"
                            title="Vista previa PDF"
                          />
                        ) : (
                          <img
                            src={previewUrl}
                            alt="Vista previa del documento"
                            className="w-full h-full object-contain"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                          <span className="text-2xl">📄</span>
                          <p className="text-xs font-semibold text-slate-500 max-w-[240px]">
                            Documento pendiente de carga. Presiona el botón de abajo para adjuntar el archivo digital.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Barra de Herramientas de Estado + Descarga */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateSubStatus('APPROVED')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      auditStates[activeDocType]?.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700 border-green-300 shadow-xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-green-50'
                    }`}
                  >
                    ✓ Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSubStatus('REJECTED')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      auditStates[activeDocType]?.status === 'REJECTED'
                        ? 'bg-red-100 text-red-700 border-red-300 shadow-xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50'
                    }`}
                  >
                    ✕ Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateSubStatus('PENDING')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      auditStates[activeDocType]?.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300 shadow-xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-yellow-50'
                    }`}
                  >
                    ⚠ Observar
                  </button>
                  {auditStates[activeDocType]?.fileUrl && (
                    <a
                      href={auditStates[activeDocType].fileUrl!}
                      download={auditStates[activeDocType]?.fileName || 'documento'}
                      className="py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                    >
                      📥 Descargar
                    </a>
                  )}
                </div>

                {/* Carga de archivo */}
                <div className="relative">
                  <input
                    type="file"
                    id="manual-upload-preview"
                    accept="application/pdf,image/*"
                    onChange={handleSubFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 w-full">
                    <label
                      htmlFor="manual-upload-preview"
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl text-center border border-dashed border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>📤 {auditStates[activeDocType]?.fileName ? `Reemplazar: ${auditStates[activeDocType].fileName!.substring(0, 30)}...` : 'Subir Archivo'}</span>
                    </label>
                    {auditStates[activeDocType]?.fileName && (
                      <button
                        type="button"
                        onClick={handleClearSubFile}
                        className="w-9 h-9 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center font-bold border border-rose-200 transition-all cursor-pointer bg-transparent"
                        title="Eliminar archivo cargado"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Caja de Comentarios */}
                <div>
                  <label htmlFor="audit-comments-preview" className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 tracking-wider">
                    Dejar un Comentario
                  </label>
                  <textarea
                    id="audit-comments-preview"
                    value={auditStates[activeDocType]?.comments || ''}
                    onChange={(e) => handleUpdateSubComments(e.target.value)}
                    className="w-full min-h-[70px] p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1931]/20 transition-all font-sans resize-y"
                    placeholder="Observaciones sobre la documentación..."
                  />
                </div>
              </div>
            </div>

            {/* C. PIE DEL MODAL */}
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveAllAudits(previewDoc.property.id)}
                className="px-5 py-2.5 bg-[#0a1931] hover:bg-[#061020] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer border-0"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFinance && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl relative border border-slate-100 flex flex-col animate-scaleUp max-h-[90vh]">
            {/* A. CABECERA */}
            <div className="flex justify-between items-start p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{previewFinance?.title || 'Auditoría de Finanzas'}</h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  ID Registro: <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{previewFinance?.id || ''}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewFinance(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors text-lg font-bold cursor-pointer border-0 bg-transparent"
                title="Cerrar Panel"
              >
                ✕
              </button>
            </div>

            {/* B. CUERPO O CARGANDO SPINNER */}
            {!financeAuditStates || Object.keys(financeAuditStates || {}).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-3xl min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[#0a1931] mb-4" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Cargando expediente de auditoría...</p>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* COLUMNA IZQUIERDA: Lista de Documentos (1/3) */}
                <div className="w-1/3 border-r border-slate-100 flex flex-col bg-slate-50/60">
                  <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {Object.keys(financeAuditStates || {}).map((docKey) => {
                      const docLabel = financeAuditStates?.[docKey]?.labelName || docKey;
                      return (
                        <div
                          key={docKey}
                          onClick={() => handleFinanceTabSwitch(docKey)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                            activeFinanceDocType === docKey ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-white/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                              activeFinanceDocType === docKey ? 'bg-[#0a1931] text-white' : 'bg-slate-200 text-slate-600'
                            }`}>{docKey.substring(0, 3)}</span>
                            <span className="text-[11px] font-semibold text-slate-700 truncate">{docLabel}</span>
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getFinanceDocStatusDotColor(docKey)}`} />
                        </div>
                      );
                    })}
                  </div>
                  {/* Botón SUBIR DOCUMENTO */}
                  <div className="p-4 border-t border-slate-200/60">
                    {isFinancePreviewExpanded ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Título del documento..."
                          className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a1931]/30 font-sans"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                              const name = (e.target as HTMLInputElement).value.trim();
                              const key = name.substring(0, 2).toUpperCase() + Math.floor(Math.random() * 105);
                              setFinanceAuditStates(prev => ({
                                ...prev,
                                [key]: { status: 'PENDING', comments: '', fileUrl: null, fileName: null, labelName: name }
                              }));
                              setActiveFinanceDocType(key);
                              setIsFinancePreviewExpanded(false);
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsFinancePreviewExpanded(false)}
                            className="flex-1 text-[10px] font-bold text-slate-500 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer bg-transparent border-0"
                          >Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsFinancePreviewExpanded(true)}
                        className="w-full text-[11px] font-bold text-[#0a1931] py-2.5 rounded-xl border-2 border-dashed border-[#0a1931]/20 hover:border-[#0a1931]/40 hover:bg-[#0a1931]/5 transition-all cursor-pointer bg-transparent"
                      >
                        + Subir Documento
                      </button>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: Panel de Control y Auditoría (2/3) */}
                <div className="w-2/3 flex flex-col overflow-y-auto p-6 space-y-4">
                  {/* Zona de Previsualización */}
                  {(() => {
                    const activoDoc = financeAuditStates?.[activeFinanceDocType];
                    const previewUrl = activoDoc?.fileUrl;
                    const name = (activoDoc?.fileName || '').toLowerCase();
                    const isPdf = previewUrl?.toLowerCase().includes('.pdf') || name.endsWith('.pdf');
                    return (
                      <div className="w-full h-80 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden relative">
                        {previewUrl ? (
                          isPdf ? (
                            <iframe
                              src={previewUrl}
                              className="w-full h-full rounded-2xl border-0"
                              title="Vista previa PDF"
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              alt="Vista previa del documento"
                              className="w-full h-full object-contain"
                            />
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                            <span className="text-2xl">📄</span>
                            <p className="text-xs font-semibold text-slate-500 max-w-[240px]">
                              Documento pendiente de carga. Presiona el botón de abajo para adjuntar el archivo digital.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Barra de Herramientas de Estado + Descarga */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateFinanceSubStatus('APPROVED')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        financeAuditStates?.[activeFinanceDocType]?.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700 border-green-300 shadow-xs font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-green-50'
                      }`}
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFinanceSubStatus('REJECTED')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        financeAuditStates?.[activeFinanceDocType]?.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700 border-red-300 shadow-xs font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-red-50'
                      }`}
                    >
                      ✕ Negar/Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateFinanceSubStatus('PENDING')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        financeAuditStates?.[activeFinanceDocType]?.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-300 shadow-xs font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-yellow-50'
                      }`}
                    >
                      ⚠ Observar
                    </button>
                    {financeAuditStates?.[activeFinanceDocType]?.fileUrl && (
                      <a
                        href={financeAuditStates?.[activeFinanceDocType]?.fileUrl!}
                        download={financeAuditStates?.[activeFinanceDocType]?.fileName || 'documento'}
                        className="py-2 px-3 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                      >
                        📥 Descargar Documento Activo
                      </a>
                    )}
                  </div>

                  {/* Carga de archivo */}
                  <div className="relative">
                    <input
                      type="file"
                      id="finance-upload-preview"
                      accept="application/pdf,image/*"
                      onChange={handleFinanceSubFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 w-full">
                      <label
                        htmlFor="finance-upload-preview"
                        className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl text-center border border-dashed border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>📤 {financeAuditStates?.[activeFinanceDocType]?.fileName ? `Reemplazar: ${financeAuditStates?.[activeFinanceDocType]?.fileName!.substring(0, 30)}...` : 'Subir Archivo'}</span>
                      </label>
                      {financeAuditStates?.[activeFinanceDocType]?.fileName && (
                        <button
                          type="button"
                          onClick={handleClearFinanceSubFile}
                          className="w-9 h-9 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center font-bold border border-rose-200 transition-all cursor-pointer bg-transparent"
                          title="Eliminar archivo cargado"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Caja de Comentarios */}
                  <div>
                    <label htmlFor="finance-comments-preview" className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5 tracking-wider">
                      Dejar un Comentario
                    </label>
                    <textarea
                      id="finance-comments-preview"
                      value={financeAuditStates?.[activeFinanceDocType]?.comments || ''}
                      onChange={(e) => handleUpdateFinanceSubComments(e.target.value)}
                      className="w-full min-h-[70px] p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1931]/20 transition-all font-sans resize-y"
                      placeholder="Observaciones sobre la documentación..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* C. PIE DEL MODAL */}
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewFinance(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!financeAuditStates || Object.keys(financeAuditStates || {}).length === 0}
                onClick={() => handleSaveFinanceAllAudits(previewFinance?.type, previewFinance?.id)}
                className="px-5 py-2.5 bg-[#0a1931] hover:bg-[#061020] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer border-0"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
    </AgentProvider>
  );
}

export default function AdminDashboard() {
  return <AdminConsole />;
}


