import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

export interface CreateAlertDto {
  userId: string;
  zona: string;
  precioMax: number;
  tipoInmueble: 'CASA' | 'DEPARTAMENTO' | 'TERRENO' | 'OFICINA';
}

export interface MatchResult {
  alertId: string;
  userId: string;
  matchedProperties: {
    id: string;
    title: string;
    price: number;
    location: string;
    type: string;
  }[];
  matchedAt: Date;
}

// ─── Mock en memoria para desarrollo sin DB ────────────────────────────────────
const MOCK_ALERTS: Array<CreateAlertDto & { id: string; isActive: boolean; createdAt: Date; lastMatchAt: Date | null }> = [];

const MOCK_PROPERTIES = [
  { id: 'prop-1-cala-cala',   title: 'Casa Familiar en Cala Cala',         price: 320000, location: 'Cala Cala',   type: 'CASA'          },
  { id: 'prop-2-queru-queru', title: 'Penthouse de Lujo en Queru Queru',   price: 185000, location: 'Queru Queru', type: 'DEPARTAMENTO'  },
  { id: 'prop-3-el-prado',    title: 'Departamento Moderno en El Prado',   price: 95000,  location: 'El Prado',    type: 'DEPARTAMENTO'  },
  { id: 'prop-4-sarco',       title: 'Terreno Comercial en Sarco',         price: 48000,  location: 'Sarco',       type: 'TERRENO'       },
  { id: 'prop-5-mayorazgo',   title: 'Oficina Premium en Mayorazgo',       price: 135000, location: 'Mayorazgo',   type: 'OFICINA'       },
  { id: 'prop-6-muyurina',    title: 'Casa de Campo en Muyurina',          price: 220000, location: 'Muyurina',    type: 'CASA'          },
];

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
  ) {}

  // ─── Crear alerta ──────────────────────────────────────────────────────────
  async createAlert(dto: CreateAlertDto) {
    const { userId, zona, precioMax, tipoInmueble } = dto;

    if (!zona || !precioMax || !tipoInmueble) {
      throw new BadRequestException('zona, precioMax y tipoInmueble son requeridos');
    }

    if (precioMax <= 0) {
      throw new BadRequestException('precioMax debe ser mayor que 0');
    }

    try {
      const alert = await this.prisma.propertyAlert.create({
        data: { userId, zona, precioMax, tipoInmueble },
      });
      this.logger.log(`🔔 Alerta creada: ${alert.id} — ${zona} | ${tipoInmueble} | Max $${precioMax}`);
      return { message: 'Alerta de búsqueda activada exitosamente', alert };
    } catch (error) {
      this.logger.warn(`DB offline — almacenando alerta en memoria: ${error.message}`);
      const mockAlert = {
        id: `alert-${Date.now()}`,
        userId,
        zona,
        precioMax,
        tipoInmueble,
        isActive: true,
        createdAt: new Date(),
        lastMatchAt: null,
      };
      MOCK_ALERTS.push(mockAlert);
      return { message: 'Alerta activada (resiliencia local)', alert: mockAlert };
    }
  }

  // ─── Listar alertas del usuario ────────────────────────────────────────────
  async getUserAlerts(userId: string) {
    try {
      return await this.prisma.propertyAlert.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      return MOCK_ALERTS.filter(a => a.userId === userId && a.isActive);
    }
  }

  // ─── Desactivar alerta ─────────────────────────────────────────────────────
  async deactivateAlert(alertId: string, userId: string) {
    try {
      const alert = await this.prisma.propertyAlert.findFirst({
        where: { id: alertId, userId },
      });
      if (!alert) throw new NotFoundException('Alerta no encontrada');

      await this.prisma.propertyAlert.update({
        where: { id: alertId },
        data: { isActive: false },
      });
      return { message: 'Alerta desactivada correctamente' };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      // Fallback mock
      const idx = MOCK_ALERTS.findIndex(a => a.id === alertId && a.userId === userId);
      if (idx !== -1) MOCK_ALERTS[idx].isActive = false;
      return { message: 'Alerta desactivada (resiliencia local)' };
    }
  }

  // ─── MOTOR DE EMPAREJAMIENTO ASÍNCRONO ────────────────────────────────────
  /**
   * Ejecuta el match engine: recorre todas las alertas activas y busca
   * propiedades que coincidan con los criterios zona+precio+tipo.
   * Diseñado para correr via cron job o disparo manual desde AdminController.
   */
  async runMatchEngine(): Promise<{ processedAlerts: number; totalMatches: number }> {
    this.logger.log('🚀 Iniciando Motor de Emparejamiento de Alertas...');
    let processedAlerts = 0;
    let totalMatches = 0;

    let alerts: any[] = [];
    try {
      alerts = await this.prisma.propertyAlert.findMany({
        where: { isActive: true },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
    } catch {
      this.logger.warn('DB offline — usando alertas en memoria para match engine');
      alerts = MOCK_ALERTS.filter(a => a.isActive);
    }

    for (const alert of alerts) {
      const matches = await this.findMatchingProperties(alert);
      processedAlerts++;

      if (matches.length > 0) {
        totalMatches += matches.length;
        await this.dispatchMatchNotification(alert, matches);
      }
    }

    this.logger.log(`✅ Match Engine completado: ${processedAlerts} alertas | ${totalMatches} matches`);
    return { processedAlerts, totalMatches };
  }

  // ─── Buscar propiedades que coinciden con la alerta ────────────────────────
  private async findMatchingProperties(alert: any): Promise<any[]> {
    try {
      return await this.prisma.property.findMany({
        where: {
          location: { contains: alert.zona, mode: 'insensitive' },
          price: { lte: alert.precioMax },
          type: alert.tipoInmueble as any,
          status: { not: 'RESERVADO' as any },
        },
        select: {
          id: true,
          title: true,
          price: true,
          location: true,
          type: true,
          approvedAt: true,
        },
        take: 5, // Máximo 5 matches por alerta para evitar spam
      });
    } catch {
      // Fallback mock en memoria
      return MOCK_PROPERTIES.filter(
        p =>
          p.location.toLowerCase().includes(alert.zona.toLowerCase()) &&
          p.price <= alert.precioMax &&
          p.type === alert.tipoInmueble,
      ).slice(0, 5);
    }
  }

  // ─── Despachar notificación de match ──────────────────────────────────────
  private async dispatchMatchNotification(alert: any, matches: any[]): Promise<void> {
    const matchResult: MatchResult = {
      alertId: alert.id,
      userId: alert.userId ?? alert.user?.id,
      matchedProperties: matches,
      matchedAt: new Date(),
    };

    this.logger.log(
      `🎯 Match para alerta ${alert.id}: ${matches.length} prop(s) en "${alert.zona}" ≤ $${alert.precioMax}`,
    );

    // Disparar webhook hacia n8n / Zapier para envío de email o WhatsApp
    await this.webhooksService.triggerWebhook('alert.match', {
      alert: {
        id: alert.id,
        zona: alert.zona,
        precioMax: alert.precioMax,
        tipoInmueble: alert.tipoInmueble,
        user: alert.user ?? { id: alert.userId, email: 'dev@propio.com.bo', name: 'Dev' },
      },
      matches: matchResult.matchedProperties,
      matchedAt: matchResult.matchedAt.toISOString(),
    });

    // Actualizar timestamp del último match
    try {
      await this.prisma.propertyAlert.update({
        where: { id: alert.id },
        data: { lastMatchAt: new Date() },
      });
    } catch {
      // DB offline — no bloquear el flujo
    }
  }

  // ─── Match inmediato para una propiedad recién publicada ──────────────────
  /**
   * Llama esto cuando se aprueba/publica una nueva propiedad.
   * Busca alertas activas que coincidan y notifica de inmediato.
   */
  async matchNewProperty(propertyId: string): Promise<number> {
    let property: any;
    try {
      property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, title: true, price: true, location: true, type: true },
      });
    } catch {
      property = MOCK_PROPERTIES.find(p => p.id === propertyId);
    }

    if (!property) return 0;

    let matchingAlerts: any[] = [];
    try {
      matchingAlerts = await this.prisma.propertyAlert.findMany({
        where: {
          isActive: true,
          precioMax: { gte: property.price },
          tipoInmueble: property.type,
          zona: { contains: property.location.split(',')[0], mode: 'insensitive' },
        },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
    } catch {
      matchingAlerts = MOCK_ALERTS.filter(
        a =>
          a.isActive &&
          a.precioMax >= property.price &&
          a.tipoInmueble === property.type &&
          property.location.toLowerCase().includes(a.zona.toLowerCase()),
      );
    }

    for (const alert of matchingAlerts) {
      await this.dispatchMatchNotification(alert, [property]);
    }

    this.logger.log(`⚡ Match inmediato: propiedad ${propertyId} notificó a ${matchingAlerts.length} usuario(s)`);
    return matchingAlerts.length;
  }
}
