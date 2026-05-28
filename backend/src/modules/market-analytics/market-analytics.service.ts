import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Tipos de salida ──────────────────────────────────────────────────────────
export interface DaysOnMarketResult {
  propertyId: string;
  daysOnMarket: number;
  urgencyLevel: 'new' | 'fresh' | 'normal' | 'aging' | 'stale';
  urgencyLabel: string;
  approvedAt: Date | null;
}

export interface ZonePriceTrend {
  zona: string;
  avgPricePerM2: number;
  totalProperties: number;
  monthlySnapshots: { month: string; avgPrice: number; count: number }[];
  priceChange30d: number; // % cambio últimos 30 días
}

export interface MarketSummary {
  zona: string;
  totalActive: number;
  avgPrice: number;
  avgDaysOnMarket: number;
  newListings7d: number;
  priceReductions30d: number;
}

// ─── Datos mock de historial de precios para desarrollo sin DB ────────────────
const MOCK_PRICE_HISTORY: Record<string, { month: string; avgPrice: number; count: number }[]> = {
  'Cala Cala': [
    { month: 'Dic 2024', avgPrice: 290000, count: 8 },
    { month: 'Ene 2025', avgPrice: 298000, count: 11 },
    { month: 'Feb 2025', avgPrice: 305000, count: 9 },
    { month: 'Mar 2025', avgPrice: 310000, count: 13 },
    { month: 'Abr 2025', avgPrice: 315000, count: 10 },
    { month: 'May 2025', avgPrice: 320000, count: 14 },
  ],
  'Queru Queru': [
    { month: 'Dic 2024', avgPrice: 162000, count: 6 },
    { month: 'Ene 2025', avgPrice: 165000, count: 8 },
    { month: 'Feb 2025', avgPrice: 170000, count: 7 },
    { month: 'Mar 2025', avgPrice: 175000, count: 9 },
    { month: 'Abr 2025', avgPrice: 180000, count: 11 },
    { month: 'May 2025', avgPrice: 185000, count: 12 },
  ],
  'El Prado': [
    { month: 'Dic 2024', avgPrice: 88000, count: 12 },
    { month: 'Ene 2025', avgPrice: 89500, count: 9 },
    { month: 'Feb 2025', avgPrice: 90000, count: 14 },
    { month: 'Mar 2025', avgPrice: 91000, count: 11 },
    { month: 'Abr 2025', avgPrice: 93000, count: 13 },
    { month: 'May 2025', avgPrice: 95000, count: 16 },
  ],
  'Sarco': [
    { month: 'Dic 2024', avgPrice: 42000, count: 5 },
    { month: 'Ene 2025', avgPrice: 43500, count: 7 },
    { month: 'Feb 2025', avgPrice: 44000, count: 6 },
    { month: 'Mar 2025', avgPrice: 45000, count: 8 },
    { month: 'Abr 2025', avgPrice: 46000, count: 9 },
    { month: 'May 2025', avgPrice: 48000, count: 11 },
  ],
};

@Injectable()
export class MarketAnalyticsService {
  private readonly logger = new Logger(MarketAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Cálculo de Days on Market ───────────────────────────────────────────
  async getDaysOnMarket(propertyId: string): Promise<DaysOnMarketResult> {
    let approvedAt: Date | null = null;

    try {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { approvedAt: true, createdAt: true },
      });

      if (!property) throw new NotFoundException(`Propiedad ${propertyId} no encontrada`);
      approvedAt = property.approvedAt ?? property.createdAt;
    } catch (error) {
      this.logger.warn(`DB offline — usando fallback temporal para DOM de ${propertyId}`);
      // Fallback: simula una fecha de aprobación reciente para desarrollo
      approvedAt = new Date(Date.now() - Math.floor(Math.random() * 45) * 24 * 60 * 60 * 1000);
    }

    const now = new Date();
    const diffMs = now.getTime() - (approvedAt?.getTime() ?? now.getTime());
    const daysOnMarket = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const { urgencyLevel, urgencyLabel } = this.classifyUrgency(daysOnMarket);

