import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusquedasGuardadasService {
  private readonly logger = new Logger(BusquedasGuardadasService.name);
  private readonly mockSavedSearches: Array<{ id: string; userId: string; query: string; createdAt: Date }> = [];

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, query: string) {
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const savedSearch = await this.prisma.busquedaGuardada.create({
        data: {
          userId,
          query,
        },
      });
      return savedSearch;
    } catch (error) {
      this.logger.warn(`DB offline o error al guardar búsqueda. Usando fallback en memoria: ${error instanceof Error ? error.message : String(error)}`);
      const mockSearch = {
        id: `search-${Date.now()}`,
        userId,
        query,
        createdAt: new Date(),
      };
      this.mockSavedSearches.push(mockSearch);
      return mockSearch;
    }
  }

  async findAll(userId: string) {
    try {
      if (!this.prisma.isConnected) {
        throw new Error('Base de datos desconectada (fallback rápido)');
      }
      const list = await this.prisma.busquedaGuardada.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return list;
    } catch (error) {
      this.logger.warn(`DB offline o error al listar búsquedas. Usando fallback en memoria: ${error instanceof Error ? error.message : String(error)}`);
      return this.mockSavedSearches.filter(s => s.userId === userId);
    }
  }
}
