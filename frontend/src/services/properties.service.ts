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
          id: 'prop-1-muyurina',
          title: 'Casa de Campo en Muyurina',
          description: 'Casa de Campo en Muyurina. Jardín interior amplio, churrasquero propio, suite con vestidor. Superficie Terreno: 450 m²\nSuperficie Construida: 220 m²',
          price: 220000.0,
          priceBob: 2200000.0,
          area: 220.0,
          rooms: 4,
          bathrooms: 3,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          lat: -17.3890,
          lng: -66.1390,
          type: 'casa',
          verified: true,
          offerType: 'VENTA',
          featured: true,
          lotSize: 450
        },
        {
          id: 'prop-2-mayorazgo',
          title: 'Oficina Premium en Mayorazgo',
          description: 'Oficina Premium en Mayorazgo. Iluminación LED inteligente, control de acceso biométrico, chapas digitales. Superficie Terreno: 0 m²\nSuperficie Construida: 115 m²',
          price: 135000.0,
          priceBob: 1350000.0,
          area: 115.0,
          rooms: 0,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
          lat: -17.3680,
          lng: -66.1780,
          type: 'oficina',
          verified: true,
          offerType: 'VENTA',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-3-queru-queru',
          title: 'Penthouse de Lujo en Queru Queru',
          description: 'Penthouse de Lujo en Queru Queru. Suite principal con vestidor, terraza privada con vista panorámica, parqueo subterráneo. Superficie Terreno: 0 m²\nSuperficie Construida: 195 m²',
          price: 128000.0,
          priceBob: 1280000.0,
          area: 195.0,
          rooms: 4,
          bathrooms: 3,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
          lat: -17.3750,
          lng: -66.1520,
          type: 'departamento',
          verified: true,
          offerType: 'VENTA',
          featured: true,
          lotSize: 0
        },
        {
          id: 'prop-4-cala-cala',
          title: 'Casa Familiar de Estilo Moderno',
          description: 'Casa Familiar de Estilo Moderno. Cocina remodelada, jardín posterior amplio, conexión de gas domiciliario. Superficie Terreno: 350 m²\nSuperficie Construida: 250 m²',
          price: 210000.0,
          priceBob: 2100000.0,
          area: 250.0,
          rooms: 5,
          bathrooms: 4,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
          lat: -17.3780,
          lng: -66.1620,
          type: 'casa',
          verified: true,
          offerType: 'VENTA',
          featured: false,
          lotSize: 350
        },
        {
          id: 'prop-5-america',
          title: 'Terreno Premium Comercial',
          description: 'Terreno Premium Comercial. Lote Premium en esquina, frente a área verde, alta afluencia. Superficie Terreno: 600 m²\nSuperficie Construida: 0 m²',
          price: 185000.0,
          priceBob: 1850000.0,
          area: 0.0,
          rooms: 0,
          bathrooms: 0,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
          lat: -17.3715,
          lng: -66.1518,
          type: 'terreno',
          verified: true,
          offerType: 'VENTA',
          featured: false,
          lotSize: 600
        },
        {
          id: 'prop-6-la-chimba',
          title: 'Galpón Industrial de Alta Capacidad',
          description: 'Galpón Industrial de Alta Capacidad. Cerco eléctrico perimetral, cisterna propia de gran capacidad. Superficie Terreno: 1,200 m²\nSuperficie Construida: 900 m²',
          price: 340000.0,
          priceBob: 3400000.0,
          area: 900.0,
          rooms: 0,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
          lat: -17.4080,
          lng: -66.1850,
          type: 'terreno',
          verified: false,
          offerType: 'VENTA',
          featured: false,
          lotSize: 1200
        },
        {
          id: 'prop-7-el-prado',
          title: 'Departamento Amoblado Central',
          description: 'Departamento Amoblado Central. Iluminación LED, conexión de gas domiciliario, edificio pet-friendly. Superficie Terreno: 0 m²\nSuperficie Construida: 85 m²',
          price: 450.0,
          priceBob: 4500.0,
          area: 85.0,
          rooms: 2,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
          lat: -17.3940,
          lng: -66.1560,
          type: 'departamento',
          verified: true,
          offerType: 'ALQUILER',
          featured: true,
          lotSize: 0
        },
        {
          id: 'prop-8-sarco',
          title: 'Monoambiente Moderno',
          description: 'Monoambiente Moderno. Seguridad de vigilancia 24/7, cajón de parqueo subterráneo, coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 42 m²',
          price: 280.0,
          priceBob: 2800.0,
          area: 42.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
          lat: -17.3790,
          lng: -66.1730,
          type: 'departamento',
          verified: true,
          offerType: 'ALQUILER',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-9-america-comercial',
          title: 'Local Comercial en Planta Baja',
          description: 'Local Comercial en Planta Baja. Luces LED empotradas, chapas digitales, vidrieras de alto tráfico. Superficie Terreno: 0 m²\nSuperficie Construida: 130 m²',
          price: 700.0,
          priceBob: 7000.0,
          area: 130.0,
          rooms: 0,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
          lat: -17.3710,
          lng: -66.1550,
          type: 'oficina',
          verified: false,
          offerType: 'ALQUILER',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-10-lomas-aranjuez',
          title: 'Garzonier Ejecutivo',
          description: 'Garzonier Ejecutivo. Box de vidrio templado, entorno de alta privacidad, gas domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 55 m²',
          price: 350.0,
          priceBob: 3500.0,
          area: 55.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          lat: -17.3520,
          lng: -66.1530,
          type: 'departamento',
          verified: true,
          offerType: 'ALQUILER',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-11-pacata-alta',
          title: 'Casa en Condominio Cerrado',
          description: 'Casa en Condominio Cerrado. Churrasquero propio techado, áreas verdes comunes, parque infantil. Superficie Terreno: 300 m²\nSuperficie Construida: 210 m²',
          price: 680.0,
          priceBob: 6800.0,
          area: 210.0,
          rooms: 3,
          bathrooms: 3,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          lat: -17.3720,
          lng: -66.1210,
          type: 'casa',
          verified: false,
          offerType: 'ALQUILER',
          featured: false,
          lotSize: 300
        },
        {
          id: 'prop-12-las-cuadras',
          title: 'Departamento Familiar Amplio',
          description: 'Departamento Familiar Amplio. Parqueo doble paralelo, baulera amplia, conexión de gas domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 120 m²',
          price: 24000.0,
          priceBob: 240000.0,
          area: 120.0,
          rooms: 3,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
          lat: -17.3980,
          lng: -66.1460,
          type: 'departamento',
          verified: true,
          offerType: 'ANTICRETICO',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-13-san-pedro',
          title: 'Monoambiente Funcional',
          description: 'Monoambiente Funcional. Control de acceso biométrico, edificio pet-friendly, acabados modernos. Superficie Terreno: 0 m²\nSuperficie Construida: 38 m²',
          price: 9500.0,
          priceBob: 95000.0,
          area: 38.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
          lat: -17.3950,
          lng: -66.1380,
          type: 'departamento',
          verified: false,
          offerType: 'ANTICRETICO',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-14-pacata-baja',
          title: 'Casa Independiente Solida',
          description: 'Casa Independiente Solida. Cisterna propia de agua, jardín posterior, cerco eléctrico perimetral. Superficie Terreno: 280 m²\nSuperficie Construida: 160 m²',
          price: 31000.0,
          priceBob: 310000.0,
          area: 160.0,
          rooms: 4,
          bathrooms: 3,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
          lat: -17.3780,
          lng: -66.1310,
          type: 'casa',
          verified: true,
          offerType: 'ANTICRETICO',
          featured: false,
          lotSize: 280
        },
        {
          id: 'prop-15-cona-cona',
          title: 'Garzonier Cómodo',
          description: 'Garzonier Cómodo. Calefón a gas instalado, iluminación LED empotrada. Superficie Terreno: 0 m²\nSuperficie Construida: 50 m²',
          price: 8500.0,
          priceBob: 85000.0,
          area: 50.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
          lat: -17.4020,
          lng: -66.1950,
          type: 'departamento',
          verified: false,
          offerType: 'ANTICRETICO',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-16-temporal',
          title: 'Oficina para Consultorios',
          description: 'Oficina para Consultorios. Circuito cerrado de cámaras, chapas digitales inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 65 m²',
          price: 13000.0,
          priceBob: 130000.0,
          area: 65.0,
          rooms: 0,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
          lat: -17.3620,
          lng: -66.1480,
          type: 'oficina',
          verified: true,
          offerType: 'ANTICRETICO',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-17-cruce-taquina',
          title: 'Condominio de Casas Smart (En Planos)',
          description: 'Condominio de Casas Smart (En Planos). Club House con piscina atemperada, domótica, ventanas de doble vidrio (DVH). Superficie Terreno: 400 m²\nSuperficie Construida: 280 m²',
          price: 190000.0,
          priceBob: 1900000.0,
          area: 280.0,
          rooms: 4,
          bathrooms: 4,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          lat: -17.3560,
          lng: -66.1680,
          type: 'casa',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
          lotSize: 400
        },
        {
          id: 'prop-18-hipodromo',
          title: 'Edificio Eco-Smart',
          description: 'Edificio Eco-Smart. Termotanque solar instalado, iluminación LED inteligente, área de coworking integrada. Superficie Terreno: 0 m²\nSuperficie Construida: 78 m²',
          price: 58000.0,
          priceBob: 580000.0,
          area: 78.0,
          rooms: 2,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
          lat: -17.3990,
          lng: -66.1750,
          type: 'departamento',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-19-beato-salomon',
          title: 'Complejo de Suites Ejecutivas',
          description: 'Complejo de Suites Ejecutivas. Walk-in closet, sauna común, circuito cerrado de televisión (CCTV). Superficie Terreno: 0 m²\nSuperficie Construida: 110 m²',
          price: 115000.0,
          priceBob: 1150000.0,
          area: 110.0,
          rooms: 3,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
          lat: -17.3820,
          lng: -66.1280,
          type: 'departamento',
          verified: false,
          offerType: 'PROYECTO',
          featured: false,
          lotSize: 0
        },
        {
          id: 'prop-20-america-oeste',
          title: 'Torre Corporativa de Oficinas',
          description: 'Torre Corporativa de Oficinas. Control de acceso biométrico, parqueo de visitas en el edificio, generador eléctrico de emergencia. Superficie Terreno: 800 m²\nSuperficie Construida: 2,400 m²',
          price: 420000.0,
          priceBob: 4200000.0,
          area: 2400.0,
          rooms: 0,
          bathrooms: 12,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
          lat: -17.3695,
          lng: -66.1610,
          type: 'oficina',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
          lotSize: 800
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

  async updateProperty(
    id: string,
    propertyData: any,
    token?: string
  ): Promise<{ message: string; data: Property }> {
    try {
      const response = await apiClient.putWithAuth<{ message: string; data: Property }>(
        `/properties/${id}`,
        propertyData,
        token || ''
      );
      return response;
    } catch (error) {
      console.warn('API de backend inalcanzable. Simulando actualización de propiedad en el cliente.');
      return {
        message: 'Propiedad actualizada con éxito (Simulado en Cliente)',
        data: {
          id,
          ...propertyData,
        } as unknown as Property
      };
    }
  },

  async deleteProperty(
    id: string,
    token?: string
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.deleteWithAuth<{ message: string }>(
        `/properties/${id}`,
        token || ''
      );
      return response;
    } catch (error) {
      console.warn('API de backend inalcanzable. Simulando eliminación de propiedad en el cliente.');
      return {
        message: 'Propiedad eliminada con éxito (Simulado en Cliente)'
      };
    }
  },
};
