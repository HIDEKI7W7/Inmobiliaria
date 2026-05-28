import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { JwtService } from '@nestjs/jwt';

describe('ContractsController', () => {
  let controller: ContractsController;
  let service: jest.Mocked<ContractsService>;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };

    const mockJwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        {
          provide: ContractsService,
          useValue: mockService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ContractsController>(ContractsController);
    service = module.get(ContractsService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar un listado de contratos', async () => {
      const mockResult = [
        {
          id: 'contract-1',
          propertyId: 'prop-1',
          tenantId: 'tenant-1',
          ownerId: 'owner-1',
          startDate: new Date(),
          endDate: new Date(),
          monthlyAmount: 1200,
          status: 'VIGENTE',
        },
      ];
      service.findAll.mockResolvedValue(mockResult as any);

      const result = await controller.findAll();
      expect(result).toBe(mockResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar un contrato por id', async () => {
      const mockResult = {
        id: 'contract-123',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
        startDate: new Date(),
        endDate: new Date(),
        monthlyAmount: 1200,
        status: 'VIGENTE',
      };
      service.findOne.mockResolvedValue(mockResult as any);

      const result = await controller.findOne('contract-123');
      expect(result).toBe(mockResult);
      expect(service.findOne).toHaveBeenCalledWith('contract-123');
    });
  });

  describe('create', () => {
    it('debería crear y retornar un nuevo contrato', async () => {
      const dto: CreateContractDto = {
        propertyId: 'db48c3a5-e362-432d-98f5-4672e8111234',
        tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
        ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
        startDate: '2026-05-22',
        endDate: '2027-05-22',
        monthlyAmount: 1000,
        status: 'VIGENTE',
        observations: 'Contrato de prueba',
      };

      const mockResponse = {
        message: 'Contrato creado exitosamente',
        data: { id: 'contract-new', ...dto, monthlyAmount: 1000 },
      };
      service.create.mockResolvedValue(mockResponse as any);

      const result = await controller.create(dto);
      expect(result).toBe(mockResponse);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('remove', () => {
    it('debería invocar la eliminación de un contrato y retornar confirmación', async () => {
      const mockResponse = { message: 'Contrato eliminado correctamente de la base de datos.' };
      service.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove('contract-123');
      expect(result).toBe(mockResponse);
      expect(service.remove).toHaveBeenCalledWith('contract-123');
    });
  });
});