    return { propertyId, daysOnMarket, urgencyLevel, urgencyLabel, approvedAt };
  }

  // ─── Clasificador de urgencia por días ────────────────────────────────────
  private classifyUrgency(days: number): { urgencyLevel: DaysOnMarketResult['urgencyLevel']; urgencyLabel: string } {
    if (days <= 3)  return { urgencyLevel: 'new',    urgencyLabel: '🔥 Nuevo hoy' };
    if (days <= 14) return { urgencyLevel: 'fresh',  urgencyLabel: '✨ Recién publicado' };
    if (days <= 30) return { urgencyLevel: 'normal', urgencyLabel: '📅 En mercado' };
    if (days <= 60) return { urgencyLevel: 'aging',  urgencyLabel: '⏳ Hace tiempo en mercado' };
    return              { urgencyLevel: 'stale',  urgencyLabel: '⚠️ Mucho tiempo publicado' };
  }

  // ─── Tendencias de precio por zona ────────────────────────────────────────
  async getPriceTrendsByZona(zona: string): Promise<ZonePriceTrend> {
    // Intentar desde DB, fallback a mock
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const histories = await this.prisma.priceHistory.findMany({
        where: {
          property: { location: { contains: zona, mode: 'insensitive' } },
          recordedAt: { gte: sixMonthsAgo },
        },
        include: { property: { select: { area: true, location: true } } },
        orderBy: { recordedAt: 'asc' },
      });

      if (histories.length > 0) {
        return this.aggregatePriceHistory(zona, histories);
      }
    } catch {
      this.logger.warn(`DB offline — usando mock de tendencias para zona: ${zona}`);
    }

    // Fallback: datos mock enriquecidos
    const snapshots = MOCK_PRICE_HISTORY[zona] ?? MOCK_PRICE_HISTORY['El Prado'];
    const latest = snapshots[snapshots.length - 1].avgPrice;
    const previous = snapshots[snapshots.length - 2]?.avgPrice ?? latest;
    const priceChange30d = ((latest - previous) / previous) * 100;

    return {
      zona,
      avgPricePerM2: Math.round(latest / 150), // Estimado basado en área promedio
      totalProperties: snapshots[snapshots.length - 1].count,
      monthlySnapshots: snapshots,
      priceChange30d: parseFloat(priceChange30d.toFixed(2)),
    };
  }

  // ─── Agregador de historial de DB ─────────────────────────────────────────
  private aggregatePriceHistory(zona: string, histories: any[]): ZonePriceTrend {
    const byMonth: Record<string, { total: number; count: number; areas: number[] }> = {};

    for (const h of histories) {
      const month = h.recordedAt.toISOString().slice(0, 7); // "2025-05"
      if (!byMonth[month]) byMonth[month] = { total: 0, count: 0, areas: [] };
      byMonth[month].total += h.price;
      byMonth[month].count += 1;
      if (h.property?.area) byMonth[month].areas.push(h.property.area);
    }

    const monthlySnapshots = Object.entries(byMonth).map(([m, v]) => ({
      month: this.formatMonth(m),
      avgPrice: Math.round(v.total / v.count),
      count: v.count,
    }));

    const latest = monthlySnapshots[monthlySnapshots.length - 1];
    const prev = monthlySnapshots[monthlySnapshots.length - 2];
    const priceChange30d = prev ? ((latest.avgPrice - prev.avgPrice) / prev.avgPrice) * 100 : 0;

    const allAreas = histories.flatMap(h => h.property?.area ? [h.property.area] : []);
    const avgArea = allAreas.length ? allAreas.reduce((a, b) => a + b, 0) / allAreas.length : 150;

    return {
      zona,
      avgPricePerM2: Math.round(latest.avgPrice / avgArea),
      totalProperties: latest.count,
      monthlySnapshots,
      priceChange30d: parseFloat(priceChange30d.toFixed(2)),
    };
  }

  private formatMonth(iso: string): string {
    const [year, month] = iso.split('-');
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${names[parseInt(month) - 1]} ${year}`;
  }

  // ─── Resumen de mercado por zona ──────────────────────────────────────────
  async getMarketSummary(zona: string): Promise<MarketSummary> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [properties, newListings] = await Promise.all([
        this.prisma.property.findMany({
          where: { location: { contains: zona, mode: 'insensitive' } },
          select: { price: true, approvedAt: true, createdAt: true },
        }),
        this.prisma.property.count({
          where: {
            location: { contains: zona, mode: 'insensitive' },
            createdAt: { gte: sevenDaysAgo },
          },
        }),
      ]);

      const avgPrice = properties.length
        ? properties.reduce((s, p) => s + p.price, 0) / properties.length
        : 0;

      const now = Date.now();
      const avgDays = properties.length
        ? properties.reduce((s, p) => {
            const since = (p.approvedAt ?? p.createdAt).getTime();
            return s + Math.floor((now - since) / 86400000);
          }, 0) / properties.length
        : 0;

      return {
        zona,
        totalActive: properties.length,
        avgPrice: Math.round(avgPrice),
        avgDaysOnMarket: Math.round(avgDays),
        newListings7d: newListings,
        priceReductions30d: Math.floor(properties.length * 0.12), // ~12% estimado
      };
    } catch {
      this.logger.warn(`DB offline — mock summary para: ${zona}`);
      const trend = MOCK_PRICE_HISTORY[zona]?.[5];
      return {
        zona,
        totalActive: trend?.count ?? 10,
        avgPrice: trend?.avgPrice ?? 150000,
        avgDaysOnMarket: 22,
        newListings7d: 3,
        priceReductions30d: 2,
      };
    }
  }

  // ─── Snapshot de precio (para registrar reducción de precio) ──────────────
  async recordPriceSnapshot(propertyId: string, price: number): Promise<void> {
    try {
      await this.prisma.priceHistory.create({
        data: { propertyId, price },
      });
      this.logger.log(`📊 Snapshot de precio registrado: ${propertyId} = $${price}`);
    } catch (error) {
      this.logger.warn(`No se pudo registrar snapshot de precio: ${error.message}`);
    }
  }
}
