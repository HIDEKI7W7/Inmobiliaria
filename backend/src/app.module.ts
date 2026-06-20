import { Module, Injectable, ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Skip throttling in development or test environments to avoid blocking parallel E2E tests (Playwright)
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return super.shouldSkip(context);
  }
}
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AdminModule } from './modules/admin/admin.module';
import { MarketAnalyticsModule } from './modules/market-analytics/market-analytics.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { StitchModule } from './modules/stitch/stitch.module';
import { FavoritosModule } from './modules/favoritos/favoritos.module';
import { BusquedasGuardadasModule } from './modules/busquedas-guardadas/busquedas-guardadas.module';
import { HistorialVistasModule } from './modules/historial-vistas/historial-vistas.module';
import { CierresModule } from './modules/cierres/cierres.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

/**
 * TSK-7.1 — Configuración del ThrottlerModule (Rate Limiting)
 *
 * Tres niveles de throttle para proteger endpoints sensibles:
 * - `default` : 200 req / 60s  → Catálogo público, analíticas
 * - `auth`    : 10  req / 60s  → Login, registro, OAuth callbacks
 * - `leads`   : 20  req / 60s  → Envío de leads / contacto
 *
 * Uso con decoradores:
 *   @SkipThrottle()                      // desactiva throttle en una ruta
 *   @Throttle({ auth: { limit: 5, ttl: 60000 } })  // sobrescribe por ruta
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // ventana de 60 segundos
        limit: 200,    // máx 200 peticiones por ventana
      },
      {
        name: 'auth',
        ttl: 60_000,
        limit: 10,     // máx 10 intentos de autenticación por minuto
      },
      {
        name: 'leads',
        ttl: 60_000,
        limit: 20,     // máx 20 envíos de lead por minuto
      },
    ]),
    PrismaModule,
    AuthModule,
    AdminModule,
    PropertiesModule,
    LeadsModule,
    MarketAnalyticsModule,
    AlertsModule,
    ContractsModule,
    PaymentsModule,
    ExpensesModule,
    StitchModule,
    FavoritosModule,
    BusquedasGuardadasModule,
    HistorialVistasModule,
    CierresModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [
    // TSK-7.1: Guard global de rate-limiting — aplica a todos los endpoints (CustomThrottlerGuard bypasses in dev/test)
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}


