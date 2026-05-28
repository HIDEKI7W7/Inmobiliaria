import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ContractsModule } from './contracts.module';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Contracts Integration & Global Pipes/Guards Tests', () => {
  let app: INestApplication;
  let mockPrismaService: any;
  let jwtService: JwtService;

  beforeAll(async () => {
    mockPrismaService = {
      contract: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((args) => {
          return Promise.resolve({
            id: 'contract-db-id',
            ...args.data,
            createdAt: new Date(),
          });
        }),
      },
      property: {
        update: jest.fn().mockResolvedValue({ id: 'prop-uuid', status: 'RESERVADO' }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ContractsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

    // Configurar exactamente la misma tubería de validación global que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    process.env.ALLOW_MOCK_TOKENS = 'true';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Verificación de Seguridad: AuthGuard & Backdoor en Producción', () => {
    let originalNodeEnv: string | undefined;

    beforeAll(() => {
      originalNodeEnv = process.env.NODE_ENV;
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('En PRODUCCIÓN: Debería denegar estrictamente el uso de "mock-admin-token" y retornar 401', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          propertyId: 'db48c3a5-e362-432d-98f5-4672e8111234',
          tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
          ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
          startDate: '2026-05-22T00:00:00.000Z',
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: 1500,
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Token de autorización inválido o expirado');
    });

    it('En DESARROLLO: Debería permitir el uso de "mock-admin-token" y avanzar a la validación del DTO', async () => {
      process.env.NODE_ENV = 'development';

      // Enviamos payload válido con token de desarrollo
      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          propertyId: 'db48c3a5-e362-432d-98f5-4672e8111234',
          tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
          ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
          startDate: '2026-05-22T00:00:00.000Z',
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: 1500,
        });

      // El token es aceptado y la petición se procesa correctamente en modo desarrollo
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Contrato creado exitosamente');
    });
  });

  describe('Verificación de Robustez: Restricciones del Global ValidationPipe (Error 400)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('Debería rechazar con error 400 si faltan propiedades obligatorias', async () => {
      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          // Falta propertyId, tenantId, ownerId
          startDate: '2026-05-22T00:00:00.000Z',
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: 1500,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'El ID de la propiedad debe ser un UUID válido.',
          'El ID de la propiedad es obligatorio.',
          'El ID del inquilino debe ser un UUID válido.',
          'El ID del inquilino es obligatorio.',
          'El ID del propietario debe ser un UUID válido.',
          'El ID del propietario es obligatorio.',
        ]),
      );
    });

    it('Debería rechazar con error 400 si el formato de UUID es inválido', async () => {
      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          propertyId: 'no-es-un-uuid',
          tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
          ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
          startDate: '2026-05-22T00:00:00.000Z',
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: 1500,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('El ID de la propiedad debe ser un UUID válido.');
    });

    it('Debería rechazar con error 400 si el monto mensual no es un número positivo mayor que cero', async () => {
      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          propertyId: 'db48c3a5-e362-432d-98f5-4672e8111234',
          tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
          ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
          startDate: '2026-05-22T00:00:00.000Z',
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: -100, // Valor inválido (debe ser positivo)
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('El monto mensual debe ser un número positivo mayor que cero.');
    });

    it('Debería rechazar con error 400 si la fecha no cumple con ISO 8601', async () => {
      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          propertyId: 'db48c3a5-e362-432d-98f5-4672e8111234',
          tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
          ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
          startDate: '22-05-2026', // Formato inválido
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: 1500,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'La fecha de inicio debe tener un formato de fecha válido (ISO 8601).',
      );
    });

    it('Debería rechazar con error 400 si se envía un campo no permitido (forbidNonWhitelisted)', async () => {
      const response = await request(app.getHttpServer())
        .post('/contracts')
        .set('Authorization', 'Bearer mock-admin-token')
        .send({
          propertyId: 'db48c3a5-e362-432d-98f5-4672e8111234',
          tenantId: 'db48c3a5-e362-432d-98f5-4672e8111235',
          ownerId: 'db48c3a5-e362-432d-98f5-4672e8111236',
          startDate: '2026-05-22T00:00:00.000Z',
          endDate: '2027-05-22T00:00:00.000Z',
          monthlyAmount: 1500,
          hackerField: 'maliciousPayload', // Campo prohibido no presente en el DTO
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('property hackerField should not exist');
    });
  });
});
