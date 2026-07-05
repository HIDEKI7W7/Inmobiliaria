'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { apiClient } from '@/services/api.client';
import { propertiesService } from '../../../services/properties.service';
import PropertyFormFields from '../../../components/modules/properties/PropertyFormFields';
import { normalizeProperty } from '@/context/FavoritesContext';
import { ALL_REAL_PROPERTIES } from '@/data/propertiesData';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  minPrice: number;
  currency?: string;
  priceBob?: number;
  location: string;
  rooms?: number;
  bathrooms?: number;
  area: number;
  verified: boolean;
  type: string;
  imageUrl?: string;
  image?: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  offerType?: string;
  address?: string;
  hasFolioReal?: boolean;
  hasCatastro?: boolean;
  hasTestimonio?: boolean;
  hasImpuestosAlDia?: boolean;
  hasPlanoUsoSuelo?: boolean;
  hasCI?: boolean;
  documents?: any[];
  documentsList?: any[];
  agentId?: string;
  status?: string;
}

export default function AgentProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      // Clean up mock property flags from localStorage
      localStorage.removeItem('propio_agent_properties_mock');

      let masterList: any[] = [];
      let currentUserId = '';
      try {
        const user = JSON.parse(localStorage.getItem('propio_user') || '{}');
        currentUserId = user.id || '';
      } catch (e) {
        console.warn("Failed to parse user from localStorage:", e);
      }

      // 1. Load backend properties
      try {
        const res = await apiClient.get<any>(`/properties`);
        if (res && res.data && Array.isArray(res.data)) {
          masterList = res.data.map(normalizeProperty);
        }
      } catch (e) {
        console.warn("Backend properties fetch failed:", e);
      }

      // If backend is empty, load ALL_REAL_PROPERTIES as base
      if (masterList.length === 0) {
        masterList = [...ALL_REAL_PROPERTIES].map(normalizeProperty);
      }

      // 2. Load custom created properties from localStorage
      const customCreatedStored = localStorage.getItem('propio_custom_created_properties');
      if (customCreatedStored) {
        try {
          const parsed = JSON.parse(customCreatedStored);
          if (Array.isArray(parsed)) {
            masterList = [...masterList, ...parsed.map(normalizeProperty)];
          }
        } catch {}
      }

      const customPropsStored = localStorage.getItem('propio_custom_properties');
      if (customPropsStored) {
        try {
          const parsed = JSON.parse(customPropsStored);
          if (Array.isArray(parsed)) {
            masterList = [...masterList, ...parsed.map(normalizeProperty)];
          }
        } catch {}
      }

      // 3. Filter by deleted properties and filter out empty mock properties
      const deletedStored = localStorage.getItem('propio_admin_deleted_properties');
      const deletedIds: string[] = deletedStored ? JSON.parse(deletedStored) : [];
      let activeProps = masterList.filter(p => 
        p && p.id && p.title && p.location &&
        !deletedIds.includes(p.id) && 
        p.title !== 'Propiedad de Catálogo' && 
        p.title !== 'PROPIEDAD DE CATÁLOGO' &&
        (Number(p.price || 0) > 0 || Number(p.priceBob || 0) > 0 || Number(p.minPrice || 0) > 0)
      );

      // 4. Show the whole available buy catalog to the sales force
      const agentProps = activeProps;

      setProperties(agentProps);
      setAllProperties(agentProps);
      setIsLoading(false);
    };

    loadProperties();
  }, []);

  // Collaboration request modal state
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [selectedPropForCollab, setSelectedPropForCollab] = useState<Property | null>(null);
  const [collabMessage, setCollabMessage] = useState('');
  const [isSendingCollab, setIsSendingCollab] = useState(false);

  // Edit property modal state
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
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

  // Packaged form data for PropertyFormFields
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
    latitude: editingProperty?.latitude || editingProperty?.lat || -17.3895,
    longitude: editingProperty?.longitude || editingProperty?.lng || -66.1568,
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
      setEditingProperty({ ...editingProperty, ...updates } as any);
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
      setEditingProperty({ ...editingProperty, ...updates });
    }
  };

  const toggleAttribute = (attr: string) => {
    setEditAttributes(prev => ({ ...prev, [attr]: !prev[attr] }));
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

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProperty || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
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
      const token = localStorage.getItem('propio_token') || '';
      const doc = await propertiesService.uploadPropertyDocument(editingProperty.id, file, token);
      setEditDocuments(prev => [...prev, doc]);
      setProperties(prev =>
        prev.map(p =>
          p.id === editingProperty.id
            ? { ...p, documents: [...(p.documents || []), doc] }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      alert(`Error al subir el archivo: ${err.message || 'Error de red'}`);
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!editingProperty) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      const token = localStorage.getItem('propio_token') || '';
      await propertiesService.deletePropertyDocument(docId, token);
      setEditDocuments(prev => prev.filter(d => d.id !== docId));
      setProperties(prev =>
        prev.map(p =>
          p.id === editingProperty.id
            ? { ...p, documents: (p.documents || []).filter((d: any) => d.id !== docId) }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      alert('Ocurrió un error al eliminar el documento.');
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

  const handleStartEdit = (prop: Property) => {
    const parsed = parseDescription(prop.description || '');
    const attrsMap: Record<string, boolean> = {};
    parsed.attrsList.forEach(a => { attrsMap[a] = true; });

    setEditingProperty(prop);
    setEditTitle(prop.title || '');
    setEditDescription(parsed.cleanDesc || '');
    setEditCurrency(prop.currency || 'BOB');
    setEditPriceBOB(String(prop.priceBob || (prop.price * 9.76)));
    setEditPriceUSD(String(prop.price || 0));
    setEditExchangeRate('9.76');
    setEditLandArea(parsed.landArea);
    setEditBuiltArea(parsed.builtArea);
    setEditZona(parsed.zona);
    setEditAttributes(attrsMap);
    setEditImages(prop.imageUrl ? [prop.imageUrl] : (prop.image ? [prop.image] : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80']));
    setEditDocuments(prop.documents || []);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    setIsSavingEdit(true);

    try {
      const activeAttrs = Object.keys(editAttributes).filter(k => editAttributes[k]);
      const attrsText = activeAttrs.length > 0 ? `\n\nAtributos: ${activeAttrs.join(', ')}` : '';
      const areaText = `\nSuperficie Terreno: ${editLandArea || 0} m²\nSuperficie Construida: ${editBuiltArea || 0} m²`;
      const zonaText = editZona ? `\nZona: ${editZona}` : '';

      const updatedFields = {
        title: editTitle,
        description: editDescription + attrsText + areaText + zonaText,
        price: parseFloat(editPriceUSD) || 0,
        currency: editCurrency,
        area: parseFloat(editBuiltArea) || parseFloat(editLandArea) || editingProperty.area || 0,
        imageUrl: editImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        rooms: editingProperty.rooms ? parseInt(String(editingProperty.rooms)) : 3,
        bathrooms: editingProperty.bathrooms ? parseInt(String(editingProperty.bathrooms)) : 2,
        location: (editingProperty as any).location,
        address: (editingProperty as any).address || '',
        offerType: editingProperty.offerType || 'VENTA',
        type: editingProperty.type,
        latitude: editingProperty.latitude || editingProperty.lat || -17.3895,
        longitude: editingProperty.longitude || editingProperty.lng || -66.1568,
        hasFolioReal: !!editingProperty.hasFolioReal,
        hasCatastro: !!editingProperty.hasCatastro,
        hasTestimonio: !!editingProperty.hasTestimonio,
        hasImpuestosAlDia: !!editingProperty.hasImpuestosAlDia,
        hasPlanoUsoSuelo: !!editingProperty.hasPlanoUsoSuelo,
        hasCI: !!editingProperty.hasCI,
        minPrice: editingProperty.minPrice ? parseFloat(String(editingProperty.minPrice)) : null,
        documentsList: editingProperty.documentsList || [],
        documents: editingProperty.documents || []
      };

      const token = localStorage.getItem('propio_token') || '';
      if (token) {
        await propertiesService.updateProperty(editingProperty.id, updatedFields, token);
      }

      setProperties(prev =>
        prev.map(p => p.id === editingProperty.id ? { ...p, ...(updatedFields as any) } : p)
      );
      setEditingProperty(null);
      alert('Cambios guardados con éxito. 🚀');
    } catch (err) {
      console.error(err);
      // Optimistic local update even if API fails
      setProperties(prev =>
        prev.map(p => p.id === editingProperty.id ? { ...p, title: editTitle } : p)
      );
      setEditingProperty(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Active property details drawer state
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [L, setL] = useState<any>(null);

  // Load Leaflet dynamically on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, []);

  // Collaboration request toast/alert state
  const [collabToast, setCollabToast] = useState<{ show: boolean; title: string } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (collabToast && collabToast.show) {
      const timer = setTimeout(() => setCollabToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [collabToast]);

  // Listen to collaboration request custom event from Map Popup
  useEffect(() => {
    const handleCollaborationRequest = (e: any) => {
      const propId = e.detail;
      const prop = properties.find(p => p.id === propId);
      if (prop) {
        let currentUserId = '';
        try {
          const user = JSON.parse(localStorage.getItem('propio_user') || '{}');
          currentUserId = user.id || '';
        } catch {}

        if (prop.agentId === currentUserId) {
          setCollabToast({ show: true, title: 'No puedes solicitar colaboración en tus propias propiedades.' });
          return;
        }

        setSelectedPropForCollab(prop);
        setCollabMessage('');
        setShowCollabModal(true);
      }
    };
    window.addEventListener('request-collaboration', handleCollaborationRequest);
    return () => window.removeEventListener('request-collaboration', handleCollaborationRequest);
  }, [properties]);

  const handleConfirmCollaboration = async () => {
    if (!selectedPropForCollab) return;
    setIsSendingCollab(true);
    try {
      const token = localStorage.getItem('propio_token');
      if (!token) {
        setCollabToast({ show: true, title: 'Error: No estás autenticado.' });
        setShowCollabModal(false);
        return;
      }
      await apiClient.postWithAuth(`/collaboration-requests/create/${selectedPropForCollab.id}`, {}, token);
      setCollabToast({
        show: true,
        title: `¡Solicitud de colaboración enviada con éxito para la propiedad: "${selectedPropForCollab.title}"! Se notificará al agente asociado.`,
      });
      setShowCollabModal(false);
    } catch (err: any) {
      console.error(err);
      setCollabToast({ show: true, title: err.message || 'Error al enviar la solicitud de colaboración.' });
      setShowCollabModal(false);
    } finally {
      setIsSendingCollab(false);
    }
  };

  // Map initialization inside modal
  useEffect(() => {
    if (!showMap || !L || !mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const map = L.map(mapContainerRef.current, {
      center: [-17.368, -66.155],
      zoom: 14,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);

    markersRef.current = [];
    allProperties.forEach((prop) => {
      const markerHtml = `
        <div style="background-color: #04045E; color: white; border: 2px solid #b9fa3c; border-radius: 12px; font-weight: 800; font-size: 10px; padding: 4px 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); white-space: nowrap; text-align: center;">
          ${prop.verified ? '👑 ' : ''}Bs. ${(prop.price / 1000).toFixed(0)}k
        </div>
      `;
      const markerIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-price-marker',
        iconSize: [80, 28],
        iconAnchor: [40, 14],
      });

      const lat = prop.lat || prop.latitude || -17.368;
      const lng = prop.lng || prop.longitude || -66.155;
      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

      let currentUserId = '';
      try {
        const user = JSON.parse(localStorage.getItem('propio_user') || '{}');
        currentUserId = user.id || '';
      } catch {}
      const isOwnProperty = prop.agentId === currentUserId;

      const img = prop.imageUrl || prop.image || '';
      const popupHtml = `
        <div style="font-family: sans-serif; width: 220px; border-radius: 16px; overflow: hidden; background-color: white;">
          <img src="${img}" alt="${prop.title}" style="width: 100%; height: 100px; object-cover: cover;" />
          <div style="padding: 10px; display: flex; flex-direction: column; gap: 6px;">
            <h4 style="margin: 0; font-size: 12px; font-weight: 900; color: #04045E; text-transform: uppercase;">${prop.title}</h4>
            <p style="margin: 0; font-size: 10px; color: #64748B;">📍 ${prop.location}</p>
            <p style="margin: 0; font-size: 12px; font-weight: 900; color: #04045E;">Bs. ${prop.price.toLocaleString()}</p>
            ${
              isOwnProperty
                ? `<div style="width: 100%; padding: 8px; margin-top: 6px; background-color: #F1F5F9; color: #64748B; border-radius: 8px; font-size: 9px; font-weight: bold; text-transform: uppercase; text-align: center; border: 1px solid #E2E8F0;">Propiedad Propia</div>`
                : `<button 
                    style="width: 100%; padding: 8px; margin-top: 6px; background-color: #b9fa3c; color: #04045E; border: none; border-radius: 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.2s;"
                    onclick="window.dispatchEvent(new CustomEvent('request-collaboration', { detail: '${prop.id}' }))"
                  >
                    🤝 Solicitar Colaboración
                  </button>`
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        className: 'custom-leaflet-popup',
      });

      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      try {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
      } catch (err) {
        console.warn("Error fitting map bounds:", err);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showMap, L, allProperties]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-8 font-sans bg-[#F8FAFC]">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#04045E] uppercase tracking-tight">
            Mis Propiedades
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Visualiza y administra los inmuebles asignados a tu cartera de asesoramiento verificado.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowMap(true)}
            className="bg-[#04045E] text-white hover:bg-[#04045E]/90 font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 active:scale-95"
          >
            🗺️ Ver Mapa
          </button>
          <Link
            href="/propietario/nuevo"
            className="bg-[#b9fa3c] text-[#04045E] font-bold px-5 py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all shrink-0 active:scale-95"
          >
            Publicar Inmueble
          </Link>
          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
              } catch (err) {
                console.error(err);
              } finally {
                document.cookie = 'propio_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;';
                localStorage.removeItem('propio_token');
                localStorage.removeItem('propio_user');
                window.location.href = '/login';
              }
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-505 px-5 py-3.5 border border-red-200/50 text-xs font-black uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center active:scale-95 shadow-sm"
            title="Cerrar Sesión"
          >
            Salir
          </button>
        </div>
      </div>

      {/* Grid de Propiedades */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 font-semibold bg-white border border-slate-100 rounded-3xl shadow-xs py-20">
          <span className="block text-4xl mb-3 animate-spin">⏳</span>
          <p className="text-sm font-semibold">Cargando tus propiedades...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-xs py-20">
          <span className="block text-5xl mb-4">🏠</span>
          <p className="text-base font-bold text-[#04045E]">No tienes propiedades asignadas</p>
          <p className="text-slate-500 text-xs mt-1 max-w-md">Para comenzar a gestionar tu cartera, añade tu primer inmueble haciendo clic en el botón de publicación.</p>
          <Link
            href="/propietario/nuevo"
            className="mt-6 inline-block bg-[#b9fa3c] text-[#04045E] font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] hover:brightness-95 transition-all active:scale-95"
          >
            Añadir Propiedad ➕
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-300 flex flex-col h-full group">
              {/* Imagen con badge */}
              <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                <img
                  src={prop.imageUrl || prop.image}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  <span className="bg-[#04045E] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
                    {prop.type}
                  </span>
                  {prop.status && (
                    <span className={`text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm ${
                      prop.status === 'APROBADO' ? 'bg-[#10B981]' :
                      prop.status === 'RECHAZADO' ? 'bg-[#EF4444]' :
                      prop.status === 'OBSERVADO' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]'
                    }`}>
                      {prop.status}
                    </span>
                  )}
                </div>
                {prop.verified && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-[#b9fa3c] text-[#04045E] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm flex items-center gap-1 border border-[#b9fa3c]/30">
                      👑 VERIFICADO
                    </span>
                  </div>
                )}
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    📍 {prop.location}
                  </p>
                  <h3 className="text-base font-black text-[#04045E] uppercase tracking-tight leading-snug group-hover:text-[#04045E]/90 transition-colors">
                    {prop.title}
                  </h3>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 border border-slate-100 bg-slate-50 rounded-xl">
                  {prop.rooms ? (
                    <div className="text-center">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">Hab.</span>
                      <span className="text-xs font-black text-[#04045E]">{prop.rooms}</span>
                    </div>
                  ) : (
                    <div className="text-center col-span-2">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">Frente</span>
                      <span className="text-xs font-black text-[#04045E]">Comercial</span>
                    </div>
                  )}
                  {prop.bathrooms && (
                    <div className="text-center border-x border-slate-200/50">
                      <span className="block text-[8px] font-black text-slate-400 uppercase">Baños</span>
                      <span className="text-xs font-black text-[#04045E]">{prop.bathrooms}</span>
                    </div>
                  )}
                  <div className="text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase">Área</span>
                    <span className="text-xs font-black text-[#04045E]">{prop.area} m²</span>
                  </div>
                </div>

                {/* Footer de Tarjeta con Precio (Venta + Mínimo) y Acciones */}
                <div className="pt-3 border-t border-slate-100 mt-auto flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-lg font-black text-[#04045E]">
                        Bs. {prop.price.toLocaleString()}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Mín. Negociar: <span className="text-emerald-600 font-black">Bs. {prop.minPrice?.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-1 w-full">
                    <button
                      onClick={() => handleStartEdit(prop)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-[#04045E] border border-slate-200 font-black text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all active:scale-95 text-center shadow-2xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setActivePropertyId(prop.id)}
                      className="flex-1 bg-[#04045E] hover:bg-[#04045E]/95 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-center shadow-xs cursor-pointer"
                    >
                      Ver Ficha
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DEL MAPA LEAFLET */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-transparent backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 md:p-6 space-y-4 relative overflow-hidden h-[85vh] flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-2 bg-[#b9fa3c]" />

            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-[#04045E] uppercase tracking-wide">
                  Mapa de Propiedades
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Presiona sobre una propiedad para solicitar colaboración
                </p>
              </div>
              <button
                onClick={() => setShowMap(false)}
                className="text-slate-450 hover:text-slate-650 text-xl font-bold p-1 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Contenedor del Mapa Leaflet */}
            <div className="flex-1 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative">
              {L ? (
                <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '100%', width: '100%' }} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-semibold">
                  Cargando mapa interactivo...
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMap(false)}
                className="py-3 px-6 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
              >
                Cerrar Mapa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXTENDIDO PARA EDITAR PROPIEDAD (igual que owner dashboard) */}
      {editingProperty && (
        <div className="fixed inset-0 z-[100] bg-[#04045E]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-6 animate-fadeIn">

            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <h2 className="text-xl font-sans font-black text-[#04045E] uppercase">Editar Inmueble</h2>
              <button
                type="button"
                onClick={() => setEditingProperty(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="overflow-y-auto max-h-[65vh] pr-2 space-y-6">
                <PropertyFormFields
                  formData={packagedFormData}
                  onChange={handleFormFieldsChange}
                  selectedAttributes={editAttributes}
                  onToggleAttribute={toggleAttribute}
                  documents={documentsChecklist}
                  onUpdateDocuments={handleUpdateDocuments}
                  isEditMode={true}
                  uploadedDocuments={editDocuments}
                  onUploadDocument={handleUploadDocument}
                  onDeleteDocument={handleDeleteDocument}
                  isUploadingDoc={isUploadingDoc}
                  images={editImages}
                  onAddImage={handleAddImage}
                  onRemoveImage={handleRemoveImage}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingProperty(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-[#04045E] hover:bg-[#04045E]/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md flex items-center gap-2"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios 🚀'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* VISOR LATERAL DE DETALLES DE PROPIEDAD */}
      {activePropertyId && (() => {
        const prop = properties.find(p => p.id === activePropertyId);
        if (!prop) return null;
        return (
          <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/60 backdrop-blur-xs transition-all duration-300">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slideInRight {
                animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            `}} />
            {/* Backdrop click to close */}
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => setActivePropertyId(null)}
            />

            {/* Side Panel */}
            <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-100 animate-slideInRight z-10 overflow-y-auto">
              {/* Decorative top bar */}
              <div className="h-2 bg-[#b9fa3c] shrink-0" />

              {/* Close Button on Top Right (Absolute) */}
              <button
                onClick={() => setActivePropertyId(null)}
                className="absolute top-6 right-6 z-20 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer shadow-md text-sm font-bold"
                aria-label="Cerrar detalles"
              >
                ✕
              </button>

              {/* Cover Image and Header */}
              <div className="relative h-64 bg-slate-100 shrink-0">
                <img
                  src={prop.imageUrl || prop.image}
                  alt={prop.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Floating tags */}
                <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="bg-[#b9fa3c] text-[#04045E] text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 border border-[#b9fa3c]/30 w-max">
                      👑 VERIFICADO
                    </span>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight leading-snug drop-shadow-md">
                      {prop.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 space-y-6">

                {/* Ubicación y Tipo */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      📍 {prop.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</p>
                    <span className="inline-block bg-[#04045E]/5 text-[#04045E] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg mt-0.5">
                      {prop.type}
                    </span>
                  </div>
                </div>

                {/* Precios y Estado de Negociación */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Precio de Lista</span>
                    <span className="text-2xl font-black text-[#04045E]">Bs. {prop.price.toLocaleString()}</span>
                  </div>
                  <div className="border-l border-slate-200/60 pl-4">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Mínimo Negociable</span>
                    <span className="text-2xl font-black text-emerald-600">Bs. {prop.minPrice?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Especificaciones Técnicas */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Datos Técnicos</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Área</span>
                      <span className="text-sm font-black text-[#04045E]">{prop.area} m²</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Dormitorios</span>
                      <span className="text-sm font-black text-[#04045E]">{prop.rooms || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-2xs">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Baños</span>
                      <span className="text-sm font-black text-[#04045E]">{prop.bathrooms || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Ubicación Georreferenciada */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Coordenadas del Inmueble</h4>
                  <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 font-semibold justify-between">
                    <div><span className="text-slate-400 font-bold">Latitud:</span> {prop.lat || prop.latitude}</div>
                    <div className="sm:border-l sm:border-slate-200 sm:pl-4"><span className="text-slate-400 font-bold">Longitud:</span> {prop.lng || prop.longitude}</div>
                  </div>
                </div>

                {/* Amenidades y Garantías */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Características & Amenidades</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-semibold">
                    <div className="flex items-center gap-2">✅ Conexión a Gas Domiciliario</div>
                    <div className="flex items-center gap-2">✅ Documentación al Día</div>
                    <div className="flex items-center gap-2">✅ Cajonería de Madera Fina</div>
                    <div className="flex items-center gap-2">✅ Garaje Privado Techado</div>
                    <div className="flex items-center gap-2">✅ Seguridad y Vigilancia</div>
                    <div className="flex items-center gap-2">✅ Iluminación LED Natural</div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActivePropertyId(null)}
                  className="flex-1 py-3.5 border border-slate-200 hover:bg-slate-100 text-[#04045E] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer text-center"
                >
                  Cerrar Ficha
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(prop);
                    setActivePropertyId(null);
                  }}
                  className="flex-1 py-3.5 bg-[#b9fa3c] hover:brightness-95 text-[#04045E] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                >
                  Editar Inmueble ⚙️
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmación de Colaboración */}
      {showCollabModal && selectedPropForCollab && (
        <div className="fixed inset-0 z-[150] bg-[#04045E]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-sm text-[#04045E] uppercase tracking-wide flex items-center gap-2">
                <span>🤝</span> Confirmar Colaboración
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCollabModal(false);
                  setSelectedPropForCollab(null);
                }}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Estás solicitando colaborar en la venta/alquiler de este inmueble de la red. Una vez enviada, el agente captador recibirá la solicitud para su aprobación.
              </p>

              {/* Ficha rápida de propiedad */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] font-black text-[#04045E] uppercase tracking-wider">Inmueble de Cartera</p>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase">{selectedPropForCollab.title}</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">📍 {selectedPropForCollab.location}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Precio</span>
                  <span className="text-xs font-black text-[#04045E]">Bs. {selectedPropForCollab.price.toLocaleString()}</span>
                </div>
              </div>

              {/* Reglas de Negocio en cuadro decorativo */}
              <div className="bg-[#b9fa3c]/10 border border-[#b9fa3c]/40 p-3.5 rounded-2xl">
                <h5 className="text-[9px] font-black text-[#04045E] uppercase tracking-wider flex items-center gap-1.5">
                  🛡️ Reglas de Transacción y Co-broking
                </h5>
                <ul className="text-[10px] text-[#04045E] font-semibold mt-1.5 list-disc list-inside space-y-1">
                  <li>Distribución equitativa de comisiones en el Pipeline de Cierre.</li>
                  <li>Facilitación de visitas coordinadas con el cliente final.</li>
                  <li>No se permite duplicidad de solicitudes pendientes.</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCollabModal(false);
                  setSelectedPropForCollab(null);
                }}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSendingCollab}
                onClick={handleConfirmCollaboration}
                className="flex-1 py-3 bg-[#04045E] hover:bg-[#04045E]/90 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                {isSendingCollab ? (
                  <span>Enviando...</span>
                ) : (
                  <span>Enviar Solicitud 🚀</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de confirmación de colaboración */}
      {collabToast && collabToast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4 animate-slideDown">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideDown {
              from { transform: translate(-50%, -100%); opacity: 0; }
              to { transform: translate(-50%, 0); opacity: 1; }
            }
            .animate-slideDown {
              animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          <div className="bg-[#04045E] border-2 border-[#b9fa3c] text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🤝</span>
              <p className="text-xs font-bold leading-normal">{collabToast.title}</p>
            </div>
            <button
              onClick={() => setCollabToast(null)}
              className="text-[#b9fa3c] hover:text-white font-black text-sm shrink-0 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
