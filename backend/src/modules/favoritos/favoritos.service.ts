import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  async ensurePropertyExists(propertyId: string) {
    const existing = await this.prisma.property.findFirst({
      where: { id: propertyId },
    });
    
    if (!existing) {
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

      await this.prisma.property.create({
        data: {
          id: propertyId,
          title,
          description,
          price,
          latitude,
          longitude,
          location,
          address: location,
          isVerified: true,
        },
      });
    }
  }

  async toggleFavorite(userId: string, propertyId: string) {
    await this.ensurePropertyExists(propertyId);

    // Buscar si ya está guardada en favoritos por este usuario
    const existing = await this.prisma.favorito.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorito.delete({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
      });
      return { favorited: false, isFavorited: false, message: 'Propiedad removida de tus favoritos' };
    } else {
      await this.prisma.favorito.create({
        data: {
          userId,
          propertyId,
        },
      });
      return { favorited: true, isFavorited: true, message: 'Propiedad guardada en tus favoritos' };
    }
  }

  async getFavorites(userId: string) {
    const list = await this.prisma.favorito.findMany({
      where: { userId },
      include: {
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // Retornamos únicamente el array con los datos completos de las propiedades guardadas
    return list.map(f => f.property);
  }

  async checkFavorite(userId: string, propertyId: string) {
    await this.ensurePropertyExists(propertyId);
    
    const existing = await this.prisma.favorito.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });
    return { isFavorited: !!existing };
  }
}
