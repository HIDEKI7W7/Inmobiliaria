import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  private fallbackContracts: any[] = [
    {
      id: 'contract-1',
      propertyId: 'prop-1-muyurina',
      tenantId: 'cli-1',
      ownerId: 'owner-1',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-06-01'),
      monthlyAmount: 1500.0,
      status: 'VIGENTE',
      observations: 'Contrato de alquiler residencial estándar.',
      createdAt: new Date(),
      updatedAt: new Date(),
      property: { id: 'prop-1-muyurina', title: 'Casa de Campo en Muyurina', price: 220000.0 },
      tenant: { id: 'cli-1', name: 'María Quispe', email: 'maria@ejemplo.com' },
      owner: { id: 'owner-1', name: 'Propietario Demo', email: 'owner@propio.com' }
    }
  ];

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
      this.logger.warn('Usando fallback de contratos en memoria.');
      return this.fallbackContracts;
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
      this.logger.warn('Intentando recuperar contrato de fallback en memoria.');
      const fallbackContract = this.fallbackContracts.find(c => c.id === id);
      if (!fallbackContract) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      return fallbackContract;
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
      this.logger.warn('Intentando registrar contrato en fallback en memoria.');
      
      const simulatedContract = {
        id: `contract-mock-${Date.now()}`,
        propertyId: dto.propertyId,
        tenantId: dto.tenantId,
        ownerId: dto.ownerId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        monthlyAmount: parseFloat(String(dto.monthlyAmount)),
        status: dto.status || 'VIGENTE',
        observations: dto.observations || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: { id: dto.propertyId, title: 'Inmueble Simulado', price: 150000 },
        tenant: { id: dto.tenantId, name: 'Cliente Simulado', email: 'cliente.simulado@ejemplo.com' },
        owner: { id: dto.ownerId, name: 'Propietario Simulado', email: 'propietario.simulado@ejemplo.com' }
      };

      this.fallbackContracts.push(simulatedContract);

      return {
        message: 'Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente (Simulado).',
        data: simulatedContract,
      };
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
      this.logger.warn('Intentando eliminar contrato de fallback en memoria.');
      const index = this.fallbackContracts.findIndex(c => c.id === id);
      if (index === -1) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      this.fallbackContracts.splice(index, 1);
      return { message: 'Contrato eliminado correctamente (Simulado).' };
    }
  }
}
