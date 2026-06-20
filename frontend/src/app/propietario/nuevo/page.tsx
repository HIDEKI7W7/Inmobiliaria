'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { propertiesService } from '../../../services/properties.service';

const DEPARTAMENTOS_COORDS: Record<string, { lat: number; lng: number }> = {
  'La Paz': { lat: -16.5000, lng: -68.1500 },
  'Cochabamba': { lat: -17.3895, lng: -66.1568 },
  'Santa Cruz': { lat: -17.7833, lng: -63.1833 },
  'Oruro': { lat: -17.9833, lng: -67.1500 },
  'Potosí': { lat: -19.5833, lng: -65.7500 },
  'Chuquisaca': { lat: -19.0333, lng: -65.2627 },
  'Tarija': { lat: -21.5355, lng: -64.7299 },
  'Beni': { lat: -14.8333, lng: -64.9000 },
  'Pando': { lat: -11.0267, lng: -68.7697 }
};

const DEPARTAMENTOS = Object.keys(DEPARTAMENTOS_COORDS);

const ATTRIBUTES_BY_CATEGORY = {
  Interiores: ['Aire Acondicionado', 'Calefacción', 'Cocina Equipada', 'Roperos Empotrados', 'Amoblado', 'Termotanque', 'Suite Master', 'Dependencias de Servicio'],
  Exteriores: ['Jardín', 'Churrasquera/Parrillero', 'Terraza', 'Balcón', 'Patio', 'Piscina Privada'],
  Parqueos: ['Parqueo Techado', 'Parqueo de Visitas', 'Garaje con Portón Eléctrico', 'Baulera'],
  Seguridad: ['Seguridad 24/7', 'Cerco Eléctrico', 'Cámaras de Vigilancia', 'Alarma', 'Conserjería'],
  'Áreas Comunes': ['Salón de Eventos', 'Gimnasio', 'Piscina Común', 'Canchas Deportivas', 'Parque Infantil', 'Sauna'],
  Sostenibilidad: ['Calefón Solar', 'Paneles Solares', 'Iluminación LED', 'Sistema de Reciclaje de Agua']
};

const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#000033]"></div>
        <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest animate-pulse font-bold">
          Inicializando Mapa Táctil...
        </p>
      </div>
    ),
  }
);

