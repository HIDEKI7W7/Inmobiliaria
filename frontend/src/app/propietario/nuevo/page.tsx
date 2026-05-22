'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Navbar } from '../../../components/ui/Navbar';
import { propertiesService } from '../../../services/properties.service';

// Carga dinámica del mapa interactivo de Leaflet para evitar errores de Hydration en servidor
const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-xl overflow-hidden border border-[#23252a] bg-[#141516] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#23252a] border-t-[#5e6ad2]"></div>
        <p className="text-[10px] text-[#8a8f98] font-mono uppercase tracking-widest animate-pulse">
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

  // 1. Efecto: Carga del borrador guardado en localStorage en el montaje
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

  // Publicación / Envío POST al Backend Protegido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Preparamos payload completo normalizado y tipado
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

      // Enviamos con el token Bearer del mock login de propietario
      const mockToken = 'mock-jwt-token-from-nest-api';
      await propertiesService.createPropertyAsPropietario(payload, mockToken);
      
      // Borramos el borrador local al registrar exitosamente
      localStorage.removeItem('propio_smart_capture_draft');
      setIsSuccess(true);
    } catch (error) {
      console.error('Error publicando propiedad:', error);
      alert('Error de conexión o de validación al enviar la propiedad.');
    } finally {
      setSaving(false);
    }
  };

  // Simulación interactiva premium de carga de archivos (Paso 4)
  const handleFileUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: (f.size / (1024 * 1024)).toFixed(2) + ' MB',
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newFiles]);

      // Efecto premium de barra de progreso subiendo
      newFiles.forEach((file, index) => {
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

  // Progreso visual superior
  const progressPercent = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100;
  const checklistOk = isChecklistComplete();

  return (
    <div className="min-h-screen bg-[#010102] text-[#f7f8f8] flex flex-col font-sans selection:bg-[#5e6ad2]/30 selection:text-white">
      <Navbar />

      <div className="flex-grow w-full max-w-lg md:max-w-xl mx-auto px-4 py-8 flex flex-col justify-center">
        {isSuccess ? (
          /* PANTALLA DE ÉXITO */
          <div className="bg-[#0f1011] p-8 rounded-2xl border border-[#23252a] text-center space-y-6 animate-fade-in shadow-2xl">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#b9fa3c]/10 text-[#b9fa3c] flex items-center justify-center text-3xl shadow-inner border border-[#b9fa3c]/20 animate-bounce">
                👑
              </div>
              <h1 className="text-xl font-bold tracking-tight uppercase text-linear-ink">
                ¡Propiedad Recibida con Éxito!
              </h1>
              <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                checklistOk 
                  ? 'bg-[#27a644]/10 text-[#27a644] border border-[#27a644]/20' 
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {checklistOk ? 'Sello Oro: Aprobado Preliminar' : 'Sello Oro: Validación Pendiente'}
              </span>
              <p className="text-xs text-[#8a8f98] leading-relaxed max-w-sm mx-auto pt-2">
                {checklistOk 
                  ? `Tu inmueble en ${formData.location} ha sido registrado de forma segura. Nuestro equipo validará los documentos para activar tu Sello Oro de validación inmediata.`
                  : `Tu inmueble ha sido registrado como BORRADOR PENDIENTE. Para recibir ofertas directas con Sello Oro, recuerda adjuntar tu carpeta legal completa en el Paso 3.`
                }
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <a
                href="/propietario"
                className="w-full py-3 bg-[#b9fa3c] hover:bg-[#b9fa3c]/90 text-[#04045E] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md text-center"
              >
                Ir a mi Panel del Propietario 🏡
              </a>
              <a
                href="/properties"
                className="w-full py-3 bg-[#141516] hover:bg-[#18191a] text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a] font-bold text-xs uppercase tracking-widest rounded-xl transition-all text-center"
              >
                Ver Catálogo Inmobiliario
              </a>
            </div>
          </div>
        ) : (
          /* FORMULARIO SMART-CAPTURE */
          <div className="bg-[#0f1011] rounded-2xl border border-[#23252a] p-6 shadow-2xl space-y-6">
            
            {/* Cabecera Técnica del Stepper */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#8a8f98]">
                <span className="text-[#b9fa3c]">Smart-Capture: Autoservicio</span>
                <span>Paso {step} de 4</span>
              </div>
              <div className="w-full h-1 bg-[#141516] rounded-full overflow-hidden border border-[#23252a]">
                <div
                  className="h-full bg-[#b9fa3c] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Mini visualizador de pasos */}
              <div className="grid grid-cols-4 gap-1 text-center text-[8px] font-bold uppercase tracking-wider pt-1 text-[#8a8f98]">
                <span className={step === 1 ? 'text-[#b9fa3c]' : ''}>1. Datos</span>
                <span className={step === 2 ? 'text-[#b9fa3c]' : ''}>2. Ubicación</span>
                <span className={step === 3 ? 'text-[#b9fa3c]' : ''}>3. Legal</span>
                <span className={step === 4 ? 'text-[#b9fa3c]' : ''}>4. Fotos</span>
              </div>
            </div>

            <form onSubmit={step === 4 ? handleSubmit : handleNext} className="space-y-5">
              
              {/* PASO 1: DATOS TÉCNICOS */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-linear-ink uppercase tracking-tight">
                      1. Ficha Técnica del Inmueble
                    </h2>
                    <p className="text-[10px] text-[#8a8f98]">
                      Configura el valor de mercado y la tipología física de tu inmueble.
                    </p>
                  </div>

                  {/* Título */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                      Título Comercial
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Departamento de lujo con acabados importados"
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold"
                    />
                  </div>

                  {/* Rango de Precios (Precio Pretendido y Precio Tope Oculto) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                        Precio Pretendido (USD)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ej. 135000"
                        value={formData.price}
                        onChange={(e) => updateFormData({ price: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-amber-500 tracking-widest flex items-center gap-1">
                        🔒 Mínimo Ocular (Tope)
                      </label>
                      <input
                        type="number"
                        placeholder="Ej. 125000"
                        value={formData.minPrice}
                        onChange={(e) => updateFormData({ minPrice: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all font-sans font-bold"
                      />
                      <span className="block text-[8px] text-[#8a8f98] leading-none">
                        Invisible para clientes finales.
                      </span>
                    </div>
                  </div>

                  {/* Modalidad de Oferta y Tipo de Propiedad */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                        Tipo de Oferta
                      </label>
                      <select
                        value={formData.offerType}
                        onChange={(e) => updateFormData({ offerType: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold"
                      >
                        <option value="VENTA">Venta 💰</option>
                        <option value="ALQUILER">Alquiler 🔑</option>
                        <option value="ANTICRETICO">Anticrético 📜</option>
                        <option value="PROYECTO">Proyecto 🏗️</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                        Tipo de Inmueble
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => updateFormData({ type: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold"
                      >
                        <option value="DEPARTAMENTO">Departamento 🏢</option>
                        <option value="CASA">Casa 🏡</option>
                        <option value="TERRENO">Terreno 🏜️</option>
                        <option value="OFICINA">Oficina 👔</option>
                      </select>
                    </div>
                  </div>

                  {/* Superficie y Ambientes */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                        Sup. (m²)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="Ej. 120"
                        value={formData.area}
                        onChange={(e) => updateFormData({ area: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold text-center"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                        Dorm.
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.rooms}
                        onChange={(e) => updateFormData({ rooms: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold text-center"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                        Baños
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.bathrooms}
                        onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                        className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                      Descripción Destacada
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Agrega comodidades, acabados y detalles que cautiven..."
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold resize-none"
                    />
                  </div>
                </div>
              )}

              {/* PASO 2: GEOLOCALIZACIÓN E UBICACIÓN */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-linear-ink uppercase tracking-tight">
                      2. Ubicación y Geolocalización GPS
                    </h2>
                    <p className="text-[10px] text-[#8a8f98]">
                      Escribe tu dirección y arrastra el marcador al punto exacto sobre el mapa de Cochabamba.
                    </p>
                  </div>

                  {/* Dirección Manual */}
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                      Dirección Escrita / Zona
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Calle Aniceto Padilla #456, Queru Queru"
                      value={formData.address}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="w-full bg-[#141516] text-[#f7f8f8] border border-[#23252a] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#5e6ad2] transition-all font-sans font-bold"
                    />
                  </div>

                  {/* Mapa Interactivo */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-black text-[#8a8f98] tracking-widest">
                      Marcador en Mapa Táctil
                    </label>
                    <LeafletMap
                      lat={formData.latitude}
                      lng={formData.longitude}
                      onChange={(lat, lng) => updateFormData({ latitude: lat, longitude: lng })}
                    />
                  </div>

                  {/* Visualizador de Coordenadas */}
                  <div className="grid grid-cols-2 gap-4 bg-[#141516] p-3 rounded-xl border border-[#23252a] text-[9px] font-mono text-[#8a8f98]">
                    <div>
                      <span className="block uppercase tracking-wider font-bold">Latitud GPS:</span>
                      <span className="font-bold text-[#f7f8f8]">{formData.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider font-bold">Longitud GPS:</span>
                      <span className="font-bold text-[#f7f8f8]">{formData.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: CHECKLIST DOCUMENTAL (DINÁMICO POR OFERTA) */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-linear-ink uppercase tracking-tight">
                      3. Checklist Documental de Validación
                    </h2>
                    <p className="text-[10px] text-[#8a8f98]">
                      Mostrando requisitos obligatorios para la modalidad de:{" "}
                      <span className="text-[#b9fa3c] font-black">{formData.offerType}</span>
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Folio Real Actualizado (Todos) */}
                    <div
                      onClick={() => updateDocuments({ hasFolioReal: !documents.hasFolioReal })}
                      className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                        documents.hasFolioReal
                          ? 'bg-[#27a644]/5 border-[#27a644]/30'
                          : 'bg-[#141516] border-[#23252a] hover:border-[#3e3e44]'
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                            documents.hasFolioReal
                              ? 'bg-[#27a644] border-[#27a644] text-[#0f1011] text-[10px] font-black'
                              : 'bg-transparent border-[#3e3e44]'
                          }`}
                        >
                          {documents.hasFolioReal && '✓'}
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-linear-ink">
                          Folio Real Actualizado (Libre Alodial)
                        </h4>
                        <p className="text-[10px] text-[#8a8f98] font-sans">
                          Certifica que el inmueble está libre de hipotecas, anotaciones o deudas.
                        </p>
                      </div>
                    </div>

                    {/* Lógica de Alquiler: Cédula de Identidad */}
                    {formData.offerType === 'ALQUILER' ? (
                      <div
                        onClick={() => updateDocuments({ hasCI: !documents.hasCI })}
                        className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                          documents.hasCI
                            ? 'bg-[#27a644]/5 border-[#27a644]/30'
                            : 'bg-[#141516] border-[#23252a] hover:border-[#3e3e44]'
                        }`}
                      >
                        <div className="pt-0.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                              documents.hasCI
                                ? 'bg-[#27a644] border-[#27a644] text-[#0f1011] text-[10px] font-black'
                                : 'bg-transparent border-[#3e3e44]'
                            }`}
                          >
                            {documents.hasCI && '✓'}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-linear-ink">
                            Cédula de Identidad Vigente (CI)
                          </h4>
                          <p className="text-[10px] text-[#8a8f98] font-sans">
                            Copia de CI legible del propietario legal del inmueble para contratación.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Lógica de Venta / Anticrético / Proyecto */
                      <div className="space-y-3">
                        {/* Certificado Catastral */}
                        <div
                          onClick={() => updateDocuments({ hasCatastro: !documents.hasCatastro })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasCatastro
                              ? 'bg-[#27a644]/5 border-[#27a644]/30'
                              : 'bg-[#141516] border-[#23252a] hover:border-[#3e3e44]'
                          }`}
                        >
                          <div className="pt-0.5">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasCatastro
                                  ? 'bg-[#27a644] border-[#27a644] text-[#0f1011] text-[10px] font-black'
                                  : 'bg-transparent border-[#3e3e44]'
                              }`}
                            >
                              {documents.hasCatastro && '✓'}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-linear-ink">
                              Certificado Catastral Al Día
                            </h4>
                            <p className="text-[10px] text-[#8a8f98] font-sans">
                              Registro y plano catastral aprobado por el municipio correspondiente de Cochabamba.
                            </p>
                          </div>
                        </div>

                        {/* Testimonio de Propiedad */}
                        <div
                          onClick={() => updateDocuments({ hasTestimonio: !documents.hasTestimonio })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasTestimonio
                              ? 'bg-[#27a644]/5 border-[#27a644]/30'
                              : 'bg-[#141516] border-[#23252a] hover:border-[#3e3e44]'
                          }`}
                        >
                          <div className="pt-0.5">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasTestimonio
                                  ? 'bg-[#27a644] border-[#27a644] text-[#0f1011] text-[10px] font-black'
                                  : 'bg-transparent border-[#3e3e44]'
                              }`}
                            >
                              {documents.hasTestimonio && '✓'}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-linear-ink">
                              Testimonio de Escritura Pública
                            </h4>
                            <p className="text-[10px] text-[#8a8f98] font-sans">
                              Escritura de compraventa notariada que acredita la propiedad.
                            </p>
                          </div>
                        </div>

                        {/* Impuestos pagados al día */}
                        <div
                          onClick={() => updateDocuments({ hasImpuestosAlDia: !documents.hasImpuestosAlDia })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasImpuestosAlDia
                              ? 'bg-[#27a644]/5 border-[#27a644]/30'
                              : 'bg-[#141516] border-[#23252a] hover:border-[#3e3e44]'
                          }`}
                        >
                          <div className="pt-0.5">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasImpuestosAlDia
                                  ? 'bg-[#27a644] border-[#27a644] text-[#0f1011] text-[10px] font-black'
                                  : 'bg-transparent border-[#3e3e44]'
                              }`}
                            >
                              {documents.hasImpuestosAlDia && '✓'}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-linear-ink">
                              Impuestos Municipales Al Día
                            </h4>
                            <p className="text-[10px] text-[#8a8f98] font-sans">
                              Comprobante de pago del último impuesto a la propiedad municipal correspondiente.
                            </p>
                          </div>
                        </div>

                        {/* Plano de Uso de Suelo */}
                        <div
                          onClick={() => updateDocuments({ hasPlanoUsoSuelo: !documents.hasPlanoUsoSuelo })}
                          className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex gap-4 items-start ${
                            documents.hasPlanoUsoSuelo
                              ? 'bg-[#27a644]/5 border-[#27a644]/30'
                              : 'bg-[#141516] border-[#23252a] hover:border-[#3e3e44]'
                          }`}
                        >
                          <div className="pt-0.5">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                documents.hasPlanoUsoSuelo
                                  ? 'bg-[#27a644] border-[#27a644] text-[#0f1011] text-[10px] font-black'
                                  : 'bg-transparent border-[#3e3e44]'
                              }`}
                            >
                              {documents.hasPlanoUsoSuelo && '✓'}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-linear-ink">
                              Plano de Uso de Suelo Aprobado
                            </h4>
                            <p className="text-[10px] text-[#8a8f98] font-sans">
                              Plano municipal de zonificación, dimensiones y uso permitido.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 4: MULTIMEDIA & PUBLICACIÓN */}
              {step === 4 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-linear-ink uppercase tracking-tight">
                      4. Multimedia e Imágenes
                    </h2>
                    <p className="text-[10px] text-[#8a8f98]">
                      Carga las fotografías más destacadas y las carpetas digitales en formato PDF.
                    </p>
                  </div>

                  {/* Dropzone Mobile-First */}
                  <div className="relative border-2 border-dashed border-[#23252a] hover:border-[#b9fa3c] bg-[#141516]/40 hover:bg-[#141516]/60 rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUploadSimulate}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-2">
                      <span className="text-3xl block group-hover:scale-110 transition-transform">📸</span>
                      <h4 className="text-xs font-bold text-[#f7f8f8] uppercase tracking-wider">
                        Subir fotografías y documentos de mi propiedad
                      </h4>
                      <p className="text-[9px] text-[#8a8f98] font-sans">
                        Arrastra o presiona para capturar desde tu teléfono móvil. (PDF, JPG, PNG)
                      </p>
                    </div>
                  </div>

                  {/* Listado de archivos con barra de progreso */}
                  {files.length > 0 && (
                    <div className="space-y-3 bg-[#141516] p-4 rounded-xl border border-[#23252a]">
                      <h4 className="text-[10px] uppercase font-bold text-[#8a8f98] tracking-widest">
                        Archivos en Proceso de Carga
                      </h4>
                      <div className="space-y-2">
                        {files.map((file, idx) => (
                          <div key={idx} className="space-y-1 text-xs">
                            <div className="flex justify-between font-mono text-[10px]">
                              <span className="truncate max-w-[200px] text-[#f7f8f8] font-bold">{file.name}</span>
                              <span className="text-[#8a8f98]">{file.size} - {file.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-[#23252a] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#b9fa3c] transition-all"
                                style={{ width: `${file.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* REGLA DE SEMÁFORO: ALERTA VISUAL DE DOCUMENTACIÓN FALANTE */}
                  {!checklistOk && (
                    <div className="p-4 rounded-xl bg-red-950/20 border border-red-600/30 text-red-500 space-y-2">
                      <div className="flex gap-2 items-start text-xs font-bold uppercase tracking-tight">
                        <span>⚠️</span>
                        <span>Alerta Documental Legal</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#8a8f98]">
                        Faltan documentos obligatorios para certificar tu inmueble con el **Sello Oro de Propio**. 
                        Si continúas, la propiedad se publicará pero se marcará con estado 
                        <span className="text-red-500 font-bold"> PENDIENTE DE VALIDACIÓN LEGAL</span> hasta que subas todo.
                      </p>
                    </div>
                  )}

                  {checklistOk && (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-600/30 text-[#27a644] space-y-2">
                      <div className="flex gap-2 items-start text-xs font-bold uppercase tracking-tight">
                        <span>👑</span>
                        <span>¡Carpeta Legal Completa!</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#8a8f98]">
                        Has marcado todos los documentos jurídicos. Tu propiedad será aprobada con el **Sello Oro de Propio** de manera inmediata al procesarse.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* BOTONES DE NAVEGACIÓN Y TRAFFIC LIGHT RULE */}
              <div className="pt-4 border-t border-[#23252a] flex justify-between gap-4">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-3 bg-[#141516] hover:bg-[#18191a] text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a] font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                  >
                    Anterior
                  </button>
                ) : (
                  <div></div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-3 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.98] flex-1 text-center ${
                    saving
                      ? 'bg-[#b9fa3c]/40 text-[#04045E]/40 cursor-not-allowed'
                      : step === 4
                        ? checklistOk
                          ? 'bg-[#b9fa3c] hover:bg-[#b9fa3c]/90 text-[#04045E]' // Verde si está todo en orden
                          : 'bg-red-600 hover:bg-red-700 text-white animate-pulse' // Rojo si falta algo (TRAFFIC LIGHT RULE!)
                        : 'bg-[#b9fa3c] hover:bg-[#b9fa3c]/90 text-[#04045E]' // Siguiente Paso
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
                    <span>Siguiente Paso</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
