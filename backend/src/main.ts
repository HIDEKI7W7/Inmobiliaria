import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PerformanceLoggingInterceptor } from './common/interceptors/performance-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar cabeceras de seguridad HTTP con Helmet
  app.use(helmet());

  // Habilitar shutdown hooks para permitir el ciclo de vida de apagado controlado de Prisma
  app.enableShutdownHooks();

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
      // Permitir peticiones sin origen (como clientes REST, apps móviles o SSR local)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin === '*') return true;
        // Coincidencia exacta o comodines de subdominios
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

  // TSK-4.2 — Filtro global de excepciones: sanitiza errores de Prisma/DB antes
  // de enviarlos al cliente, eliminando cualquier exposición de stack traces internos.
  app.useGlobalFilters(new HttpExceptionFilter());

  // TSK-1.1 — Interceptor global de rendimiento: mide latencia por endpoint
  // y la registra con umbrales visuales (🟢<100ms, 🟡<500ms, 🔴≥500ms).
  app.useGlobalInterceptors(new PerformanceLoggingInterceptor());

  // Configuración global de pipes para validaciones de DTOs automáticas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Backend de "Propio" corriendo en: http://localhost:${port}/api`);
}
bootstrap();
