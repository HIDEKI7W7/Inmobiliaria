import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritosService {
  private readonly logger = new Logger(FavoritosService.name);
  
  // Base de datos temporal en memoria para desarrollo local sin conexión a base de datos
  private static mockFavoritesMap: Map<string, Set<string>> = new Map(); // userId -> Set of propertyIds

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

  async toggleFavorite(userId: string, propertyId: string) {
    try {
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
    } catch (error) {
      this.logger.warn('Error de conexion con la base de datos al alternar favorito. Usando fallback en memoria de desarrollo.');
      
      if (!FavoritosService.mockFavoritesMap.has(userId)) {
        FavoritosService.mockFavoritesMap.set(userId, new Set());
      }
      
      const userFavs = FavoritosService.mockFavoritesMap.get(userId)!;
      if (userFavs.has(propertyId)) {
        userFavs.delete(propertyId);
        return { favorited: false, isFavorited: false, message: 'Propiedad removida de tus favoritos (memoria local)' };
      } else {
        userFavs.add(propertyId);
        return { favorited: true, isFavorited: true, message: 'Propiedad guardada en tus favoritos (memoria local)' };
      }
    }
  }

  async getFavorites(userId: string) {
    try {
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
    } catch (error) {
      this.logger.warn('Error de conexion con la base de datos al obtener favoritos. Usando fallback en memoria de desarrollo.');
      const userFavs = FavoritosService.mockFavoritesMap.get(userId);
      if (!userFavs) return [];
      
      return Array.from(userFavs).map(propertyId => this.getMockProperty(propertyId));
    }
  }

  async checkFavorite(userId: string, propertyId: string) {
    try {
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
    } catch (error) {
      this.logger.warn('Error de conexion con la base de datos al verificar favorito. Usando fallback en memoria de desarrollo.');
      const userFavs = FavoritosService.mockFavoritesMap.get(userId);
      return { isFavorited: userFavs ? userFavs.has(propertyId) : false };
    }
  }
}
