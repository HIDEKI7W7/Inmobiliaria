import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FindPropertiesQueryDto } from './dto/find-properties-query.dto';

/**
 * Forma de la respuesta paginada por cursor para el catálogo de propiedades.
 * El cliente recibe `nextCursor` opaco y lo envía en la siguiente petición.
 */
export interface PaginatedPropertiesResult {
  data: any[];
  meta: {
    count: number;
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}

const MOCK_PROPERTIES = [
  {
    id: 'prop-1-queru-queru',
    title: 'Penthouse de Lujo en Queru Queru',
    description: 'Espectacular penthouse de estreno con terraza panorámica, jacuzzi y acabados de primera. Suite principal con vestidor, Terraza privada con vista panorámica, Parqueo subterráneo techado. Superficie Terreno: 0 m²\nSuperficie Construida: 195 m²\nAtributos: Suite Master, Terraza, Parqueo Techado',
    price: 183908.0,
    currency: 'BOB',
    priceBob: 1280000.0,
    area: 195.0,
    rooms: 4,
    bathrooms: 3,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3750,
    longitude: -66.1520,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-2-cala-cala',
    title: 'Casa Familiar de Estilo Moderno',
    description: 'Amplia casa de dos plantas con jardín interior, churrasquera y seguridad las 24 horas. Cocina remodelada, Jardín interior amplio, Churrasquero propio. Superficie Terreno: 350 m²\nSuperficie Construida: 250 m²\nAtributos: Jardín, Churrasquera/Parrillero, Cocina Equipada',
    price: 318965.0,
    currency: 'BOB',
    priceBob: 2220000.0,
    area: 250.0,
    rooms: 5,
    bathrooms: 4,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3780,
    longitude: -66.1620,
    type: 'CASA',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-3-el-prado',
    title: 'Departamento de Estreno en El Prado',
    description: 'Departamento de estreno en pleno Prado. Iluminación LED inteligente, Conexión de Gas Domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 85 m²\nAtributos: Iluminación LED',
    price: 93390.0,
    currency: 'BOB',
    priceBob: 650000.0,
    area: 85.0,
    rooms: 2,
    bathrooms: 2,
    location: 'La Paz',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    latitude: -16.5020,
    longitude: -68.1220,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-4-villa-adela',
    title: 'Galpón Industrial de Alta Capacidad',
    description: 'Amplio galpón industrial en Villa Adela. Cerco eléctrico perimetral, Tanque de agua de gran capacidad, Generador eléctrico de emergencia. Superficie Terreno: 1200 m²\nSuperficie Construida: 900 m²',
    price: 495689.0,
    currency: 'BOB',
    priceBob: 3450000.0,
    area: 900.0,
    rooms: 0,
    bathrooms: 2,
    location: 'La Paz',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    latitude: -16.5120,
    longitude: -68.1920,
    type: 'TERRENO',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-5-banzer',
    title: 'Terreno Premium Comercial',
    description: 'Excelente terreno plano comercial sobre Av. Banzer. Lote Premium (en esquina, frente a área verde). Superficie Terreno: 600 m²\nSuperficie Construida: 0 m²',
    price: 270114.0,
    currency: 'BOB',
    priceBob: 1880000.0,
    area: 600.0,
    rooms: 0,
    bathrooms: 0,
    location: 'Santa Cruz',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    latitude: -17.7420,
    longitude: -63.1620,
    type: 'TERRENO',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-6-equipetrol',
    title: 'Monoambiente Amoblado para Ejecutivos',
    description: 'Precioso monoambiente totalmente equipado en Equipetrol. Seguridad de vigilancia 24/7, Piscina atemperada, Gimnasio equipado. Superficie Terreno: 0 m²\nSuperficie Construida: 42 m²\nAtributos: Amoblado, Seguridad 24/7, Gimnasio',
    price: 459.0,
    currency: 'BOB',
    priceBob: 3200.0,
    area: 42.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Santa Cruz',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    latitude: -17.7620,
    longitude: -63.1920,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-7-central',
    title: 'Oficina Corporativa Central',
    description: 'Oficina ejecutiva de alto nivel en zona central. Control de acceso biométrico, Circuito cerrado de cámaras, Coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 110 m²\nAtributos: Cámaras de Vigilancia, Seguridad 24/7',
    price: 1077.0,
    currency: 'BOB',
    priceBob: 7500.0,
    area: 110.0,
    rooms: 0,
    bathrooms: 2,
    location: 'La Paz',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    latitude: -16.5005,
    longitude: -68.1305,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-8-america',
    title: 'Local Comercial en Planta Baja',
    description: 'Local comercial amplio sobre Av. América. Iluminación LED inteligente, Chapas digitales / cerraduras inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 130 m²\nAtributos: Iluminación LED, Seguridad 24/7',
    price: 1408.0,
    currency: 'BOB',
    priceBob: 9800.0,
    area: 130.0,
    rooms: 0,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3715,
    longitude: -66.1518,
    type: 'OFICINA',
    isVerified: false,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-9-san-roque',
    title: 'Garzonier Económico',
    description: 'Cómodo garzonier en zona San Roque. Conexión de Gas Domiciliario instalada. Superficie Terreno: 0 m²\nSuperficie Construida: 55 m²',
    price: 258.0,
    currency: 'BOB',
    priceBob: 1800.0,
    area: 55.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Chuquisaca',
    imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
    latitude: -19.0435,
    longitude: -65.2595,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-10-panosas',
    title: 'Casa en Condominio Cerrado',
    description: 'Casa elegante en condominio privado. Churrasquero propio, Áreas de juegos infantiles, Seguridad de vigilancia 24/7. Superficie Terreno: 300 m²\nSuperficie Construida: 210 m²\nAtributos: Jardín, Churrasquera/Parrillero, Seguridad 24/7',
    price: 718.0,
    currency: 'BOB',
    priceBob: 5000.0,
    area: 210.0,
    rooms: 3,
    bathrooms: 3,
    location: 'Tarija',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    latitude: -21.5305,
    longitude: -64.7355,
    type: 'CASA',
    isVerified: true,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-11-sarco',
    title: 'Departamento Familiar Amplio',
    description: 'Amplio departamento ideal para familias en Sarco. Parqueo doble, Baulera amplia, Conexión de Gas Domiciliario instalada. Superficie Terreno: 0 m²\nSuperficie Construida: 120 m²\nAtributos: Parqueo Techado, Baulera',
    price: 35201.0,
    currency: 'BOB',
    priceBob: 245000.0,
    area: 120.0,
    rooms: 3,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3790,
    longitude: -66.1730,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-12-sopocachi',
    title: 'Monoambiente Minimalista',
    description: 'Moderno monoambiente de diseño minimalista en Sopocachi. Edificio pet-friendly, Control de acceso biométrico. Superficie Terreno: 0 m²\nSuperficie Construida: 38 m²\nAtributos: Seguridad 24/7',
    price: 15086.0,
    currency: 'BOB',
    priceBob: 105000.0,
    area: 38.0,
    rooms: 1,
    bathrooms: 1,
    location: 'La Paz',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    latitude: -16.5120,
    longitude: -68.1260,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-13-sud',
    title: 'Casa Independiente',
    description: 'Casa independiente cómoda en Oruro. Tanque de agua de gran capacidad, Jardín interior, Garaje amplio. Superficie Terreno: 280 m²\nSuperficie Construida: 160 m²\nAtributos: Jardín, Garaje con Portón Eléctrico',
    price: 45258.0,
    currency: 'BOB',
    priceBob: 315000.0,
    area: 160.0,
    rooms: 4,
    bathrooms: 3,
    location: 'Oruro',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    latitude: -17.9860,
    longitude: -67.1480,
    type: 'CASA',
    isVerified: true,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-14-satelite',
    title: 'Garzonier en Planta Alta',
    description: 'Cómodo garzonier soleado en Ciudad Satélite. Calefón a gas o termotanque solar instalado. Superficie Terreno: 0 m²\nSuperficie Construida: 50 m²',
    price: 12931.0,
    currency: 'BOB',
    priceBob: 90000.0,
    area: 50.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Potosí',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    latitude: -19.5780,
    longitude: -65.7480,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-15-sucre-central',
    title: 'Oficina para Consultorios',
    description: 'Oficina adaptada para consultorios en pleno centro. Iluminación LED inteligente, Chapas digitales / cerraduras inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 65 m²\nAtributos: Iluminación LED',
    price: 20114.0,
    currency: 'BOB',
    priceBob: 140000.0,
    area: 65.0,
    rooms: 0,
    bathrooms: 1,
    location: 'Chuquisaca',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    latitude: -19.0350,
    longitude: -65.2610,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-16-urubo',
    title: 'Condominio de Casas Premium (En Planos)',
    description: 'Proyecto residencial en preventa en el Urubó. Club House, Piscina atemperada, Domótica, Aislamiento acústico y térmico. Superficie Terreno: 400 m²\nSuperficie Construida: 280 m²\nAtributos: Piscina Común, Salón de Eventos, Seguridad 24/7',
    price: 280172.0,
    currency: 'BOB',
    priceBob: 1950000.0,
    area: 280.0,
    rooms: 4,
    bathrooms: 4,
    location: 'Santa Cruz',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    latitude: -17.7720,
    longitude: -63.2120,
    type: 'CASA',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-17-tupuraya',
    title: 'Edificio de Departamentos Eco-Smart',
    description: 'Preventa de departamentos sostenibles en Tupuraya. Termotanque solar instalado, Iluminación LED inteligente, Coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 78 m²\nAtributos: Calefón Solar, Iluminación LED',
    price: 84770.0,
    currency: 'BOB',
    priceBob: 590000.0,
    area: 78.0,
    rooms: 2,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3780,
    longitude: -66.1420,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-18-riberalta',
    title: 'Complejo Hotelero y Suites',
    description: 'Inversión comercial de gran envergadura en Riberalta. Generador eléctrico de emergencia, Tanque de agua de gran capacidad, Circuito cerrado de cámaras (CCTV). Superficie Terreno: 2500 m²\nSuperficie Construida: 1800 m²',
    price: 833333.0,
    currency: 'BOB',
    priceBob: 5800000.0,
    area: 1800.0,
    rooms: 25,
    bathrooms: 30,
    location: 'Beni',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    latitude: -14.8350,
    longitude: -64.8980,
    type: 'CASA',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-19-cobija',
    title: 'Urbanización Comercial Estratégica',
    description: 'Lotes comerciales en Cobija Oeste. Lote Premium (en esquina, frente a área verde). Superficie Terreno: 500 m²\nSuperficie Construida: 0 m²',
    price: 50287.0,
    currency: 'BOB',
    priceBob: 350000.0,
    area: 500.0,
    rooms: 0,
    bathrooms: 0,
    location: 'Pando',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    latitude: -11.0220,
    longitude: -68.7520,
    type: 'TERRENO',
    isVerified: false,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-20-sirari',
    title: 'Edificio Corporativo y de Oficinas',
    description: 'Edificio corporativo de oficinas premium en Sirari. Control de acceso biométrico, Circuito cerrado de cámaras, Parqueo para visitas en el edificio. Superficie Terreno: 800 m²\nSuperficie Construida: 2400 m²\nAtributos: Parqueo de Visitas, Seguridad 24/7',
    price: 1278735.0,
    currency: 'BOB',
    priceBob: 8900000.0,
    area: 2400.0,
    rooms: 0,
    bathrooms: 12,
    location: 'Santa Cruz',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    latitude: -17.7650,
    longitude: -63.1750,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  }
];


@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // TSK-3.2 — Catálogo con Paginación por Cursor (Cursor-based Pagination)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Obtiene propiedades del catálogo usando paginación por cursor.
   *
   * La paginación por cursor es O(1) en la DB (no recalcula OFFSET) y es
   * consistente ante inserciones concurrentes, siendo ideal para 10k+ registros.
   *
   * Contrato del protocolo de paginación:
   * - Primera página: no enviar `cursor`.
   * - Páginas siguientes: enviar el `nextCursor` recibido en la respuesta anterior.
   * - Si `hasNextPage` es false, se llegó al final del catálogo.
   */
  async findAll(query: FindPropertiesQueryDto): Promise<PaginatedPropertiesResult> {
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 100);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';

