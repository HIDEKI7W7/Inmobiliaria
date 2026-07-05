import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketingPlansService {
  private readonly logger = new Logger(MarketingPlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ponytail: self-healing seed on first call
  private async checkAndSeed() {
    const count = await this.prisma.marketingPlan.count();
    if (count === 0) {
      this.logger.log('Seeding default marketing plans into Neon Database...');
      
      const defaultPlans = [
        {
          id: 'plan-gratis',
          name: 'Plan Gratuito',
          price: 'Gratis',
          billingCycle: '',
          badgeText: null,
          themeType: 'gray',
          features: [
            { text: '1 publicación activa', included: true },
            { text: 'Fotos básicas (hasta 5)', included: true },
            { text: 'Contacto directo por WhatsApp', included: true },
          ],
        },
        {
          id: 'plan-contenidos',
          name: 'Plan Contenidos',
          price: '$69',
          billingCycle: '/mes',
          badgeText: 'MAS RECOMENDADO PARA RENTAS',
          themeType: 'green',
          features: [
            { text: '1 propiedad', included: true },
            { text: 'Fotos + Video optimizado', included: true },
            { text: 'Contacto directo por WhatsApp', included: true },
            { text: 'Mapa interactivo con radar', included: true },
            { text: 'Alquiler de letrero físico', included: true },
          ],
        },
        {
          id: 'plan-venta-pro',
          name: 'Plan Venta Pro',
          price: '$199',
          billingCycle: '/mes',
          badgeText: 'MAS RECOMENDADO PARA VENTA',
          themeType: 'green',
          features: [
            { text: '1 propiedad', included: true },
            { text: 'Dron + Fotos Profesionales', included: true },
            { text: 'Sello Oro + Mapa Premium', included: true },
            { text: 'Alquiler de letrero físico', included: true },
            { text: 'Estadísticas Avanzadas de Visitas', included: true },
            { text: 'PUBLICIDAD PRIORITARIA', included: true },
          ],
        },
        {
          id: 'plan-cierre-garantizado',
          name: 'Cierre Garantizado',
          price: 'Comisión: 1.5%',
          billingCycle: 'del valor de venta (Todo incluido)',
          badgeText: 'TODO INCLUIDO',
          themeType: 'blue',
          features: [
            { text: 'Gestión completa por Agente Experto', included: true },
            { text: 'Visitas y Negociación delegadas', included: true },
            { text: 'Alquiler de letrero físico', included: true },
            { text: 'Auditoría Legal y Notarial', included: true },
          ],
        },
      ];

      for (const plan of defaultPlans) {
        await this.prisma.marketingPlan.create({
          data: {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            billingCycle: plan.billingCycle,
            badgeText: plan.badgeText,
            themeType: plan.themeType,
            features: plan.features as any,
          },
        });
      }
    } else {
      // Self-heal/update existing legacy marketing plan prices
      await this.prisma.marketingPlan.updateMany({
        where: { id: 'plan-contenidos', price: '250' },
        data: {
          price: '$69',
          features: [
            { text: '1 propiedad', included: true },
            { text: 'Fotos + Video optimizado', included: true },
            { text: 'Contacto directo por WhatsApp', included: true },
            { text: 'Mapa interactivo con radar', included: true },
            { text: 'Alquiler de letrero físico', included: true },
          ] as any
        }
      });
      await this.prisma.marketingPlan.updateMany({
        where: { id: 'plan-venta-pro', price: '490' },
        data: {
          price: '$199',
          features: [
            { text: '1 propiedad', included: true },
            { text: 'Dron + Fotos Profesionales', included: true },
            { text: 'Sello Oro + Mapa Premium', included: true },
            { text: 'Alquiler de letrero físico', included: true },
            { text: 'Estadísticas Avanzadas de Visitas', included: true },
            { text: 'PUBLICIDAD PRIORITARIA', included: true },
          ] as any
        }
      });
      await this.prisma.marketingPlan.updateMany({
        where: { id: 'plan-cierre-garantizado', price: 'Comisión: 1.5%' },
        data: {
          billingCycle: 'del valor de venta (Todo incluido)',
          features: [
            { text: 'Gestión completa por Agente Experto', included: true },
            { text: 'Visitas y Negociación delegadas', included: true },
            { text: 'Alquiler de letrero físico', included: true },
            { text: 'Auditoría Legal y Notarial', included: true },
          ] as any
        }
      });
    }
  }

  async findAll() {
    await this.checkAndSeed();
    return this.prisma.marketingPlan.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.marketingPlan.update({
      where: { id },
      data: {
        name: data.name,
        price: String(data.price),
        billingCycle: data.billingCycle,
        badgeText: data.badgeText || null,
        themeType: data.themeType || 'gray',
        features: data.features as any,
      },
    });
  }
}
