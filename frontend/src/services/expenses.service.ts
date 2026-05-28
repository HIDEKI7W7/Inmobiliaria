import { apiClient } from './api.client';

export interface Expense {
  id: string;
  concept: string;
  amount: number;
  date: string | Date;
  propertyId?: string | null;
  property?: {
    id: string;
    title: string;
  } | null;
  category: string;
  createdAt?: string | Date;
}

let mockExpenses: Expense[] = [
  {
    id: 'expense-1',
    concept: 'Mantenimiento de plomería y tuberías',
    amount: 150.00,
    date: '2026-05-20',
    propertyId: '1',
    property: {
      id: '1',
      title: 'Apartaestudio moderno en Laureles',
    },
    category: 'Mantenimiento',
    createdAt: '2026-05-20T12:00:00Z',
  },
  {
    id: 'expense-2',
    concept: 'Pago de impuestos municipales anuales',
    amount: 450.00,
    date: '2026-05-18',
    propertyId: null,
    property: null,
    category: 'Impuestos',
    createdAt: '2026-05-18T12:00:00Z',
  }
];

export const expensesService = {
  async getExpenses(token?: string): Promise<Expense[]> {
    try {
      return await apiClient.getWithAuth<Expense[]>('/expenses', token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Cargando fallback de gastos.');
      return mockExpenses;
    }
  },

  async createExpense(dto: {
    concept: string;
    amount: number;
    date: string;
    propertyId?: string;
    category: string;
  }, token?: string): Promise<{ message: string; data: Expense }> {
    try {
      return await apiClient.postWithAuth<{ message: string; data: Expense }>(
        '/expenses',
        dto,
        token || 'mock-admin-token'
      );
    } catch (error) {
      console.warn('API de backend inalcanzable. Registrando gasto simular en memoria.');
      const newExpense: Expense = {
        id: 'expense-' + Math.random().toString(36).substr(2, 9),
        concept: dto.concept,
        amount: parseFloat(String(dto.amount)),
        date: dto.date,
        propertyId: dto.propertyId || null,
        property: dto.propertyId ? {
          id: dto.propertyId,
          title: dto.propertyId === '1' ? 'Apartaestudio moderno en Laureles' : 'Propiedad Seleccionada',
        } : null,
        category: dto.category,
        createdAt: new Date().toISOString(),
      };
      mockExpenses.push(newExpense);
      return {
        message: 'Gasto registrado exitosamente (Simulado).',
        data: newExpense,
      };
    }
  }
};