    // ── Construcción de la cláusula WHERE ──────────────────────────────────
    const where: Record<string, any> = {
      // TSK-4.4: Excluir registros eliminados lógicamente
      deletedAt: null,
    };

    if (query.ownerId)  where.ownerId  = query.ownerId;
    if (query.agentId)  where.agentId  = query.agentId;
    if (query.status)   where.status   = query.status.toUpperCase();
    if (query.offerType) where.offerType = query.offerType.toUpperCase();
    if (query.type)     where.type     = query.type.toUpperCase();

    if (query.verifiedOnly === 'true' || query.verifiedOnly === '1') {
      where.isVerified = true;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice !== undefined) where.price.lte = parseFloat(query.maxPrice);
    }

    // ── Mapeos Dinámicos de Filtros Zillow Avanzados ─────────────────────────
    if (query.tipoTransaccion) {
      if (query.tipoTransaccion === 'en_venta') {
        where.offerType = 'VENTA';
        where.status = { not: 'VENDIDO' };
      } else if (query.tipoTransaccion === 'en_alquiler') {
        where.offerType = { in: ['ALQUILER', 'ANTICRETICO'] };
        where.status = { not: 'VENDIDO' };
      } else if (query.tipoTransaccion === 'vendido') {
        where.status = 'VENDIDO';
      }
    }

    if (query.precioMin !== undefined || query.precioMax !== undefined) {
      where.price = where.price || {};
      if (query.precioMin !== undefined && query.precioMin !== 'null' && query.precioMin !== '') {
        where.price.gte = parseFloat(query.precioMin);
      }
      if (query.precioMax !== undefined && query.precioMax !== 'null' && query.precioMax !== '') {
        where.price.lte = parseFloat(query.precioMax);
      }
    }

    if (query.dormitorios && query.dormitorios !== 'cualquiera') {
      const dormsCount = parseInt(query.dormitorios, 10);
      if (!isNaN(dormsCount)) {
        if (query.coincidenciaExactaDorms === 'true') {
          where.rooms = dormsCount;
        } else {
          where.rooms = { gte: dormsCount };
        }
      }
    }

    if (query.banos && query.banos !== 'cualquiera') {
      const bathsCount = parseInt(query.banos, 10);
      if (!isNaN(bathsCount)) {
        where.bathrooms = { gte: bathsCount };
      }
    }

    if (query.tiposCasa) {
      const typesList = query.tiposCasa.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);
      if (typesList.length > 0) {
        where.type = { in: typesList };
      }
    }

    if (query.piesCuadradosMin !== undefined || query.piesCuadradosMax !== undefined) {
      where.area = where.area || {};
      if (query.piesCuadradosMin !== undefined && query.piesCuadradosMin !== 'null' && query.piesCuadradosMin !== '') {
        // Convertir sqft a m² (1 sqft = 0.092903 m²)
        where.area.gte = parseFloat(query.piesCuadradosMin) * 0.092903;
      }
      if (query.piesCuadradosMax !== undefined && query.piesCuadradosMax !== 'null' && query.piesCuadradosMax !== '') {
        where.area.lte = parseFloat(query.piesCuadradosMax) * 0.092903;
      }
    }

    if (query.text) {
      where.OR = [
        { title:    { contains: query.text, mode: 'insensitive' } },
        { location: { contains: query.text, mode: 'insensitive' } },
        { address:  { contains: query.text, mode: 'insensitive' } },
      ];
    }

    // ── Resolución del cursor ──────────────────────────────────────────────
    // Pedimos limit+1 registros para saber si existe una página siguiente
    // sin necesitar un COUNT(*) adicional.
    const take = limit + 1;

    const queryOptions: any = {
      where,
      orderBy: { [sortBy]: sortDir },
      take,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        minPrice: true,
        currency: true,
        area: true,
        rooms: true,
        bathrooms: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        offerType: true,
        type: true,
        status: true,
        isVerified: true,
        imageUrl: true,
        hasFolioReal: true,
        hasCatastro: true,
        hasTestimonio: true,
        hasImpuestosAlDia: true,
        hasPlanoUsoSuelo: true,
        hasCI: true,
        approvedAt: true,
        createdAt: true,
        ownerId: true,
        agentId: true,
      },
    };

    if (query.cursor) {
      queryOptions.cursor = { id: query.cursor };
      queryOptions.skip = 1;
    }

    this.logger.log(
      `[findAll] limit=${limit} cursor=${query.cursor ?? 'INICIO'} sortBy=${sortBy}:${sortDir}`,
    );

    let properties;
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      properties = await this.prisma.property.findMany(queryOptions);
    } catch (err) {
      this.logger.warn(`Error de conexión con la base de datos en findAll: ${err.message}. Usando catálogo mock en memoria.`);
      // Filtrar y ordenar en memoria local
      const filtered = MOCK_PROPERTIES.filter(p => {
        const pAny = p as any;
        if (query.ownerId && pAny.ownerId !== query.ownerId) return false;
        if (query.agentId && pAny.agentId !== query.agentId) return false;
        if (query.status && pAny.status !== query.status.toUpperCase()) return false;
        if (query.offerType && pAny.offerType !== query.offerType.toUpperCase()) return false;
        if (query.type && pAny.type !== query.type.toUpperCase()) return false;
        if ((query.verifiedOnly === 'true' || query.verifiedOnly === '1') && !pAny.isVerified) return false;
        
        if (query.minPrice !== undefined && pAny.price < parseFloat(query.minPrice)) return false;
        if (query.maxPrice !== undefined && pAny.price > parseFloat(query.maxPrice)) return false;
        
        if (query.tipoTransaccion) {
          if (query.tipoTransaccion === 'en_venta' && (p.offerType !== 'VENTA' || p.status === 'VENDIDO')) return false;
          if (query.tipoTransaccion === 'en_alquiler' && (!['ALQUILER', 'ANTICRETICO'].includes(p.offerType) || p.status === 'VENDIDO')) return false;
          if (query.tipoTransaccion === 'vendido' && p.status !== 'VENDIDO') return false;
        }
        
        if (query.precioMin !== undefined && query.precioMin !== 'null' && query.precioMin !== '' && p.price < parseFloat(query.precioMin)) return false;
        if (query.precioMax !== undefined && query.precioMax !== 'null' && query.precioMax !== '' && p.price > parseFloat(query.precioMax)) return false;
        
        if (query.dormitorios && query.dormitorios !== 'cualquiera') {
          const dormsCount = parseInt(query.dormitorios, 10);
          if (!isNaN(dormsCount)) {
            if (query.coincidenciaExactaDorms === 'true') {
              if (p.rooms !== dormsCount) return false;
            } else {
              if (p.rooms < dormsCount) return false;
            }
          }
        }
        if (query.banos && query.banos !== 'cualquiera') {
          const bathsCount = parseInt(query.banos, 10);
          if (!isNaN(bathsCount) && p.bathrooms < bathsCount) return false;
        }
        if (query.tiposCasa) {
          const typesList = query.tiposCasa.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          if (typesList.length > 0 && !typesList.includes(p.type.toLowerCase())) return false;
        }
        if (query.text) {
          const text = query.text.toLowerCase();
          const match = p.title.toLowerCase().includes(text) || p.location.toLowerCase().includes(text);
          if (!match) return false;
        }
        return true;
      });

      // Ordenar en memoria
      const sorted = [...filtered].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'price') return (a.price - b.price) * dir;
        if (sortBy === 'area') return (a.area - b.area) * dir;
        return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      });

      // Paginación simple en memoria
      let startIndex = 0;
      if (query.cursor) {
        const idx = sorted.findIndex(p => p.id === query.cursor);
        if (idx !== -1) startIndex = idx + 1;
      }
      properties = sorted.slice(startIndex, startIndex + take);
    }

    // ── Determinación de página siguiente ─────────────────────────────────
    const hasNextPage = properties.length > limit;
    const pageData = hasNextPage ? properties.slice(0, limit) : properties;
    const nextCursor = hasNextPage ? (pageData[pageData.length - 1]?.id ?? null) : null;

    return {
      data: pageData.map((p) => ({
        ...p,
        verified: p.isVerified, // alias para compatibilidad con frontend
        imageUrl:
          p.imageUrl ??
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
      })),
      meta: {
        count: pageData.length,
        limit,
        nextCursor,
        hasNextPage,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Detalle de Propiedad
  // ─────────────────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    let property;
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      property = await this.prisma.property.findFirst({
        where: { id, deletedAt: null }, // TSK-4.4: ignora soft-deleted
        include: {
          priceHistory: {
            orderBy: { recordedAt: 'desc' },
            take: 10,
          },
        },
      });
    } catch (err) {
      this.logger.warn(`Error de conexión con la base de datos en findOne: ${err.message}. Buscando en catálogo mock.`);
      property = MOCK_PROPERTIES.find(p => p.id === id);
    }

    if (!property) {
      throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
    }

    return { ...property, verified: (property as any).isVerified, priceHistory: (property as any).priceHistory || [] };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Creación de Propiedad
  // ─────────────────────────────────────────────────────────────────────────────

  async create(dto: CreatePropertyDto) {
    this.logger.log(`[create] Nueva propiedad: ${dto.title}`);
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const dbProperty = await this.prisma.property.create({
        data: {
          title: dto.title,
          description: dto.description,
          price: parseFloat(String(dto.price)),
          minPrice: dto.minPrice ? parseFloat(String(dto.minPrice)) : null,
          area: parseFloat(String(dto.area)),
          rooms: parseInt(String(dto.rooms ?? 0)),
          bathrooms: parseInt(String(dto.bathrooms ?? 0)),
          location: dto.location,
          address: dto.address ?? null,
          offerType: dto.offerType ? (dto.offerType.toUpperCase() as any) : 'VENTA',
          imageUrl:
            dto.imageUrl ??
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          latitude: dto.latitude ?? -17.3895,
          longitude: dto.longitude ?? -66.1568,
          isVerified: false,
          status: 'NUEVA_PUBLICACION',
          ownerId: dto.ownerId ?? null,
          hasFolioReal: dto.hasFolioReal ?? false,
          hasCatastro: dto.hasCatastro ?? false,
          hasTestimonio: dto.hasTestimonio ?? false,
          hasImpuestosAlDia: dto.hasImpuestosAlDia ?? false,
          hasPlanoUsoSuelo: dto.hasPlanoUsoSuelo ?? false,
          hasCI: dto.hasCI ?? false,
        },
      });

      return {
        message: 'Propiedad registrada exitosamente en Propio.',
        data: dbProperty,
      };
    } catch (error) {
      this.logger.error(`Error al registrar propiedad: ${error instanceof Error ? error.message : String(error)}`);
      const mockProperty = {
        id: `prop-mock-${Date.now()}`,
        title: dto.title,
        description: dto.description,
        price: parseFloat(String(dto.price)),
        minPrice: dto.minPrice ? parseFloat(String(dto.minPrice)) : null,
        area: parseFloat(String(dto.area)),
        rooms: parseInt(String(dto.rooms ?? 0)),
        bathrooms: parseInt(String(dto.bathrooms ?? 0)),
        location: dto.location,
        address: dto.address ?? null,
        offerType: dto.offerType ? dto.offerType.toUpperCase() : 'VENTA',
        type: 'DEPARTAMENTO',
        imageUrl: dto.imageUrl ?? 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        latitude: dto.latitude ?? -17.3895,
        longitude: dto.longitude ?? -66.1568,
        isVerified: false,
        status: 'NUEVA_PUBLICACION',
        ownerId: dto.ownerId ?? null,
        hasFolioReal: dto.hasFolioReal ?? false,
        hasCatastro: dto.hasCatastro ?? false,
        hasTestimonio: dto.hasTestimonio ?? false,
        hasImpuestosAlDia: dto.hasImpuestosAlDia ?? false,
        hasPlanoUsoSuelo: dto.hasPlanoUsoSuelo ?? false,
        hasCI: dto.hasCI ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      MOCK_PROPERTIES.push(mockProperty);
      return {
        message: 'Propiedad registrada exitosamente en Propio (resiliencia local).',
        data: mockProperty,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TSK-4.4 — Eliminación Lógica (Soft Delete)
  // Previene pérdida accidental de datos relacionados (Contratos, Leads, etc.)
  // ─────────────────────────────────────────────────────────────────────────────

  async remove(id: string) {
    this.logger.warn(`[remove] Soft-delete de propiedad ID: ${id}`);
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const existing = await this.prisma.property.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
      }

      await this.prisma.property.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        message: `Propiedad con ID "${id}" eliminada lógicamente del sistema. Los datos históricos se preservan.`,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Error al eliminar propiedad ${id}: ${err.message}`);
      
      const idx = MOCK_PROPERTIES.findIndex(p => p.id === id);
      if (idx !== -1) {
        (MOCK_PROPERTIES[idx] as any).deletedAt = new Date();
        return {
          message: `Propiedad con ID "${id}" eliminada lógicamente del sistema (resiliencia local).`,
        };
      }
      throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Actualización de Estado (Admin)
  // ─────────────────────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: string, observationNotes?: string) {
    const uppercaseStatus = status.toUpperCase();
    this.logger.log(`[updateStatus] Propiedad ${id} → ${uppercaseStatus}`);
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const existing = await this.prisma.property.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
      }

      const updated = await this.prisma.property.update({
        where: { id },
        data: {
          status: uppercaseStatus as any,
          observationNotes: observationNotes ?? null,
          isVerified: uppercaseStatus === 'APROBADO',
          approvedAt: uppercaseStatus === 'APROBADO' ? new Date() : existing.approvedAt,
        },
      });

      return {
        message: `Estado de propiedad actualizado a "${uppercaseStatus}".`,
        data: updated,
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Error al actualizar estado de propiedad ${id}: ${err.message}`);
      
      const idx = MOCK_PROPERTIES.findIndex(p => p.id === id);
      if (idx !== -1) {
        const mockP = MOCK_PROPERTIES[idx];
        (mockP as any).status = uppercaseStatus;
        (mockP as any).isVerified = uppercaseStatus === 'APROBADO';
        return {
          message: `Estado de propiedad actualizado a "${uppercaseStatus}" (resiliencia local).`,
          data: mockP,
        };
      }
      throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
    }
  }
}
