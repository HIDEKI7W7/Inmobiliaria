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

    const properties = await this.prisma.property.findMany(queryOptions);

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
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null }, // TSK-4.4: ignora soft-deleted
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`La propiedad con ID "${id}" no fue encontrada.`);
    }

    return { ...property, verified: property.isVerified };
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
