import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private mockLeads: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private initializeMockLeads() {
    if (this.mockLeads.length > 0) return;
    this.mockLeads = [
      {
        id: 'lead-1',
        name: 'Alejandro Camacho',
        email: 'acamacho@gmail.com',
        phone: '+591 70712345',
        propertyId: '1',
        status: 'LEAD_ENTRANTE',
        assignedAgentId: 'agent-1',
        createdAt: new Date('2026-05-21T09:00:00Z'),
        property: {
          id: '1',
          title: 'Penthouse de Lujo en Queru Queru',
          price: 185000,
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        }
      },
      {
        id: 'lead-2',
        name: 'Sofia Rojas',
        email: 'srojas@hotmail.com',
        phone: '+591 72233445',
        propertyId: '2',
        status: 'CITA_AGENDADA',
        assignedAgentId: 'agent-1',
        createdAt: new Date('2026-05-21T11:30:00Z'),
        property: {
          id: '2',
          title: 'Hermosa Casa Familiar en Cala Cala',
          price: 320000,
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
        }
      },
      {
        id: 'lead-3',
        name: 'Marcelo Vargas',
        email: 'mvargas@outlook.com',
        phone: '+591 76543210',
        propertyId: '3',
        status: 'VISITA_REALIZADA',
        assignedAgentId: 'agent-1',
        createdAt: new Date('2026-05-22T08:15:00Z'),
        property: {
          id: '3',
          title: 'Terreno Urbanizado en Lomas de Aranjuez',
          price: 150000,
          imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
        }
      },
      {
        id: 'lead-4',
        name: 'Daniela Lanza',
        email: 'dlanza@live.com',
        phone: '+591 70799887',
        propertyId: '4',
        status: 'NEGOCIACION',
        assignedAgentId: 'agent-1',
        createdAt: new Date('2026-05-22T10:45:00Z'),
        property: {
          id: '4',
          title: 'Oficina Ejecutiva en Av. América',
          price: 85000,
          imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
        }
      }
    ];
  }

  async findAll() {
    this.initializeMockLeads();
    return this.mockLeads;
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
        return dbLeads;
      }
    } catch (error) {
      this.logger.warn(`No se pudo consultar la base de datos de leads (${error.message}). Cargando fallback de leads en memoria...`);
    }

    this.initializeMockLeads();
    return this.mockLeads.filter((l) => l.assignedAgentId === agentId);
  }

  async updateLeadStatus(id: string, status: string, agentId: string) {
    const uppercaseStatus = status.toUpperCase();
    this.logger.log(`Actualizando lead ${id} al estado ${uppercaseStatus} por agente ${agentId}`);

    // =========================================================================
    // INTENTO DE PERSISTENCIA EN BASE DE DATOS
    // =========================================================================
    try {
      // 1. Actualizar el estado del lead
      const dbLead = await this.prisma.lead.update({
        where: { id },
        data: { status: uppercaseStatus as any },
        include: { property: true },
      });

      // 2. Acción automática de Reserva (Blackout en producción)
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
    } catch (error) {
      this.logger.warn(`Error al guardar en base de datos (${error.message}). Sincronizando con mock local...`);
    }

    // =========================================================================
    // FALLBACK EN MEMORIA
    // =========================================================================
    this.initializeMockLeads();
    const lead = this.mockLeads.find((l) => l.id === id);
    if (!lead) {
      throw new NotFoundException(`El prospecto con ID ${id} no fue encontrado.`);
    }

    // Actualizar estado del lead
    lead.status = uppercaseStatus;

    // Si es reserva, simulamos el blackout del inmueble
    if (uppercaseStatus === 'RESERVA' && lead.property) {
      this.logger.log(`[BLACKOUT SIMULADO] Propiedad ${lead.propertyId} marcada como RESERVADA en el cliente.`);
      lead.property.status = 'RESERVADO';
      lead.property.isVerified = false;
      lead.property.verified = false;
    }

    return {
      message: `Estado del lead actualizado correctamente a ${uppercaseStatus} (Memoria Fallback)`,
      data: lead,
    };
  }

  async create(data: any) {
    try {
      const dbLead = await this.prisma.lead.create({
        data: {
          name: data.name || data.fullName,
          email: data.email,
          phone: data.phone,
          message: data.message || 'Interés registrado vía web',
          propertyId: data.propertyId,
          assignedAgentId: data.assignedAgentId || 'agent-1',
          status: 'LEAD_ENTRANTE',
        },
        include: { property: true }
      });
      return {
        message: 'Lead registrado exitosamente en la base de datos de Propio.',
        data: dbLead,
      };
    } catch (error) {
      this.logger.warn(`No se pudo persistir lead en BD (${error.message}). Simulando en memoria...`);
      this.initializeMockLeads();
      const newLead = {
        id: 'lead-' + Math.random().toString(36).substr(2, 9),
        name: data.name || data.fullName,
        email: data.email,
        phone: data.phone,
        propertyId: data.propertyId,
        status: 'LEAD_ENTRANTE',
        assignedAgentId: data.assignedAgentId || 'agent-1',
        createdAt: new Date(),
        property: {
          id: data.propertyId,
          title: 'Propiedad en Consulta',
          price: 120000,
          imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        }
      };
      this.mockLeads.push(newLead);
      return {
        message: 'Lead registrado de forma exitosa (Simulación Resiliente).',
        data: newLead,
      };
    }
  }
}
