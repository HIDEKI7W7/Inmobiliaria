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

// Coordenadas límite (Bounding Boxes) estrictas para los departamentos de Bolivia
export const BOUNDS_BOLIVIA: Record<string, { minLon: number; minLat: number; maxLon: number; maxLat: number }> = {
  "La Paz": { minLon: -68.22, minLat: -16.57, maxLon: -68.05, maxLat: -16.43 },
  "Santa Cruz": { minLon: -63.28, minLat: -17.88, maxLon: -63.12, maxLat: -17.72 },
  "Cochabamba": { minLon: -66.25, minLat: -17.45, maxLon: -66.08, maxLat: -17.33 },
  "Oruro": { minLon: -67.22, minLat: -18.05, maxLon: -67.08, maxLat: -17.90 },
  "Potosí": { minLon: -65.82, minLat: -19.65, maxLon: -65.68, maxLat: -19.50 },
  "Tarija": { minLon: -64.80, minLat: -21.60, maxLon: -64.65, maxLat: -21.45 },
  "Chuquisaca": { minLon: -65.33, minLat: -19.10, maxLon: -65.18, maxLat: -18.95 },
  "Beni": { minLon: -65.00, minLat: -14.95, maxLon: -64.80, maxLat: -14.75 },
  "Pando": { minLon: -68.85, minLat: -11.10, maxLon: -68.68, maxLat: -10.92 }
};

