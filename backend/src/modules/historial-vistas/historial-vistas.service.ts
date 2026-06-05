import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HistorialVistasService {
  private readonly logger = new Logger(HistorialVistasService.name);
  
  // Base de datos temporal en memoria para desarrollo local
  private static mockHistoryMap: Map<string, Array<{ propertyId: string; vistoEn: Date }>> = new Map(); // userId -> list of views

  constructor(private readonly prisma: PrismaService) {}

  getMockProperty(propertyId: string) {
    let title = 'Propiedad de Catálogo';
    let description = 'Descripción de propiedad del catálogo dinámico de Propio.';
    let price = 150000;
    let latitude = -17.3680;
    let longitude = -66.1590;
    let location = 'Cochabamba, Bolivia';

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
    const existing = await this.prisma.property.findFirst({
      where: { id: propertyId },
    });
    
    if (!existing) {
      const mock = this.getMockProperty(propertyId);
      await this.prisma.property.create({
        data: {
          id: mock.id,
          title: mock.title,
          description: mock.description,
          price: mock.price,
          latitude: mock.latitude,
          longitude: mock.longitude,
          location: mock.location,
          address: mock.location,
          isVerified: mock.isVerified,
        },
      });
    }
  }

  async recordView(userId: string, propertyId: string) {
    try {
      await this.ensurePropertyExists(propertyId);

      const existing = await this.prisma.historialVista.findFirst({
        where: {
          userId,
          propertyId,
        },
      });

      if (existing) {
        return await this.prisma.historialVista.update({
          where: { id: existing.id },
          data: {
            vistoEn: new Date(),
          },
        });
      } else {
        return await this.prisma.historialVista.create({
          data: {
            userId,
            propertyId,
            vistoEn: new Date(),
          },
        });
      }
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
