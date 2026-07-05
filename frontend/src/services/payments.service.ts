import { apiClient } from './api.client';

export interface Payment {
  id: string;
  contractId: string;
  contract?: {
    id: string;
    property?: {
      id: string;
      title: string;
      location?: string; // added to match CTR-102 (Cochabamba)
    };
  };
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
  reference?: string | null;
  createdAt?: string | Date;
  category_type?: string;
  issuer_type?: string;
  issuerName?: string;
  destinationAccount?: string;
  status?: string;
  notes?: string;
  receiptUrl?: string;
}

let mockPayments: Payment[] = [];

export const paymentsService = {
  async getPayments(token?: string): Promise<Payment[]> {
    try {
      return await apiClient.getWithAuth<Payment[]>('/payments', token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Cargando fallback de pagos.');
      return mockPayments;
    }
  },

  async updatePaymentStatus(id: string, payload: { status: string; notes?: string }, token?: string): Promise<Payment> {
    try {
      return await apiClient.patchWithAuth<Payment>(`/payments/${id}/status`, payload, token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Actualizando estado de pago simulado.');
      const idx = mockPayments.findIndex(p => p.id === id);
      if (idx !== -1) {
        mockPayments[idx] = {
          ...mockPayments[idx],
          status: payload.status,
          notes: payload.notes !== undefined ? payload.notes : mockPayments[idx].notes
        };
        return mockPayments[idx];
      }
      throw error;
    }
  },

  async createPayment(dto: any, token?: string): Promise<{ message: string; data: Payment }> {
    try {
      return await apiClient.postWithAuth<{ message: string; data: Payment }>(
        '/payments',
        dto,
        token || 'mock-admin-token'
      );
    } catch (error) {
      console.warn('API de backend inalcanzable. Registrando pago simulado.');
      const newPayment: Payment = {
        id: 'PAY-' + Math.floor(100 + Math.random() * 900),
        contractId: dto.contractId,
        amount: parseFloat(String(dto.amount)),
        paymentDate: dto.paymentDate,
        paymentMethod: dto.paymentMethod,
        reference: dto.reference || null,
        status: dto.status || 'PENDIENTE',
        category_type: dto.category_type || 'PLAN_MKT_BASICO',
        issuer_type: dto.issuer_type || 'PROPIETARIO',
        issuerName: dto.issuerName || 'Propietario',
        destinationAccount: dto.destinationAccount || 'Banco Bisa - Cta 11234',
        receiptUrl: dto.receiptUrl || null,
        notes: dto.notes || null,
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
