import { Controller, Get, Param, Post, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { MarketAnalyticsService } from './market-analytics.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('market')
export class MarketAnalyticsController {
  constructor(private readonly marketAnalyticsService: MarketAnalyticsService) {}

  /**
   * GET /api/market/dom/:propertyId
   * Retorna los días en el mercado y nivel de urgencia de un inmueble.
   */
  @Get('dom/:propertyId')
  async getDaysOnMarket(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.marketAnalyticsService.getDaysOnMarket(propertyId);
  }

  /**
   * GET /api/market/trends/:zona
   * Retorna la gráfica de tendencia de precios mensuales de una zona.
   */
  @Get('trends/:zona')
  async getPriceTrends(@Param('zona') zona: string) {
    return this.marketAnalyticsService.getPriceTrendsByZona(
      decodeURIComponent(zona),
    );
  }

  /**
   * GET /api/market/summary/:zona
   * Retorna el resumen de mercado: total activos, precio promedio, DOM promedio, etc.
   */
  @Get('summary/:zona')
  async getMarketSummary(@Param('zona') zona: string) {
    return this.marketAnalyticsService.getMarketSummary(
      decodeURIComponent(zona),
    );
  }

  /**
   * POST /api/market/snapshot (protegido — solo agentes/admins)
   * Registra un snapshot de precio en el historial de una propiedad.
   */
  @Post('snapshot')
  @UseGuards(AuthGuard)
  async recordSnapshot(
    @Body() body: { propertyId: string; price: number },
  ) {
    await this.marketAnalyticsService.recordPriceSnapshot(
      body.propertyId,
      body.price,
    );
    return { message: 'Snapshot de precio registrado exitosamente' };
  }
}
