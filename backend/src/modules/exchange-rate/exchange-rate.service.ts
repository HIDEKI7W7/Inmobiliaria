import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ExchangeRateService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRateService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('Inicializando servicio de Tipo de Cambio flotante...');
    // Ejecutar inmediatamente al iniciar
    await this.syncExchangeRate();
    // Programar ejecución todos los días a las 06:00 AM
    this.scheduleDailySync();
  }

  /**
   * Programa la sincronización diaria para ejecutarse a las 06:00 AM hora local
   */
  private scheduleDailySync() {
    const now = new Date();
    const target = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      6, // 06:00 AM
      0,
      0,
      0
    );

    if (now.getTime() > target.getTime()) {
      // Si ya pasó de las 6 AM hoy, programar para mañana a las 6 AM
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    this.logger.log(`Próxima sincronización automática programada en: ${(delay / 1000 / 60).toFixed(2)} minutos.`);

    this.timer = setTimeout(async () => {
      await this.syncExchangeRate();
      // Después del primer retraso, ejecutar cada 24 horas
      this.timer = setInterval(async () => {
        await this.syncExchangeRate();
      }, 24 * 60 * 60 * 1000);
    }, delay);
  }

  /**
   * Realiza la sincronización de tipo de cambio desde la página del BCB
   */
  async syncExchangeRate(): Promise<{ rateBuy: number; rateSell: number; source: string }> {
    this.logger.log('Sincronizando tipo de cambio con el Banco Central de Bolivia...');
    let rateBuy = 6.86;
    let rateSell = 6.96;
    let success = false;
    const url = 'https://www.bcb.gob.bo/';

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });

      const html = response.data;
      // Regex para buscar valores de compra/venta en la página del BCB
      const buyRegex = /(?:tipo\s+de\s+cambio|compra|dólar|dolar)[\s\S]*?(\d[\.,]\d{2})/i;
      const sellRegex = /(?:venta)[\s\S]*?(\d[\.,]\d{2})/i;

      const buyMatch = html.match(buyRegex);
      const sellMatch = html.match(sellRegex);

      if (buyMatch && buyMatch[1]) {
        rateBuy = parseFloat(buyMatch[1].replace(',', '.'));
        success = true;
      }
      if (sellMatch && sellMatch[1]) {
        rateSell = parseFloat(sellMatch[1].replace(',', '.'));
        success = true;
      }

      // Validar rangos realistas para el tipo de cambio oficial en Bolivia (ej. entre 6.00 y 10.00)
      if (rateBuy < 6.0 || rateBuy > 10.0 || rateSell < 6.0 || rateSell > 10.0) {
        throw new Error(`Valores extraídos fuera de rango realista: Compra=${rateBuy}, Venta=${rateSell}`);
      }

      this.logger.log(`Tipo de cambio extraído con éxito del BCB: Compra=${rateBuy}, Venta=${rateSell}`);
    } catch (error: any) {
      this.logger.warn(`Fallo al extraer tipo de cambio del BCB: ${error.message || error}`);
      // Fallback: usar el último valor almacenado en BD si es válido
      const lastRate = await this.getCurrentRateFromDb();
      if (lastRate && lastRate.rateBuy >= 6.0 && lastRate.rateBuy <= 10.0 && lastRate.rateSell >= 6.0 && lastRate.rateSell <= 10.0) {
        rateBuy = lastRate.rateBuy;
        rateSell = lastRate.rateSell;
        this.logger.log(`Cargando último tipo de cambio de la BD: Compra=${rateBuy}, Venta=${rateSell}`);
      } else {
        rateBuy = 6.86;
        rateSell = 6.96;
        this.logger.log(`Usando valores fallback por defecto: Compra=${rateBuy}, Venta=${rateSell}`);
      }

      // Guardar alerta en los logs de actividad del administrador
      await this.logActivity(`ALERTA: Falló la sincronización automática con el BCB. Se mantuvo el tipo de cambio (Compra: ${rateBuy} / Venta: ${rateSell}). Detalle: ${error.message || error}`);
    }

    // Actualizar o crear la configuración global en la BD (solo si es un valor realista)
    if (rateBuy >= 6.0 && rateBuy <= 10.0 && rateSell >= 6.0 && rateSell <= 10.0) {
      await this.updateRateInDb(rateBuy, rateSell, 'BCB');
    }

    return { rateBuy, rateSell, source: 'BCB' };
  }

  /**
   * Obtiene la tasa de cambio actual desde la base de datos
   */
  async getCurrentRate(): Promise<{ rateBuy: number; rateSell: number; updatedAt: Date }> {
    const rate = await this.getCurrentRateFromDb();
    if (rate && rate.rateBuy >= 6.0 && rate.rateBuy <= 10.0 && rate.rateSell >= 6.0 && rate.rateSell <= 10.0) {
      return {
        rateBuy: rate.rateBuy,
        rateSell: rate.rateSell,
        updatedAt: rate.updatedAt,
      };
    }
    return {
      rateBuy: 6.86,
      rateSell: 6.96,
      updatedAt: new Date(),
    };
  }

  /**
   * Permite actualizar manualmente el tipo de cambio desde el panel de administración
   */
  async updateRateManually(rateBuy: number, rateSell: number): Promise<any> {
    this.logger.log(`Actualizando manualmente el tipo de cambio: Compra=${rateBuy}, Venta=${rateSell}`);
    await this.updateRateInDb(rateBuy, rateSell, 'MANUAL');
    await this.logActivity(`ADMIN: Tipo de cambio actualizado manualmente a Compra: ${rateBuy} / Venta: ${rateSell}`);
    return { message: 'Tipo de cambio actualizado manualmente con éxito.', rateBuy, rateSell };
  }

  /**
   * Obtiene el historial de tasas de cambio para auditoría
   */
  async getHistory(): Promise<any[]> {
    if (this.prisma.isConnected) {
      return this.prisma.exchangeRateHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
    }
    return [];
  }

  // ── Helpers de Acceso a Base de Datos ──

  private async getCurrentRateFromDb() {
    if (this.prisma.isConnected) {
      return this.prisma.exchangeRate.findUnique({
        where: { key: 'USD_BOB' },
      });
    }
    return null;
  }

  private async updateRateInDb(rateBuy: number, rateSell: number, source: string) {
    if (this.prisma.isConnected) {
      // 1. Actualizar configuración global
      await this.prisma.exchangeRate.upsert({
        where: { key: 'USD_BOB' },
        update: { rateBuy, rateSell },
        create: { key: 'USD_BOB', rateBuy, rateSell },
      });

      // 2. Registrar en historial de auditoría
      await this.prisma.exchangeRateHistory.create({
        data: { rateBuy, rateSell, source },
      });
    }
  }

  private async logActivity(text: string) {
    this.logger.log(text);
    if (this.prisma.isConnected) {
      await this.prisma.activityLog.create({
        data: { text },
      }).catch((err: any) => this.logger.error(`Error al guardar log de actividad: ${err.message}`));
    }
  }
}
