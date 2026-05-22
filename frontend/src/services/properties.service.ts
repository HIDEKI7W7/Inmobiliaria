import { apiClient } from './api.client';
import { Property } from '../components/modules/properties/PropertyCard';

export const propertiesService = {
  async getProperties(filters?: {
    type?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
    verifiedOnly?: boolean | string;
    text?: string;
  }): Promise<Property[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.type) params.append('type', filters.type);
        if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
        if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
        if (filters.verifiedOnly !== undefined) {
          params.append('verifiedOnly', String(filters.verifiedOnly));
        }
        if (filters.text) params.append('text', filters.text);
      }
      
      const queryString = params.toString();
      const path = queryString ? `/properties?${queryString}` : '/properties';
      const data = await apiClient.get<any[]>(path);
      return data.map((p: any) => ({
        ...p,
        lat: p.lat ?? p.latitude ?? -17.3895,
        lng: p.lng ?? p.longitude ?? -66.1568,
        verified: p.verified ?? p.isVerified ?? false,
        type: (p.type || 'casa').toLowerCase(),
        priceBob: p.priceBob ?? (p.price * 10),
      }));
    } catch (error) {
      // Fallback local robusto por si el backend NestJS no está levantado
      console.warn('API de backend inalcanzable. Cargando fallback de datos inmobiliarios de Propio en Cochabamba con filtrado local.');
      
      const mockList: Property[] = [
        {
          id: '1',
          title: 'Penthouse de Lujo en Queru Queru',
          description: 'Espectacular penthouse de estreno con terraza panorámica, jacuzzi y acabados de primera.',
          price: 185000,
          priceBob: 1850000, // Tipo de cambio 10
          area: 195,
          rooms: 4,
          bathrooms: 3,
          location: 'Queru Queru, Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          featured: true,
          lat: -17.3750,
          lng: -66.1520,
          type: 'departamento',
          verified: true,
        },
        {
          id: '2',
          title: 'Hermosa Casa Familiar en Cala Cala',
          description: 'Amplia casa de dos plantas con jardín interior, churrasquera y seguridad las 24 horas.',
          price: 320000,
          priceBob: 3200000,
          area: 350,
          rooms: 5,
          bathrooms: 4,
          location: 'Cala Cala, Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
          featured: false,
          lat: -17.3780,
          lng: -66.1620,
          type: 'casa',
          verified: true,
        },
        {
          id: '3',
          title: 'Terreno Urbanizado en Lomas de Aranjuez',
          description: 'Excelente terreno plano con todos los servicios básicos, listo para construir en urbanización privada.',
          price: 150000,
          priceBob: 1500000,
          area: 600,
          rooms: 0,
          bathrooms: 0,
          location: 'Aranjuez, Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
          featured: false,
          lat: -17.3550,
          lng: -66.1480,
          type: 'terreno',
          verified: false,
        },
        {
          id: '4',
          title: 'Oficina Ejecutiva en Av. América',
          description: 'Oficina ejecutiva de alto nivel en edificio corporativo inteligente con salas de reuniones comunes.',
          price: 85000,
          priceBob: 850000,
          area: 75,
          rooms: 2,
          bathrooms: 1,
          location: 'América Oeste, Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
          featured: true,
          lat: -17.3820,
          lng: -66.1590,
          type: 'oficina',
          verified: true,
        },
        {
          id: '5',
          title: 'Departamento de Estreno en El Prado',
          description: 'Departamento de 2 habitaciones en pleno Prado, ideal para inversión con alta rentabilidad de alquiler.',
          price: 95000,
          priceBob: 950000,
          area: 85,
          rooms: 2,
          bathrooms: 2,
          location: 'El Prado, Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
          featured: false,
          lat: -17.3880,
          lng: -66.1550,
          type: 'departamento',
          verified: false,
        },
        {
          id: '6',
          title: 'Moderna Casa en Condominio Queru Queru',
          description: 'Casa en condominio cerrado con piscina común, áreas verdes y acabados importados de lujo.',
          price: 240000,
          priceBob: 2400000,
          area: 280,
          rooms: 4,
          bathrooms: 4,
          location: 'Queru Queru, Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          featured: false,
          lat: -17.3745,
          lng: -66.1515,
          type: 'casa',
          verified: true,
        }
      ];

      // Aplicamos lógica de filtrado exacto en memoria como fallback de la base de datos
      let filtered = [...mockList];
      if (filters) {
        if (filters.type) {
          filtered = filtered.filter(p => p.type.toLowerCase() === filters.type!.toLowerCase());
        }
        if (filters.verifiedOnly === true || filters.verifiedOnly === 'true') {
          filtered = filtered.filter(p => p.verified === true);
        }
        if (filters.minPrice) {
          const min = parseFloat(String(filters.minPrice));
          filtered = filtered.filter(p => p.price >= min);
        }
        if (filters.maxPrice) {
          const max = parseFloat(String(filters.maxPrice));
          filtered = filtered.filter(p => p.price <= max);
        }
        if (filters.text) {
          const query = filters.text.toLowerCase();
          filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.location.toLowerCase().includes(query)
          );
        }
      }
      return filtered;
    }
  },

  async getPropertyById(id: string): Promise<Property> {
    try {
      const p = await apiClient.get<any>(`/properties/${id}`);
      return {
        ...p,
        lat: p.lat ?? p.latitude ?? -17.3895,
        lng: p.lng ?? p.longitude ?? -66.1568,
        verified: p.verified ?? p.isVerified ?? false,
        type: (p.type || 'casa').toLowerCase(),
        priceBob: p.priceBob ?? (p.price * 10),
      };
    } catch (error) {
      const properties = await this.getProperties();
      const match = properties.find((p) => p.id === id);
      if (!match) {
        throw new Error('Propiedad no encontrada');
      }
      return match;
    }
  },

  async createProperty(property: any): Promise<{ message: string; data: Property }> {
    try {
      return await apiClient.post<{ message: string; data: Property }>('/properties', property);
    } catch (error) {
      console.warn('API de backend inalcanzable. Simulando creación exitosa en el cliente.');
      return {
        message: 'Propiedad registrada exitosamente (Simulado en Cliente)',
        data: {
          id: 'prop-' + Math.random().toString(36).substr(2, 9),
          lat: -17.3895,
          lng: -66.1568,
          verified: false,
          ...property,
        } as unknown as Property
      };
    }
  },

  async createPropertyAsPropietario(property: any, token: string): Promise<{ message: string; data: Property }> {
    try {
      return await apiClient.postWithAuth<{ message: string; data: Property }>('/properties/propietario', property, token);
    } catch (error) {
      console.warn('API de backend inalcanzable. Simulando creación de propietario exitosa en el cliente.');
      return {
        message: 'Propiedad registrada exitosamente (Simulado en Cliente)',
        data: {
          id: 'prop-' + Math.random().toString(36).substr(2, 9),
          lat: property.latitude ?? -17.3895,
          lng: property.longitude ?? -66.1568,
          verified: false,
          status: 'NUEVA_PUBLICACION',
          ...property,
        } as unknown as Property
      };
    }
  },

  async updatePropertyStatus(
    id: string,
    status: string,
    observationNotes?: string,
    token?: string
  ): Promise<{ message: string; data: Property }> {
    try {
      const response = await apiClient.patchWithAuth<{ message: string; data: Property }>(
        `/admin/properties/${id}/status`,
        { status, observationNotes },
        token || 'mock-admin-token'
      );
      return response;
    } catch (error) {
      console.warn('API de backend inalcanzable. Simulando actualización de estado en el cliente.');
      return {
        message: 'Estado de propiedad actualizado con éxito (Simulado en Cliente)',
        data: {
          id,
          status: status.toUpperCase(),
          observationNotes: observationNotes || null,
          verified: status.toUpperCase() === 'APROBADO',
        } as unknown as Property
      };
    }
  },
};
