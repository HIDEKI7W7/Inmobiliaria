import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * TSK-1.1 — Interceptor Global de Rendimiento
 *
 * Mide y registra el tiempo de respuesta (en ms) de cada endpoint HTTP,
 * junto con el método, ruta, código de estado HTTP y tamaño aproximado
 * del payload. Destinado a funcionar como baseline de métricas de latencia.
 *
 * Arquitectura: Capa de Infraestructura (Adaptador de Observabilidad)
 */
@Injectable()
export class PerformanceLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('⚡ Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request>();
    const response = httpCtx.getResponse<Response>();

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsedMs = Date.now() - startTime;
          const statusCode = response.statusCode;
          const threshold = this.getThreshold(elapsedMs);

          this.logger.log(
            `${threshold} ${method} ${url} → ${statusCode} [${elapsedMs}ms]`,
          );
        },
        error: () => {
          const elapsedMs = Date.now() - startTime;
          // Los errores se loggean aquí también para capturar la latencia total,
          // incluyendo el tiempo de procesamiento antes de que se lanzara el error.
          this.logger.warn(
            `❌ ${method} ${url} → ERROR [${elapsedMs}ms]`,
          );
        },
      }),
    );
  }

  /**
   * Asigna un emoji indicador de rendimiento según el umbral de latencia:
   * - 🟢 < 100ms  → Óptimo
   * - 🟡 < 500ms  → Aceptable
   * - 🔴 >= 500ms → Degradado (requiere atención)
   */
  private getThreshold(ms: number): string {
    if (ms < 100) return '🟢';
    if (ms < 500) return '🟡';
    return '🔴';
  }
}
