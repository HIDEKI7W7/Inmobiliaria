import { apiClient } from './api.client';

export interface Payment {
  id: string;
  contractId: string;
  contract?: {
    id: string;
    property?: {
      id: string;
      title: string;
    };
  };
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
  reference?: string | null;
  createdAt?: string | Date;
}

let mockPayments: Payment[] = [
  {
    id: 'payment-1',
    contractId: 'contract-1',
    contract: {
      id: 'contract-1',
      property: {
        id: '1',
        title: 'Apartaestudio moderno en Laureles',
      }
    },
    amount: 1000.00,
    paymentDate: '2026-05-22',
    paymentMethod: 'Transferencia',
    reference: 'TRF-98231',
    createdAt: '2026-05-22T12:00:00Z',
  }
];

export const paymentsService = {
  async getPayments(token?: string): Promise<Payment[]> {
    try {
      // Note: The backend endpoint is /payments, using Auth headers for safety
      return await apiClient.getWithAuth<Payment[]>('/payments', token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Cargando fallback de pagos.');
      return mockPayments;
    }
  },

  async createPayment(dto: {
    contractId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
  }, token?: string): Promise<{ message: string; data: Payment }> {
    try {
      return await apiClient.postWithAuth<{ message: string; data: Payment }>(
        '/payments',
        dto,
        token || 'mock-admin-token'
      );
    } catch (error) {
      console.warn('API de backend inalcanzable. Registrando pago simular en memoria.');
      const newPayment: Payment = {
        id: 'payment-' + Math.random().toString(36).substr(2, 9),
        contractId: dto.contractId,
        contract: {
          id: dto.contractId,
          property: {
            id: '1',
            title: 'Apartaestudio moderno en Laureles',
          }
        },
        amount: parseFloat(String(dto.amount)),
        paymentDate: dto.paymentDate,
        paymentMethod: dto.paymentMethod,
        reference: dto.reference || null,
        createdAt: new Date().toISOString(),
      };
      mockPayments.push(newPayment);
      return {
        message: 'Pago registrado exitosamente en el sistema (Simulado).',
        data: newPayment,
      };
    }
  }
};
