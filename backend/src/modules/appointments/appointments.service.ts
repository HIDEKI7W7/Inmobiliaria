import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async create(
    userId: string | null,
    data: {
      propertyId: string;
      scheduledAt: Date;
      clientPhone: string;
      clientName: string;
      clientEmail: string;
      notes?: string;
      type?: string;
    },
  ) {
    this.logger.log(`[create] Creando cita para propiedad ${data.propertyId}`);

    // Resolver el agente asignado a la propiedad
    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId },
    });

    if (!property) {
      throw new NotFoundException(`La propiedad con ID "${data.propertyId}" no existe.`);
    }

    const agentId = property.agentId || null;

    try {
      const meeting = await this.prisma.meeting.create({
        data: {
          userId,
          propertyId: data.propertyId,
          scheduledAt: data.scheduledAt,
          clientPhone: data.clientPhone,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          agentId,
          notes: data.notes || '',
          type: data.type || 'visita',
          status: 'SCHEDULED', // Equivalente a pendiente/agendada
        },
        include: {
          property: true,
          user: true,
        },
      });

      // Disparar la notificación de webhook para WhatsApp posterior a la inserción en BD
      try {
        const m = meeting as any;
        await this.webhooksService.triggerWebhook('appointment.created', {
          id: m.id,
          propertyId: m.propertyId,
          propertyTitle: m.property?.title || '',
          scheduledAt: m.scheduledAt.toISOString(),
          clientName: m.clientName || m.user?.name || '',
          clientPhone: m.clientPhone || m.user?.whatsappPhone || '',
          clientEmail: m.clientEmail || m.user?.email || '',
          agentId: m.agentId,
        });
      } catch (webhookErr) {
        this.logger.error(`Error al disparar webhook para cita: ${webhookErr.message}`);
      }

      return meeting;
    } catch (error) {
      this.logger.error(`Error al insertar cita en la base de datos: ${error.message}`);
      throw error;
    }
  }

  async findAllForAgent(agentId: string, role: string) {
    this.logger.log(`[findAllForAgent] Buscando citas para el usuario ${agentId} con rol ${role}`);
    
    const isAgent = role?.toUpperCase() === 'AGENTE';
    const isAdmin = role?.toUpperCase() === 'ADMIN';

    if (isAdmin) {
      return this.prisma.meeting.findMany({
        include: {
          property: true,
          user: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    }

    if (isAgent) {
      return this.prisma.meeting.findMany({
        where: {
          OR: [
            { agentId },
            { property: { agentId } },
          ],
        },
        include: {
          property: true,
          user: true,
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    }

    // Default: return meetings where the user is the client/initiator
    return this.prisma.meeting.findMany({
      where: {
        userId: agentId,
      },
      include: {
        property: true,
        user: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }
}
