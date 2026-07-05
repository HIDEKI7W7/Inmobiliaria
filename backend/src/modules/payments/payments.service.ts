import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private mockPayments: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private initializeMockPayments() {
    if (this.mockPayments.length > 0) return;
    this.mockPayments = [
      {
        id: 'PAY-401',
        contractId: 'CTR-101',
        amount: 1500.00,
        paymentDate: new Date('2026-06-15'),
        paymentMethod: 'Transferencia',
        reference: 'TRF-98231',
        status: 'PENDIENTE',
        category_type: 'PLAN_MKT_PREMIUM',
        issuer_type: 'PROPIETARIO',
        issuerName: 'René Vargas',
        destinationAccount: 'Banco Bisa - Cta 11234',
        receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'PAY-402',
        contractId: 'CTR-102',
        amount: 3200.00,
        paymentDate: new Date('2026-06-18'),
        paymentMethod: 'Transferencia',
        reference: 'TRF-98232',
        status: 'CONCILIADO',
        category_type: 'COMISION_VENTA',
        issuer_type: 'CLIENTE',
        issuerName: 'Mateo Salvatierra',
        destinationAccount: 'Banco Mercantil - Cta 98765',
        receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'PAY-403',
        contractId: 'CTR-103',
        amount: 800.00,
        paymentDate: new Date('2026-06-20'),
        paymentMethod: 'Depósito',
        reference: 'DEP-88231',
        status: 'OBSERVADO',
        category_type: 'PLAN_MKT_BASICO',
        issuer_type: 'PROPIETARIO',
        issuerName: 'Claudia Claure',
        destinationAccount: 'Banco Nacional - Cta 55432',
        receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80',
        notes: 'Comprobante borroso / ilegible',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
  }

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        this.logger.log('Consultando pagos de la base de datos...');
        const dbPayments = await this.prisma.payment.findMany({
          include: { contract: { include: { property: true } } },
          orderBy: { paymentDate: 'desc' }
        });
        if (dbPayments.length > 0) return dbPayments;
      } catch (error) {
        this.logger.warn(`No se pudo consultar la base de datos de pagos (${error.message}). Cargando fallback...`);
      }
    }

    this.initializeMockPayments();
    return this.mockPayments;
  }

  async create(dto: CreatePaymentDto) {
    if (!dto.contractId || dto.amount === undefined || !dto.paymentDate || !dto.paymentMethod) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    if (this.prisma.isConnected) {
      try {
        this.logger.log('Registrando nuevo pago en la base de datos...');
        const dbPayment = await this.prisma.payment.create({
          data: {
            contractId: dto.contractId,
            amount: parseFloat(String(dto.amount)),
            paymentDate: new Date(dto.paymentDate),
            paymentMethod: dto.paymentMethod,
            reference: dto.reference || null,
            status: dto.status || 'PENDIENTE',
            category_type: dto.category_type || 'PLAN_MKT_BASICO',
            issuer_type: dto.issuer_type || 'PROPIETARIO',
            issuerName: dto.issuerName || 'Propietario',
            destinationAccount: dto.destinationAccount || 'Banco Bisa - Cta 11234',
            receiptUrl: dto.receiptUrl || null,
            notes: dto.notes || null,
          },
          include: { contract: { include: { property: true } } }
        });
        return {
          message: 'Pago registrado exitosamente en el sistema.',
          data: dbPayment,
        };
      } catch (error) {
        this.logger.warn(`No se pudo persistir pago en la base de datos (${error.message}). Realizando registro simulado...`);
      }
    }

    this.initializeMockPayments();
    const newPayment = {
      id: 'PAY-' + Math.floor(100 + Math.random() * 900),
      contractId: dto.contractId,
      amount: parseFloat(String(dto.amount)),
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      reference: dto.reference || null,
      status: dto.status || 'PENDIENTE',
      category_type: dto.category_type || 'PLAN_MKT_BASICO',
      issuer_type: dto.issuer_type || 'PROPIETARIO',
      issuerName: dto.issuerName || 'Propietario',
      destinationAccount: dto.destinationAccount || 'Banco Bisa - Cta 11234',
      receiptUrl: dto.receiptUrl || null,
      notes: dto.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockPayments.push(newPayment);
    return {
      message: 'Pago registrado exitosamente en el sistema (Simulado).',
      data: newPayment,
    };
  }

  async updateStatus(id: string, body: { status: string; notes?: string }) {
    const { status, notes } = body;
    if (!['PENDIENTE', 'CONCILIADO', 'OBSERVADO'].includes(status)) {
      throw new BadRequestException('Estado de pago inválido.');
    }

    if (this.prisma.isConnected) {
      try {
        const payment = await this.prisma.payment.findUnique({
          where: { id },
          include: { contract: { include: { property: true } } }
        });
        if (!payment) throw new NotFoundException('Ingreso no encontrado.');

        const updated = await this.prisma.payment.update({
          where: { id },
          data: {
            status,
            notes: notes !== undefined ? notes : payment.notes,
          },
          include: { contract: { include: { property: true } } }
        });
        return updated;
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
        this.logger.warn(`Error al actualizar estado en DB (${error.message}). Usando fallback...`);
      }
    }

    this.initializeMockPayments();
    const idx = this.mockPayments.findIndex(p => p.id === id);
    if (idx === -1) throw new NotFoundException('Ingreso no encontrado.');

    this.mockPayments[idx] = {
      ...this.mockPayments[idx],
      status,
      notes: notes !== undefined ? notes : this.mockPayments[idx].notes,
      updatedAt: new Date(),
    };
    return this.mockPayments[idx];
  }
}
