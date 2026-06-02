import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleFavorite(userId: string, propertyId: string) {
    // Verificar que la propiedad exista y no esté eliminada lógicamente
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) {
      throw new NotFoundException('Propiedad no encontrada o inactiva');
    }

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
