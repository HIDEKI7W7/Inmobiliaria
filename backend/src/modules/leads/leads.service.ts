import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    this.logger.log('Buscando todos los leads de la base de datos...');
    try {
      return await this.prisma.lead.findMany({
        include: { property: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error al consultar la base de datos de leads: ${message}`);
      throw new BadRequestException(`Error de base de datos al buscar leads: ${message}`);
    }
  }

  async findAgentLeads(agentId: string) {
    this.logger.log(`Buscando leads asignados al agente: ${agentId}`);
    try {
      const dbLeads = await this.prisma.lead.findMany({
        where: { assignedAgentId: agentId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
      });

      if (dbLeads.length > 0) {
        const leadEmails = [...new Set(dbLeads.map((lead) => lead.email).filter(Boolean))];
        const matchedUsers = await this.prisma.user.findMany({
          where: { email: { in: leadEmails } },
          select: {
            email: true,
            whatsappPhone: true,
            objective: true,
            propertyInterest: true,
            onboardingCompleted: true,
          },
        });
        const usersByEmail = new Map(matchedUsers.map((user) => [user.email, user]));

        return dbLeads.map((lead) => {
          const customerProfile = usersByEmail.get(lead.email);
          return {
            ...lead,
            phone: customerProfile?.whatsappPhone || lead.phone,
            customerProfile: customerProfile || null,
          };
        });
      }

      return [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Fallo de base de datos en findAgentLeads: ${message}`);
      throw new BadRequestException(`No se pudieron obtener los prospectos del agente por fallo relacional: ${message}`);
    }
  }

  async updateLeadStatus(id: string, status: string, agentId: string) {
    const uppercaseStatus = status.toUpperCase();
    this.logger.log(`Actualizando lead ${id} al estado ${uppercaseStatus} por agente ${agentId}`);

    try {
      const dbLead = await this.prisma.lead.update({
        where: { id },
        data: { status: uppercaseStatus },
        include: { property: true },
      });

      if (uppercaseStatus === 'RESERVA' && dbLead.propertyId) {
        this.logger.log(`[BLACKOUT ACTIVADO] Bloqueando propiedad vinculada: ${dbLead.propertyId}`);
        await this.prisma.property.update({
          where: { id: dbLead.propertyId },
          data: {
            status: 'RESERVADO',
            isVerified: false,
          },
        });
      }

      return {
        message: `Estado del lead actualizado correctamente a ${uppercaseStatus} (BD)`,
        data: dbLead,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error de base de datos al actualizar estado del lead: ${message}`);
      throw new NotFoundException(`El prospecto con ID ${id} no fue encontrado o no se pudo actualizar: ${message}`);
    }
  }

  async create(data: CreateLeadDto) {
    this.logger.log(`Registrando nuevo lead para propiedad: ${data.propertyId}`);
    try {
      const property = await this.prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true },
      });

      if (!property) {
        throw new NotFoundException(`No existe la propiedad ${data.propertyId}.`);
      }

      if (!data.assignedAgentId) {
        throw new BadRequestException('assignedAgentId es obligatorio para registrar un lead.');
      }

      const agent = await this.prisma.user.findUnique({
        where: { id: data.assignedAgentId },
        select: { id: true, role: true },
      });

      if (!agent || agent.role !== 'AGENTE') {
        throw new NotFoundException(`No existe un agente activo válido con id ${data.assignedAgentId}.`);
      }

      const dbLead = await this.prisma.lead.create({
        data: {
          name: data.name || data.fullName || 'Lead sin nombre',
          email: data.email,
          phone: data.phone,
          message: data.message || 'Interés registrado vía web',
          propertyId: data.propertyId,
          assignedAgentId: data.assignedAgentId,
          status: 'LEAD_ENTRANTE',
        },
        include: { property: true },
      });

      return {
        message: 'Lead registrado exitosamente en la base de datos de Propio.',
        data: dbLead,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Fallo relacional al crear prospecto: ${message}`);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`No se pudo crear el prospecto en base de datos: ${message}`);
    }
  }
}