export default function SmartCaptureForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string; progress: number }[]>([]);
  
  // Selección de atributos de alto valor
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, boolean>>({});

  // Estados del Formulario (Smart-Capture Data Model)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    currency: 'BOB', // BOB o USD
    priceBOB: '',
    priceUSD: '',
    exchangeRate: '6.96',
    minPrice: '', // Precio mínimo sugerido por el propietario
    offerType: 'VENTA', // VENTA, ALQUILER, ANTICRETICO, PROYECTO
    type: 'DEPARTAMENTO', // DEPARTAMENTO, CASA, TERRENO, OFICINA, etc.
    landArea: '',
    builtArea: '',
    rooms: '3',
    bathrooms: '2',
    location: 'Cochabamba',
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
    const updated = { ...formData, ...fields };
    setFormData(updated);
    handlePersistDraft(updated, documents, selectedAttributes, step);
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

  const handleLocationChange = (loc: string) => {
    const coords = DEPARTAMENTOS_COORDS[loc] || { lat: -17.3895, lng: -66.1568 };
    const updated = {
      ...formData,
      location: loc,
      latitude: coords.lat,
      longitude: coords.lng
    };
    setFormData(updated);
    handlePersistDraft(updated, documents, selectedAttributes, step);
  };

  const handlePriceChange = (val: string, type: 'BOB' | 'USD' | 'RATE' | 'CURRENCY') => {
    const rate = parseFloat(formData.exchangeRate) || 6.96;
    if (type === 'BOB') {
      const bob = val;
      const usd = val ? (parseFloat(val) / rate).toFixed(2) : '';
      updateFormData({ priceBOB: bob, priceUSD: usd });
    } else if (type === 'USD') {
      const usd = val;
      const bob = val ? (parseFloat(val) * rate).toFixed(2) : '';
      updateFormData({ priceUSD: usd, priceBOB: bob });
    } else if (type === 'RATE') {
      const newRate = val;
      const rateNum = parseFloat(val) || 6.96;
      let bob = formData.priceBOB;
      if (formData.currency === 'USD' && formData.priceUSD) {
        bob = (parseFloat(formData.priceUSD) * rateNum).toFixed(2);
      }
      updateFormData({ exchangeRate: newRate, priceBOB: bob });
    } else if (type === 'CURRENCY') {
      updateFormData({ currency: val });
    }
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
      const attrsText = activeAttrs.length > 0 ? `\n\nAtributos: ${activeAttrs.join(', ')}` : '';
      const areaText = `\nSuperficie Terreno: ${formData.landArea || 0} m²\nSuperficie Construida: ${formData.builtArea || 0} m²`;
      const zonaText = formData.zona ? `\nZona: ${formData.zona}` : '';

      const payload = {
        title: formData.title,
        description: formData.description + attrsText + areaText + zonaText,
        price: parseFloat(formData.priceBOB) || 0,
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
        area: parseFloat(formData.builtArea) || parseFloat(formData.landArea) || 0,
        rooms: parseInt(formData.rooms),
        bathrooms: parseInt(formData.bathrooms),
        location: formData.location,
        address: formData.address || null,
        offerType: formData.offerType,
        type: formData.type,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        latitude: formData.latitude,
        longitude: formData.longitude,
        hasFolioReal: documents.hasFolioReal,
        hasCatastro: documents.hasCatastro,
        hasTestimonio: documents.hasTestimonio,
        hasImpuestosAlDia: documents.hasImpuestosAlDia,
        hasPlanoUsoSuelo: documents.hasPlanoUsoSuelo,
        hasCI: documents.hasCI,
      };

      const mockToken = 'mock-jwt-token-from-nest-api';
      await propertiesService.createPropertyAsPropietario(payload, mockToken);
      
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
    }
  };

  const checklistOk = isChecklistComplete();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#000033] font-sans antialiased flex flex-col selection:bg-[#ccff00]/30">
      
      {/* Navbar Superior */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center select-none flex-shrink-0">
        <Link href="/" className="text-xl font-heading font-bold text-[#000033]">
          Propio<span className="text-[#ccff00] font-black">.</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Paso {step} de 4</span>
      </header>

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
              <span className={`inline-block text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                checklistOk 
                  ? 'bg-emerald-55 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-55 text-amber-800 border border-amber-205'
              }`}>
                {checklistOk ? 'Sello Oro: Aprobado Preliminar' : 'Sello Oro: Validación Pendiente'}
              </span>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md mx-auto pt-2 font-medium">
                {checklistOk 
                  ? `Tu inmueble en ${formData.location} ha sido registrado de forma segura. Nuestro equipo validará los documentos para activar tu Sello Oro de validación inmediata.`
                  : `Tu inmueble ha sido registrado como BORRADOR PENDIENTE. Para recibir ofertas directas con Sello Oro, recuerda adjuntar tu carpeta legal completa en el Paso 3.`
                }
              </p>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://frontend-olzedn7qe-hidekiiiii.vercel.app/propietario/dashboard"
                className="px-6 py-3.5 bg-[#ccff00] hover:bg-opacity-95 text-[#000033] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md text-center hover:scale-[1.02] active:scale-95"
              >
                Ir a mi Panel de Propietario 🏡
              </a>
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
              <div className="hidden md:flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className={`flex items-center gap-2 pb-2 ${step >= 1 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>1</span> Datos Básicos
                </div>
                <div className={`flex items-center gap-2 pb-2 ${step >= 2 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>2</span> Ubicación
                </div>
                <div className={`flex items-center gap-2 pb-2 ${step >= 3 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>3</span> Legal
                </div>
                <div className={`flex items-center gap-2 pb-2 ${step >= 4 ? 'text-[#000033] border-b-2 border-[#ccff00] font-black' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-[#ccff00] text-[#000033] font-bold' : 'bg-slate-100 text-slate-400'}`}>4</span> Fotos
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

            <form onSubmit={step === 4 ? handleSubmit : handleNext} className="space-y-6">
              
              {/* PASO 1: DATOS BÁSICOS */}
              {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-heading font-black tracking-tight text-[#000033] mb-2 uppercase">1. Ficha Técnica del Inmueble</h2>
                    <p className="text-slate-500 text-sm font-medium">Configura la información financiera, tipología y atributos de tu inmueble.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Título Comercial</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Departamento de lujo con acabados importados"
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                    />
                  </div>

                  {/* LÓGICA FINANCIERA DE MONEDA */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Moneda de Publicación</label>
                        <select
                          value={formData.currency}
                          onChange={(e) => handlePriceChange(e.target.value, 'CURRENCY')}
                          className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-white text-slate-900 font-medium text-sm transition-colors"
                        >
                          <option value="BOB">Bolivianos (Bs.)</option>
                          <option value="USD">Dólares (USD)</option>
                        </select>
                      </div>

                      {formData.currency === 'USD' ? (
                        <div>
                          <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">
                            Tipo de Cambio (Bs. x 1 USD) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Ej. 6.96"
                            value={formData.exchangeRate}
                            onChange={(e) => handlePriceChange(e.target.value, 'RATE')}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-white text-slate-900 font-medium text-sm transition-colors"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formData.currency === 'BOB' ? (
                        <div>
                          <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Precio en Bolivianos (Bs.)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Ej. 700000"
                            value={formData.priceBOB}
                            onChange={(e) => handlePriceChange(e.target.value, 'BOB')}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-white text-slate-900 font-medium text-sm transition-colors"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Precio en Dólares (USD)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Ej. 100000"
                            value={formData.priceUSD}
                            onChange={(e) => handlePriceChange(e.target.value, 'USD')}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-white text-slate-900 font-medium text-sm transition-colors"
                          />
                        </div>
                      )}

                      {formData.currency === 'USD' ? (
                        <div>
                          <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                            Equivalente Calculado (Bs.)
                          </label>
                          <input
                            type="text"
                            readOnly
                            placeholder="Bs. 0.00"
                            value={formData.priceBOB ? `${parseFloat(formData.priceBOB).toLocaleString('es-BO')} Bs.` : ''}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm outline-none cursor-default"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-2">
                            Referencia en Dólares (USD)
                          </label>
                          <input
                            type="text"
                            readOnly
                            placeholder="USD 0.00"
                            value={formData.priceUSD ? `${parseFloat(formData.priceUSD).toLocaleString('en-US')} USD` : ''}
                            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-bold text-sm outline-none cursor-default"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2">
                        Precio mínimo sugerido por el propietario (Tope Opcional)
                      </label>
                      <input
                        type="number"
                        placeholder="Monto confidencial para negociaciones"
                        value={formData.minPrice}
                        onChange={(e) => updateFormData({ minPrice: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-white text-slate-900 font-medium text-sm transition-colors"
                      />
                      <span className="text-[9px] text-slate-450 font-bold mt-1.5 block uppercase tracking-wider">🔒 Visible solo para agentes.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Tipo de Oferta</label>
                      <select
                        value={formData.offerType}
                        onChange={(e) => updateFormData({ offerType: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      >
                        <option value="VENTA">Venta 💰</option>
                        <option value="ALQUILER">Alquiler 🔑</option>
                        <option value="ANTICRETICO">Anticrético 📜</option>
                        <option value="PROYECTO">Proyecto 🏗️</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Tipo de Inmueble</label>
                      <select
                        value={formData.type}
                        onChange={(e) => updateFormData({ type: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      >
                        <option value="DEPARTAMENTO">Departamento 🏢</option>
                        <option value="CASA">Casa 🏡</option>
                        <option value="TERRENO">Terreno 🏜️</option>
                        <option value="OFICINA">Oficina 👔</option>
                        <option value="LOCAL_COMERCIAL">Local Comercial 🏪</option>
                        <option value="EDIFICIO">Edificio 🏫</option>
                      </select>
                    </div>
                  </div>

                  {/* SUPERFICIES SEPARADAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Superficie de Terreno (m²)</label>
                      <input
                        type="number"
                        placeholder="Ej. 300"
                        value={formData.landArea}
                        onChange={(e) => updateFormData({ landArea: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Superficie Construida (m²)</label>
                      <input
                        type="number"
                        placeholder="Ej. 180"
                        value={formData.builtArea}
                        onChange={(e) => updateFormData({ builtArea: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Dormitorios</label>
                      <input
                        type="number"
                        required
                        value={formData.rooms}
                        onChange={(e) => updateFormData({ rooms: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Baños</label>
                      <input
                        type="number"
                        required
                        value={formData.bathrooms}
                        onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Descripción Destacada</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Agrega comodidades, acabados y detalles que cautiven..."
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors resize-none"
                    />
                  </div>

                  {/* CHECKLIST DE ATRIBUTOS DE ALTO VALOR */}
                  <div className="border-t border-slate-200 pt-6 space-y-4">
                    <h3 className="text-lg font-heading font-bold text-[#000033] uppercase">Atributos de Alto Valor</h3>
                    <div className="space-y-6">
                      {Object.entries(ATTRIBUTES_BY_CATEGORY).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest">{category}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {items.map((item) => {
                              const isChecked = !!selectedAttributes[item];
                              return (
                                <button
                                  type="button"
                                  key={item}
                                  onClick={() => toggleAttribute(item)}
                                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                                    isChecked
                                      ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#000033] font-bold'
                                      : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350 text-slate-600'
                                  }`}
                                >
                                  <span>{item}</span>
                                  {isChecked && <span className="text-[#000033] font-black">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* PASO 2: GEOLOCALIZACIÓN */}
              {step === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-heading font-black tracking-tight text-[#000033] mb-2 uppercase">2. Ubicación y Geolocalización</h2>
                    <p className="text-slate-500 text-sm font-medium">Ubica con total precisión tu propiedad en el mapa para guiar a los interesados.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Ciudad / Departamento</label>
                      <select
                        value={formData.location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      >
                        {DEPARTAMENTOS.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Zona / Barrio</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Queru Queru"
                        value={formData.zona}
                        onChange={(e) => updateFormData({ zona: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Dirección Completa</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Calle Aniceto Padilla #456"
                      value={formData.address}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Marcador en Mapa Táctil</label>
                    <LeafletMap
                      lat={formData.latitude}
                      lng={formData.longitude}
                      onChange={(lat, lng) => updateFormData({ latitude: lat, longitude: lng })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-500">
                    <div>
                      <span className="block uppercase tracking-wider font-bold text-[#000033] mb-0.5">Latitud GPS:</span>
                      <span className="font-bold text-slate-800 text-xs">{formData.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider font-bold text-[#000033] mb-0.5">Longitud GPS:</span>
                      <span className="font-bold text-slate-800 text-xs">{formData.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: CHECKLIST LEGAL */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-heading font-black tracking-tight text-[#000033] mb-2 uppercase">3. Checklist de Validación Legal</h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Adjunta la documentación para activar el <span className="text-[#000033] font-black uppercase">Sello Oro</span> de tu propiedad (Modalidad: {formData.offerType}).
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Folio Real */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 bg-[#F8FAFC] border-slate-200">
                      <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => updateDocuments({ hasFolioReal: !documents.hasFolioReal })}>
                        <div className="pt-0.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            documents.hasFolioReal ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                          }`}>
                            {documents.hasFolioReal && '✓'}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold uppercase tracking-wide">Folio Real Actualizado (Libre Alodial)</h4>
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Certifica que el inmueble está libre de hipotecas, anotaciones o deudas.</p>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] flex items-center gap-1.5 transition-colors">
                          <span>📎 Adjuntar</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                alert(`Copia de Folio Real cargada: ${e.target.files[0].name}`);
                                updateDocuments({ hasFolioReal: true });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {formData.offerType === 'ALQUILER' ? (
                      /* Cédula CI para Alquiler */
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 bg-[#F8FAFC] border-slate-200">
                        <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => updateDocuments({ hasCI: !documents.hasCI })}>
                          <div className="pt-0.5">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              documents.hasCI ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                            }`}>
                              {documents.hasCI && '✓'}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold uppercase tracking-wide">Cédula de Identidad Vigente (CI)</h4>
                            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Copia de CI legible del propietario legal para contratación.</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] flex items-center gap-1.5 transition-colors">
                            <span>📎 Adjuntar</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  alert(`Copia de CI cargada: ${e.target.files[0].name}`);
                                  updateDocuments({ hasCI: true });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      /* Venta / Anticrético / Proyecto */
                      <div className="space-y-3.5">
                        {/* Certificado Catastral */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 bg-[#F8FAFC] border-slate-200">
                          <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => updateDocuments({ hasCatastro: !documents.hasCatastro })}>
                            <div className="pt-0.5">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasCatastro ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                              }`}>
                                {documents.hasCatastro && '✓'}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold uppercase tracking-wide">Certificado Catastral Al Día</h4>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Registro y plano catastral aprobado por el municipio correspondiente.</p>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] flex items-center gap-1.5 transition-colors">
                              <span>📎 Adjuntar</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    alert(`Copia de Certificado Catastral cargada: ${e.target.files[0].name}`);
                                    updateDocuments({ hasCatastro: true });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Testimonio de Escritura */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 bg-[#F8FAFC] border-slate-200">
                          <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => updateDocuments({ hasTestimonio: !documents.hasTestimonio })}>
                            <div className="pt-0.5">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasTestimonio ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                              }`}>
                                {documents.hasTestimonio && '✓'}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold uppercase tracking-wide">Testimonio de Escritura Pública</h4>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Escritura de compraventa notariada que acredita la propiedad.</p>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] flex items-center gap-1.5 transition-colors">
                              <span>📎 Adjuntar</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    alert(`Copia de Testimonio de Escritura cargada: ${e.target.files[0].name}`);
                                    updateDocuments({ hasTestimonio: true });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Impuestos Municipales */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 bg-[#F8FAFC] border-slate-200">
                          <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => updateDocuments({ hasImpuestosAlDia: !documents.hasImpuestosAlDia })}>
                            <div className="pt-0.5">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasImpuestosAlDia ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                              }`}>
                                {documents.hasImpuestosAlDia && '✓'}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold uppercase tracking-wide">Impuestos Municipales Al Día</h4>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Comprobante de pago del último impuesto a la propiedad municipal.</p>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] flex items-center gap-1.5 transition-colors">
                              <span>📎 Adjuntar</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    alert(`Copia de Impuestos cargada: ${e.target.files[0].name}`);
                                    updateDocuments({ hasImpuestosAlDia: true });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Plano de Uso de Suelo */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 bg-[#F8FAFC] border-slate-200">
                          <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => updateDocuments({ hasPlanoUsoSuelo: !documents.hasPlanoUsoSuelo })}>
                            <div className="pt-0.5">
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasPlanoUsoSuelo ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                              }`}>
                                {documents.hasPlanoUsoSuelo && '✓'}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold uppercase tracking-wide">Plano de Uso de Suelo Aprobado</h4>
                              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Plano municipal de zonificación, dimensiones y uso permitido.</p>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <label className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] flex items-center gap-1.5 transition-colors">
                              <span>📎 Adjuntar</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    alert(`Copia de Plano de Uso de Suelo cargada: ${e.target.files[0].name}`);
                                    updateDocuments({ hasPlanoUsoSuelo: true });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 4: FOTOS */}
              {step === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-2xl font-heading font-black tracking-tight text-[#000033] mb-2 uppercase">4. Subir fotografías</h2>
                    <p className="text-slate-500 text-sm font-medium">Carga las fotografías más destacadas del inmueble (Formatos de imagen nativos, peso máx: 150 MB).</p>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#000033] bg-slate-50 hover:bg-slate-100 rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUploadSimulate}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-2.5">
                      <span className="text-3xl block group-hover:scale-110 transition-transform">📸</span>
                      <h4 className="text-xs font-bold text-[#000033] uppercase tracking-wider">Subir fotografías</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Arrastra o presiona para seleccionar imágenes. (JPG, PNG, WEBP)</p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-sans">
                      <h4 className="text-[10px] uppercase font-bold text-slate-450 tracking-widest">Archivos en proceso de carga</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="space-y-1 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <div className="text-[9px] font-bold text-[#000033] truncate" title={file.name}>
                              {file.name}
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-400">
                              <span>{file.size}</span>
                              <span className="font-bold">{file.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-[#000033] transition-all"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
