'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
// import { propertiesService } from '../../../services/properties.service'; // no longer used: canonical write goes directly to localStorage

import PropertyFormFields from '../../../components/modules/properties/PropertyFormFields';
import { persistProperty } from '../../../utils/localDb';
import { useFavorites } from '../../../context/FavoritesContext';
import { getCurrentUser } from '../../../utils/session';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export default function SmartCaptureForm() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role?.toUpperCase() === 'CLIENTE') {
      setIsAuthorized(false);
      router.replace('/');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  let setContextProperties: any = null;
  try {
    const context = useFavorites();
    setContextProperties = context.setProperties;
  } catch (err) {
    console.warn("useFavorites hook not available", err);
  }
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string; progress: number }[]>([]);
  const [uploadedImagesBase64, setUploadedImagesBase64] = useState<string[]>([]);
  const [uploadedDocsBase64, setUploadedDocsBase64] = useState<Record<string, string>>({});
  const [documentosLegales, setDocumentosLegales] = useState<File[]>([]);
  
  const handleAdjuntarDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newDocs = Array.from(e.target.files);
      if (newDocs.length > 0) {
        setDocumentosLegales((prev) => [...prev, ...newDocs]);
        // FileReader para Base64 de documentos
        newDocs.forEach((file: any) => {
          const reader = new FileReader();
          const realFile = file.fileObj || file;
          reader.onloadend = () => {
            setUploadedDocsBase64(prev => ({
              ...prev,
              [file.name]: reader.result as string
            }));
          };
          reader.readAsDataURL(realFile);
        });
      }
    }
  };

  const handleEliminarDocumento = (index: number) => {
    setDocumentosLegales((prev) => prev.filter((_, i) => i !== index));
  };

  const [extraDocuments, setExtraDocuments] = useState<{ id: string; name: string; file: File | null }[]>([]);

  const handleAddExtraDocument = () => {
    setExtraDocuments((prev) => [
      ...prev,
      { id: 'extra-' + Math.random().toString(36).substr(2, 9), name: '', file: null }
    ]);
  };

  const handleUpdateExtraDocumentName = (id: string, name: string) => {
    setExtraDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, name } : doc))
    );
  };

  const handleUploadExtraDocumentFile = (id: string, file: File) => {
    setExtraDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, file } : doc))
    );
  };

  const handleRemoveExtraDocument = (id: string) => {
    setExtraDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };
  
  // Selección de atributos de alto valor
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, boolean>>({});

  // Estados del Formulario (Smart-Capture Data Model)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'BOB', // BOB o USD
    priceBOB: '',
    priceUSD: '',
    exchangeRate: '9.76',
    minPrice: '', // Precio mínimo sugerido por el propietario
    offerType: 'VENTA', // VENTA, ALQUILER, ANTICRETICO, PROYECTO
    type: 'DEPARTAMENTO', // DEPARTAMENTO, CASA, TERRENO, OFICINA, etc.
    landArea: '',
    builtArea: '',
    rooms: '3',
    bathrooms: '2',
    location: 'SANTA CRUZ',
    zona: '',
    address: '',
    latitude: -17.3895,
    longitude: -66.1568,
    imageUrl: '',
    ownerName: 'Propietario Legítimo',
    ownerPhone: '',
    ownerEmail: 'owner@propio.com.bo',
  });

  // Estados del Paso 3: Checklist Documental
  const [documents, setDocuments] = useState({
    hasFolioReal: false,
    hasCI: false,
    hasCatastro: false,
    hasTestimonio: false,
    hasImpuestosAlDia: false,
    hasPlanoUsoSuelo: false,
    hasOtrosDocumentos: false,
  });

  // Cargar borrador de localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('propio_smart_capture_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.formData) {
          setFormData((prev) => ({ ...prev, ...draft.formData }));
        }
        if (draft.documents) {
          setDocuments((prev) => ({ ...prev, ...draft.documents }));
        }
        if (draft.selectedAttributes) {
          setSelectedAttributes(draft.selectedAttributes);
        }
        if (draft.step) {
          setStep(draft.step);
        }
      } catch (error) {
        console.error('Error cargando borrador de Propio:', error);
      }
    }
  }, []);

  // Persistir borrador
  const handlePersistDraft = (
    updatedFormData: typeof formData,
    updatedDocs: typeof documents,
    updatedAttrs: typeof selectedAttributes,
    currentStep: number
  ) => {
    localStorage.setItem(
      'propio_smart_capture_draft',
      JSON.stringify({
        formData: updatedFormData,
        documents: updatedDocs,
        selectedAttributes: updatedAttrs,
        step: currentStep,
      })
    );
  };

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...fields };
      // Persistir el borrador asíncronamente con el estado atómico actualizado
      setTimeout(() => {
        handlePersistDraft(updated, documents, selectedAttributes, step);
      }, 0);
      return updated;
    });
  };

  const updateDocuments = (fields: Partial<typeof documents>) => {
    const updated = { ...documents, ...fields };
    setDocuments(updated);
    handlePersistDraft(formData, updated, selectedAttributes, step);
  };

  const toggleAttribute = (attr: string) => {
    const updated = { ...selectedAttributes, [attr]: !selectedAttributes[attr] };
    setSelectedAttributes(updated);
    handlePersistDraft(formData, documents, updated, step);
  };



  const isChecklistComplete = () => {
    if (formData.offerType === 'ALQUILER') {
      return documents.hasFolioReal && documents.hasCI;
    } else {
      return (
        documents.hasFolioReal &&
        documents.hasCatastro &&
        documents.hasTestimonio &&
        documents.hasImpuestosAlDia &&
        documents.hasPlanoUsoSuelo
      );
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      handlePersistDraft(formData, documents, selectedAttributes, nextStep);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      handlePersistDraft(formData, documents, selectedAttributes, prevStep);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const activeAttrs = Object.keys(selectedAttributes).filter(k => selectedAttributes[k]);

      // ── Calcular ID correlativo legible (PROP-REAL-011 / PROP-RENT-011) ──
      const isRent = (formData.offerType || 'VENTA') === 'ALQUILER';
      const prefix = isRent ? 'PROP-RENT' : 'PROP-REAL';
      let correlativeIdx = 11;
      try {
        const localPropsRes = await fetch('/api/local/properties').then(r => r.json());
        const localProps = localPropsRes?.properties || [];
        const allExisting = JSON.parse(localStorage.getItem('propio_custom_created_properties') || '[]');
        const combined = [...allExisting, ...localProps];
        const matching = combined.filter((p: any) => p && p.id && p.id.startsWith(prefix));
        
        let maxIdx = 10;
        matching.forEach((p: any) => {
          const numPart = parseInt(p.id.replace(prefix + '-', ''));
          if (!isNaN(numPart) && numPart > maxIdx) {
            maxIdx = numPart;
          }
        });
        correlativeIdx = maxIdx + 1;
      } catch (_e) {
        correlativeIdx = Math.floor(Math.random() * 1000) + 100;
      }
      const correlativeId = `${prefix}-${String(correlativeIdx).padStart(3, '0')}`;

      // ── Variables del checklist legal ──
      const customPriceBob = parseFloat(formData.priceBOB) || 0;
      const customPriceUsd = parseFloat(formData.priceUSD) || Math.round(customPriceBob / 9.76);
      const hasAnyCheckedDoc = documents.hasFolioReal || documents.hasCI || documents.hasCatastro || documents.hasTestimonio || documents.hasImpuestosAlDia || documents.hasPlanoUsoSuelo || documents.hasOtrosDocumentos;
      const isMissingFiles = documentosLegales.length === 0;
      const docStatusVal = (hasAnyCheckedDoc && isMissingFiles) ? 'marcado_sin_archivo' : 'OK';

      // Estructura de los 6 documentos oficiales específicos
      const officialDocsList = await Promise.all([
        { key: 'hasFolioReal', name: 'Folio Real Actualizado (Libre Alodial)', checked: !!documents.hasFolioReal },
        { key: 'hasCatastro', name: 'Certificado Catastral Al Día', checked: !!documents.hasCatastro },
        { key: 'hasTestimonio', name: 'Testimonio de Escritura Pública', checked: !!documents.hasTestimonio },
        { key: 'hasImpuestosAlDia', name: 'Impuestos Municipales Al Día', checked: !!documents.hasImpuestosAlDia },
        { key: 'hasPlanoUsoSuelo', name: 'Plano de Uso de Suelo Aprobado', checked: !!documents.hasPlanoUsoSuelo },
        { key: 'hasCI', name: 'Cédula de Identidad Vigente (CI)', checked: !!documents.hasCI },
      ].map(async (item) => {
        const fileObj = documentosLegales.find((f: any) => f && f.docKey === item.key);
        let fileBase64: string | null = null;
        if (fileObj) {
          try {
            const realFile = (fileObj as any).fileObj || fileObj;
            fileBase64 = await fileToBase64(realFile);
          } catch (err) {
            console.error('Error reading file as base64', err);
          }
        }
        return {
          name: item.name,
          checked: item.checked,
          file: fileBase64 || '',
          fileType: fileObj ? fileObj.type : '',
          fileName: fileObj ? fileObj.name : '',
        };
      }));

      // ── Objeto canonical compartido por admin, propietario y catálogo ──
      const canonicalProp = {
        id: correlativeId,
        title: formData.title,
        description: formData.description + (activeAttrs.length > 0 ? `\n\nAtributos: ${activeAttrs.join(', ')}` : '') + `\nSuperficie Terreno: ${formData.landArea || 0} m²\nSuperficie Construida: ${formData.builtArea || 0} m²` + (formData.zona ? `\nZona: ${formData.zona}` : ''),
        price: customPriceUsd,
        priceBob: customPriceBob,
        priceBs: customPriceBob,
        area: parseFloat(formData.builtArea) || parseFloat(formData.landArea) || 0,
        m2: parseFloat(formData.builtArea) || parseFloat(formData.landArea) || 0,
        rooms: parseInt(formData.rooms) || 0,
        beds: parseInt(formData.rooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        baths: parseInt(formData.bathrooms) || 0,
        location: String(formData.location || 'SANTA CRUZ').toUpperCase(),
        address: formData.address || 'Calle Innominada',
        imageUrl: uploadedImagesBase64[0] || formData.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        image: uploadedImagesBase64[0] || formData.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        images: uploadedImagesBase64.length > 0
          ? uploadedImagesBase64
          : [formData.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'],
        lat: formData.latitude ?? -17.3895,
        lng: formData.longitude ?? -66.1568,
        coordinates: { lat: formData.latitude ?? -17.3895, lng: formData.longitude ?? -66.1568 },
        type: (formData.type || 'casa').toLowerCase(),
        offerType: formData.offerType || 'VENTA',
        priceLabel: `${Math.round(customPriceUsd / 1000)}K USD`,
        lotSize: parseFloat(formData.landArea) || 0,
        verified: checklistOk,
        isVerified: checklistOk,
        status: 'NUEVA_PUBLICACION',
        documentStatus: docStatusVal,
        hasFolioReal: documents.hasFolioReal,
        hasCatastro: documents.hasCatastro,
        hasTestimonio: documents.hasTestimonio,
        hasImpuestosAlDia: documents.hasImpuestosAlDia,
        hasPlanoUsoSuelo: documents.hasPlanoUsoSuelo,
        hasCI: documents.hasCI,
        // documentsList: formato para el panel de auditoría del admin
        documentsList: officialDocsList.map((d, i) => ({
          id: `DOC-${correlativeId}-${i}`,
          name: d.name,
          isMarked: d.checked,
          fileData: d.file || null,
          fileType: d.fileType || '',
          fileName: d.fileName || '',
        })),
        documents: officialDocsList,
        specs: {
          dorm: parseInt(formData.rooms) || 0,
          baños: parseInt(formData.bathrooms) || 0,
          constr: parseFloat(formData.builtArea) || 0,
        },
        agentId: 'AGT-001',
        agent_id: 'AGT-001',
        ownerId: (getCurrentUser()?.userId || getCurrentUser()?.name || getCurrentUser()?.email?.split('@')[0] || 'owner'),
        agente: { nombre: 'Asesor Asignado', telefono: '59172345678' },
        propietario: { nombre: 'Propietario Principal', telefono: '59171234567' },
        createdAt: new Date().toISOString(),
      };

      // ── Escribir en ambas keys de localStorage (sesión activa) ──
      try {
        // 1. propio_custom_created_properties → leído por el admin y el panel propietario
        const customCreatedRaw = localStorage.getItem('propio_custom_created_properties');
        let customPropsList: any[] = [];
        try { customPropsList = JSON.parse(customCreatedRaw || '[]'); } catch (_e) { customPropsList = []; }
        if (!Array.isArray(customPropsList)) customPropsList = [];
        customPropsList.unshift(canonicalProp);
        localStorage.setItem('propio_custom_created_properties', JSON.stringify(customPropsList));

        // 2. propio_properties_data → leído por el catálogo público
        const propertiesDataRaw = localStorage.getItem('propio_properties_data');
        let propertiesDataList: any[] = [];
        try { propertiesDataList = JSON.parse(propertiesDataRaw || '[]'); } catch (_e) { propertiesDataList = []; }
        if (!Array.isArray(propertiesDataList)) propertiesDataList = [];
        propertiesDataList.unshift(canonicalProp);
        localStorage.setItem('propio_properties_data', JSON.stringify(propertiesDataList));

        // 3. Invalidar el caché del admin para forzar recarga en la misma pestaña
        localStorage.removeItem('propio_admin_properties');

        // 4. Notificar a otras pestañas y a la misma pestaña
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'propio_custom_created_properties',
          newValue: JSON.stringify(customPropsList),
        }));
        window.dispatchEvent(new CustomEvent('propio:new-property', { detail: canonicalProp }));

        // ── Mutación sobre el estado global que comparte el ERP ──
        if (setContextProperties) {
          setContextProperties((prev: any[]) => [canonicalProp, ...prev]);
        }
      } catch (err) {
        console.error('Error saving canonical property to localStorage:', err);
      }

      // ── PERSISTENCIA REAL EN db.json via helper blindado (sobrevive F5 y reinicios) ──
      try {
        const propForDB = {
          ...canonicalProp,
          // Solo primera imagen para no inflar db.json con base64
          images: canonicalProp.images?.length > 0 ? [canonicalProp.images[0]] : canonicalProp.images,
          imageUrl: canonicalProp.imageUrl || '',
        };
        // Fire-and-forget: el helper valida Content-Type antes de parsear
        persistProperty(propForDB).catch(e => console.warn('[localDb] persistProperty error:', e));
      } catch (fetchErr) {
        console.warn('[localDb] Error al persistir propiedad:', fetchErr);
      }

      localStorage.removeItem('propio_smart_capture_draft');
      setIsSuccess(true);
    } catch (error) {
      console.error('Error publicando propiedad:', error);
      alert('Error de conexión o de validación al enviar la propiedad.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const allowedFiles = Array.from(e.target.files).filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`El archivo ${file.name} no es una imagen permitida. Solo se aceptan fotografías.`);
          return false;
        }
        if (file.size > 150 * 1024 * 1024) {
          alert(`El archivo ${file.name} supera el tamaño máximo de 150 MB.`);
          return false;
        }
        return true;
      });

      const newFiles = allowedFiles.map((f) => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
        progress: 0,
      }));

      if (newFiles.length === 0) return;

      setFiles((prev) => [...prev, ...newFiles]);

      newFiles.forEach((file) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setFiles((prev) =>
            prev.map((pf) => (pf.name === file.name ? { ...pf, progress } : pf))
          );
          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 150);
      });

      // Lector de archivos para transformar a Base64 e inyectar en array real
      allowedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImagesBase64((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#000022] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#ccff00]"></div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return null;
  }

  const checklistOk = isChecklistComplete();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#000033] font-sans antialiased flex flex-col selection:bg-[#ccff00]/30">
      
      {/* Contenedor Central */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-12">
        
        {isSuccess ? (
          /* PANTALLA DE ÉXITO */
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10 text-center space-y-6 animate-fadeIn">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#ccff00]/20 text-[#000033] flex items-center justify-center text-3xl border border-[#ccff00]/30 animate-bounce">
                👑
              </div>
              <h1 className="text-2xl font-heading font-black tracking-tight uppercase text-[#000033]">
                ¡Propiedad Recibida con Éxito!
              </h1>
              {/* [JSX_BADGE_ESTADO_REVISION] */}
              <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider text-center">
                {checklistOk ? 'En revisión por el equipo legal' : 'Documentación pendiente de completar'}
              </span>

              {/* [JSX_MODIFICACION_PARRAFO_DESCRIPCION] */}
              {checklistOk ? (
                <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed mt-4 text-center">
                  Tu inmueble en {formData.location} ha sido registrado de forma segura. Nuestro equipo validará los documentos para activar el sello de DOCUMENTACION VERIFICADA de validación inmediata.
                </p>
              ) : (
                <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed mt-4 text-center">
                  Tu inmueble esta en proceso de aprobación. Para recibir el sello de DOCUMENTACION VERIFICADA, recuerda adjuntar tu carpeta legal completa en el paso 3.
                </p>
              )}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/propietario/dashboard"
                className="px-6 py-3.5 bg-[#ccff00] hover:bg-opacity-95 text-[#000033] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md text-center hover:scale-[1.02] active:scale-95"
              >
                Ir a mi Panel de Propietario 🏡
              </Link>
              <Link
                href="/properties"
                className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#000033] border border-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all text-center hover:scale-[1.02] active:scale-95"
              >
                Ver Catálogo Inmobiliario
              </Link>
            </div>
          </div>
        ) : (
          /* FORMULARIO SMART-CAPTURE */
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-10 flex flex-col gap-6">
            
            {/* Stepper */}
            <div className="space-y-4">
              <div className="hidden md:flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold uppercase tracking-wider text-slate-400 flex-wrap gap-x-6 gap-y-2">
                <div className={`flex items-center gap-2 pb-2 shrink-0 ${step >= 1 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 1 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>1</span> Datos Básicos
                </div>
                <div className={`flex items-center gap-2 pb-2 shrink-0 ${step >= 2 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 2 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>2</span> Ubicación
                </div>
                <div className={`flex items-center gap-2 pb-2 shrink-0 ${step >= 3 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 3 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>3</span> Legal
                </div>
                <div className={`flex items-center gap-2 pb-2 shrink-0 ${step >= 4 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 4 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>4</span> Fotos
                </div>
              </div>
              <div className="flex md:hidden items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                <div className="text-[#000033] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ccff00] text-[#000033] flex items-center justify-center text-[10px] font-black">{step}</span>
                  <span>
                    {step === 1 && 'Datos Básicos'}
                    {step === 2 && 'Ubicación'}
                    {step === 3 && 'Legal'}
                    {step === 4 && 'Fotos'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-450">Paso {step} de 4</span>
              </div>
            </div>

            <form onSubmit={step === 4 ? handleSubmit : handleNext} className="flex flex-col gap-6">
              {/* PASO 1: DATOS BÁSICOS */}

              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-heading font-black tracking-tight text-[#000033] mb-2 uppercase">1. Ficha Técnica del Inmueble</h2>
                    <p className="text-slate-500 text-sm font-medium">Configura la información financiera, tipología y atributos de tu inmueble.</p>
                  </div>
                  <PropertyFormFields
                    formData={formData}
                    onChange={updateFormData}
                    step={1}
                    selectedAttributes={selectedAttributes}
                    onToggleAttribute={toggleAttribute}
                    documents={documents}
                    onUpdateDocuments={updateDocuments}
                    images={formData.imageUrl ? [formData.imageUrl] : []}
                  />
                </div>
              )}

              {/* PASO 2: GEOLOCALIZACIÓN */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <PropertyFormFields
                    formData={formData}
                    onChange={updateFormData}
                    step={2}
                    selectedAttributes={selectedAttributes}
                    onToggleAttribute={toggleAttribute}
                    documents={documents}
                    onUpdateDocuments={updateDocuments}
                    images={formData.imageUrl ? [formData.imageUrl] : []}
                  />
                </div>
              )}

              {/* PASO 3: CHECKLIST LEGAL */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <PropertyFormFields
                    formData={formData}
                    onChange={updateFormData}
                    step={3}
                    selectedAttributes={selectedAttributes}
                    onToggleAttribute={toggleAttribute}
                    documents={documents}
                    onUpdateDocuments={updateDocuments}
                    images={formData.imageUrl ? [formData.imageUrl] : []}
                    extraDocuments={extraDocuments}
                    onAddExtraDocument={handleAddExtraDocument}
                    onUpdateExtraDocumentName={handleUpdateExtraDocumentName}
                    onUploadExtraDocumentFile={handleUploadExtraDocumentFile}
                    onRemoveExtraDocument={handleRemoveExtraDocument}
                    documentosLegales={documentosLegales}
                    onAdjuntarDocumento={handleAdjuntarDocumento}
                    onEliminarDocumento={handleEliminarDocumento}
                  />
                </div>
              )}

              {/* PASO 4: FOTOS */}
              {step === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <PropertyFormFields
                    formData={formData}
                    onChange={updateFormData}
                    step={4}
                    selectedAttributes={selectedAttributes}
                    onToggleAttribute={toggleAttribute}
                    documents={documents}
                    onUpdateDocuments={updateDocuments}
                    images={formData.imageUrl ? [formData.imageUrl] : []}
                    onUploadImageSimulate={handleFileUploadSimulate}
                    filesSimulated={files}
                    documentosLegales={documentosLegales}
                    onAdjuntarDocumento={handleAdjuntarDocumento}
                    onEliminarDocumento={handleEliminarDocumento}
                  />
                  {/* Alerta documental */}
                  {!checklistOk ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-1.5 text-xs">
                      <div className="flex gap-2 items-start font-bold uppercase tracking-wide">
                        <span>⚠️</span>
                        <span>Alerta Documental Legal</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-500 font-semibold">
                        Faltan documentos obligatorios para certificar tu inmueble con el **Sello Oro de Propio**. 
                        La propiedad se publicará como <span className="text-red-650 font-bold">PENDIENTE DE VALIDACIÓN</span> hasta que completes la carpeta.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1.5 text-xs">
                      <div className="flex gap-2 items-start font-bold uppercase tracking-wide">
                        <span>👑</span>
                        <span>¡Carpeta Legal Completa!</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-500 font-semibold">
                        Has completado todos los requisitos obligatorios. Tu propiedad recibirá el **Sello Oro de Propio** inmediatamente al ser aprobada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-6 border-t border-slate-100 flex justify-between gap-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#000033] border border-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                  >
                    Anterior
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-3.5 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-95 flex-1 text-center ${
                    saving
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : step === 4
                        ? 'bg-[#ccff00] hover:bg-opacity-90 text-[#000033]'
                        : 'bg-[#ccff00] hover:bg-opacity-90 text-[#000033]'
                  }`}
                >
                  {saving ? (
                    <span>Registrando...</span>
                  ) : step === 4 ? (
                    checklistOk ? (
                      <span>Publicar Inmueble 🚀</span>
                    ) : (
                      <span>Publicar Pendiente ⚠️</span>
                    )
                  ) : (
                    <span>Siguiente Paso →</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        )}

      </main>
    </div>
  );
}
