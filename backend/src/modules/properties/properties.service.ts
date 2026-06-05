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
    id: 'prop-1-cala-cala',
    title: 'Casa Familiar en Cala Cala',
    description: 'Espléndida residencia de dos plantas ubicada en una de las zonas más exclusivas de Cochabamba. Cuenta con jardín interior privado, churrasquera cubierta y acabados de primera calidad.',
    price: 320000,
    area: 350,
    rooms: 5,
    bathrooms: 4,
    location: 'Cala Cala, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3680,
    longitude: -66.1590,
    type: 'CASA',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-01-01'),
    deletedAt: null
  },
  {
    id: 'prop-2-queru-queru',
    title: 'Penthouse de Lujo en Queru Queru',
    description: 'Espectacular penthouse de estreno ubicado en el último piso del Edificio Skyview. Terraza panorámica con jacuzzi, acabados europeos y domótica integrada.',
    price: 185000,
    area: 195,
    rooms: 4,
    bathrooms: 3,
    location: 'Queru Queru, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3695,
    longitude: -66.1480,
    type: 'DEPARTAMENTO',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-01-02'),
    deletedAt: null
  },
  {
    id: 'prop-3-el-prado',
    title: 'Departamento Moderno en El Prado',
    description: 'Departamento de 2 habitaciones recién remodelado en pleno Prado. Cocina americana integrada, balcón privado y portería 24h. Ideal para profesionales y ejecutivos.',
    price: 95000,
    area: 85,
    rooms: 2,
    bathrooms: 2,
    location: 'El Prado, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3820,
    longitude: -66.1560,
    type: 'DEPARTAMENTO',
    isVerified: false,
    offerType: 'ALQUILER',
    status: 'APROBADO',
    createdAt: new Date('2026-01-03'),
    deletedAt: null
  },
  {
    id: 'prop-4-sarco',
    title: 'Terreno Comercial en Sarco',
    description: 'Excelente terreno comercial de alta plusvalía en zona de alto tráfico en Sarco. Ideal para proyectos corporativos o inmobiliarios multifamiliares.',
    price: 48000,
    area: 400,
    rooms: 0,
    bathrooms: 0,
    location: 'Sarco, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3800,
    longitude: -66.1750,
    type: 'TERRENO',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-01-04'),
    deletedAt: null
  },
  {
    id: 'prop-5-mayorazgo',
    title: 'Oficina Premium en Mayorazgo',
    description: 'Oficina moderna corporativa con divisiones de vidrio templado, aire acondicionado y dos parqueos subterráneos. Seguridad 24 horas y sala de reuniones común.',
    price: 135000,
    area: 120,
    rooms: 0,
    bathrooms: 2,
    location: 'Mayorazgo, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3650,
    longitude: -66.1700,
    type: 'OFICINA',
    isVerified: true,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-01-05'),
    deletedAt: null
  },
  {
    id: 'prop-6-muyurina',
    title: 'Casa de Campo en Muyurina',
    description: 'Hermosa finca campestre con amplias áreas verdes, árboles frutales y piscina privada. Ideal para escapar de la rutina urbana o desarrollo turístico.',
    price: 220000,
    area: 480,
    rooms: 6,
    bathrooms: 4,
    location: 'Muyurina, Cochabamba',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    latitude: -17.3780,
    longitude: -66.1380,
    type: 'CASA',
    isVerified: false,
    offerType: 'VENTA',
    status: 'APROBADO',
    createdAt: new Date('2026-01-06'),
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
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TSK-4.4 — Eliminación Lógica (Soft Delete)
  // Previene pérdida accidental de datos relacionados (Contratos, Leads, etc.)
  // ─────────────────────────────────────────────────────────────────────────────

  async remove(id: string) {
    this.logger.warn(`[remove] Soft-delete de propiedad ID: ${id}`);

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
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Actualización de Estado (Admin)
  // ─────────────────────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: string, observationNotes?: string) {
    const uppercaseStatus = status.toUpperCase();
    this.logger.log(`[updateStatus] Propiedad ${id} → ${uppercaseStatus}`);

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
  }
}
