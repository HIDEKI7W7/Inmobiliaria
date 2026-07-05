import { apiClient } from './api.client';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  status: string;
  assignedAgentId: string;
  createdAt: string | Date;
  property?: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
  };
  customerProfile?: {
    whatsappPhone?: string | null;
    objective?: 'COMPRAR' | 'ALQUILAR' | 'VENDER' | string | null;
    propertyInterest?: 'CASA' | 'DEPARTAMENTO' | 'TERRENO' | string | null;
    onboardingCompleted?: boolean;
  } | null;
}

export interface CommissionDeal {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  amount: number | null;
  commission: number | null;
  status: 'CONGELADO' | 'ACTIVO';
}

export const leadsService = {
  async getAgentLeads(token?: string): Promise<Lead[]> {
    try {
      const data = await apiClient.getWithAuth<Lead[]>(`/agente/leads`, token || 'mock-agent-token');
      return data;
    } catch (error) {
      console.warn('API de leads inalcanzable. Retornando vacío para producción.');
      return [];
    }
  },

  async updateLeadStatus(id: string, status: string, token?: string): Promise<{ message: string; data: Lead }> {
    try {
      const response = await apiClient.patchWithAuth<{ message: string; data: Lead }>(
        `/agente/leads/${id}/status`,
        { status },
        token || 'mock-agent-token'
      );
      return response;
    } catch (error) {
      console.warn('API de leads inalcanzable. Simulando actualización de estado del lead en el cliente.');
      return {
        message: 'Estado del lead actualizado con éxito (Simulado en Cliente)',
        data: {
          id,
          status: status.toUpperCase(),
        } as unknown as Lead
      };
    }
  },

  async getAgentDeals(token?: string): Promise<CommissionDeal[]> {
    try {
      const data = await apiClient.getWithAuth<CommissionDeal[]>(`/agente/leads/deals`, token || 'mock-agent-token');
      return data;
    } catch (error) {
      console.warn('API de deals inalcanzable. Retornando vacío para producción.');
      return [];
    }
  },

  async registerDeal(propertyId: string, clientName: string, amount: number, token?: string): Promise<CommissionDeal> {
    try {
      const data = await apiClient.postWithAuth<CommissionDeal>(
        `/agente/leads/deals`,
        { propertyId, clientName, amount },
        token || 'mock-agent-token'
      );
      return data;
    } catch (error) {
      console.warn('API de deals inalcanzable. Simulando registro de transacción local.');
      return {
        id: `deal-${Date.now()}`,
        propertyId,
        propertyTitle: 'Propiedad de Cartera (Simulado)',
        clientName,
        amount,
        commission: amount * 0.03,
        status: 'ACTIVO'
      };
    }
  }
};
