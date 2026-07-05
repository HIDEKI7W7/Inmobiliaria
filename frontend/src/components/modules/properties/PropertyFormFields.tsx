'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { apiClient } from '@/services/api.client';

export const ATTRIBUTES_BY_CATEGORY = {
  Interiores: ['Aire Acondicionado', 'Calefacción', 'Cocina Equipada', 'Roperos Empotrados', 'Amoblado', 'Termotanque', 'Suite Master', 'Dependencias de Servicio'],
  Exteriores: ['Jardín', 'Churrasquera/Parrillero', 'Terraza', 'Balcón', 'Patio', 'Piscina Privada'],
  Parqueos: ['Parqueo Techado', 'Parqueo de Visitas', 'Garaje con Portón Eléctrico', 'Baulera'],
  Seguridad: ['Seguridad 24/7', 'Cerco Eléctrico', 'Cámaras de Vigilancia', 'Alarma', 'Conserjería'],
  'Áreas Comunes': ['Salón de Eventos', 'Gimnasio', 'Piscina Común', 'Canchas Deportivas', 'Parque Infantil', 'Sauna'],
  Sostenibilidad: ['Calefón Solar', 'Paneles Solares', 'Iluminación LED', 'Sistema de Reciclaje de Agua']
};

export const DEPARTAMENTOS_COORDS: Record<string, { lat: number; lng: number }> = {
  'La Paz': { lat: -16.50, lng: -68.15 },
  'Santa Cruz': { lat: -17.7833, lng: -63.1667 },
  'Cochabamba': { lat: -17.3895, lng: -66.1568 },
  'Oruro': { lat: -17.9833, lng: -67.15 },
  'Potosí': { lat: -19.5833, lng: -65.75 },
  'Tarija': { lat: -21.5355, lng: -64.7296 },
  'Chuquisaca': { lat: -19.0333, lng: -65.2627 },
  'Beni': { lat: -14.8333, lng: -64.9 },
  'Pando': { lat: -11.0167, lng: -68.7667 }
};

// [DICCIONARIO_ZONAS_BOLIVIA_ESTADO] - Zonas principales de Bolivia por departamento
export const ZONAS_POR_DEPARTAMENTO: Record<string, string[]> = {
  "La Paz": ["Central", "Sopocachi", "Miraflores", "Obrajes", "Calacoto", "Achumani", "San Pedro"],
  "Cochabamba": ["Cala Cala", "Queru Queru", "Mayorazgo", "Muyurina", "El Prado", "Sarco", "Tiquipaya"],
  "Santa Cruz": ["Equipetrol", "Las Palmas", "Urubó", "Zona Central", "Sirari", "Los Cusis"],
  "Tarija": ["El Molino", "San Roque", "La Pampa", "Senac"],
  "Chuquisaca": ["Zona Central", "San Roque", "Barrio Petrolero"],
  "Oruro": ["Zona Central", "Zona Norte", "Zona Sur"],
  "Potosí": ["Zona Central", "Ciudad Satélite", "Las Delicias"],
  "Beni": ["Trinidad Central", "Pompeya"],
  "Pando": ["Cobija Central", "Mapajo"]
};

export const DEPARTAMENTOS = Object.keys(DEPARTAMENTOS_COORDS);

export const PROPERTY_TYPES = [
  { value: 'DEPARTAMENTO', label: 'Departamento', emoji: '🏢' },
  { value: 'CASA', label: 'Casa', emoji: '🏠' },
  { value: 'CASA_CONDOMINIO', label: 'Casa en condominio', emoji: '🏡' },
  { value: 'OFICINA', label: 'Oficina', emoji: '🏢' },
  { value: 'LOCAL_COMERCIAL', label: 'Local Comercial', emoji: '🏪' },
  { value: 'TERRENO', label: 'Terreno', emoji: '🗺️' },
  { value: 'PROPIEDAD_AGRICOLA', label: 'Propiedad agrícola/ganadera', emoji: '🚜' },
  { value: 'EDIFICIO', label: 'Edificio', emoji: '🏫' },
  { value: 'HOTEL', label: 'Hotel', emoji: '🏨' },
  { value: 'MONOAMBIENTE', label: 'Monoambiente', emoji: '🛏️' },
  { value: 'GARZONIER', label: 'Garzonier', emoji: '🛋️' },
  { value: 'PENTHOUSE', label: 'Penthouse', emoji: '🏙️' },
  { value: 'GARAJE_BAULERA', label: 'Garaje / Baulera', emoji: '🚗' },
  { value: 'GALPON', label: 'Galpón', emoji: '🏭' }
];

