import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    contract: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    property: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    prisma = module.get(PrismaService);

    // Reset all mock implementations before each test
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar contratos de la base de datos si están disponibles', async () => {
      const dbContracts = [
        {
          id: 'contract-db',
          propertyId: 'p-1',
          tenantId: 't-1',
          ownerId: 'o-1',
          startDate: new Date(),
          endDate: new Date(),
          monthlyAmount: 1500,
          status: 'VIGENTE',
        },
      ];
      mockPrismaService.contract.findMany.mockResolvedValue(dbContracts);

      const result = await service.findAll();
      expect(result).toEqual(dbContracts);
      expect(mockPrismaService.contract.findMany).toHaveBeenCalled();
    });

    it('debería retornar contratos mock (fallback) si la base de datos falla', async () => {
      mockPrismaService.contract.findMany.mockRejectedValue(new Error('DB Connection Timeout'));

      const result = await service.findAll();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe('contract-1');
    });
  });

  describe('findOne', () => {
    it('debería retornar un contrato de la base de datos por id', async () => {
      const contract = {
        id: 'contract-123',
        propertyId: 'p-1',
        tenantId: 't-1',
        ownerId: 'o-1',
        startDate: new Date(),
        endDate: new Date(),
        monthlyAmount: 1500,
        status: 'VIGENTE',
      };
      mockPrismaService.contract.findUnique.mockResolvedValue(contract);

      const result = await service.findOne('contract-123');
      expect(result).toEqual(contract);
      expect(mockPrismaService.contract.findUnique).toHaveBeenCalledWith({
        where: { id: 'contract-123' },
        include: expect.any(Object),
      });
    });

    it('debería retornar un contrato del fallback si la base de datos falla', async () => {
      mockPrismaService.contract.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await service.findOne('contract-1');
      expect(result.id).toBe('contract-1');
    });

    it('debería lanzar NotFoundException si el contrato no se encuentra en el fallback', async () => {
      mockPrismaService.contract.findUnique.mockRejectedValue(new Error('DB error'));

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('El contrato con ID non-existent-id no existe.'),
      );
    });
  });

  describe('create', () => {
    const dto: CreateContractDto = {
      propertyId: 'p-id',
      tenantId: 't-id',
      ownerId: 'o-id',
      startDate: '2026-05-22',
      endDate: '2027-05-22',
      monthlyAmount: 1200,
      status: 'VIGENTE',
      observations: 'Observación de prueba',
    };

    it('debería lanzar BadRequestException si falta algún campo obligatorio', async () => {
      const malformedDto = { ...dto, propertyId: undefined } as any;

      await expect(service.create(malformedDto)).rejects.toThrow(
        new BadRequestException('Todos los campos son obligatorios.'),
      );
    });

    it('debería persistir en base de datos e incrementar el estado de la propiedad a RESERVADO', async () => {
      const createdContract = {
        id: 'contract-db-created',
        propertyId: dto.propertyId,
        tenantId: dto.tenantId,
        ownerId: dto.ownerId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        monthlyAmount: dto.monthlyAmount,
        status: dto.status,
      };

      mockPrismaService.contract.create.mockResolvedValue(createdContract);
      mockPrismaService.property.update.mockResolvedValue({ id: dto.propertyId, status: 'RESERVADO' });

      const result = await service.create(dto);

      expect(result.message).toContain('Contrato creado exitosamente');
      expect(result.data).toEqual(createdContract);
      expect(mockPrismaService.contract.create).toHaveBeenCalled();
      expect(mockPrismaService.property.update).toHaveBeenCalledWith({
        where: { id: dto.propertyId },
        data: { status: 'RESERVADO' },
      });
    });

    it('debería realizar registro simulado en memoria si la persistencia en DB falla', async () => {
      mockPrismaService.contract.create.mockRejectedValue(new Error('Prisma database is down'));

      const result = await service.create(dto);

      expect(result.message).toContain('Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente (Simulado).');
      expect(result.data.propertyId).toBe(dto.propertyId);
      expect(result.data.monthlyAmount).toBe(dto.monthlyAmount);
    });
  });

  describe('remove', () => {
    it('debería eliminar el contrato de la base de datos si existe', async () => {
      mockPrismaService.contract.delete.mockResolvedValue({ id: 'contract-123' });

      const result = await service.remove('contract-123');

      expect(result.message).toContain('Contrato eliminado correctamente de la base de datos.');
      expect(mockPrismaService.contract.delete).toHaveBeenCalledWith({ where: { id: 'contract-123' } });
    });

    it('debería eliminar de memoria (fallback) si la eliminación en DB falla', async () => {
      mockPrismaService.contract.delete.mockRejectedValue(new Error('DB error'));

      // Primero agregamos un mock contract al array llamando a findAll (para inicializar el mock contracts con contract-1)
      await service.findAll();

      const result = await service.remove('contract-1');
      expect(result.message).toContain('Contrato eliminado correctamente (Simulado).');
    });

    it('debería lanzar NotFoundException en remoción de memoria si el contrato no existe', async () => {
      mockPrismaService.contract.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        new NotFoundException('El contrato con ID non-existent-id no existe.'),
      );
    });
  });
});
