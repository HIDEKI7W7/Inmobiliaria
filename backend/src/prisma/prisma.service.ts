import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Iniciando conexión con la base de datos PostgreSQL...');
      await this.$connect();
      this.logger.log('Conexión con PostgreSQL establecida exitosamente.');
      this.isConnected = true;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error al conectar a la base de datos: ${error.message}`);
      }
      this.logger.warn('⚠️ No se pudo conectar a PostgreSQL. Activando base de datos en memoria para resiliencia total y demo funcional.');
      this.isConnected = false;
      this.activateInMemoryFallback();
    }
  }

  private activateInMemoryFallback() {
    const defaultPasswordHash = bcrypt.hashSync('agent123', 10);
    const regularPasswordHash = bcrypt.hashSync('password123', 10);

    const memoryStore: Record<string, any[]> = {
      user: [
        {
          id: 'agent-1',
          email: 'agent@propio.com.bo',
          password: defaultPasswordHash,
          name: 'Agente Estrella',
          role: 'AGENTE',
          authProvider: 'LOCAL',
          onboardingCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'agente-2',
          email: 'agente1@propio.com.bo',
          password: regularPasswordHash,
          name: 'Agente Principal',
          role: 'AGENTE',
          authProvider: 'LOCAL',
          onboardingCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'admin-1',
          email: 'admin1@propio.com.bo',
          password: regularPasswordHash,
          name: 'Administrador General',
          role: 'ADMIN',
          authProvider: 'LOCAL',
          onboardingCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'propietario-1',
          email: 'propietario1@gmail.com',
          password: regularPasswordHash,
          name: 'Carlos Mendoza',
          role: 'PROPIETARIO',
          authProvider: 'LOCAL',
          onboardingCompleted: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      property: [
        {
          id: 'prop-1',
          title: 'Espectacular Penthouse en Cala Cala',
          description: 'Lujoso departamento de estreno con acabados premium en la mejor zona de Cochabamba. Cuenta con una suite principal de gran formato con vestidor y baño privado, 2 dormitorios adicionales con roperos empotrados, amplio living comedor de concepto abierto con ventanales de piso a techo y cocina gourmet equipada con cajonería alta y baja.',
          price: 165000,
          minPrice: 155000,
          currency: 'USD',
          area: 168.5,
          rooms: 3,
          bathrooms: 3,
          latitude: -17.3758,
          longitude: -66.1582,
          location: 'Cala Cala, Cochabamba',
          address: 'Av. América Nro. 420',
          offerType: 'VENTA',
          imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
          type: 'DEPARTAMENTO',
          isVerified: true,
          status: 'APROBADO',
          hasFolioReal: true,
          hasCatastro: true,
          hasTestimonio: true,
          hasImpuestosAlDia: true,
          hasPlanoUsoSuelo: true,
          hasCI: true,
          deletedAt: null,
          ownerId: 'propietario-1',
          agentId: 'agent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prop-2',
          title: 'Moderna Residencia en Las Palmas',
          description: 'Exclusiva casa de diseño vanguardista con piscina en el condominio más seguro de Santa Cruz. La propiedad cuenta con 4 suites independientes con baños privados, un espectacular recibidor de doble altura, cocina con isla central revestida en granito, terraza con churrasquera techada y hermosos jardines paisajistas.',
          price: 345000,
          minPrice: 325000,
          currency: 'USD',
          area: 380,
          rooms: 4,
          bathrooms: 5,
          latitude: -17.7995,
          longitude: -63.1998,
          location: 'Las Palmas, Santa Cruz',
          address: 'Calle Las Orquídeas Nro. 78',
          offerType: 'VENTA',
          imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          type: 'CASA',
          isVerified: true,
          status: 'APROBADO',
          hasFolioReal: true,
          hasCatastro: true,
          hasTestimonio: true,
          hasImpuestosAlDia: true,
          hasPlanoUsoSuelo: true,
          hasCI: true,
          deletedAt: null,
          ownerId: 'propietario-1',
          agentId: 'agent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prop-3',
          title: 'Acogedor Departamento Céntrico en Sopocachi',
          description: 'Cómodo departamento de 2 dormitorios ideal para parejas o ejecutivos en el corazón cultural de La Paz. Muy soleado con hermosa vista de la ciudad y el Illimani, living comedor confortable, cocina estilo americana con instalación de gas domiciliario y calefacción central.',
          price: 750,
          minPrice: 700,
          currency: 'USD',
          area: 85,
          rooms: 2,
          bathrooms: 2,
          latitude: -16.5122,
          longitude: -68.1255,
          location: 'Sopocachi, La Paz',
          address: 'Av. Arce esq. Belisario Salinas',
          offerType: 'ALQUILER',
          imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
          type: 'DEPARTAMENTO',
          isVerified: true,
          status: 'APROBADO',
          hasFolioReal: true,
          hasCatastro: true,
          hasTestimonio: true,
          hasImpuestosAlDia: true,
          hasPlanoUsoSuelo: true,
          hasCI: true,
          deletedAt: null,
          ownerId: 'propietario-1',
          agentId: 'agent-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      lead: [
        {
          id: 'lead-1',
          name: 'María Fernández',
          phone: '+591 71234567',
          email: 'maria.fer@gmail.com',
          message: 'Hola, estoy sumamente interesada en el Penthouse en Cala Cala. Quisiera programar una visita para este sábado en la tarde.',
          currentStage: 'Lead Entrante',
          status: 'LEAD_ENTRANTE',
          assignedAgentId: 'agent-1',
          propertyId: 'prop-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      contract: [],
      payment: [],
      expense: [],
      priceHistory: [],
    };

    const createMockTable = (tableName: string) => {
      const getList = () => memoryStore[tableName];
      return {
        findMany: async (args?: any) => {
          let list = [...getList()];
          if (args?.where) {
            list = list.filter(item => {
              const matchCriteria = (whereObj: any): boolean => {
                for (const [key, val] of Object.entries(whereObj)) {
                  if (key === 'OR') {
                    if (Array.isArray(val)) {
                      return val.some(orCriteria => matchCriteria(orCriteria));
                    }
                    continue;
                  }
                  
                  const itemVal = item[key] ?? null;
                  
                  if (val && typeof val === 'object') {
                    if ('in' in val) {
                      if (!(val as any).in.includes(itemVal)) return false;
                    } else if ('mode' in val && 'equals' in val) {
                      if (String(itemVal).toLowerCase() !== String((val as any).equals).toLowerCase()) return false;
                    } else if ('contains' in val) {
                      const containsVal = String((val as any).contains).toLowerCase();
                      if (!String(itemVal).toLowerCase().includes(containsVal)) return false;
                    } else if ('gte' in val || 'lte' in val) {
                      const numVal = Number(itemVal);
                      if ('gte' in val && numVal < Number((val as any).gte)) return false;
                      if ('lte' in val && numVal > Number((val as any).lte)) return false;
                    }
                  } else {
                    const filterVal = val ?? null;
                    if (itemVal !== filterVal) return false;
                  }
                }
                return true;
              };
              
              return matchCriteria(args.where);
            });
          }
          return list;
        },
        findUnique: async (args: any) => {
          const list = getList();
          return list.find(item => {
            for (const [key, val] of Object.entries(args.where)) {
              const itemVal = item[key] ?? null;
              const filterVal = val ?? null;
              if (itemVal !== filterVal) return false;
            }
            return true;
          }) || null;
        },
        findFirst: async (args: any) => {
          const list = getList();
          return list.find(item => {
            if (args?.where) {
              for (const [key, val] of Object.entries(args.where)) {
                const itemVal = item[key] ?? null;
                const filterVal = val ?? null;
                if (itemVal !== filterVal) return false;
              }
            }
            return true;
          }) || null;
        },
        create: async (args: any) => {
          const list = getList();
          const newItem = {
            id: Math.random().toString(36).substring(2, 11),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...args.data
          };
          list.push(newItem);
          return newItem;
        },
        update: async (args: any) => {
          const list = getList();
          const index = list.findIndex(item => {
            for (const [key, val] of Object.entries(args.where)) {
              const itemVal = item[key] ?? null;
              const filterVal = val ?? null;
              if (itemVal !== filterVal) return false;
            }
            return true;
          });
          if (index !== -1) {
            list[index] = { ...list[index], ...args.data, updatedAt: new Date() };
            return list[index];
          }
          throw new Error(`Record not found in memory table ${tableName}`);
        },
        delete: async (args: any) => {
          const list = getList();
          const index = list.findIndex(item => {
            for (const [key, val] of Object.entries(args.where)) {
              const itemVal = item[key] ?? null;
              const filterVal = val ?? null;
              if (itemVal !== filterVal) return false;
            }
            return true;
          });
          if (index !== -1) {
            const deleted = list[index];
            list.splice(index, 1);
            return deleted;
          }
          throw new Error(`Record not found in memory table ${tableName} to delete`);
        },
        count: async () => {
          return getList().length;
        }
      };
    };

    // Override target Prisma Client properties with our mock tables
    Object.defineProperty(this, 'user', { value: createMockTable('user'), writable: true, configurable: true });
    Object.defineProperty(this, 'property', { value: createMockTable('property'), writable: true, configurable: true });
    Object.defineProperty(this, 'lead', { value: createMockTable('lead'), writable: true, configurable: true });
    Object.defineProperty(this, 'contract', { value: createMockTable('contract'), writable: true, configurable: true });
    Object.defineProperty(this, 'payment', { value: createMockTable('payment'), writable: true, configurable: true });
    Object.defineProperty(this, 'expense', { value: createMockTable('expense'), writable: true, configurable: true });
    Object.defineProperty(this, 'priceHistory', { value: createMockTable('priceHistory'), writable: true, configurable: true });
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      try {
        this.logger.log('Cerrando conexión de base de datos...');
        await this.$disconnect();
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.logger.error(`Error al desconectar de la base de datos: ${error.message}`);
        }
      }
    }
  }
}
