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
  status?: 'PENDIENTE' | 'APROBADO' | 'OBSERVADO';
  notes?: string | null;
  requester?: string | null;
  vinculacion?: string | null;
  receiptUrl?: string | null;
  createdAt?: string | Date;
}

let mockExpenses: Expense[] = [];

export const expensesService = {
  async getExpenses(branchId?: string, token?: string): Promise<Expense[]> {
    try {
      const url = branchId ? `/expenses?branch_id=${encodeURIComponent(branchId)}` : '/expenses';
      return await apiClient.getWithAuth<Expense[]>(url, token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Cargando fallback de gastos.');
      if (branchId && branchId !== 'TODOS') {
        return mockExpenses.filter(e =>
          (e.vinculacion || '').toLowerCase().includes(branchId.toLowerCase())
        );
      }
      return mockExpenses;
    }
  },

  async createExpense(dto: {
    concept: string;
    amount: number;
    date: string;
    propertyId?: string;
    category: string;
    status?: string;
    notes?: string;
    requester?: string;
    vinculacion?: string;
    receiptUrl?: string;
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
        id: 'EGR-' + (400 + mockExpenses.length + 1),
        concept: dto.concept,
        amount: parseFloat(String(dto.amount)),
        date: dto.date,
        propertyId: dto.propertyId || null,
        property: dto.propertyId ? {
          id: dto.propertyId,
          title: dto.propertyId === '1' ? 'Apartaestudio moderno en Laureles' : 'Propiedad Seleccionada',
        } : null,
        category: dto.category,
        status: (dto.status as any) || 'PENDIENTE',
        notes: dto.notes || null,
        requester: dto.requester || 'Admin',
        vinculacion: dto.vinculacion || 'Gasto General',
        receiptUrl: dto.receiptUrl || '#',
        createdAt: new Date().toISOString(),
      };
      mockExpenses.push(newExpense);
      return {
        message: 'Gasto registrado exitosamente (Simulado).',
        data: newExpense,
      };
    }
  },

  async updateExpense(id: string, dto: Partial<Expense>, token?: string): Promise<{ message: string; data: Expense }> {
    try {
      return await apiClient.patchWithAuth<{ message: string; data: Expense }>(
        `/expenses/${id}`,
        dto,
        token || 'mock-admin-token'
      );
    } catch (error) {
      console.warn(`API de backend inalcanzable. Actualizando gasto ${id} simular en memoria.`);
      const idx = mockExpenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        mockExpenses[idx] = {
          ...mockExpenses[idx],
          ...dto,
        } as any;
        return {
          message: 'Gasto actualizado exitosamente (Simulado).',
          data: mockExpenses[idx],
        };
      }
      throw error;
    }
  },

  async updateExpenseStatus(id: string, dto: { status: string; notes?: string }, token?: string): Promise<{ message: string; data: Expense }> {
    try {
      return await apiClient.patchWithAuth<{ message: string; data: Expense }>(
        `/expenses/${id}/status`,
        dto,
        token || 'mock-admin-token'
      );
    } catch (error) {
      console.warn(`API de backend inalcanzable. Actualizando estado de gasto ${id} en memoria.`);
      const idx = mockExpenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        mockExpenses[idx] = {
          ...mockExpenses[idx],
          ...dto,
        } as any;
        return {
          message: 'Estado del gasto actualizado (Simulado).',
          data: mockExpenses[idx],
        };
      }
      throw error;
    }
  }
};
