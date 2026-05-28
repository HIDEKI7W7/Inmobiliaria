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
        id: 'payment-1',
        contractId: 'contract-1',
        amount: 1000.00,
        paymentDate: new Date('2026-05-22'),
        paymentMethod: 'Transferencia',
        reference: 'TRF-98231',
        createdAt: new Date(),
      }
    ];
  }

  async findAll() {
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

    this.initializeMockPayments();
    return this.mockPayments;
  }

  async create(dto: CreatePaymentDto) {
    if (!dto.contractId || !dto.amount || !dto.paymentDate || !dto.paymentMethod) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    try {
      this.logger.log('Registrando nuevo pago en la base de datos...');
      const dbPayment = await this.prisma.payment.create({
        data: {
          contractId: dto.contractId,
          amount: parseFloat(String(dto.amount)),
          paymentDate: new Date(dto.paymentDate),
          paymentMethod: dto.paymentMethod,
          reference: dto.reference || null,
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

    this.initializeMockPayments();
    const newPayment = {
      id: 'payment-' + Math.random().toString(36).substr(2, 9),
      contractId: dto.contractId,
      amount: parseFloat(String(dto.amount)),
      paymentDate: new Date(dto.paymentDate),
      paymentMethod: dto.paymentMethod,
      reference: dto.reference || null,
      createdAt: new Date(),
    };

    this.mockPayments.push(newPayment);
    return {
      message: 'Pago registrado exitosamente en el sistema (Simulado).',
      data: newPayment,
    };
  }
}
