import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

const ORDERS_FILE = path.join(process.cwd(), 'marketing_orders.json');

export interface MarketingOrder {
  id: string;
  userId: string;
  userType: 'PROPIETARIO' | 'AGENTE' | 'BROKER';
  userName: string;
  userEmail: string;
  userPhone: string;
  propertyId: string;
  propertyTitle: string;
  propertyBranch: string;
  contractUrl: string;
  startDate: string;
  endDate: string;
  planId: string;
  planName: string;
  priceOverride: number;
  status: 'NUEVO' | 'CONTACTADO' | 'GRABADO' | 'PUBLICADO';
  createdAt: string;
}

@Injectable()
export class MarketingOrdersService {
  private readonly logger = new Logger(MarketingOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private read(): MarketingOrder[] {
    if (!fs.existsSync(ORDERS_FILE)) {
      // Seed default orders
      const seed: MarketingOrder[] = [
        {
          id: 'MKT-ORD-101',
          userId: 'owner-1',
          userType: 'PROPIETARIO',
          userName: 'René Vargas',
          userEmail: 'rene@mail.com',
          userPhone: '+59179812345',
          propertyId: 'prop-3-queru-queru',
          propertyTitle: 'Penthouse de Lujo en Queru Queru',
          propertyBranch: 'Cochabamba',
          contractUrl: '/uploads/contrato_reside.pdf',
          startDate: '2026-06-01',
          endDate: '2026-12-01',
          planId: 'plan-venta-pro',
          planName: 'Plan Venta Pro',
          priceOverride: 490,
          status: 'NUEVO',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'MKT-ORD-102',
          userId: 'owner-2',
          userType: 'PROPIETARIO',
          userName: 'Claudia Claure',
          userEmail: 'clau@mail.com',
          userPhone: '+59171299887',
          propertyId: 'prop-1-muyurina',
          propertyTitle: 'Casa de Campo en Muyurina',
          propertyBranch: 'Cochabamba',
          contractUrl: '/uploads/contrato_villa.pdf',
          startDate: '2026-06-15',
          endDate: '2026-09-15',
          planId: 'plan-cierre-garantizado',
          planName: 'Cierre Garantizado',
          priceOverride: 750,
          status: 'CONTACTADO',
          createdAt: new Date().toISOString(),
        }
      ];
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    try {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  private write(data: MarketingOrder[]) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  findAll(branchId?: string): MarketingOrder[] {
    const orders = this.read();
    if (branchId && branchId !== 'TODOS') {
      return orders.filter(o => o.propertyBranch.toLowerCase() === branchId.toLowerCase());
    }
    return orders;
  }

  async create(body: {
    userId: string;
    userType: string;
    propertyId: string;
    contractUrl?: string;
    startDate: string;
    endDate: string;
    planId: string;
    priceOverride: number;
  }): Promise<MarketingOrder> {
    if (!body.userId || !body.propertyId || !body.startDate || !body.endDate || !body.planId) {
      throw new BadRequestException('Faltan campos obligatorios para registrar el pedido de marketing.');
    }

    // Resolve user details from DB best-effort
    let userName = 'Usuario Desconocido';
    let userEmail = 'correo@mail.com';
    let userPhone = '+59170000000';
    try {
      const user = await this.prisma.user.findUnique({ where: { id: body.userId } });
      if (user) {
        userName = user.name || user.nickname || 'Sin nombre';
        userEmail = user.email;
        userPhone = user.whatsappPhone || '+59170000000';
      }
    } catch (err) {
      this.logger.warn(`Could not resolve user: ${err.message}`);
    }

    // Resolve property details
    let propertyTitle = 'Propiedad de Marketing';
    let propertyBranch = 'Cochabamba';
    try {
      const property = await this.prisma.property.findUnique({ where: { id: body.propertyId } });
      if (property) {
        propertyTitle = property.title;
        propertyBranch = property.location || 'Cochabamba';
      }
    } catch (err) {
      this.logger.warn(`Could not resolve property: ${err.message}`);
    }

    // Resolve plan name
    let planName = 'Plan Custom';
    try {
      const plan = await this.prisma.marketingPlan.findUnique({ where: { id: body.planId } });
      if (plan) planName = plan.name;
    } catch (err) {
      this.logger.warn(`Could not resolve plan: ${err.message}`);
    }

    const orders = this.read();
    const newOrder: MarketingOrder = {
      id: `MKT-ORD-${Date.now()}`,
      userId: body.userId,
      userType: (body.userType || 'PROPIETARIO').toUpperCase() as any,
      userName,
      userEmail,
      userPhone,
      propertyId: body.propertyId,
      propertyTitle,
      propertyBranch,
      contractUrl: body.contractUrl || '#',
      startDate: body.startDate,
      endDate: body.endDate,
      planId: body.planId,
      planName,
      priceOverride: Number(body.priceOverride) || 0,
      status: 'NUEVO',
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    this.write(orders);
    return newOrder;
  }

  updateStatus(id: string, status: string): MarketingOrder {
    const orders = this.read();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new BadRequestException(`Pedido ${id} no encontrado.`);

    const validStages = ['NUEVO', 'CONTACTADO', 'GRABADO', 'PUBLICADO'];
    if (!validStages.includes(status.toUpperCase())) {
      throw new BadRequestException(`Etapa ${status} no permitida.`);
    }

    orders[idx].status = status.toUpperCase() as any;
    this.write(orders);
    return orders[idx];
  }
}