// Genera un bounding box de +/- 0.15 grados alrededor del centro del departamento/ciudad para restringir búsquedas
export const getBoundingBoxQueryParam = (locationName: string): string => {
  const normalizedKey = Object.keys(BOUNDS_BOLIVIA).find(
    (key) => key.toLowerCase() === locationName.toLowerCase()
  );
  const bounds = normalizedKey ? BOUNDS_BOLIVIA[normalizedKey] : null;
  if (!bounds) {
    const coords = DEPARTAMENTOS_COORDS[locationName];
    if (!coords) return '';
    const offset = 0.15; // Aproximadamente 15-20 km
    const minLon = coords.lng - offset;
    const maxLon = coords.lng + offset;
    const minLat = coords.lat - offset;
    const maxLat = coords.lat + offset;
    // Nominatim viewbox format: left,top,right,bottom (min_lon, max_lat, max_lon, min_lat)
    return `&viewbox=${minLon.toFixed(4)},${maxLat.toFixed(4)},${maxLon.toFixed(4)},${minLat.toFixed(4)}&bounded=1`;
  }
  // Nominatim viewbox format: left,top,right,bottom (min_lon, max_lat, max_lon, min_lat)
  return `&viewbox=${bounds.minLon.toFixed(4)},${bounds.maxLat.toFixed(4)},${bounds.maxLon.toFixed(4)},${bounds.minLat.toFixed(4)}&bounded=1`;
};

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

   const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [buscando, setBuscando] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar el tipo de cambio oficial del BCB de manera dinámica
  useEffect(() => {
    const fetchOfficialRate = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(`${apiBaseUrl}/exchange-rate/official`, {
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object' && data.officialRate) {
            onChange({ exchangeRate: String(data.officialRate) });
            return;
          }
        }
        throw new Error('Respuesta inválida del servidor');
      } catch (err) {
        console.warn('Error al obtener tipo de cambio oficial del BCB. Cargando fallback seguro: 9.83');
        onChange({ exchangeRate: '9.83' });
      }
    };
    fetchOfficialRate();
  }, []);


  // [LOGICA_AUTOCOMPLETE_Y_PANEO_MAPA] - Efecto para cambio de departamento
  const prevLocationRef = useRef(formData.location);
  useEffect(() => {
    if (formData.location && formData.location !== prevLocationRef.current) {
      const normalizedLoc = Object.keys(DEPARTAMENTOS_COORDS).find(
        (key) => key.toLowerCase() === (formData.location || '').toLowerCase()
      ) || formData.location;

      const coords = DEPARTAMENTOS_COORDS[normalizedLoc];
      const defaultZones = ZONAS_POR_DEPARTAMENTO[normalizedLoc] || ["Central"];
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

  // [ESTADOS_AUTOCOMPLETE_Y_DEBOUNCE_MIG] - Búsqueda asíncrona Photon (Komoot) con debounce de 300ms
  useEffect(() => {
    if (!formData.address || formData.address.trim().length <= 3) {
      setSugerencias([]);
      return;
    }

    // Normalizar la ubicación por si viene en mayúsculas (ej. SANTA CRUZ)
    const normalizedLoc = Object.keys(DEPARTAMENTOS_COORDS).find(
      (key) => key.toLowerCase() === (formData.location || '').toLowerCase()
    ) || formData.location;

    // Separación de calle y número mediante Regex (ej: "colon 463" -> calle: "colon", número: "463")
    const numberMatch = formData.address.match(/(.*?)(?:\s+(?:No|N°|#)?\s*\d+[\w-]*\s*)$/i);
    const calle = numberMatch && numberMatch[1] ? numberMatch[1].trim() : formData.address.trim();

    if (calle.length < 3) {
      setSugerencias([]);
      return;
    }

    setBuscando(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
        const query = `${calle}, ${formData.zona || ''}`;
        const coords = DEPARTAMENTOS_COORDS[normalizedLoc] || { lat: -16.50, lng: -68.15 };
        const url = `${apiBase}/maps/autocomplete?query=${encodeURIComponent(query)}&lat=${coords.lat}&lng=${coords.lng}`;
        
        const res = await fetch(url);
        let data = [];
        if (res.ok) {
          const payload = await res.json();
          if (payload && payload.success && Array.isArray(payload.results)) {
            data = payload.results;
          }
        }

        setSugerencias(data);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSugerencias([]);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.address, formData.zona, formData.location]);

  // Helper para extraer la dirección corta (Calle) libre de redundancia geográfica
  const getShortAddress = (item: any): string => {
    return item.street || '';
  };

  // Helper para extraer el resto del display_name para datos secundarios (ciudad, provincia, país)
  const getSecondaryAddress = (item: any): string => {
    if (item.formattedAddress && item.street) {
      let rest = item.formattedAddress;
      if (rest.startsWith(item.street)) {
        rest = rest.substring(item.street.length);
      }
      return rest.replace(/^[\s,]+/, '').trim();
    }
    return item.city || '';
  };

  // [LOGICA_SELECCION_Y_FLYTO_MAPA] - Selección de una sugerencia de dirección
  const handleSeleccionarSugerencia = (item: any) => {
    const numberMatch = formData.address.match(/(?:\s+(?:No|N°|#)?\s*(\d+[\w-]*)\s*)$/i);
    const typedNumber = numberMatch && numberMatch[1] ? numberMatch[1] : '';

    const shortAddr = getShortAddress(item);
    
    // Si el usuario ingresó un número y el shortAddr de la API no lo tiene, se lo concatenamos
    let finalAddress = shortAddr;
    if (typedNumber && !shortAddr.includes(typedNumber)) {
      finalAddress = `${shortAddr} #${typedNumber}`;
    }

    onChange({
      address: finalAddress,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lng ?? item.lon),
    });
    setSugerencias([]);

    // Enfocar el input y posicionar el cursor al final para que el usuario digite el número de puerta
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = finalAddress.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  // [LOGICA_GEOCODING_NOMINATIM_CORS_BLINDAJE] - Búsqueda en pérdida de foco (onBlur) libre de CORS (Photon)
  const ejecutarGeocodificacionNacional = async () => {
    if (!formData.address || formData.address.trim().length < 4) return;
    
    setIsSearching(true);
    try {
      const normalizedLoc = Object.keys(DEPARTAMENTOS_COORDS).find(
        (key) => key.toLowerCase() === (formData.location || '').toLowerCase()
      ) || formData.location;

      // Separación de calle y número mediante Regex (ej: "colon 463" -> calle: "colon", número: "463")
      const numberMatch = formData.address.match(/(.*?)(?:\s+(?:No|N°|#)?\s*\d+[\w-]*\s*)$/i);
      const calle = numberMatch && numberMatch[1] ? numberMatch[1].trim() : formData.address.trim();

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
      const query = `${calle}, ${formData.zona || ''}`;
      const coords = DEPARTAMENTOS_COORDS[normalizedLoc] || { lat: -16.50, lng: -68.15 };
      const url = `${apiBase}/maps/autocomplete?query=${encodeURIComponent(query)}&lat=${coords.lat}&lng=${coords.lng}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Response was not ok');
      
      const payload = await response.json();
      if (payload && payload.success && Array.isArray(payload.results) && payload.results.length > 0) {
        const data = payload.results;
        setSugerencias(data);
        // Si se invoca desde pérdida de foco (onBlur), toma el primer resultado directo
        const primerResultado = data[0];
        const nuevaLat = parseFloat(primerResultado.lat);
        const nuevaLng = parseFloat(primerResultado.lng ?? primerResultado.lon);
        
        if (!isNaN(nuevaLat) && !isNaN(nuevaLng)) {
          onChange({
            // Mantener la dirección tal como la escribió el usuario (con su número de puerta customizado)
            address: formData.address || getShortAddress(primerResultado),
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
            {(() => {
              const normalizedLoc = Object.keys(ZONAS_POR_DEPARTAMENTO).find(
                (key) => key.toLowerCase() === (formData.location || '').toLowerCase()
              ) || formData.location;
              return (ZONAS_POR_DEPARTAMENTO[normalizedLoc] || ["Central"]).map((z) => (
                <option key={z} value={z}>{z}</option>
              ));
            })()}
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
            ref={inputRef}
            disabled={!formData.location || !formData.zona}
            placeholder={
              formData.location && formData.zona
                ? "Ej. Calle Aniceto Padilla #456"
                : "Primero selecciona ciudad y zona..."
            }
            value={formData.address}
            onChange={(e) => onChange({ address: e.target.value })}
            onBlur={ejecutarGeocodificacionNacional}
            className={`w-full px-4 py-3.5 border rounded-xl outline-none focus:border-[#000033] text-sm transition-colors ${
              formData.location && formData.zona
                ? 'border-slate-200 bg-[#F8FAFC] text-slate-900'
                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed select-none'
            }`}
          />
          {(buscando || isSearching) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-200 border-t-[#000033]" />
            </div>
          )}
        </div>

        {/* [JSX_INPUT_DIRECCION_CON_DROPDOWN_FLOTANTE] - Estilo Google Maps Premium */}
        {sugerencias.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-60 overflow-y-auto rounded-[16px] border border-slate-100 bg-white shadow-2xl py-1.5 animate-fadeIn">
            {sugerencias.map((item, idx) => {
              const short = getShortAddress(item);
              const numberMatch = formData.address.match(/(?:\s+(?:No|N°|#)?\s*(\d+[\w-]*)\s*)$/i);
              const typedNumber = numberMatch && numberMatch[1] ? numberMatch[1] : '';
              
              // Agregar el número que el usuario ingresó para que figure destacado en negrita (ej: "Socabaya 7")
              const mainText = typedNumber && !short.includes(typedNumber) ? `${short} ${typedNumber}` : short;
              const secondaryText = getSecondaryAddress(item);
              return (
                <li
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => {
                    handleSeleccionarSugerencia(item);
                  }}
                  className="flex items-center gap-3.5 cursor-pointer px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 shrink-0 text-slate-400">
                    <svg className="w-4.5 h-4.5 text-slate-450" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-baseline min-w-0 gap-2 flex-wrap md:flex-nowrap leading-tight">
                    <span className="font-bold text-slate-800 text-sm truncate">{mainText}</span>
                    {secondaryText && (
                      <span className="text-slate-400 text-xs truncate font-normal">{secondaryText}</span>
                    )}
                  </div>
                </li>
              );
            })}
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
          onAddressChange={(addr) => {
            if (addr) onChange({ address: addr });
          }}
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
