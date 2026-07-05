import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HistorialVistasService {
  private readonly logger = new Logger(HistorialVistasService.name);
  
  // Base de datos temporal en memoria para desarrollo local
  private static mockHistoryMap: Map<string, Array<{ propertyId: string; vistoEn: Date }>> = new Map(); // userId -> list of views

  constructor(private readonly prisma: PrismaService) {}

  getMockProperty(propertyId: string) {
    let title = 'Casa de Campo en Muyurina';
    let description = 'Hermosa casa de campo con jardín interior amplio y churrasquero propio.';
    let price = 220000;
    let latitude = -17.3890;
    let longitude = -66.1390;
    let location = 'Muyurina, Cochabamba';

    if (propertyId === 'prop-1-cala-cala') {
      title = 'Casa Familiar en Cala Cala';
      description = 'Espléndida residencia de dos plantas ubicada en Cala Cala.';
      price = 320000;
      latitude = -17.3680;
      longitude = -66.1590;
      location = 'Cala Cala, Cochabamba';
    } else if (propertyId === 'prop-2-queru-queru') {
      title = 'Penthouse de Lujo en Queru Queru';
      description = 'Espectacular penthouse de estreno en Queru Queru.';
      price = 185000;
      latitude = -17.3695;
      longitude = -66.1480;
      location = 'Queru Queru, Cochabamba';
    } else if (propertyId === 'prop-3-el-prado') {
      title = 'Departamento Moderno en El Prado';
      description = 'Departamento de 2 habitaciones recién remodelado en pleno Prado.';
      price = 95000;
      latitude = -17.3820;
      longitude = -66.1560;
      location = 'El Prado, Cochabamba';
    }

    return {
      id: propertyId,
      title,
      description,
      price,
      latitude,
      longitude,
      location,
      address: location,
      isVerified: true,
      offerType: propertyId === 'prop-3-el-prado' ? 'ALQUILER' : 'VENTA',
      type: propertyId === 'prop-1-cala-cala' ? 'CASA' : 'DEPARTAMENTO',
      area: propertyId === 'prop-1-cala-cala' ? 350 : propertyId === 'prop-2-queru-queru' ? 195 : 85,
      rooms: propertyId === 'prop-1-cala-cala' ? 5 : propertyId === 'prop-2-queru-queru' ? 4 : 2,
      bathrooms: propertyId === 'prop-1-cala-cala' ? 4 : propertyId === 'prop-2-queru-queru' ? 3 : 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async ensurePropertyExists(propertyId: string) {
    const existing = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    
    if (!existing) {
      const mockP = this.getMockProperty(propertyId);
      this.logger.log(`[HistorialVistas] Auto-creando propiedad mock "${mockP.title}" (ID: ${propertyId}) en PostgreSQL.`);
      await this.prisma.property.create({
        data: {
          id: propertyId,
          title: mockP.title,
          description: mockP.description,
          price: parseFloat(mockP.price as any),
          latitude: parseFloat(mockP.latitude as any),
          longitude: parseFloat(mockP.longitude as any),
          location: mockP.location,
          address: mockP.address,
          status: 'APROBADO',
        }
      });
    }
  }

  async recordView(userId: string, propertyId: string) {
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      await this.ensurePropertyExists(propertyId);

      const existing = await this.prisma.historialVista.findFirst({
        where: {
          userId,
          propertyId,
        },
      });

      let viewRecord;
      if (existing) {
        viewRecord = await this.prisma.historialVista.update({
          where: { id: existing.id },
          data: {
            vistoEn: new Date(),
          },
        });
      } else {
        viewRecord = await this.prisma.historialVista.create({
          data: {
            userId,
            propertyId,
            vistoEn: new Date(),
          },
        });
      }

      // ponytail: automatically register a Lead when a property is viewed
      try {
        let name = 'Prospecto Anónimo';
        let email = 'prospecto@gmail.com';
        let phone = '+591 700 00000';
        const message = 'Registrado automáticamente al visualizar la propiedad.';

        if (userId && userId !== 'guest-user') {
          const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, whatsappPhone: true }
          });
          if (user) {
            name = user.name || 'Cliente Interesado';
            email = user.email;
            phone = user.whatsappPhone || '+591 700 00000';
          }
        } else {
          const mockNames = ['Carlos Arandia', 'María René Claros', 'Juan de Dios Ortíz', 'Gabriela Claure', 'Claudia Mendoza', 'Pedro Vargas', 'Gaby Solares', 'Jorge Claros'];
          const mockEmails = ['carlos@mail.com', 'maria.cl@gmail.com', 'juan.ortiz@outlook.com', 'gaby.c@mail.com', 'claudia.m@gmail.com', 'pedro.v@mail.com', 'gaby.solares@gmail.com', 'jorge@mail.com'];
          const mockPhones = ['+591 798 12345', '+591 712 99887', '+591 700 44332', '+591 721 55443', '+591 707 11223', '+591 789 65432', '+591 765 43210', '+591 750 98765'];
          const idx = Math.floor(Math.random() * mockNames.length);
          name = mockNames[idx];
          email = mockEmails[idx];
          phone = mockPhones[idx];
        }

        const existingLead = await this.prisma.lead.findFirst({
          where: { email, propertyId }
        });
        if (!existingLead) {
          const prop = await this.prisma.property.findUnique({
            where: { id: propertyId },
            select: { agentId: true }
          });
          let assignedAgentId = prop?.agentId;
          if (!assignedAgentId) {
            const firstAgent = await this.prisma.user.findFirst({
              where: { role: 'AGENTE' },
              select: { id: true }
            });
            assignedAgentId = firstAgent?.id || 'agent-1';
          }
          await this.prisma.lead.create({
            data: {
              name,
              email,
              phone,
              propertyId,
              assignedAgentId,
              status: 'LEAD_ENTRANTE',
              currentStage: 'Lead Entrante',
              message
            }
          });
          this.logger.log(`[HistorialVistas] Lead auto-registrado para ${name} en la propiedad ${propertyId}`);
        }
      } catch (leadErr: any) {
        this.logger.warn(`Failed to auto-create lead on view: ${leadErr.message}`);
      }

      return viewRecord;
    } catch (error) {
      this.logger.warn('Error de conexion con la base de datos al registrar historial de vista. Usando fallback en memoria de desarrollo.');
      
      if (!HistorialVistasService.mockHistoryMap.has(userId)) {
        HistorialVistasService.mockHistoryMap.set(userId, []);
      }
      
      const userHistory = HistorialVistasService.mockHistoryMap.get(userId)!;
      const existingIdx = userHistory.findIndex(h => h.propertyId === propertyId);
      if (existingIdx !== -1) {
        userHistory[existingIdx].vistoEn = new Date();
      } else {
        userHistory.push({ propertyId, vistoEn: new Date() });
      }
      
      return { userId, propertyId, vistoEn: new Date() };
    }
  }

  async getHistory(userId: string) {
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const list = await this.prisma.historialVista.findMany({
        where: { userId },
        include: {
          property: true,
        },
        orderBy: {
          vistoEn: 'desc',
        },
      });
      // Retornamos únicamente el array con los datos completos de las propiedades vistas
      return list.map(h => h.property).filter(p => p !== null);
    } catch (error) {
      this.logger.warn('Error de conexion con la base de datos al obtener historial de vistas. Usando fallback en memoria de desarrollo.');
      const userHistory = HistorialVistasService.mockHistoryMap.get(userId);
      if (!userHistory) return [];
      
      // Ordenar por vistoEn desc
      const sorted = [...userHistory].sort((a, b) => b.vistoEn.getTime() - a.vistoEn.getTime());
      return sorted.map(h => this.getMockProperty(h.propertyId));
    }
  }
}
