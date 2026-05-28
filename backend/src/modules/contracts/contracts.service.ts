import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    this.logger.log('Consultando contratos de la base de datos...');
    try {
      return await this.prisma.contract.findMany({
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Fallo al consultar contratos: ${message}`);
      throw new BadRequestException(`No se pudieron consultar los contratos de base de datos: ${message}`);
    }
  }

  async findOne(id: string) {
    this.logger.log(`Buscando contrato con ID: ${id}`);
    try {
      const dbContract = await this.prisma.contract.findUnique({
        where: { id },
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      });
      if (!dbContract) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      return dbContract;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error al buscar contrato ${id}: ${message}`);
      throw new BadRequestException(`Error de base de datos al buscar contrato: ${message}`);
    }
  }

  async create(dto: CreateContractDto) {
    if (!dto.propertyId || !dto.tenantId || !dto.ownerId || !dto.startDate || !dto.endDate || !dto.monthlyAmount) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    this.logger.log('Registrando nuevo contrato de forma persistente...');
    try {
      const dbContract = await this.prisma.contract.create({
        data: {
          propertyId: dto.propertyId,
          tenantId: dto.tenantId,
          ownerId: dto.ownerId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          monthlyAmount: parseFloat(String(dto.monthlyAmount)),
          status: dto.status || 'VIGENTE',
          observations: dto.observations || null,
        },
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      await this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { status: 'RESERVADO' },
      });

      return {
        message: 'Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente.',
        data: dbContract,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Fallo relacional al crear contrato: ${message}`);
      throw new BadRequestException(`No se pudo crear el contrato por integridad relacional: ${message}`);
    }
  }

  async remove(id: string) {
    this.logger.warn(`Eliminando contrato con ID: ${id}`);
    try {
      const dbContract = await this.prisma.contract.findUnique({
        where: { id },
      });
      if (!dbContract) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      await this.prisma.contract.delete({ where: { id } });
      return { message: 'Contrato eliminado correctamente de la base de datos.' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error al eliminar contrato ${id}: ${message}`);
      throw new BadRequestException(`Fallo de base de datos al eliminar contrato: ${message}`);
    }
  }
}
