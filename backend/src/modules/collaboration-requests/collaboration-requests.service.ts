import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CollaborationRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(propertyId: string, sellingAgentId: string) {
    // 1. Validar existencia del inmueble
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException(`Propiedad con ID ${propertyId} no encontrada.`);
    }

    // 2. Determinar el agente captador (capturingAgentId)
    const capturingAgentId = property.agentId || property.ownerId;
    if (!capturingAgentId) {
      throw new BadRequestException('El inmueble no tiene un agente captador o propietario asignado.');
    }

    // Regla de Negocio: No colaborar con uno mismo
    if (sellingAgentId === capturingAgentId) {
      throw new BadRequestException('No puedes solicitar colaboración para tus propias propiedades.');
    }

    // 3. Validar rol del agente solicitante (vendedor)
    const sellingAgent = await this.prisma.user.findUnique({
      where: { id: sellingAgentId },
    });
    if (!sellingAgent || sellingAgent.role !== 'AGENTE') {
      throw new BadRequestException('Las solicitudes de colaboración sólo pueden ser realizadas por agentes comerciales.');
    }

    // Evitar solicitudes duplicadas pendientes
    const existing = await this.prisma.collaborationRequest.findFirst({
      where: {
        propertyId,
        sellingAgentId,
        capturingAgentId,
        status: 'PENDIENTE',
      },
    });
    if (existing) {
      throw new BadRequestException('Ya existe una solicitud de colaboración pendiente para esta propiedad.');
    }

    // 4. Crear la solicitud de colaboración
    const request = await this.prisma.collaborationRequest.create({
      data: {
        propertyId,
        sellingAgentId,
        capturingAgentId,
        status: 'PENDIENTE',
      },
      include: {
        property: true,
        sellingAgent: {
          select: { id: true, name: true, email: true },
        },
        capturingAgent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 5. Notificación / Evento Trigger
    console.log(`[NOTIFICACIÓN DE COLABORACIÓN] Enviando alerta al agente captador ${capturingAgentId} para la propiedad "${property.title}". Solicitud ID: ${request.id}`);

    return {
      message: 'Solicitud de colaboración registrada exitosamente.',
      request,
    };
  }

  async getRequestsForAgent(agentId: string) {
    // Solicitudes enviadas (como vendedor)
    const sent = await this.prisma.collaborationRequest.findMany({
      where: { sellingAgentId: agentId },
      include: {
        property: true,
        capturingAgent: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Solicitudes recibidas (como captador)
    const received = await this.prisma.collaborationRequest.findMany({
      where: { capturingAgentId: agentId },
      include: {
        property: true,
        sellingAgent: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      sent,
      received,
    };
  }

  async updateRequestStatus(requestId: string, agentId: string, status: 'ACEPTADO' | 'RECHAZADO') {
    const request = await this.prisma.collaborationRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud de colaboración con ID ${requestId} no encontrada.`);
    }

    // Validar que sólo el agente captador receptor pueda responder
    if (request.capturingAgentId !== agentId) {
      throw new BadRequestException('Sólo el agente captador asignado puede gestionar el estado de esta colaboración.');
    }

    // Regla de Comisiones del Negocio:
    // Los agentes captadores no ganan comisión de la misma forma que las agencias tradicionales (las solicitudes de colaboración ocurren estrictamente entre agentes vendedores, donde el captador facilita la operación y el vendedor es quien comercializa con el cliente final).
    console.log(`[REGLA DE COMISIÓN] Asesor captador ID: ${request.capturingAgentId} procesando estado: ${status}.`);
    if (status === 'ACEPTADO') {
      console.log(`[COMISIÓN COMPARTIDA ACTIVADA] Distribución autorizada para la solicitud de venta compartida ${requestId}.`);
    }

    const updatedRequest = await this.prisma.collaborationRequest.update({
      where: { id: requestId },
      data: { status },
      include: {
        property: true,
        sellingAgent: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      message: `Solicitud de colaboración ${status.toLowerCase()} exitosamente.`,
      request: updatedRequest,
    };
  }
}
