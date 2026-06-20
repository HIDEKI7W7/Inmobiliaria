import { Injectable, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
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

const MOCK_PROPERTIES: any[] = [
  {
    id: 'prop-1-muyurina',
    title: 'Casa de Campo en Muyurina',
    description: 'Casa de Campo en Muyurina. Jardín interior amplio, churrasquero propio, suite con vestidor. Superficie Terreno: 450 m²\nSuperficie Construida: 220 m²',
    price: 220000.0,
    currency: 'BOB',
    priceBob: 2200000.0,
    area: 220.0,
    rooms: 4,
    bathrooms: 3,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3890,
    longitude: -66.1390,
    type: 'CASA',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-2-mayorazgo',
    title: 'Oficina Premium en Mayorazgo',
    description: 'Oficina Premium en Mayorazgo. Iluminación LED inteligente, control de acceso biométrico, chapas digitales. Superficie Terreno: 0 m²\nSuperficie Construida: 115 m²',
    price: 135000.0,
    currency: 'BOB',
    priceBob: 1350000.0,
    area: 115.0,
    rooms: 0,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3680,
    longitude: -66.1780,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-3-queru-queru',
    title: 'Penthouse de Lujo en Queru Queru',
    description: 'Penthouse de Lujo en Queru Queru. Suite principal con vestidor, terraza privada con vista panorámica, parqueo subterráneo. Superficie Terreno: 0 m²\nSuperficie Construida: 195 m²',
    price: 128000.0,
    currency: 'BOB',
    priceBob: 1280000.0,
    area: 195.0,
    rooms: 4,
    bathrooms: 3,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
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
    id: 'prop-4-cala-cala',
    title: 'Casa Familiar de Estilo Moderno',
    description: 'Casa Familiar de Estilo Moderno. Cocina remodelada, jardín posterior amplio, conexión de gas domiciliario. Superficie Terreno: 350 m²\nSuperficie Construida: 250 m²',
    price: 210000.0,
    currency: 'BOB',
    priceBob: 2100000.0,
    area: 250.0,
    rooms: 5,
    bathrooms: 4,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
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
    id: 'prop-5-america',
    title: 'Terreno Premium Comercial',
    description: 'Terreno Premium Comercial. Lote Premium en esquina, frente a área verde, alta afluencia. Superficie Terreno: 600 m²\nSuperficie Construida: 0 m²',
    price: 185000.0,
    currency: 'BOB',
    priceBob: 1850000.0,
    area: 0.0,
    rooms: 0,
    bathrooms: 0,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3715,
    longitude: -66.1518,
    type: 'TERRENO',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-6-la-chimba',
    title: 'Galpón Industrial de Alta Capacidad',
    description: 'Galpón Industrial de Alta Capacidad. Cerco eléctrico perimetral, cisterna propia de gran capacidad. Superficie Terreno: 1,200 m²\nSuperficie Construida: 900 m²',
    price: 340000.0,
    currency: 'BOB',
    priceBob: 3400000.0,
    area: 900.0,
    rooms: 0,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    latitude: -17.4080,
    longitude: -66.1850,
    type: 'TERRENO',
    isVerified: false,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-7-el-prado',
    title: 'Departamento Amoblado Central',
    description: 'Departamento Amoblado Central. Iluminación LED, conexión de gas domiciliario, edificio pet-friendly. Superficie Terreno: 0 m²\nSuperficie Construida: 85 m²',
    price: 450.0,
    currency: 'BOB',
    priceBob: 4500.0,
    area: 85.0,
    rooms: 2,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3940,
    longitude: -66.1560,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-8-sarco',
    title: 'Monoambiente Moderno',
    description: 'Monoambiente Moderno. Seguridad de vigilancia 24/7, cajón de parqueo subterráneo, coworking space. Superficie Terreno: 0 m²\nSuperficie Construida: 42 m²',
    price: 280.0,
    currency: 'BOB',
    priceBob: 2800.0,
    area: 42.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3790,
    longitude: -66.1730,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-9-america-comercial',
    title: 'Local Comercial en Planta Baja',
    description: 'Local Comercial en Planta Baja. Luces LED empotradas, chapas digitales, vidrieras de alto tráfico. Superficie Terreno: 0 m²\nSuperficie Construida: 130 m²',
    price: 700.0,
    currency: 'BOB',
    priceBob: 7000.0,
    area: 130.0,
    rooms: 0,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3710,
    longitude: -66.1550,
    type: 'OFICINA',
    isVerified: false,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-10-lomas-aranjuez',
    title: 'Garzonier Ejecutivo',
    description: 'Garzonier Ejecutivo. Box de vidrio templado, entorno de alta privacidad, gas domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 55 m²',
    price: 350.0,
    currency: 'BOB',
    priceBob: 3500.0,
    area: 55.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3520,
    longitude: -66.1530,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-11-pacata-alta',
    title: 'Casa en Condominio Cerrado',
    description: 'Casa en Condominio Cerrado. Churrasquero propio techado, áreas verdes comunes, parque infantil. Superficie Terreno: 300 m²\nSuperficie Construida: 210 m²',
    price: 680.0,
    currency: 'BOB',
    priceBob: 6800.0,
    area: 210.0,
    rooms: 3,
    bathrooms: 3,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3720,
    longitude: -66.1210,
    type: 'CASA',
    isVerified: false,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-12-las-cuadras',
    title: 'Departamento Familiar Amplio',
    description: 'Departamento Familiar Amplio. Parqueo doble paralelo, baulera amplia, conexión de gas domiciliario. Superficie Terreno: 0 m²\nSuperficie Construida: 120 m²',
    price: 24000.0,
    currency: 'BOB',
    priceBob: 240000.0,
    area: 120.0,
    rooms: 3,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3980,
    longitude: -66.1460,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-13-san-pedro',
    title: 'Monoambiente Funcional',
    description: 'Monoambiente Funcional. Control de acceso biométrico, edificio pet-friendly, acabados modernos. Superficie Terreno: 0 m²\nSuperficie Construida: 38 m²',
    price: 9500.0,
    currency: 'BOB',
    priceBob: 95000.0,
    area: 38.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3950,
    longitude: -66.1380,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-14-pacata-baja',
    title: 'Casa Independiente Solida',
    description: 'Casa Independiente Solida. Cisterna propia de agua, jardín posterior, cerco eléctrico perimetral. Superficie Terreno: 280 m²\nSuperficie Construida: 160 m²',
    price: 31000.0,
    currency: 'BOB',
    priceBob: 310000.0,
    area: 160.0,
    rooms: 4,
    bathrooms: 3,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3780,
    longitude: -66.1310,
    type: 'CASA',
    isVerified: true,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-15-cona-cona',
    title: 'Garzonier Cómodo',
    description: 'Garzonier Cómodo. Calefón a gas instalado, iluminación LED empotrada. Superficie Terreno: 0 m²\nSuperficie Construida: 50 m²',
    price: 8500.0,
    currency: 'BOB',
    priceBob: 85000.0,
    area: 50.0,
    rooms: 1,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    latitude: -17.4020,
    longitude: -66.1950,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-16-temporal',
    title: 'Oficina para Consultorios',
    description: 'Oficina para Consultorios. Circuito cerrado de cámaras, chapas digitales inteligentes. Superficie Terreno: 0 m²\nSuperficie Construida: 65 m²',
    price: 13000.0,
    currency: 'BOB',
    priceBob: 130000.0,
    area: 65.0,
    rooms: 0,
    bathrooms: 1,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3620,
    longitude: -66.1480,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'ANTICRETICO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-17-cruce-taquina',
    title: 'Condominio de Casas Smart (En Planos)',
    description: 'Condominio de Casas Smart (En Planos). Club House con piscina atemperada, domótica, ventanas de doble vidrio (DVH). Superficie Terreno: 400 m²\nSuperficie Construida: 280 m²',
    price: 190000.0,
    currency: 'BOB',
    priceBob: 1900000.0,
    area: 280.0,
    rooms: 4,
    bathrooms: 4,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3560,
    longitude: -66.1680,
    type: 'CASA',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-18-hipodromo',
    title: 'Edificio Eco-Smart',
    description: 'Edificio Eco-Smart. Termotanque solar instalado, iluminación LED inteligente, área de coworking integrada. Superficie Terreno: 0 m²\nSuperficie Construida: 78 m²',
    price: 58000.0,
    currency: 'BOB',
    priceBob: 580000.0,
    area: 78.0,
    rooms: 2,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3990,
    longitude: -66.1750,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-19-beato-salomon',
    title: 'Complejo de Suites Ejecutivas',
    description: 'Complejo de Suites Ejecutivas. Walk-in closet, sauna común, circuito cerrado de televisión (CCTV). Superficie Terreno: 0 m²\nSuperficie Construida: 110 m²',
    price: 115000.0,
    currency: 'BOB',
    priceBob: 1150000.0,
    area: 110.0,
    rooms: 3,
    bathrooms: 2,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3820,
    longitude: -66.1280,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  },
  {
    id: 'prop-20-america-oeste',
    title: 'Torre Corporativa de Oficinas',
    description: 'Torre Corporativa de Oficinas. Control de acceso biométrico, parqueo de visitas en el edificio, generador eléctrico de emergencia. Superficie Terreno: 800 m²\nSuperficie Construida: 2,400 m²',
    price: 420000.0,
    currency: 'BOB',
    priceBob: 4200000.0,
    area: 2400.0,
    rooms: 0,
    bathrooms: 12,
    location: 'Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3695,
    longitude: -66.1610,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'PROYECTO',
    status: 'APROBADO',
    createdAt: new Date('2026-06-12'),
    deletedAt: null
  }
];


@Injectable()
export class PropertiesService implements OnModuleInit {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Disparar cada 1 hora la limpieza de expirados
    setInterval(() => {
      this.checkAndCleanExpiredProperties();
    }, 60 * 60 * 1000);
    
    // Y una ejecución inicial inmediata con delay
    setTimeout(() => {
      this.checkAndCleanExpiredProperties();
    }, 5000);
  }

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
        .map((t: string) => t.trim().toLowerCase())
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
          const typesList = query.tiposCasa.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
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

  async update(id: string, dto: any) {
    this.logger.log(`[update] Actualizando propiedad ID: ${id}`);
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
          title: dto.title ?? existing.title,
          description: dto.description ?? existing.description,
          price: dto.price !== undefined ? parseFloat(dto.price) : existing.price,
          currency: dto.currency ?? existing.currency,
          area: dto.area !== undefined ? parseFloat(dto.area) : existing.area,
          imageUrl: dto.imageUrl ?? existing.imageUrl,
        },
      });
      return {
        message: 'Propiedad actualizada exitosamente en base de datos.',
        data: updated,
      };
    } catch (err) {
      this.logger.warn(`Error al actualizar propiedad en DB: ${err.message}. Actualizando en catálogo mock.`);
      const idx = MOCK_PROPERTIES.findIndex(p => p.id === id);
      if (idx !== -1) {
        MOCK_PROPERTIES[idx] = {
          ...MOCK_PROPERTIES[idx],
          title: dto.title ?? MOCK_PROPERTIES[idx].title,
          description: dto.description ?? MOCK_PROPERTIES[idx].description,
          price: dto.price !== undefined ? parseFloat(dto.price) : MOCK_PROPERTIES[idx].price,
          priceBob: dto.priceBob !== undefined ? parseFloat(dto.priceBob) : MOCK_PROPERTIES[idx].priceBob,
          currency: dto.currency ?? MOCK_PROPERTIES[idx].currency,
          area: dto.area !== undefined ? parseFloat(dto.area) : MOCK_PROPERTIES[idx].area,
          imageUrl: dto.imageUrl ?? MOCK_PROPERTIES[idx].imageUrl,
        };
        return {
          message: 'Propiedad actualizada exitosamente (resiliencia local).',
          data: MOCK_PROPERTIES[idx],
        };
      }
      throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
    }
  }

  checkAndCleanExpiredProperties() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    this.logger.log('Cron/Disparador: Iniciando verificación de vigencia temporal de anuncios (90 días)...');

    // Clean mock properties
    let expiredMockCount = 0;
    for (let i = MOCK_PROPERTIES.length - 1; i >= 0; i--) {
      const p = MOCK_PROPERTIES[i];
      const createdDate = new Date(p.createdAt || new Date());
      if (createdDate < ninetyDaysAgo && p.deletedAt === null) {
        this.logger.warn(`Cron/Disparador: Expirando propiedad mock "${p.title}" (ID: ${p.id}) por superar 90 días.`);
        p.deletedAt = new Date(); // soft delete
        expiredMockCount++;
      }
    }
    if (expiredMockCount > 0) {
      this.logger.log(`Cron/Disparador: Expirados ${expiredMockCount} anuncios mock.`);
    }
    
    // Also try cleaning database if connected
    if (this.prisma.isConnected) {
      this.prisma.property.updateMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      }).then(res => {
        if (res.count > 0) {
          this.logger.warn(`Cron/Disparador: Expirados ${res.count} anuncios en base de datos por superar 90 días.`);
        }
      }).catch(err => {
        this.logger.error(`Error en expiración automática de DB: ${err.message}`);
      });
    }
  }
}
