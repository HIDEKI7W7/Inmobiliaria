import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Inicialización del cliente de Prisma con logs estructurados para depuración en desarrollo
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  /**
   * Se ejecuta automáticamente al inicializar el módulo NestJS.
   * Conecta de forma inmediata y asíncrona a la base de datos PostgreSQL.
   */
  async onModuleInit() {
    try {
      this.logger.log('Iniciando conexión con la base de datos PostgreSQL...');
      await this.$connect();
      this.logger.log('Conexión con PostgreSQL establecida exitosamente. (Prisma Client conectado)');
    } catch (error) {
      this.logger.warn(
        `No se pudo conectar a PostgreSQL en el arranque: ${error.message}. El sistema continuará en modo de desarrollo resiliente.`
      );
      // Evitamos lanzar el error para que NestJS pueda arrancar con normalidad y habilitar el fallback en memoria
    }
  }

  /**
   * Se ejecuta al apagar el servidor NestJS (SIGTERM, SIGINT, etc.).
   * Libera los recursos de conexión de forma controlada y evita memory leaks en producción.
   */
  async onModuleDestroy() {
    try {
      this.logger.log('Cerrando conexión de base de datos de forma limpia (Shutdown Signal detectado)...');
      await this.$disconnect();
      this.logger.log('Conexión con PostgreSQL cerrada de forma exitosa.');
    } catch (error) {
      this.logger.error(
        `Error al cerrar la conexión de base de datos de forma limpia: ${error.message}`,
        error.stack,
      );
    }
  }
}
