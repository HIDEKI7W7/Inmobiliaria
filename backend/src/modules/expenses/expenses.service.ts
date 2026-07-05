import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateExpenseDto } from './dto/create-expense.dto';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);
  private mockExpenses: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private initializeMockExpenses() {
    if (this.mockExpenses.length > 0) return;
    this.mockExpenses = [
      {
        id: 'EGR-401',
        concept: 'Alquiler de Oficina central',
        amount: 800.00,
        date: new Date('2026-05-02'),
        propertyId: null,
        category: 'Oficina',
        status: 'APROBADO',
        notes: null,
        requester: 'Admin',
        vinculacion: 'Gasto General',
        receiptUrl: '#',
        createdAt: new Date(),
      },
      {
        id: 'EGR-402',
        concept: 'Prediales Vinto',
        amount: 400.00,
        date: new Date('2026-05-18'),
        propertyId: null,
        category: 'Impuestos',
        status: 'APROBADO',
        notes: null,
        requester: 'Admin',
        vinculacion: 'Prop: Terreno Vinto',
        receiptUrl: '#',
        createdAt: new Date(),
      },
      {
        id: 'EGR-403',
        concept: 'Plomería Torre Norte',
        amount: 150.00,
        date: new Date('2026-05-19'),
        propertyId: '1',
        category: 'Mantenimiento',
        status: 'PENDIENTE',
        notes: null,
        requester: 'Agente: Juan P.',
        vinculacion: 'Prop: Torre Norte 14A',
        receiptUrl: '#',
        createdAt: new Date(),
      },
      {
        id: 'EGR-404',
        concept: 'Material de Escritorio',
        amount: 100.00,
        date: new Date('2026-05-22'),
        propertyId: null,
        category: 'Oficina',
        status: 'OBSERVADO',
        notes: 'Falta factura de compra',
        requester: 'Secretaria',
        vinculacion: 'Gasto General',
        receiptUrl: '#',
        createdAt: new Date(),
      }
    ];
  }

  async findAll(branchId?: string) {
    try {
      this.logger.log(`Consultando gastos de la base de datos (Sucursal: ${branchId || 'TODOS'})...`);
      const whereClause = branchId && branchId !== 'TODOS' ? {
        vinculacion: {
          contains: branchId,
          mode: 'insensitive' as any
        }
      } : {};
      const dbExpenses = await this.prisma.expense.findMany({
        where: whereClause,
        include: { property: true },
        orderBy: { date: 'desc' }
      });
      if (dbExpenses.length > 0) return dbExpenses;
    } catch (error) {
      this.logger.warn(`No se pudo consultar la base de datos de gastos (${error.message}). Cargando fallback...`);
    }

    this.initializeMockExpenses();
    if (branchId && branchId !== 'TODOS') {
      return this.mockExpenses.filter(e => 
        (e.vinculacion || '').toLowerCase().includes(branchId.toLowerCase())
      );
    }
    return this.mockExpenses;
  }

  async create(dto: CreateExpenseDto) {
    if (!dto.concept || !dto.amount || !dto.date || !dto.category) {
      throw new BadRequestException('Todos los campos obligatorios deben proporcionarse.');
    }

    try {
      this.logger.log('Registrando nuevo gasto en base de datos...');
      const dbExpense = await this.prisma.expense.create({
        data: {
          concept: dto.concept,
          amount: parseFloat(String(dto.amount)),
          date: new Date(dto.date),
          propertyId: dto.propertyId || null,
          category: dto.category,
          status: dto.status || 'PENDIENTE',
          notes: dto.notes || null,
          requester: dto.requester || 'Admin',
          vinculacion: dto.vinculacion || 'Gasto General',
          receiptUrl: dto.receiptUrl || '#',
        },
        include: { property: true }
      });
      return {
        message: 'Gasto registrado exitosamente.',
        data: dbExpense,
      };
    } catch (error) {
      this.logger.warn(`No se pudo persistir gasto en base de datos (${error.message}). Realizando registro simulado...`);
    }

    this.initializeMockExpenses();
    const newExpense = {
      id: 'EGR-' + (400 + this.mockExpenses.length + 1),
      concept: dto.concept,
      amount: parseFloat(String(dto.amount)),
      date: new Date(dto.date),
      propertyId: dto.propertyId || null,
      category: dto.category,
      status: dto.status || 'PENDIENTE',
      notes: dto.notes || null,
      requester: dto.requester || 'Admin',
      vinculacion: dto.vinculacion || 'Gasto General',
      receiptUrl: dto.receiptUrl || '#',
      createdAt: new Date(),
    };

    this.mockExpenses.push(newExpense);
    return {
      message: 'Gasto registrado exitosamente (Simulado).',
      data: newExpense,
    };
  }

  async update(id: string, dto: any) {
    try {
      this.logger.log(`Actualizando gasto ${id} en base de datos...`);
      const dbExpense = await this.prisma.expense.update({
        where: { id },
        data: {
          concept: dto.concept,
          amount: dto.amount !== undefined ? parseFloat(String(dto.amount)) : undefined,
          date: dto.date ? new Date(dto.date) : undefined,
          propertyId: dto.propertyId,
          category: dto.category,
          status: dto.status,
          notes: dto.notes,
          requester: dto.requester,
          vinculacion: dto.vinculacion,
          receiptUrl: dto.receiptUrl,
        },
        include: { property: true }
      });
      return {
        message: 'Gasto actualizado exitosamente.',
        data: dbExpense,
      };
    } catch (error) {
      this.logger.warn(`No se pudo actualizar gasto en base de datos (${error.message}). Realizando actualización simulada...`);
    }

    this.initializeMockExpenses();
    const idx = this.mockExpenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.mockExpenses[idx] = {
        ...this.mockExpenses[idx],
        ...dto,
        amount: dto.amount !== undefined ? parseFloat(String(dto.amount)) : this.mockExpenses[idx].amount,
        date: dto.date ? new Date(dto.date) : this.mockExpenses[idx].date,
      };
      return {
        message: 'Gasto actualizado exitosamente (Simulado).',
        data: this.mockExpenses[idx],
      };
    }
    throw new NotFoundException(`Gasto con ID ${id} no encontrado.`);
  }
}
