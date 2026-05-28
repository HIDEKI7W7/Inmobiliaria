import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * TSK-4.2 — Filtro Global de Excepciones HTTP
 *
 * Centraliza y sanitiza TODAS las respuestas de error del sistema antes de
 * enviarlas al cliente. Garantiza que:
 * 1. Nunca se exponga un stack trace de Prisma, PostgreSQL o Node.js al cliente.
 * 2. Los errores de base de datos conocidos (P2002, P2025, etc.) se traduzcan
 *    a mensajes HTTP semánticos y seguros.
 * 3. El log detallado del error (con contexto interno) queda ÚNICAMENTE del
 *    lado del servidor.
 *
 * Arquitectura: Capa de Infraestructura (Adaptador de Error Handling)
 * OWASP: A05:2021 – Security Misconfiguration (información sensible en errores)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('🛡️ ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message } = this.resolveException(exception, request);

    // Log detallado únicamente en el servidor — nunca en el cliente
    this.logger.error(
      `[${request.method}] ${request.url} → HTTP ${statusCode}: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(statusCode).json({
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Resolución de Excepciones
  // ─────────────────────────────────────────────────────────────────────────────

  private resolveException(
    exception: unknown,
    request: Request,
  ): { statusCode: number; message: string } {
    // 1. Excepciones HTTP nativas de NestJS (ValidationPipe, Guards, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message = this.extractMessage(exceptionResponse);
      return { statusCode: status, message };
    }

    // 2. Errores conocidos de Prisma ORM → traducción a mensajes HTTP seguros
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(exception);
    }

    // 3. Errores de validación de Prisma (ej. tipo de dato incorrecto)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Los datos enviados no tienen el formato esperado.',
      };
    }

    // 4. Timeout de conexión a la base de datos u otros errores de inicialización
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'El servicio de base de datos no está disponible temporalmente.',
      };
    }

    // 5. Errores de runtime de Prisma no categorizados
    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Ocurrió un error crítico interno. Por favor, intente más tarde.',
      };
    }

    // 6. Fallback: cualquier otro error no controlado (500 genérico y seguro)
    this.logger.error(
      `[UNHANDLED] ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocurrió un error inesperado. Por favor, intente más tarde.',
    };
  }

  /**
   * Mapeo de códigos de error de Prisma a respuestas HTTP semánticas y seguras.
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference
   */
  private handlePrismaKnownError(
    error: Prisma.PrismaClientKnownRequestError,
  ): { statusCode: number; message: string } {
    switch (error.code) {
      // P2002: Violación de restricción UNIQUE (ej. email duplicado)
      case 'P2002': {
        const fields = (error.meta?.target as string[])?.join(', ') ?? 'campo';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `Ya existe un registro con el mismo valor en: ${fields}.`,
        };
      }

      // P2025: Registro no encontrado (ej. update/delete de ID inexistente)
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'El recurso solicitado no fue encontrado.',
        };

      // P2003: Violación de Foreign Key (ej. referencia a ID que no existe)
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'La referencia a un recurso relacionado no es válida o no existe.',
        };

      // P2014: Violación de relación requerida
      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'La operación viola una relación requerida entre entidades.',
        };

      // P2016: Error de interpretación de query
      case 'P2016':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'La consulta no pudo ser procesada correctamente.',
        };

      // P2028: Timeout en transacción
      case 'P2028':
        return {
          statusCode: HttpStatus.REQUEST_TIMEOUT,
          message: 'La operación tardó demasiado. Por favor, intente nuevamente.',
        };

      // Código desconocido — respuesta genérica y segura
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Ocurrió un error de base de datos. Por favor, intente más tarde.',
        };
    }
  }

  /**
   * Extrae el mensaje de error de forma segura desde una respuesta de HttpException.
   * Soporta tanto strings como objetos con campo `message`.
   */
  private extractMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const msg = (exceptionResponse as { message: unknown }).message;
      if (Array.isArray(msg)) return msg.join('; ');
      if (typeof msg === 'string') return msg;
    }
    return 'Ocurrió un error en la solicitud.';
  }
}
