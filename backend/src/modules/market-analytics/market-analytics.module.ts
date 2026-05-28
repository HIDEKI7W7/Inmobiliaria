import { Module } from '@nestjs/common';
import { MarketAnalyticsController } from './market-analytics.controller';
import { MarketAnalyticsService } from './market-analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketAnalyticsController],
  providers: [MarketAnalyticsService],
  exports: [MarketAnalyticsService], // Exportado para que AlertsModule lo reutilice
})
export class MarketAnalyticsModule {}
