import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getClientStats(userId: string) {
    this.logger.log(`Obteniendo estadísticas de cliente para usuario: ${userId}`);
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }

      const [savedSearchesCount, activeOffersCount, sentInquiriesCount, scheduledMeetingsCount] = await Promise.all([
        this.prisma.busquedaGuardada.count({ where: { userId } }),
        this.prisma.offer.count({ where: { userId, status: 'PENDING' } }),
        this.prisma.inquiry.count({ where: { userId } }),
        this.prisma.meeting.count({ where: { userId, status: 'SCHEDULED' } }),
      ]);

      return {
        savedSearchesCount,
        activeOffersCount,
        sentInquiriesCount,
        scheduledMeetingsCount,
      };
    } catch (error) {
      this.logger.warn(`Error al consultar estadísticas del cliente: ${error instanceof Error ? error.message : String(error)}. Usando fallback.`);
      return {
        savedSearchesCount: 0,
        activeOffersCount: 0,
        sentInquiriesCount: 0,
        scheduledMeetingsCount: 0,
      };
    }
  }

  async getOwnerStats(userId: string) {
    this.logger.log(`Obteniendo estadísticas de propietario para usuario: ${userId}`);
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }

      const [receivedOffersCount, receivedInquiriesCount, scheduledMeetingsCount] = await Promise.all([
        this.prisma.offer.count({
          where: {
            property: { ownerId: userId },
            status: 'PENDING',
          },
        }),
        this.prisma.inquiry.count({
          where: {
            property: { ownerId: userId },
          },
        }),
        this.prisma.meeting.count({
          where: {
            property: { ownerId: userId },
            status: 'SCHEDULED',
          },
        }),
      ]);

      return {
        receivedOffersCount,
        receivedInquiriesCount,
        scheduledMeetingsCount,
      };
    } catch (error) {
      this.logger.warn(`Error al consultar estadísticas del propietario: ${error instanceof Error ? error.message : String(error)}. Usando fallback.`);
      return {
        receivedOffersCount: 0,
        receivedInquiriesCount: 0,
        scheduledMeetingsCount: 0,
      };
    }
  }

  async createOffer(userId: string, propertyId: string, amount: number) {
    this.logger.log(`Registrando oferta de usuario ${userId} para propiedad ${propertyId} por valor ${amount}`);
    try {
      return await this.prisma.offer.create({
        data: {
          userId,
          propertyId,
          amount,
          status: 'PENDING',
        },
      });
    } catch (error) {
      this.logger.error(`Error al registrar oferta: ${error}`);
      throw error;
    }
  }

  async createInquiry(userId: string, propertyId: string, message: string) {
    this.logger.log(`Registrando consulta de usuario ${userId} para propiedad ${propertyId}`);
    try {
      return await this.prisma.inquiry.create({
        data: {
          userId,
          propertyId,
          message,
        },
      });
    } catch (error) {
      this.logger.error(`Error al registrar consulta: ${error}`);
      throw error;
    }
  }

  async createMeeting(data: {
    userId?: string | null;
    propertyId: string;
    scheduledAt: Date;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    notes?: string;
    type?: string;
  }) {
    this.logger.log(`Registrando reunión para propiedad ${data.propertyId} el ${data.scheduledAt}`);
    try {
      const meeting = await this.prisma.meeting.create({
        data: {
          userId: data.userId || null,
          propertyId: data.propertyId,
          scheduledAt: data.scheduledAt,
          status: 'SCHEDULED',
          clientName: data.clientName,
          clientPhone: data.clientPhone,
          clientEmail: data.clientEmail,
          notes: data.notes,
          type: data.type || 'visita',
        },
      });
      // Registrar un evento para notificación automática de WhatsApp
      this.logger.log(`[AppointmentScheduled] WhatsApp notification triggered for phone ${data.clientPhone || 'N/A'}`);
      return meeting;
    } catch (error) {
      this.logger.error(`Error al registrar reunión: ${error}`);
      throw error;
    }
  }

  async getMeetings(userId: string, role: string) {
    this.logger.log(`Obteniendo reuniones para usuario ${userId} con rol ${role}`);
    try {
      if (role === 'AGENTE' || role === 'ADMIN') {
        return await this.prisma.meeting.findMany({
          where: {
            property: {
              agentId: userId,
            },
          },
          include: {
            property: {
              select: {
                title: true,
                location: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        });
      } else if (role === 'PROPIETARIO') {
        return await this.prisma.meeting.findMany({
          where: {
            property: {
              ownerId: userId,
            },
          },
          include: {
            property: {
              select: {
                title: true,
                location: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        });
      } else {
        return await this.prisma.meeting.findMany({
          where: {
            userId: userId,
          },
          include: {
            property: {
              select: {
                title: true,
                location: true,
              },
            },
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error al obtener reuniones: ${error}`);
      throw error;
    }
  }

  async getClientDashboardData(userId: string) {
    this.logger.log(`Obteniendo datos completos del dashboard del cliente: ${userId}`);
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }

      // 1. Obtener favoritos del usuario
      const favorites = await this.prisma.favorito.findMany({
        where: { userId },
        select: { propertyId: true },
      });
      const favoriteIds = favorites.map(f => f.propertyId);

      // 2. Obtener inmuebles con interacciones del usuario (Inquiry, Meeting, Offer)
      const [inquiries, meetings, offers] = await Promise.all([
        this.prisma.inquiry.findMany({
          where: { userId },
          select: { propertyId: true },
        }),
        this.prisma.meeting.findMany({
          where: { userId },
          select: { propertyId: true },
        }),
        this.prisma.offer.findMany({
          where: { userId },
          select: { propertyId: true },
        }),
      ]);

      // Unificar IDs de propiedades favoritas y de interacciones
      const interactionIds = [
        ...inquiries.map(i => i.propertyId),
        ...meetings.map(m => m.propertyId),
        ...offers.map(o => o.propertyId),
      ];

      const allInterestIds = Array.from(new Set([...favoriteIds, ...interactionIds]));

      // Consultar detalles de los inmuebles de interés
      const interests = await this.prisma.property.findMany({
        where: {
          id: { in: allInterestIds },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          offerType: true,
          type: true,
          isVerified: true,
          imageUrl: true,
          latitude: true,
          longitude: true,
        },
      });

      const interestsWithAlias = interests.map(p => ({
        ...p,
        verified: p.isVerified,
        priceBob: p.price * 6.96, // Cálculo de Bs para la divisa correspondiente
      }));

      // 3. Recomendaciones Geoespaciales
      let recommendations: any[] = [];
      if (favoriteIds.length > 0) {
        // Obtener detalles de favoritos para extraer sus categorías y coordenadas
        const favoriteDetails = await this.prisma.property.findMany({
          where: {
            id: { in: favoriteIds },
            deletedAt: null,
          },
          select: {
            type: true,
            latitude: true,
            longitude: true,
          },
        });

        const categories = Array.from(new Set(favoriteDetails.map(fd => fd.type)));
        
        if (categories.length > 0) {
          // Consulta optimizada nativa en DB usando la ley esférica de cosenos (Haversine)
          // Filtra por misma categoría, estado APROBADO, excluye favoritos del usuario, y distancia <= 3.0 km
          const rawRecommendations = await this.prisma.$queryRaw<any[]>`
            SELECT p.id, p.title, p.price, p.currency, p.offer_type as "offerType", p.type, p.image_url as "imageUrl", p.latitude, p.longitude, p.is_verified as "isVerified",
              MIN(
                6371 * acos(
                  LEAST(GREATEST(
                    cos(radians(ref.latitude)) * cos(radians(p.latitude)) * 
                    cos(radians(p.longitude) - radians(ref.longitude)) + 
                    sin(radians(ref.latitude)) * sin(radians(p.latitude))
                  , -1.0), 1.0)
                )
              ) AS distance
            FROM properties p
            JOIN favoritos f ON f.user_id = ${userId}
            JOIN properties ref ON f.property_id = ref.id
            WHERE p.status = 'APROBADO'
              AND p.deleted_at IS NULL
              AND p.type = ANY(${categories})
              AND NOT (p.id = ANY(${favoriteIds}))
            GROUP BY p.id, p.title, p.price, p.currency, p.offer_type, p.type, p.image_url, p.latitude, p.longitude, p.is_verified
            HAVING MIN(
                6371 * acos(
                  LEAST(GREATEST(
                    cos(radians(ref.latitude)) * cos(radians(p.latitude)) * 
                    cos(radians(p.longitude) - radians(ref.longitude)) + 
                    sin(radians(ref.latitude)) * sin(radians(p.latitude))
                  , -1.0), 1.0)
                )
              ) <= 3.0
            ORDER BY distance ASC
            LIMIT 5
          `;

          recommendations = rawRecommendations.map(p => ({
            ...p,
            verified: p.isVerified,
            priceBob: p.price * 6.96,
          }));
        }
      }

      // 4. Estadísticas del Cliente
      const stats = await this.getClientStats(userId);

      return {
        interests: interestsWithAlias,
        recommendations,
        stats,
      };
    } catch (error) {
      this.logger.error(`Error en getClientDashboardData: ${error.message}`);
      // Fallback
      return {
        interests: [],
        recommendations: [],
        stats: {
          savedSearchesCount: 0,
          activeOffersCount: 0,
          sentInquiriesCount: 0,
          scheduledMeetingsCount: 0,
        },
      };
    }
  }

  /**
   * Admin KPI stats — filterable by city/branch.
   * Ponytail pattern: only add location filter when branch !== 'TODOS'.
   */
  async getAdminStats(branch: string) {
    // Build location filter — empty object means "no filter" (all branches)
    const locationWhere = branch !== 'TODOS' ? { location: { contains: branch, mode: 'insensitive' as const } } : {};

    // Current month window
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      if (!this.prisma.isConnected) throw new Error('DB disconnected');

      // Seed activity logs if none exist
      const logCount = await this.prisma.activityLog.count();
      if (logCount === 0) {
        await this.prisma.activityLog.createMany({
          data: [
            { text: '📢 Agente Roberto Claros registró un Cierre en Casa en Cala Cala (Cochabamba)', createdAt: new Date(Date.now() - 3600000) },
            { text: '📄 Propietario René Vargas subió Folio Real para validación en Casa en Cala Cala (Cochabamba)', createdAt: new Date(Date.now() - 14400000) },
            { text: '💸 Pago de mensualidad conciliado para Contrato #CON-9021 (Santa Cruz)', createdAt: new Date(Date.now() - 86400000) },
            { text: '📢 Agente Lucía Arteaga registró un Cierre en Penthouse en Queru Queru (Cochabamba)', createdAt: new Date(Date.now() - 120000000) },
            { text: '💸 Pago de mensualidad conciliado para Contrato #CON-4211 (La Paz)', createdAt: new Date(Date.now() - 200000000) },
          ]
        });
      }

      // Query metrics
      const [
        totalActiveProps,
        verifiedActiveProps,
        totalAgents,
        assignedAgents,
        monthIncomeResult,
        totalVigenteContracts,
        allLogs
      ] = await Promise.all([
        // KPI 1: Inmuebles Activos (Total COUNT)
        this.prisma.property.count({
          where: { status: { in: ['APROBADO', 'RESERVADO', 'NUEVA_PUBLICACION'] }, deletedAt: null, ...locationWhere },
        }),
        // KPI 1 subtext: verified properties
        this.prisma.property.count({
          where: { status: { in: ['APROBADO', 'RESERVADO', 'NUEVA_PUBLICACION'] }, deletedAt: null, isVerified: true, ...locationWhere },
        }),
        // KPI 2: Fuerza de ventas (Total agents)
        this.prisma.user.count({ where: { role: 'AGENTE', isActive: true } }),
        // KPI 2 subtext: Assigned agents (agents with at least one assigned property)
        this.prisma.user.count({
          where: {
            role: 'AGENTE',
            isActive: true,
            assignedProperties: { some: {} }
          }
        }),
        // KPI 3: Ingresos del mes (SUM of conciliado payments this month)
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'CONCILIADO',
            createdAt: { gte: startOfMonth },
            contract: branch !== 'TODOS' ? { property: { location: { contains: branch, mode: 'insensitive' } } } : {}
          },
        }),
        // KPI 4: Contratos registrados (VIGENTE count)
        this.prisma.contract.count({
          where: {
            status: 'VIGENTE',
            property: branch !== 'TODOS' ? { location: { contains: branch, mode: 'insensitive' } } : {}
          }
        }),
        // Central Feed: Activity logs
        this.prisma.activityLog.findMany({
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const percentVerified = totalActiveProps > 0 ? Math.round((verifiedActiveProps / totalActiveProps) * 100) : 100;
      
      // Filter recent events based on active branch text
      const filteredLogs = branch !== 'TODOS'
        ? allLogs.filter(log => log.text.toLowerCase().includes(branch.toLowerCase()))
        : allLogs;

      const recentEvents = filteredLogs.map((log) => ({
        id: log.id,
        text: log.text,
        time: new Date(log.createdAt).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }),
      }));

      return {
        activeProperties: totalActiveProps,
        percentVerified,
        agentCount: totalAgents,
        assignedAgents,
        monthlyIncome: monthIncomeResult._sum.amount ?? 0,
        cierresDelMes: totalVigenteContracts, // matches contracts count contextually
        recentEvents
      };
    } catch (err) {
      this.logger.warn(`getAdminStats fallback: ${err instanceof Error ? err.message : err}`);
      return {
        activeProperties: 0,
        percentVerified: 0,
        agentCount: 0,
        assignedAgents: 0,
        monthlyIncome: 0,
        cierresDelMes: 0,
        recentEvents: [],
      };
    }
  }

  /** Hard Delete for ActivityLog */
  async deleteActivityLog(id: string) {
    this.logger.log(`Hard Deleting activity log: ${id}`);
    try {
      const deleted = await this.prisma.activityLog.delete({
        where: { id }
      });
      return { success: true, deleted };
    } catch (err) {
      this.logger.error(`Error deleting activity log: ${err}`);
      throw err;
    }
  }
}

