import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
    const sanitizedUrl = (process.env.DATABASE_URL || '').replace(/:[^:@]+@/, ':****@');
    this.logger.log(`PrismaService instanciado con DATABASE_URL: ${sanitizedUrl}`);
  }

  async onModuleInit() {
    let retries = 5;
    const delay = 3000; // 3 segundos para dar tiempo a Neon de despertar

    while (retries > 0) {
      try {
        this.logger.log('Iniciando conexión con la base de datos PostgreSQL Serverless...');
        await this.$connect();
        this.isConnected = true;
        this.logger.log('Conexión con PostgreSQL establecida exitosamente.');
        break;
      } catch (error: unknown) {
        retries--;
        this.isConnected = false;
        
        if (error instanceof Error) {
          this.logger.error(`Fallo de conexión en frío con Neon DB. Reintentos restantes: ${retries}. Detalle: ${error.message}`);
        } else {
          this.logger.error(`Fallo de conexión en frío con Neon DB. Reintentos restantes: ${retries}`);
        }

        if (retries === 0) {
          this.logger.error('No se pudo establecer conexión definitiva con la Base de Datos.');
          throw error;
        }

        this.logger.warn(`Esperando ${delay / 1000}s para el reintento...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Cerrando conexión de base de datos...');
      await this.$disconnect();
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Error al desconectar de la base de datos: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);
      } else {
        this.logger.error('Error inesperado no verificado al desconectar:', String(error));
      }
    }
  }
}
