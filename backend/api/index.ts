import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PerformanceLoggingInterceptor } from '../src/common/interceptors/performance-logging.interceptor';
import express from 'express';

let cachedHandler: any;

async function bootstrap() {
  if (!cachedHandler) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);

    // Habilitar cabeceras de seguridad HTTP con Helmet (con algunas directivas relajadas para serverless si es necesario)
    app.use(helmet({
      contentSecurityPolicy: false,
    }));

    // Prefijo global de API para todas las rutas
    app.setGlobalPrefix('api');

    // Obtener y parsear los orígenes permitidos desde las variables de entorno
    const allowedOriginsString = process.env.CORS_ALLOWED_ORIGINS || '';
    const allowedOrigins = allowedOriginsString
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Agregar localhosts como fallback para desarrollo local
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');

    // Habilitar CORS para permitir llamadas seguras desde el frontend de Next.js
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some((allowedOrigin) => {
          if (allowedOrigin === '*') return true;
          return allowedOrigin === origin || origin.endsWith(allowedOrigin.replace('*.', '.'));
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`Orígenes no permitidos por la política estricta de CORS de Propio: ${origin}`));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    });

    // Filtro global de excepciones: sanitiza errores de Prisma/DB antes de enviarlos al cliente
    app.useGlobalFilters(new HttpExceptionFilter());

    // Interceptor global de rendimiento: mide latencia por endpoint
    app.useGlobalInterceptors(new PerformanceLoggingInterceptor());

    // Configuración global de pipes para validaciones de DTOs automáticas
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Inicializar la aplicación NestJS sin escuchar en un puerto específico
    await app.init();

    cachedHandler = expressApp;
  }
  return cachedHandler;
}

export default async (req: any, res: any) => {
  const handler = await bootstrap();
  return handler(req, res);
};
