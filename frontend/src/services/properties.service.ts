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
          id: 'prop-1-queru-queru',
          title: 'Penthouse de Lujo en Queru Queru',
          description: 'Espectacular penthouse de estreno con terraza panorámica, jacuzzi y acabados de primera. Suite principal con vestidor, Terraza privada con vista panorámica, Parqueo subterráneo techado. Superficie Terreno: 0 m²\nSuperficie Construida: 195 m²\nAtributos: Suite Master, Terraza, Parqueo Techado',
          price: 183908.0,
          priceBob: 1280000.0,
          area: 195.0,
          rooms: 4,
          bathrooms: 3,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          lat: -17.3750,
          lng: -66.1520,
          type: 'departamento',
          verified: true,
          offerType: 'VENTA',
          featured: true,
        },
        {
          id: 'prop-2-cala-cala',
          title: 'Casa Familiar de Estilo Moderno',
          description: 'Amplia casa de dos plantas con jardín interior, churrasquera y seguridad las 24 horas. Cocina remodelada, Jardín interior amplio, Churrasquero propio. Superficie Terreno: 350 m²\nSuperficie Construida: 250 m²\nAtributos: Jardín, Churrasquera/Parrillero, Cocina Equipada',
          price: 318965.0,
          priceBob: 2220000.0,
          area: 250.0,
          rooms: 5,
          bathrooms: 4,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
          lat: -17.3780,
          lng: -66.1620,
          type: 'casa',
          verified: true,
          offerType: 'VENTA',
          featured: false,
        },
        {
          id: 'prop-3-el-prado',
          title: 'Departamento de Estreno en El Prado',
          description: 'Departamento de estreno en pleno Prado. Iluminación LED inteligente, Conexión de Gas Domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 85 m²\nAtributos: Iluminación LED',
          price: 93390.0,
          priceBob: 650000.0,
          area: 85.0,
          rooms: 2,
          bathrooms: 2,
          location: 'La Paz',
          imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
          lat: -16.5020,
          lng: -68.1220,
          type: 'departamento',
          verified: false,
          offerType: 'VENTA',
          featured: false,
        },
        {
          id: 'prop-4-villa-adela',
          title: 'Galpón Industrial de Alta Capacidad',
          description: 'Amplio galpón industrial en Villa Adela. Cerco eléctrico perimetral, Tanque de agua de gran capacidad, Generador eléctrico de emergencia. Superficie Terreno: 1200 m²\nSuperficie Construida: 900 m²',
          price: 495689.0,
          priceBob: 3450000.0,
          area: 900.0,
          rooms: 0,
          bathrooms: 2,
          location: 'La Paz',
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
          lat: -16.5120,
          lng: -68.1920,
          type: 'terreno',
          verified: true,
          offerType: 'VENTA',
          featured: false,
        },
        {
          id: 'prop-5-banzer',
          title: 'Terreno Premium Comercial',
          description: 'Excelente terreno plano comercial sobre Av. Banzer. Lote Premium (en esquina, frente a área verde). Superficie Terreno: 600 m²\nSuperficie Construida: 0 m²',
          price: 270114.0,
          priceBob: 1880000.0,
          area: 600.0,
          rooms: 0,
          bathrooms: 0,
          location: 'Santa Cruz',
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
          lat: -17.7420,
          lng: -63.1620,
          type: 'terreno',
          verified: true,
          offerType: 'VENTA',
          featured: false,
        },
        {
          id: 'prop-6-equipetrol',
          title: 'Monoambiente Amoblado para Ejecutivos',
          description: 'Precioso monoambiente totalmente equipado en Equipetrol. Seguridad de vigilancia 24/7, Piscina atemperada, Gimnasio equipado. Superficie Terreno: 0 m²\nSuperficie Construida: 42 m²\nAtributos: Amoblado, Seguridad 24/7, Gimnasio',
          price: 459.0,
          priceBob: 3200.0,
          area: 42.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Santa Cruz',
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
          lat: -17.7620,
          lng: -63.1920,
          type: 'departamento',
          verified: true,
          offerType: 'ALQUILER',
          featured: false,
        },
        {
          id: 'prop-7-central',
          title: 'Oficina Corporativa Central',
          description: 'Oficina ejecutiva de alto nivel en zona central. Control de acceso biométrico, Circuito cerrado de cámaras, Coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 110 m²\nAtributos: Cámaras de Vigilancia, Seguridad 24/7',
          price: 1077.0,
          priceBob: 7500.0,
          area: 110.0,
          rooms: 0,
          bathrooms: 2,
          location: 'La Paz',
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
          lat: -16.5005,
          lng: -68.1305,
          type: 'oficina',
          verified: true,
          offerType: 'ALQUILER',
          featured: true,
        },
        {
          id: 'prop-8-america',
          title: 'Local Comercial en Planta Baja',
          description: 'Local comercial amplio sobre Av. América. Iluminación LED inteligente, Chapas digitales / cerraduras inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 130 m²\nAtributos: Iluminación LED, Seguridad 24/7',
          price: 1408.0,
          priceBob: 9800.0,
          area: 130.0,
          rooms: 0,
          bathrooms: 1,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
          lat: -17.3715,
          lng: -66.1518,
          type: 'oficina',
          verified: false,
          offerType: 'ALQUILER',
          featured: false,
        },
        {
          id: 'prop-9-san-roque',
          title: 'Garzonier Económico',
          description: 'Cómodo garzonier en zona San Roque. Conexión de Gas Domiciliario instalada. Superficie Terreno: 0 m²\nSuperficie Construida: 55 m²',
          price: 258.0,
          priceBob: 1800.0,
          area: 55.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Chuquisaca',
          imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
          lat: -19.0435,
          lng: -65.2595,
          type: 'departamento',
          verified: false,
          offerType: 'ALQUILER',
          featured: false,
        },
        {
          id: 'prop-10-panosas',
          title: 'Casa en Condominio Cerrado',
          description: 'Casa elegante en condominio privado. Churrasquero propio, Áreas de juegos infantiles, Seguridad de vigilancia 24/7. Superficie Terreno: 300 m²\nSuperficie Construida: 210 m²\nAtributos: Jardín, Churrasquera/Parrillero, Seguridad 24/7',
          price: 718.0,
          priceBob: 5000.0,
          area: 210.0,
          rooms: 3,
          bathrooms: 3,
          location: 'Tarija',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          lat: -21.5305,
          lng: -64.7355,
          type: 'casa',
          verified: true,
          offerType: 'ALQUILER',
          featured: false,
        },
        {
          id: 'prop-11-sarco',
          title: 'Departamento Familiar Amplio',
          description: 'Amplio departamento ideal para familias en Sarco. Parqueo doble, Baulera amplia, Conexión de Gas Domiciliario instalada. Superficie Terreno: 0 m²\nSuperficie Construida: 120 m²\nAtributos: Parqueo Techado, Baulera',
          price: 35201.0,
          priceBob: 245000.0,
          area: 120.0,
          rooms: 3,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          lat: -17.3790,
          lng: -66.1730,
          type: 'departamento',
          verified: true,
          offerType: 'ANTICRETICO',
          featured: false,
        },
        {
          id: 'prop-12-sopocachi',
          title: 'Monoambiente Minimalista',
          description: 'Moderno monoambiente de diseño minimalista en Sopocachi. Edificio pet-friendly, Control de acceso biométrico. Superficie Terreno: 0 m²\nSuperficie Construida: 38 m²\nAtributos: Seguridad 24/7',
          price: 15086.0,
          priceBob: 105000.0,
          area: 38.0,
          rooms: 1,
          bathrooms: 1,
          location: 'La Paz',
          imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
          lat: -16.5120,
          lng: -68.1260,
          type: 'departamento',
          verified: false,
          offerType: 'ANTICRETICO',
          featured: false,
        },
        {
          id: 'prop-13-sud',
          title: 'Casa Independiente',
          description: 'Casa independiente cómoda en Oruro. Tanque de agua de gran capacidad, Jardín interior, Garaje amplio. Superficie Terreno: 280 m²\nSuperficie Construida: 160 m²\nAtributos: Jardín, Garaje con Portón Eléctrico',
          price: 45258.0,
          priceBob: 315000.0,
          area: 160.0,
          rooms: 4,
          bathrooms: 3,
          location: 'Oruro',
          imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
          lat: -17.9860,
          lng: -67.1480,
          type: 'casa',
          verified: true,
          offerType: 'ANTICRETICO',
          featured: false,
        },
        {
          id: 'prop-14-satelite',
          title: 'Garzonier en Planta Alta',
          description: 'Cómodo garzonier soleado en Ciudad Satélite. Calefón a gas o termotanque solar instalado. Superficie Terreno: 0 m²\nSuperficie Construida: 50 m²',
          price: 12931.0,
          priceBob: 90000.0,
          area: 50.0,
          rooms: 1,
          bathrooms: 1,
          location: 'Potosí',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
          lat: -19.5780,
          lng: -65.7480,
          type: 'departamento',
          verified: false,
          offerType: 'ANTICRETICO',
          featured: false,
        },
        {
          id: 'prop-15-sucre-central',
          title: 'Oficina para Consultorios',
          description: 'Oficina adaptada para consultorios en pleno centro. Iluminación LED inteligente, Chapas digitales / cerraduras inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 65 m²\nAtributos: Iluminación LED',
          price: 20114.0,
          priceBob: 140000.0,
          area: 65.0,
          rooms: 0,
          bathrooms: 1,
          location: 'Chuquisaca',
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
          lat: -19.0350,
          lng: -65.2610,
          type: 'oficina',
          verified: true,
          offerType: 'ANTICRETICO',
          featured: false,
        },
        {
          id: 'prop-16-urubo',
          title: 'Condominio de Casas Premium (En Planos)',
          description: 'Proyecto residencial en preventa en el Urubó. Club House, Piscina atemperada, Domótica, Aislamiento acústico y térmico. Superficie Terreno: 400 m²\nSuperficie Construida: 280 m²\nAtributos: Piscina Común, Salón de Eventos, Seguridad 24/7',
          price: 280172.0,
          priceBob: 1950000.0,
          area: 280.0,
          rooms: 4,
          bathrooms: 4,
          location: 'Santa Cruz',
          imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
          lat: -17.7720,
          lng: -63.2120,
          type: 'casa',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
        },
        {
          id: 'prop-17-tupuraya',
          title: 'Edificio de Departamentos Eco-Smart',
          description: 'Preventa de departamentos sostenibles en Tupuraya. Termotanque solar instalado, Iluminación LED inteligente, Coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 78 m²\nAtributos: Calefón Solar, Iluminación LED',
          price: 84770.0,
          priceBob: 590000.0,
          area: 78.0,
          rooms: 2,
          bathrooms: 2,
          location: 'Cochabamba',
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          lat: -17.3780,
          lng: -66.1420,
          type: 'departamento',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
        },
        {
          id: 'prop-18-riberalta',
          title: 'Complejo Hotelero y Suites',
          description: 'Inversión comercial de gran envergadura en Riberalta. Generador eléctrico de emergencia, Tanque de agua de gran capacidad, Circuito cerrado de cámaras (CCTV). Superficie Terreno: 2500 m²\nSuperficie Construida: 1800 m²',
          price: 833333.0,
          priceBob: 5800000.0,
          area: 1800.0,
          rooms: 25,
          bathrooms: 30,
          location: 'Beni',
          imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
          lat: -14.8350,
          lng: -64.8980,
          type: 'casa',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
        },
        {
          id: 'prop-19-cobija',
          title: 'Urbanización Comercial Estratégica',
          description: 'Lotes comerciales en Cobija Oeste. Lote Premium (en esquina, frente a área verde). Superficie Terreno: 500 m²\nSuperficie Construida: 0 m²',
          price: 50287.0,
          priceBob: 350000.0,
          area: 500.0,
          rooms: 0,
          bathrooms: 0,
          location: 'Pando',
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
          lat: -11.0220,
          lng: -68.7520,
          type: 'terreno',
          verified: false,
          offerType: 'PROYECTO',
          featured: false,
        },
        {
          id: 'prop-20-sirari',
          title: 'Edificio Corporativo y de Oficinas',
          description: 'Edificio corporativo de oficinas premium en Sirari. Control de acceso biométrico, Circuito cerrado de cámaras, Parqueo para visitas en el edificio. Superficie Terreno: 800 m²\nSuperficie Construida: 2400 m²\nAtributos: Parqueo de Visitas, Seguridad 24/7',
          price: 1278735.0,
          priceBob: 8900000.0,
          area: 2400.0,
          rooms: 0,
          bathrooms: 12,
          location: 'Santa Cruz',
          imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
          lat: -17.7650,
          lng: -63.1750,
          type: 'oficina',
          verified: true,
          offerType: 'PROYECTO',
          featured: false,
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
