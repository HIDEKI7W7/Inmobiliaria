import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BusquedasGuardadasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, query: string) {
    return this.prisma.busquedaGuardada.create({
      data: {
        userId,
        query,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.busquedaGuardada.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
