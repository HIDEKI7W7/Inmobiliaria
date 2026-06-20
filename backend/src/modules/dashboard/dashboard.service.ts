import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  async createMeeting(userId: string, propertyId: string, scheduledAt: Date) {
    this.logger.log(`Registrando reunión de usuario ${userId} para propiedad ${propertyId} el ${scheduledAt}`);
    try {
      return await this.prisma.meeting.create({
        data: {
          userId,
          propertyId,
          scheduledAt,
          status: 'SCHEDULED',
        },
      });
    } catch (error) {
      this.logger.error(`Error al registrar reunión: ${error}`);
      throw error;
    }
  }
}
