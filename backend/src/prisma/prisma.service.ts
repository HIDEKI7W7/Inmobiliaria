import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

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
    } catch (error: unknown) {
      // IMPLEMENTACIÓN DE TYPE GUARDING ESTRICTO
      if (error instanceof Error) {
        this.logger.error(`Error al conectar a la base de datos: ${error.message}`);
        this.logger.error(`Stack: ${error.stack}`);
      } else {
        this.logger.error('Un error inesperado no verificado ha ocurrido:', String(error));
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
