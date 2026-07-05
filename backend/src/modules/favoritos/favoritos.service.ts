import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * AUDITORÍA FULL-STACK SENIOR:
 * 1. Operaciones Asíncronas: Se garantiza el uso de 'await' explícito en todas las invocaciones a Prisma
 *    (findUnique, create, delete, findMany) para evitar retornos tempranos e inconsistencias de base de datos.
 * 2. Extracción de Identidad: El identificador 'userId' extraído del token JWT por el AuthGuard se mapea
 *    correctamente al parámetro 'userId' del servicio, asegurando la consistencia relacional.
 */
@Injectable()
export class FavoritosService {
  private readonly logger = new Logger(FavoritosService.name);
  
  // Archivo JSON persistente para desarrollo local sin conexión a base de datos
  private readonly fallbackFilePath = path.resolve(process.cwd(), 'favoritos_fallback.json');

  constructor(private readonly prisma: PrismaService) {}

  private async loadFallbackFavorites(): Promise<Map<string, Set<string>>> {
    const map = new Map<string, Set<string>>();
    try {
      const content = await fs.readFile(this.fallbackFilePath, 'utf-8');
      const data = JSON.parse(content);
      for (const userId of Object.keys(data)) {
        if (Array.isArray(data[userId])) {
          map.set(userId, new Set(data[userId]));
        }
      }
    } catch (error) {
      // Si el archivo no existe, simplemente retornamos un mapa vacío
      this.logger.log('No se pudo leer el archivo de favoritos fallback (puede que no exista todavía).');
    }
    return map;
  }

  private async saveFallbackFavorites(map: Map<string, Set<string>>): Promise<void> {
    try {
      const data: Record<string, string[]> = {};
      for (const [userId, propertyIds] of map.entries()) {
        data[userId] = Array.from(propertyIds);
      }
      await fs.writeFile(this.fallbackFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Error al escribir el archivo de favoritos fallback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

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
      throw new Error(`Propiedad ${propertyId} no existe en la base de datos (evitando polución mock)`);
    }
    return existing;
  }

  async toggleFavorite(userId: string, propertyId: string) {
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const property = await this.ensurePropertyExists(propertyId);

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

        // Eliminar interacción correspondiente de forma limpia
        await this.prisma.userInteraction.deleteMany({
          where: {
            userId,
            propertyId,
            interactionType: 'LIKE',
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

        // Registrar inmediatamente en la tabla user_interactions
        await this.prisma.userInteraction.create({
          data: {
            userId,
            propertyId,
            interactionType: 'LIKE',
            category: property.type,
            zone: property.location,
          },
        });

        return { favorited: true, isFavorited: true, message: 'Propiedad guardada en tus favoritos' };
      }
    } catch (error) {
      this.logger.warn('Error de conexion con la base de datos al alternar favorito. Usando fallback en archivo JSON persistente.');
      
      const map = await this.loadFallbackFavorites();
      if (!map.has(userId)) {
        map.set(userId, new Set());
      }
      
      const userFavs = map.get(userId)!;
      let favorited = false;
      let message = '';
      
      if (userFavs.has(propertyId)) {
        userFavs.delete(propertyId);
        favorited = false;
        message = 'Propiedad removida de tus favoritos (fallback persistente)';
      } else {
        userFavs.add(propertyId);
        favorited = true;
        message = 'Propiedad guardada en tus favoritos (fallback persistente)';
      }
      
      await this.saveFallbackFavorites(map);
      return { favorited, isFavorited: favorited, message };
    }
  }

  async getFavorites(userId: string) {
    let dbFavorites: any[] = [];
    try {
      if (this.prisma.isConnected) {
        const list = await this.prisma.favorito.findMany({
          where: { userId },
          include: {
            property: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        dbFavorites = list.map(f => f.property);
      }
    } catch (error) {
      this.logger.warn(`Error al consultar favoritos de DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Cargar y mezclar favoritos del fallback JSON
    try {
      const map = await this.loadFallbackFavorites();
      const userFavs = map.get(userId);
      if (userFavs && userFavs.size > 0) {
        const fallbackList = Array.from(userFavs).map(propertyId => this.getMockProperty(propertyId));
        const dbIds = new Set(dbFavorites.map(p => p.id));
        for (const fallbackProp of fallbackList) {
          if (!dbIds.has(fallbackProp.id)) {
            dbFavorites.push(fallbackProp);
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Error al cargar favoritos del fallback JSON: ${error instanceof Error ? error.message : String(error)}`);
    }

    return dbFavorites;
  }

  async checkFavorite(userId: string, propertyId: string) {
    // 1. Primero verificar en el JSON fallback
    try {
      const map = await this.loadFallbackFavorites();
      const userFavs = map.get(userId);
      if (userFavs && userFavs.has(propertyId)) {
        return { isFavorited: true };
      }
    } catch (error) {
      // Ignorar error al leer fallback
    }

    // 2. Si no está en el fallback, verificar en la DB
    try {
      if (this.prisma.isConnected) {
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
    } catch (error) {
      this.logger.warn(`Error al verificar favorito en DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { isFavorited: false };
  }
}
