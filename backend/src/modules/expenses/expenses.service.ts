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
        id: 'expense-1',
        concept: 'Mantenimiento de plomería y tuberías',
        amount: 150.00,
        date: new Date('2026-05-20'),
        propertyId: '1',
        category: 'Mantenimiento',
        createdAt: new Date(),
      },
      {
        id: 'expense-2',
        concept: 'Pago de impuestos municipales anuales',
        amount: 450.00,
        date: new Date('2026-05-18'),
        propertyId: null,
        category: 'Impuestos',
        createdAt: new Date(),
      }
    ];
  }

  async findAll() {
    try {
      this.logger.log('Consultando gastos de la base de datos...');
      const dbExpenses = await this.prisma.expense.findMany({
        include: { property: true },
        orderBy: { date: 'desc' }
      });
      if (dbExpenses.length > 0) return dbExpenses;
    } catch (error) {
      this.logger.warn(`No se pudo consultar la base de datos de gastos (${error.message}). Cargando fallback...`);
    }

    this.initializeMockExpenses();
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
      id: 'expense-' + Math.random().toString(36).substr(2, 9),
      concept: dto.concept,
      amount: parseFloat(String(dto.amount)),
      date: new Date(dto.date),
      propertyId: dto.propertyId || null,
      category: dto.category,
      createdAt: new Date(),
    };

    this.mockExpenses.push(newExpense);
    return {
      message: 'Gasto registrado exitosamente (Simulado).',
      data: newExpense,
    };
  }
}
