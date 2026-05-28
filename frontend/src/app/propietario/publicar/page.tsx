'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { propertiesService } from '../../../services/properties.service';

// Carga dinámica del mapa interactivo de Leaflet para evitar errores de Hydration en servidor
const LeafletMap = dynamic(
  () => import('../nuevo/LeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-[#04045E]"></div>
        <p className="text-[10px] text-slate-400 font-sans uppercase tracking-widest animate-pulse font-bold">
          Inicializando Mapa Táctil...
        </p>
      </div>
    ),
  }
);

export default function PublicarPropiedadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string; progress: number }[]>([]);

  // Estados del Formulario (Smart-Capture Data Model)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    minPrice: '', // Precio Tope Mínimo (invisible para clientes)
    offerType: 'VENTA', // Select: Venta, Alquiler, Anticrético, Proyecto
    type: 'DEPARTAMENTO', // CASA, DEPARTAMENTO, TERRENO, OFICINA
    area: '',
    rooms: '3',
    bathrooms: '2',
    location: 'Cochabamba',
    address: '', // Dirección manual
    latitude: -17.3895, // Ubicación inicial Cochabamba
    longitude: -66.1568,
    imageUrl: '',
    ownerName: 'Propietario Legítimo',
    ownerPhone: '',
    ownerEmail: 'owner@propio.com.bo',
  });

  // Estados del Paso 3: Checklist Documental dinámico
  const [documents, setDocuments] = useState({
    hasFolioReal: false,       // Folio Real (Todos)
    hasCI: false,              // CI (Solo Alquiler)
    hasCatastro: false,        // Certificado Catastral (Venta, Anticrético, Proyecto)
    hasTestimonio: false,      // Testimonio de Propiedad (Venta, Anticrético, Proyecto)
    hasImpuestosAlDia: false,  // Impuestos al día (Venta, Anticrético, Proyecto)
    hasPlanoUsoSuelo: false,   // Plano de Uso de Suelo (Venta, Anticrético, Proyecto)
  });

  // Carga del borrador guardado en localStorage en el montaje
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
        if (draft.step) {
          setStep(draft.step);
        }
      } catch (error) {
        console.error('Error cargando borrador de Propio:', error);
      }
    }
  }, []);

  // Función para persistir el borrador en localStorage
  const handlePersistDraft = (updatedFormData: typeof formData, updatedDocs: typeof documents, currentStep: number) => {
    localStorage.setItem(
      'propio_smart_capture_draft',
      JSON.stringify({
        formData: updatedFormData,
        documents: updatedDocs,
        step: currentStep,
      })
    );
  };

  const updateFormData = (fields: Partial<typeof formData>) => {
    const updated = { ...formData, ...fields };
    setFormData(updated);
    handlePersistDraft(updated, documents, step);
  };

  const updateDocuments = (fields: Partial<typeof documents>) => {
    const updated = { ...documents, ...fields };
    setDocuments(updated);
    handlePersistDraft(formData, updated, step);
  };

  // Lógica Dinámica: ¿Tiene el propietario todos los documentos obligatorios según su tipo de oferta?
  const isChecklistComplete = () => {
    if (formData.offerType === 'ALQUILER') {
      // Obligatorios Alquiler: Folio Real y Cédula de Identidad (CI)
      return documents.hasFolioReal && documents.hasCI;
    } else {
      // Obligatorios Venta / Anticrético / Proyecto: Folio Real, Catastro, Testimonio, Impuestos, Plano Uso de Suelo
      return (
        documents.hasFolioReal &&
        documents.hasCatastro &&
        documents.hasTestimonio &&
        documents.hasImpuestosAlDia &&
        documents.hasPlanoUsoSuelo
      );
    }
  };

  // Manejo de pasos
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      handlePersistDraft(formData, documents, nextStep);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      handlePersistDraft(formData, documents, prevStep);
      window.scrollTo(0, 0);
    }
  };

  // Publicación / Envío POST al Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || `Propiedad tipo ${formData.type.toLowerCase()} en ${formData.location} ofertada bajo modalidad de ${formData.offerType.toLowerCase()}.`,
        price: parseFloat(formData.price),
        minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
        area: parseFloat(formData.area),
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

  // Simulación interactiva de carga de archivos
  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
        progress: 0,
      }));
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

  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;
  const checklistOk = isChecklistComplete();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#04045E] font-sans antialiased flex flex-col selection:bg-[#b9fa3c]/30">
      
      {/* Navbar Superior de Contexto */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center select-none flex-shrink-0">
        <Link href="/" className="text-xl font-bold text-[#04045E]">
          Propio<span className="text-[#b9fa3c] font-black">.</span>
        </Link>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Paso {step} de 4</span>
      </header>

      {/* Contenedor Central Espacioso */}
      <main className="flex-grow flex items-center justify-center p-6 md:p-12">
        
        {isSuccess ? (
          /* PANTALLA DE ÉXITO */
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10 text-center space-y-6 animate-fade-in">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#b9fa3c]/20 text-[#04045E] flex items-center justify-center text-3xl shadow-sm border border-[#b9fa3c]/30 animate-bounce">
                👑
              </div>
              <h1 className="text-2xl font-black tracking-tight uppercase text-[#04045E]">
                ¡Propiedad Recibida con Éxito!
              </h1>
              <span className={`inline-block text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                checklistOk 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
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
              <Link
                href="/propietario"
                className="px-6 py-3.5 bg-[#b9fa3c] hover:bg-[#b9fa3c]/90 text-[#04045E] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md text-center hover:scale-[1.02] active:scale-95"
              >
                Ir a mi Panel de Propietario 🏡
              </Link>
              <Link
                href="/properties"
                className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-[#04045E] border border-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all text-center hover:scale-[1.02] active:scale-95"
              >
                Ver Catálogo Inmobiliario
              </Link>
            </div>
          </div>
        ) : (
          /* FORMULARIO SMART-CAPTURE */
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl p-8 md:p-10 flex flex-col gap-6">
            
            {/* Stepper del Formulario */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                <div className={`flex items-center gap-2 pb-2 ${step >= 1 ? 'text-[#04045E] border-b-2 border-[#b9fa3c]' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-slate-100 text-slate-400'}`}>1</span> Datos Básicos
                </div>
                <div className={`flex items-center gap-2 pb-2 ${step >= 2 ? 'text-[#04045E] border-b-2 border-[#b9fa3c]' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-slate-100 text-slate-400'}`}>2</span> Ubicación
                </div>
                <div className={`flex items-center gap-2 pb-2 ${step >= 3 ? 'text-[#04045E] border-b-2 border-[#b9fa3c]' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-slate-100 text-slate-400'}`}>3</span> Legal
                </div>
                <div className={`flex items-center gap-2 pb-2 ${step >= 4 ? 'text-[#04045E] border-b-2 border-[#b9fa3c]' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 4 ? 'bg-[#b9fa3c] text-[#04045E]' : 'bg-slate-100 text-slate-400'}`}>4</span> Fotos
                </div>
              </div>
            </div>

            <form onSubmit={step === 4 ? handleSubmit : handleNext} className="space-y-6">
              
              {/* PASO 1: DATOS BÁSICOS */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#04045E] mb-2 uppercase">1. Ficha Técnica del Inmueble</h2>
                    <p className="text-slate-500 text-sm font-medium">Configura el valor de mercado y la tipología física de tu inmueble.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Título Comercial</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Departamento de lujo con acabados importados"
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Precio Pretendido (USD)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ej. 135000"
                        value={formData.price}
                        onChange={(e) => updateFormData({ price: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-amber-600 mb-2 flex items-center gap-1.5">
                        🔒 Mínimo Ocular (Tope Opcional)
                      </label>
                      <input
                        type="number"
                        placeholder="Ej. 125000"
                        value={formData.minPrice}
                        onChange={(e) => updateFormData({ minPrice: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-amber-500 bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      />
                      <span className="text-[10px] text-slate-400 font-medium mt-1.5 block">Invisible para clientes finales.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Tipo de Oferta</label>
                      <select
                        value={formData.offerType}
                        onChange={(e) => updateFormData({ offerType: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      >
                        <option value="VENTA">Venta 💰</option>
                        <option value="ALQUILER">Alquiler 🔑</option>
                        <option value="ANTICRETICO">Anticrético 📜</option>
                        <option value="PROYECTO">Proyecto 🏗️</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Tipo de Inmueble</label>
                      <select
                        value={formData.type}
                        onChange={(e) => updateFormData({ type: e.target.value })}
                        className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                      >
                        <option value="DEPARTAMENTO">Departamento 🏢</option>
                        <option value="CASA">Casa 🏡</option>
                        <option value="TERRENO">Terreno 🏜️</option>
                        <option value="OFICINA">Oficina 👔</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Sup. (M²)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej. 120"
                        value={formData.area}
                        onChange={(e) => updateFormData({ area: e.target.value })}
                        className="w-full px-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Dorm.</label>
                      <input
                        type="number"
                        required
                        value={formData.rooms}
                        onChange={(e) => updateFormData({ rooms: e.target.value })}
                        className="w-full px-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Baños</label>
                      <input
                        type="number"
                        required
                        value={formData.bathrooms}
                        onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                        className="w-full px-3 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Descripción Destacada</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Agrega comodidades, acabados y detalles que cautiven..."
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: GEOLOCALIZACIÓN E UBICACIÓN */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#04045E] mb-2 uppercase">2. Ubicación y Geolocalización</h2>
                    <p className="text-slate-500 text-sm font-medium">Ubica con total precisión tu propiedad en el mapa para guiar al agente de forma segura.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Dirección Escrita / Zona</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Calle Aniceto Padilla #456, Queru Queru"
                      value={formData.address}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#04045E] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-[#04045E] mb-2">Marcador en Mapa Táctil</label>
                    <LeafletMap
                      lat={formData.latitude}
                      lng={formData.longitude}
                      onChange={(lat, lng) => updateFormData({ latitude: lat, longitude: lng })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-500">
                    <div>
                      <span className="block uppercase tracking-wider font-bold text-[#04045E] mb-0.5">Latitud GPS:</span>
                      <span className="font-bold text-slate-800 text-xs">{formData.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider font-bold text-[#04045E] mb-0.5">Longitud GPS:</span>
                      <span className="font-bold text-slate-800 text-xs">{formData.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: CHECKLIST LEGAL */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#04045E] mb-2 uppercase">3. Checklist de Validación Legal</h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Adjunta la documentación para activar el <span className="text-[#04045E] font-black uppercase">Sello Oro</span> de tu propiedad (Modalidad: {formData.offerType}).
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Folio Real */}
                    <div
                      onClick={() => updateDocuments({ hasFolioReal: !documents.hasFolioReal })}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                        documents.hasFolioReal
                          ? 'bg-emerald-50 border-emerald-300 text-[#04045E]'
                          : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350'
                      }`}
                    >
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

                    {formData.offerType === 'ALQUILER' ? (
                      /* Cédula CI para Alquiler */
                      <div
                        onClick={() => updateDocuments({ hasCI: !documents.hasCI })}
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                          documents.hasCI
                            ? 'bg-emerald-50 border-emerald-300 text-[#04045E]'
                            : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350'
                        }`}
                      >
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
                    ) : (
                      /* Venta / Anticrético / Proyecto */
                      <div className="space-y-3.5">
                        {/* Certificado Catastral */}
                        <div
                          onClick={() => updateDocuments({ hasCatastro: !documents.hasCatastro })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasCatastro
                              ? 'bg-emerald-50 border-emerald-300 text-[#04045E]'
                              : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350'
                          }`}
                        >
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

                        {/* Testimonio de Escritura */}
                        <div
                          onClick={() => updateDocuments({ hasTestimonio: !documents.hasTestimonio })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasTestimonio
                              ? 'bg-emerald-50 border-emerald-300 text-[#04045E]'
                              : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350'
                          }`}
                        >
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

                        {/* Impuestos Municipales */}
                        <div
                          onClick={() => updateDocuments({ hasImpuestosAlDia: !documents.hasImpuestosAlDia })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasImpuestosAlDia
                              ? 'bg-emerald-50 border-emerald-300 text-[#04045E]'
                              : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350'
                          }`}
                        >
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

                        {/* Plano de Uso de Suelo */}
                        <div
                          onClick={() => updateDocuments({ hasPlanoUsoSuelo: !documents.hasPlanoUsoSuelo })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasPlanoUsoSuelo
                              ? 'bg-emerald-50 border-emerald-300 text-[#04045E]'
                              : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350'
                          }`}
                        >
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
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 4: FOTOS Y MULTIMEDIA */}
              {step === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#04045E] mb-2 uppercase">4. Galería e Imágenes</h2>
                    <p className="text-slate-500 text-sm font-medium">Carga las fotografías más destacadas del inmueble para convencer a los leads.</p>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#04045E] bg-slate-50 hover:bg-slate-100 rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUploadSimulate}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-2.5">
                      <span className="text-3xl block group-hover:scale-110 transition-transform">📸</span>
                      <h4 className="text-xs font-bold text-[#04045E] uppercase tracking-wider">Subir fotografías y documentos</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">Arrastra o presiona para seleccionar imágenes. (JPG, PNG, PDF)</p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <h4 className="text-[10px] uppercase font-bold text-slate-450 tracking-widest">Archivos en proceso de carga</h4>
                      <div className="space-y-2.5">
                        {files.map((file, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-[#04045E]">
                              <span className="truncate max-w-[200px]">{file.name}</span>
                              <span className="text-slate-400">{file.size} - {file.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#04045E] transition-all"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Alerta de validación documental */}
                  {!checklistOk ? (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 space-y-1.5 text-xs">
                      <div className="flex gap-2 items-start font-bold uppercase tracking-wide">
                        <span>⚠️</span>
                        <span>Alerta Documental Legal</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-slate-500 font-semibold">
                        Faltan documentos obligatorios para certificar tu inmueble con el **Sello Oro de Propio**. 
                        La propiedad se publicará como <span className="text-red-600 font-bold">PENDIENTE DE VALIDACIÓN</span> hasta que completes la carpeta.
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
                    className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-455 hover:text-[#04045E] border border-slate-200 font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shrink-0"
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
                        ? checklistOk
                          ? 'bg-[#b9fa3c] hover:bg-[#b9fa3c]/90 text-[#04045E]'
                          : 'bg-red-650 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-[#b9fa3c] hover:bg-[#b9fa3c]/90 text-[#04045E]'
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
