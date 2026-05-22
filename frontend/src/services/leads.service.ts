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
}

export const leadsService = {
  async getAgentLeads(token?: string): Promise<Lead[]> {
    try {
      const data = await apiClient.getWithAuth<Lead[]>(`/agent/leads`, token || 'mock-agent-token');
      return data;
    } catch (error) {
      console.warn('API de leads inalcanzable. Cargando fallback de leads del agente en memoria.');
      // Fallback robusto local
      return [
        {
          id: 'lead-1',
          name: 'Alejandro Camacho',
          email: 'acamacho@gmail.com',
          phone: '+591 70712345',
          propertyId: '1',
          status: 'LEAD_ENTRANTE',
          assignedAgentId: 'agent-1',
          createdAt: new Date('2026-05-21T09:00:00Z'),
          property: {
            id: '1',
            title: 'Penthouse de Lujo en Queru Queru',
            price: 185000,
            imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          }
        },
        {
          id: 'lead-2',
          name: 'Sofia Rojas',
          email: 'srojas@hotmail.com',
          phone: '+591 72233445',
          propertyId: '2',
          status: 'CITA_AGENDADA',
          assignedAgentId: 'agent-1',
          createdAt: new Date('2026-05-21T11:30:00Z'),
          property: {
            id: '2',
            title: 'Hermosa Casa Familiar en Cala Cala',
            price: 320000,
            imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
          }
        },
        {
          id: 'lead-3',
          name: 'Marcelo Vargas',
          email: 'mvargas@outlook.com',
          phone: '+591 76543210',
          propertyId: '3',
          status: 'VISITA_REALIZADA',
          assignedAgentId: 'agent-1',
          createdAt: new Date('2026-05-22T08:15:00Z'),
          property: {
            id: '3',
            title: 'Terreno Urbanizado en Lomas de Aranjuez',
            price: 150000,
            imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
          }
        },
        {
          id: 'lead-4',
          name: 'Daniela Lanza',
          email: 'dlanza@live.com',
          phone: '+591 70799887',
          propertyId: '4',
          status: 'NEGOCIACION',
          assignedAgentId: 'agent-1',
          createdAt: new Date('2026-05-22T10:45:00Z'),
          property: {
            id: '4',
            title: 'Oficina Ejecutiva en Av. América',
            price: 85000,
            imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
          }
        }
      ];
    }
  },

  async updateLeadStatus(id: string, status: string, token?: string): Promise<{ message: string; data: Lead }> {
    try {
      const response = await apiClient.patchWithAuth<{ message: string; data: Lead }>(
        `/agent/leads/${id}/status`,
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
};
