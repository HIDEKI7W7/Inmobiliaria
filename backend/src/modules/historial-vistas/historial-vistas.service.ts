import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HistorialVistasService {
  constructor(private readonly prisma: PrismaService) {}

  async recordView(userId: string, propertyId: string) {
    // Verificar que la propiedad exista y no esté eliminada lógicamente
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada o inactiva');
    }

    // Buscar si ya existe una vista registrada para este usuario e inmueble
    const existing = await this.prisma.historialVista.findFirst({
      where: {
        userId,
        propertyId,
      },
    });

    if (existing) {
      return this.prisma.historialVista.update({
        where: { id: existing.id },
        data: {
          vistoEn: new Date(),
        },
      });
    } else {
      return this.prisma.historialVista.create({
        data: {
          userId,
          propertyId,
          vistoEn: new Date(),
        },
      });
    }
  }

  async getHistory(userId: string) {
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
  }
}
