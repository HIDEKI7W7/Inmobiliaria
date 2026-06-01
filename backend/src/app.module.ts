import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