const LeafletMap = dynamic(
  () => import('../../../app/propietario/nuevo/LeafletMap'),
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

export interface PropertyFormFieldsData {
  title: string;
  description: string;
  currency: string;
  exchangeRate: string;
  priceBOB: string;
  priceUSD: string;
  minPrice: string;
  offerType: string;
  type: string;
  landArea: string;
  builtArea: string;
  rooms: string;
  bathrooms: string;
  location: string;
  zona: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface PropertyFormFieldsProps {
  formData: PropertyFormFieldsData;
  onChange: (updates: Partial<PropertyFormFieldsData>) => void;
  step?: number; // If undefined, show all sections together (for edit modals)
  
  // Attributes
  selectedAttributes: Record<string, boolean>;
  onToggleAttribute: (attr: string) => void;
  
  // Checkbox Documents (Legal Folder Checklist)
  documents: {
    hasFolioReal: boolean;
    hasCatastro: boolean;
    hasTestimonio: boolean;
    hasImpuestosAlDia: boolean;
    hasPlanoUsoSuelo: boolean;
    hasCI: boolean;
    hasOtrosDocumentos?: boolean;
  };
  onUpdateDocuments: (updates: Partial<PropertyFormFieldsProps['documents']>) => void;
  
  // Real Uploaded Documents List & Handlers (for Edit Mode in dashboards)
  isEditMode?: boolean;
  uploadedDocuments?: any[];
  onUploadDocument?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteDocument?: (docId: string) => void;
  isUploadingDoc?: boolean;

  // Wizard Uploaded Documents List & Handlers
  documentosLegales?: any[];
  onAdjuntarDocumento?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEliminarDocumento?: (index: number) => void;

  // Images Gallery
  images: string[];
  onAddImage?: () => void;
  onRemoveImage?: (index: number) => void;
  onUploadImageSimulate?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filesSimulated?: any[]; // for wizard step 4 upload simulate progress

  // Extra Custom Documents
  extraDocuments?: { id: string; name: string; file: File | null }[];
  onAddExtraDocument?: () => void;
  onUpdateExtraDocumentName?: (id: string, name: string) => void;
  onUploadExtraDocumentFile?: (id: string, file: File) => void;
  onRemoveExtraDocument?: (id: string) => void;
}

export default function PropertyFormFields({
  formData,
  onChange,
  step,
  selectedAttributes,
  onToggleAttribute,
  documents,
  onUpdateDocuments,
  isEditMode = false,
  uploadedDocuments = [],
  onUploadDocument,
  onDeleteDocument,
  isUploadingDoc = false,
  documentosLegales: rawDocumentosLegales = [],
  onAdjuntarDocumento,
  onEliminarDocumento,
  images,
  onAddImage,
  onRemoveImage,
  onUploadImageSimulate,
  filesSimulated = [],
  extraDocuments = [],
  onAddExtraDocument,
  onUpdateExtraDocumentName,
  onUploadExtraDocumentFile,
  onRemoveExtraDocument
}: PropertyFormFieldsProps) {
  // Index array items on the rawDocumentosLegales array directly for O(1) string key lookup
  const documentosLegales = rawDocumentosLegales as any;
  if (documentosLegales && Array.isArray(documentosLegales)) {
    documentosLegales.forEach((file: any) => {
      if (file && file.docKey) {
        documentosLegales[file.docKey] = file;
      }
    });
  }

  const handleUploadDocument = (docKey: string, file: File | undefined) => {
    if (!file) return;

    // Update parent's checklist state (checkmark green)
    onUpdateDocuments({ [docKey]: true });

    // Remove any previous file with the same docKey from array to prevent duplicates
    const oldFileIndex = (rawDocumentosLegales || []).findIndex((f: any) => f && (f.docKey === docKey || f.fileObj?.docKey === docKey));
    if (oldFileIndex !== -1 && onEliminarDocumento) {
      onEliminarDocumento(oldFileIndex);
    }

    if (onAdjuntarDocumento) {
      const wrappedFile = {
        fileObj: file,
        docKey: docKey,
        name: file.name,
        type: file.type,
        size: file.size
      };
      const mockEvent = {
        target: {
          files: [wrappedFile]
        }
      } as any;
      onAdjuntarDocumento(mockEvent);
    }
  };

  // [DECLARACION_ESTADOS_GEOCODING_FIX_FINAL] - Estados locales para el autocompletado de calles
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [buscando, setBuscando] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Tipo de cambio fijo de la plataforma: 1 USD = 9.76 Bs.
  // Se aplica siempre al montar para sobreescribir cualquier valor obsoleto en caché.
  useEffect(() => {
    onChange({ exchangeRate: '9.76' });
  }, []);


  // [LOGICA_AUTOCOMPLETE_Y_PANEO_MAPA] - Efecto para cambio de departamento
  const prevLocationRef = useRef(formData.location);
  useEffect(() => {
    if (formData.location && formData.location !== prevLocationRef.current) {
      const coords = DEPARTAMENTOS_COORDS[formData.location];
      const defaultZones = ZONAS_POR_DEPARTAMENTO[formData.location] || ["Central"];
      const defaultZona = defaultZones[0];
      if (coords) {
        onChange({
          latitude: coords.lat,
          longitude: coords.lng,
          zona: defaultZona,
        });
      }
      prevLocationRef.current = formData.location;
    }
  }, [formData.location, onChange]);

  // [ESTADOS_AUTOCOMPLETE_Y_DEBOUNCE_MIG] - Búsqueda asíncrona Nominatim con debounce de 400ms
  useEffect(() => {
    if (!formData.address || formData.address.trim().length <= 3) {
      setSugerencias([]);
      return;
    }
    setBuscando(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const query = `${formData.address}, ${formData.zona || ''}, ${formData.location || ''}`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bo&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          setSugerencias(Array.isArray(data) ? data : []);
        } else {
          setSugerencias([]);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSugerencias([]);
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.address, formData.zona, formData.location]);

  // [LOGICA_SELECCION_Y_FLYTO_MAPA] - Selección de una sugerencia de dirección
  const handleSeleccionarSugerencia = (item: any) => {
    onChange({
      address: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    });
    setSugerencias([]);
  };

  // [LOGICA_GEOCODING_NOMINATIM_CORS_BLINDAJE] - Búsqueda en pérdida de foco (onBlur) libre de CORS
  const ejecutarGeocodificacionNacional = async () => {
    if (!formData.address || formData.address.trim().length < 4) return;
    
    setIsSearching(true);
    try {
      const query = `${formData.address}, ${formData.zona || ''}, ${formData.location || ''}, Bolivia`;
      
      // Inyección de Headers correctos y User-Agent legítimo para evitar el bloqueo de CORS de Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bo&limit=5&addressdetails=1`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // Identifica tu app para cumplir las políticas de uso de OpenStreetMap
            'User-Agent': 'PropioInmobiliariaBolivia/1.0 (contacto@propio.com.bo)'
          }
        }
      );

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      if (data && data.length > 0) {
        setSugerencias(data);
        // Si se invoca desde pérdida de foco (onBlur), toma el primer resultado directo
        const primerResultado = data[0];
        const nuevaLat = parseFloat(primerResultado.lat);
        const nuevaLng = parseFloat(primerResultado.lon);
        
        if (!isNaN(nuevaLat) && !isNaN(nuevaLng)) {
          onChange({
            address: primerResultado.display_name,
            latitude: nuevaLat,
            longitude: nuevaLng
          });
        }
      } else {
        setSugerencias([]);
      }
    } catch (err) {
      console.error('Error in geocoding Nominatim search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePriceChangeInternal = (val: string, type: 'BOB' | 'USD' | 'RATE' | 'CURRENCY') => {
    const rate = parseFloat(formData.exchangeRate) || 9.76;
    if (type === 'BOB') {
      const bob = val;
      const usd = val ? (parseFloat(val) / rate).toFixed(2) : '';
      onChange({ priceBOB: bob, priceUSD: usd });
    } else if (type === 'USD') {
      const usd = val;
      const bob = val ? (parseFloat(val) * rate).toFixed(2) : '';
      onChange({ priceUSD: usd, priceBOB: bob });
    } else if (type === 'RATE') {
      const newRate = val;
      const rateNum = parseFloat(val) || 9.76;
      let bob = formData.priceBOB;
      if (formData.priceUSD) {
        bob = (parseFloat(formData.priceUSD) * rateNum).toFixed(2);
      }
      onChange({ exchangeRate: newRate, priceBOB: bob });
    } else if (type === 'CURRENCY') {
      const newCurrency = val;
      // Al cambiar la moneda, recalculamos los campos cruzados para sincronizarlos con la moneda seleccionada
      let usd = formData.priceUSD;
      let bob = formData.priceBOB;
      if (newCurrency === 'BOB' && bob) {
        usd = (parseFloat(bob) / rate).toFixed(2);
      } else if (newCurrency === 'USD' && usd) {
        bob = (parseFloat(usd) * rate).toFixed(2);
      }
      onChange({ currency: newCurrency, priceUSD: usd, priceBOB: bob });
    }
  };

  // Section 1: Basic Info, Prices, Attributes
  const renderBasicInfo = () => (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Título Comercial o Nombre del Inmueble *</label>
        <input
          type="text"
          required
          placeholder="Ej. Hermosa Casa con Piscina en Queru Queru"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
        />
      </div>

      {/* Tipo de Oferta y Tipo de Inmueble */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Tipo de Oferta</label>
          <select
            value={formData.offerType}
            onChange={(e) => onChange({ offerType: e.target.value })}
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
            onChange={(e) => onChange({ type: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} {t.emoji}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Precios */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-1.5">Moneda del Anuncio</label>
            <select
              value={formData.currency || 'BOB'}
              onChange={(e) => handlePriceChangeInternal(e.target.value, 'CURRENCY')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white text-sm focus:border-[#000033] cursor-pointer"
            >
              <option value="BOB">Bolivianos (Bs.)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-1.5">Tipo de Cambio (Oficial)</label>
            <input
              type="number"
              step="0.01"
              readOnly
              value={formData.exchangeRate || '9.76'}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-slate-100 text-sm cursor-not-allowed select-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-1.5">Precio (Bs.) *</label>
            <input
              type="number"
              required={formData.currency === 'BOB' || !formData.currency}
              readOnly={formData.currency === 'USD'}
              placeholder={formData.currency === 'USD' ? 'Autocalculado' : 'Ej: 1740000'}
              value={formData.priceBOB}
              onChange={(e) => handlePriceChangeInternal(e.target.value, 'BOB')}
              className={`w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm transition-all ${
                formData.currency === 'USD' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:border-[#000033]'
              }`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-1.5">Precio (USD) *</label>
            <input
              type="number"
              required={formData.currency === 'USD'}
              readOnly={formData.currency === 'BOB' || !formData.currency}
              placeholder={formData.currency === 'BOB' || !formData.currency ? 'Autocalculado' : 'Ej: 250000'}
              value={formData.priceUSD}
              onChange={(e) => handlePriceChangeInternal(e.target.value, 'USD')}
              className={`w-full px-3 py-2 border border-slate-200 rounded-xl outline-none text-sm transition-all ${
                formData.currency === 'BOB' || !formData.currency ? 'bg-slate-100 cursor-not-allowed' : 'bg-white focus:border-[#000033]'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2">
            Precio mínimo sugerido por el propietario (Tope Opcional)
          </label>
          <input
            type="number"
            placeholder="Monto confidencial para negociaciones"
            value={formData.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-white text-slate-900 font-medium text-sm transition-colors"
          />
          <span className="text-[9px] text-slate-450 font-bold mt-1.5 block uppercase tracking-wider">🔒 Visible solo para agentes.</span>
        </div>
      </div>

      {/* Habitaciones y Baños */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Dormitorios</label>
          <input
            type="number"
            required
            value={formData.rooms}
            onChange={(e) => onChange({ rooms: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Baños</label>
          <input
            type="number"
            required
            value={formData.bathrooms}
            onChange={(e) => onChange({ bathrooms: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm text-center"
          />
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Descripción Destacada</label>
        <textarea
          required
          rows={4}
          placeholder="Agrega comodidades, acabados y detalles que cautiven..."
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors resize-none"
        />
      </div>

      {/* Checklists Atributos de Valor y Sostenibilidad */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <h3 className="text-lg font-sans font-bold text-[#000033] uppercase">Atributos de Valor & Sostenibilidad</h3>
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
                      onClick={() => onToggleAttribute(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#000033] font-bold'
                          : 'bg-[#F8FAFC] border-slate-200 hover:border-slate-350 text-slate-650'
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
  );

  // Section 2: Geolocalización, Superficies y Ubicación
  const renderGeolocalisation = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-sans font-bold text-[#000033] uppercase">Ubicación y Geolocalización</h3>
        <p className="text-slate-500 text-xs font-medium mt-1">Ubica con total precisión tu propiedad en el mapa para guiar a los interesados.</p>
      </div>

      {/* Superficies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Superficie de Terreno (m²)</label>
          <input
            type="number"
            placeholder="Ej. 300"
            value={formData.landArea}
            onChange={(e) => onChange({ landArea: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold tracking-wider uppercase text-[#000033] mb-2">Superficie Construida (m²)</label>
          <input
            type="number"
            placeholder="Ej. 180"
            value={formData.builtArea}
            onChange={(e) => onChange({ builtArea: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm"
          />
        </div>
      </div>

      {/* Ubicación y Zona */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Ciudad / Departamento</label>
          <select
            value={formData.location}
            onChange={(e) => {
              onChange({ location: e.target.value });
            }}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
          >
            {DEPARTAMENTOS.map((dep) => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Zona / Barrio</label>
          {/* [JSX_CAMBIO_INPUT_A_SELECT_ZONA] */}
          <select
            value={formData.zona}
            onChange={(e) => onChange({ zona: e.target.value })}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
          >
            {(ZONAS_POR_DEPARTAMENTO[formData.location] || ["Central"]).map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dirección */}
      <div className="relative w-full">
        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Dirección Completa</label>
        <div className="relative w-full">
          <input
            type="text"
            required
            placeholder="Ej. Calle Aniceto Padilla #456"
            value={formData.address}
            onChange={(e) => onChange({ address: e.target.value })}
            onBlur={ejecutarGeocodificacionNacional}
            className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:border-[#000033] bg-[#F8FAFC] text-slate-900 font-medium text-sm transition-colors"
          />
          {(buscando || isSearching) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-[#000033]" />
            </div>
          )}
        </div>

        {/* [JSX_INPUT_DIRECCION_CON_DROPDOWN_FLOTANTE] */}
        {sugerencias.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            {sugerencias.map((item, idx) => (
              <li
                key={idx}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => {
                  handleSeleccionarSugerencia(item);
                }}
                className="flex items-center gap-2.5 cursor-pointer px-4 py-3 text-sm text-slate-800 hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-none"
              >
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{item.display_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mapa Táctil */}
      <div>
        <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033] mb-2">Marcador en Mapa Táctil</label>
        <LeafletMap
          lat={formData.latitude}
          lng={formData.longitude}
          onChange={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
        />
      </div>

      {/* GPS Info */}
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
  );

  // Section 3: Checklist Legal & Documents
  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-sans font-bold text-[#000033] uppercase">Carpeta y Validación Documental</h3>
        <p className="text-slate-500 text-xs font-medium mt-1">Adjunta la documentación legal e información técnica respaldatoria.</p>
      </div>

      {/* If edit mode is active, expose direct database upload capability */}
      {isEditMode && onUploadDocument && onDeleteDocument ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-bold tracking-wider uppercase text-[#000033]">Documentación subida al sistema</label>
            <label className={`cursor-pointer text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] bg-slate-100 hover:bg-slate-200 border px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
              {isUploadingDoc ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-300 border-t-slate-600" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <span>📎 Adjuntar Documento</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png"
                    onChange={onUploadDocument}
                    className="hidden"
                  />
                </>
              )}
            </label>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-2">
            {uploadedDocuments.map((doc: any) => {
              const isImage = doc.fileType?.startsWith('image/');
              return (
                <div key={doc.id} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-lg shadow-sm">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 hover:text-[#000033] transition-colors truncate max-w-[85%]"
                  >
                    <span className="text-base shrink-0">{isImage ? '🖼️' : '📄'}</span>
                    <span className="truncate" title={doc.fileName}>{doc.fileName}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeleteDocument(doc.id)}
                    className="text-red-500 hover:text-red-700 text-[11px] font-bold p-1 rounded transition-colors"
                    title="Eliminar documento"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
            {uploadedDocuments.length === 0 && (
              <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">Sin documentos adjuntos. Sube planos, CI o Folio Real.</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Checklist legal */}
      <div className="space-y-3.5">
        <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Requisitos Legales Checklist</h4>
        
        {/* Folio Real */}
        <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasFolioReal: !documents.hasFolioReal })}>
            <div className="pt-0.5">
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                documents.hasFolioReal ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
              }`}>
                {documents.hasFolioReal && '✓'}
              </div>
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Folio Real Actualizado (Libre Alodial)</h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Certifica que el inmueble está libre de hipotecas, anotaciones o deudas.</p>
            </div>
          </div>
          {/* Bloque derecho del botón de carga */}
          <div className="flex items-center gap-3 ml-4 shrink-0">
            <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
              documentosLegales['hasFolioReal']
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
            }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {documentosLegales['hasFolioReal'] ? "Reemplazar" : "Adjuntar"}
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                className="hidden" 
                onChange={(e) => handleUploadDocument('hasFolioReal', e.target.files?.[0])}
              />
            </label>
          </div>
        </div>

        {formData.offerType === 'ALQUILER' ? (
          /* Cédula CI para Alquiler */
          <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasCI: !documents.hasCI })}>
              <div className="pt-0.5">
                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                  documents.hasCI ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                }`}>
                  {documents.hasCI && '✓'}
                </div>
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Cédula de Identidad Vigente (CI)</h4>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Copia de CI legible del propietario legal para contratación.</p>
              </div>
            </div>
            {/* Bloque derecho del botón de carga */}
            <div className="flex items-center gap-3 ml-4 shrink-0">
              <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                documentosLegales['hasCI']
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {documentosLegales['hasCI'] ? "Reemplazar" : "Adjuntar"}
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  className="hidden" 
                  onChange={(e) => handleUploadDocument('hasCI', e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        ) : (
          /* Venta / Anticrético / Proyecto */
          <div className="space-y-3.5">
            {/* Certificado Catastral */}
            <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasCatastro: !documents.hasCatastro })}>
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    documents.hasCatastro ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                  }`}>
                    {documents.hasCatastro && '✓'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Certificado Catastral Al Día</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Registro y plano catastral aprobado por el municipio correspondiente.</p>
                </div>
              </div>
              {/* Bloque derecho del botón de carga */}
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  documentosLegales['hasCatastro']
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {documentosLegales['hasCatastro'] ? "Reemplazar" : "Adjuntar"}
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={(e) => handleUploadDocument('hasCatastro', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Testimonio de Escritura */}
            <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasTestimonio: !documents.hasTestimonio })}>
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    documents.hasTestimonio ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                  }`}>
                    {documents.hasTestimonio && '✓'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Testimonio de Escritura Pública</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Escritura de compraventa notariada que acredita la propiedad.</p>
                </div>
              </div>
              {/* Bloque derecho del botón de carga */}
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  documentosLegales['hasTestimonio']
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {documentosLegales['hasTestimonio'] ? "Reemplazar" : "Adjuntar"}
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={(e) => handleUploadDocument('hasTestimonio', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Impuestos Municipales */}
            <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasImpuestosAlDia: !documents.hasImpuestosAlDia })}>
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    documents.hasImpuestosAlDia ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                  }`}>
                    {documents.hasImpuestosAlDia && '✓'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Impuestos Municipales Al Día</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Comprobante de pago del último impuesto a la propiedad municipal.</p>
                </div>
              </div>
              {/* Bloque derecho del botón de carga */}
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  documentosLegales['hasImpuestosAlDia']
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {documentosLegales['hasImpuestosAlDia'] ? "Reemplazar" : "Adjuntar"}
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={(e) => handleUploadDocument('hasImpuestosAlDia', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Plano de Uso de Suelo */}
            <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasPlanoUsoSuelo: !documents.hasPlanoUsoSuelo })}>
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    documents.hasPlanoUsoSuelo ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                  }`}>
                    {documents.hasPlanoUsoSuelo && '✓'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Plano de Uso de Suelo Aprobado</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Plano municipal de zonificación, dimensiones y uso permitido.</p>
                </div>
              </div>
              {/* Bloque derecho del botón de carga */}
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  documentosLegales['hasPlanoUsoSuelo']
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {documentosLegales['hasPlanoUsoSuelo'] ? "Reemplazar" : "Adjuntar"}
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={(e) => handleUploadDocument('hasPlanoUsoSuelo', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Cédula de Identidad */}
            <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasCI: !documents.hasCI })}>
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    documents.hasCI ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                  }`}>
                    {documents.hasCI && '✓'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Cédula de Identidad Vigente (CI)</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Copia de CI legible del propietario legal para contratación y verificación de identidad.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  documentosLegales['hasCI']
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {documentosLegales['hasCI'] ? "Reemplazar" : "Adjuntar"}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleUploadDocument('hasCI', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            {/* Otros Documentos */}
            <div className="flex items-center justify-between w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex gap-4 items-start cursor-pointer flex-1" onClick={() => onUpdateDocuments({ hasOtrosDocumentos: !documents.hasOtrosDocumentos })}>
                <div className="pt-0.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    documents.hasOtrosDocumentos ? 'bg-emerald-500 border-emerald-500 text-white text-[10px] font-bold' : 'bg-white border-slate-300'
                  }`}>
                    {documents.hasOtrosDocumentos && '✓'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-[#000033]">Otros Documentos (Ej. Planos)</h4>
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Planos arquitectónicos, estructurales o documentación técnica adicional del inmueble.</p>
                </div>
              </div>
              {/* Bloque derecho del botón de carga */}
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  documentosLegales['hasOtrosDocumentos']
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {documentosLegales['hasOtrosDocumentos'] ? "Reemplazar" : "Adjuntar"}
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    onChange={(e) => handleUploadDocument('hasOtrosDocumentos', e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Documentos Adicionales */}
      <div className="mt-6 pt-6 border-t border-slate-150 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Documentos Adicionales</h4>
          <button
            type="button"
            onClick={onAddExtraDocument}
            className="text-[10px] font-black text-[#000033] hover:bg-opacity-90 bg-[#ccff00] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-wider"
          >
            + Añadir más documentos
          </button>
        </div>

        <div className="space-y-3">
          {extraDocuments.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 w-full p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex-1">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdateExtraDocumentName?.(item.id, e.target.value)}
                  placeholder="Escribe el nombre del documento (ej. Poder Notarial)"
                  className="w-full bg-slate-50 border border-slate-250 px-3 py-2 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:border-[#000033]"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  item.file
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-gray-200 hover:border-emerald-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-600'
                }`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {item.file ? "Reemplazar" : "Adjuntar"}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onUploadExtraDocumentFile?.(item.id, file);
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onRemoveExtraDocument?.(item.id)}
                  className="text-red-500 hover:text-red-700 p-2 border border-red-150 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                  title="Eliminar Documento"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Section 4: Fotos y Archivos Simulados
  const renderPhotos = () => (
    <div className="space-y-6">
      {/* Documentación del Anuncio */}
      <div className="border-b border-slate-150 pb-6">
        <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3">Documentación del Anuncio</h3>
        {onAdjuntarDocumento ? (
          <div className="relative border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-300 rounded-xl p-4 text-center cursor-pointer transition-all group">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const filesArray = Array.from(e.target.files);
                  const guessDocKey = (fileName: string): string => {
                    const name = fileName.toLowerCase();
                    if (name.includes('folio') || name.includes('real') || name.includes('alodial')) return 'hasFolioReal';
                    if (name.includes('catastro') || name.includes('catastral')) return 'hasCatastro';
                    if (name.includes('testimonio') || name.includes('escritura')) return 'hasTestimonio';
                    if (name.includes('impuesto') || name.includes('tasa') || name.includes('muni')) return 'hasImpuestosAlDia';
                    if (name.includes('plano') || name.includes('suelo') || name.includes('uso')) return 'hasPlanoUsoSuelo';
                    if (name.includes('ci') || name.includes('cedula') || name.includes('identi') || name.includes('dnt')) return 'hasCI';
                    return '';
                  };
                  const wrappedFiles = filesArray.map(file => {
                    const gKey = guessDocKey(file.name);
                    if (gKey) {
                      onUpdateDocuments({ [gKey]: true });
                    }
                    return {
                      fileObj: file,
                      docKey: gKey || 'hasOtrosDocumentos',
                      name: file.name,
                      type: file.type,
                      size: file.size
                    };
                  });
                  if (onAdjuntarDocumento) {
                    const mockEvent = {
                      target: {
                        files: wrappedFiles
                      }
                    } as any;
                    onAdjuntarDocumento(mockEvent);
                  }
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-950 transition-colors uppercase tracking-wider">
              + ADJUNTAR DOCUMENTACIÓN LEGAL (PDF O IMAGEN)
            </span>
          </div>
        ) : null}

        {/* Listado dinámico */}
        {documentosLegales && documentosLegales.length > 0 && (
          <div className="space-y-2 mt-3">
            {documentosLegales.map((doc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs font-medium text-slate-700 transition-all hover:bg-slate-100/50">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg shrink-0">📄</span>
                  <span className="truncate font-semibold text-slate-700">{doc.name || doc.nombre}</span>
                  {doc.size && <span className="text-[10px] text-slate-400 font-semibold">({doc.size})</span>}
                </div>
                {onEliminarDocumento && (
                  <button
                    type="button"
                    onClick={() => onEliminarDocumento(idx)}
                    className="w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all text-xs font-bold"
                    title="Eliminar documento"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-sans font-bold text-[#000033] uppercase">Subir fotografías</h3>
        <p className="text-slate-500 text-xs font-medium mt-1">Carga las fotografías más destacadas del anuncio (Formatos de imagen nativos, peso máx: 150 MB).</p>
      </div>

      {onUploadImageSimulate ? (
        <div className="relative border-2 border-dashed border-slate-200 hover:border-[#000033] bg-slate-50 hover:bg-slate-100 rounded-xl p-8 text-center transition-all duration-300 cursor-pointer group">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={onUploadImageSimulate}
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
          />
          <div className="space-y-2.5">
            <span className="text-3xl block group-hover:scale-110 transition-transform">📸</span>
            <h4 className="text-xs font-bold text-[#000033] uppercase tracking-wider">Subir fotografías</h4>
            <p className="text-[10px] text-slate-400 font-semibold">Arrastra o presiona para seleccionar imágenes. (JPG, PNG, WEBP)</p>
          </div>
        </div>
      ) : (
        /* Edit Mode: Add image directly */
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#000033]">Fotos cargadas</label>
          {onAddImage && (
            <button
              type="button"
              onClick={onAddImage}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#000033] bg-slate-100 hover:bg-slate-200 border px-3 py-1.5 rounded-xl transition-all"
            >
              + Agregar Foto Demo
            </button>
          )}
        </div>
      )}

      {/* Progress of simulated files uploads */}
      {filesSimulated.length > 0 && (
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-sans">
          <h4 className="text-[10px] uppercase font-bold text-slate-450 tracking-widest">Archivos en proceso de carga</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {filesSimulated.map((file, idx) => (
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

      {/* Images Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border">
        {images.map((img, idx) => (
          <div key={idx} className="relative h-20 bg-slate-200 rounded-lg overflow-hidden group">
            <img src={img} alt={`Anuncio ${idx + 1}`} className="w-full h-full object-cover" />
            {onRemoveImage && (
              <button
                type="button"
                onClick={() => onRemoveImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-700 opacity-80 group-hover:opacity-100 transition-opacity"
                title="Eliminar foto"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-[10px] text-slate-400 font-bold uppercase text-center py-4">Sin fotos. Sube al menos una foto.</p>
        )}
      </div>
    </div>
  );

  // If a specific step is passed (for page wizard), render only that step. Otherwise, render everything.
  if (step !== undefined) {
    switch (step) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderGeolocalisation();
      case 3:
        return renderDocuments();
      case 4:
        return renderPhotos();
      default:
        return null;
    }
  }

  // Edit Modals: Render everything in a single stacked scroll list
  return (
    <div className="space-y-8">
      {renderBasicInfo()}
      <div className="border-t border-slate-200 pt-6">
        {renderGeolocalisation()}
      </div>
      <div className="border-t border-slate-200 pt-6">
        {renderDocuments()}
      </div>
      <div className="border-t border-slate-200 pt-6">
        {renderPhotos()}
      </div>
    </div>
  );
}
