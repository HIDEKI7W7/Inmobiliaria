import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);
  private latestAnnouncement: any = null;

  constructor(private readonly prisma: PrismaService) {}

  async getLatestActive() {
    if (this.latestAnnouncement) {
      return this.latestAnnouncement;
    }

    try {
      if (!this.prisma.isConnected) {
        throw new Error('Database disconnected (fallback)');
      }

      let announcement = await this.prisma.announcement.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (!announcement) {
        // Seed default announcement dynamically
        announcement = await this.prisma.announcement.create({
          data: {
            title: 'ESQUEMA DE COMISIONES 2026',
            subtitle: 'MENSAJE MANDATORIO PARA ASESORES',
            content: JSON.stringify({
              cierre: 'ESTRUCTURA DEL CIERRE:\n• Comisión General: 1.5% del valor total de la transacción.\n• Distribución Estándar: 50% para PROPIO y 50% para el Asesor (0.75% c/u).\n• Bono Especial: Captaciones verificadas con Sello Oro otorgan un +0.25% extra de comisión directa al Asesor.',
              reglas: 'REGLAS DE REGISTRO:\n• Es obligatorio registrar el cliente en el módulo Mis Clientes antes del cierre.\n• El cierre debe asociar de forma directa la propiedad activa y cargar el respaldo en PDF (minuta o contrato).\n• El asesor tiene un límite de 24 horas desde la firma para registrar o modificar los datos del cierre.'
            }),
            isActive: true,
          },
        });
      }

      this.latestAnnouncement = announcement;
      return announcement;
    } catch (error) {
      this.logger.warn(`Error getting latest active announcement: ${error.message}. Returning mock.`);
      // Mock fallback
      return {
        id: 'announcement-mock-default',
        title: 'ESQUEMA DE COMISIONES 2026',
        subtitle: 'MENSAJE MANDATORIO PARA ASESORES',
        content: JSON.stringify({
          cierre: 'ESTRUCTURA DEL CIERRE:\n• Comisión General: 1.5% del valor total de la transacción.\n• Distribución Estándar: 50% para PROPIO y 50% para el Asesor (0.75% c/u).\n• Bono Especial: Captaciones verificadas con Sello Oro otorgan un +0.25% extra de comisión directa al Asesor.',
          reglas: 'REGLAS DE REGISTRO:\n• Es obligatorio registrar el cliente en el módulo Mis Clientes antes del cierre.\n• El cierre debe asociar de forma directa la propiedad activa y cargar el respaldo en PDF (minuta o contrato).\n• El asesor tiene un límite de 24 horas desde la firma para registrar o modificar los datos del cierre.'
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async saveAnnouncement(data: { id?: string; title: string; subtitle: string; content: string; isActive: boolean }) {
    this.logger.log(`[saveAnnouncement] Saving announcement: ${data.title}`);
    try {
      let announcement;
      if (data.id) {
        announcement = await this.prisma.announcement.update({
          where: { id: data.id },
          data: {
            title: data.title,
            subtitle: data.subtitle,
            content: data.content,
            isActive: data.isActive,
          },
        });
      } else {
        announcement = await this.prisma.announcement.create({
          data: {
            title: data.title,
            subtitle: data.subtitle,
            content: data.content,
            isActive: data.isActive,
          },
        });
      }
      this.latestAnnouncement = null; // Invalidate cache
      return announcement;
    } catch (error) {
      this.logger.error(`Error saving announcement: ${error.message}`);
      throw error;
    }
  }
}
