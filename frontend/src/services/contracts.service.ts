import { apiClient } from './api.client';

export interface Contract {
  id: string;
  propertyId: string;
  property?: {
    id: string;
    title: string;
    location: string;
    address?: string | null;
  };
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    email: string;
  };
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  startDate: string | Date;
  endDate: string | Date;
  monthlyAmount: number;
  status: 'VIGENTE' | 'VENCIDO' | 'RESCINDIDO';
  observations?: string | null;
  createdAt?: string | Date;
}

let mockContracts: Contract[] = [
  {
    id: 'contract-1',
    propertyId: '1',
    property: {
      id: '1',
      title: 'Apartaestudio moderno en Laureles',
      address: 'Circular 4# 70-10',
      location: 'Laureles',
    },
    tenantId: 'tenant-1',
    tenant: { id: 'tenant-1', name: 'Admin', email: 'admin@propio.com.bo' },
    ownerId: 'owner-1',
    owner: { id: 'owner-1', name: 'Juan', email: 'owner@propio.com.bo' },
    startDate: '2026-05-22',
    endDate: '2027-05-22',
    monthlyAmount: 1000.00,
    status: 'VIGENTE',
    observations: 'Contrato inicial de prueba para MVP.',
    createdAt: '2026-05-22T12:00:00Z',
  }
];

export const contractsService = {
  async getContracts(token?: string): Promise<Contract[]> {
    try {
      return await apiClient.getWithAuth<Contract[]>('/contracts', token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Cargando fallback de contratos.');
      return mockContracts;
    }
  },

  async createContract(dto: {
    propertyId: string;
    tenantId: string;
    ownerId: string;
    startDate: string;
    endDate: string;
    monthlyAmount: number;
    status?: 'VIGENTE' | 'VENCIDO' | 'RESCINDIDO';
    observations?: string;
  }, token?: string): Promise<{ message: string; data: Contract }> {
    try {
      return await apiClient.postWithAuth<{ message: string; data: Contract }>(
        '/contracts',
        dto,
        token || 'mock-admin-token'
      );
    } catch (error) {
      console.warn('API de backend inalcanzable. Creando contrato simular en memoria.');
      const newContract: Contract = {
        id: 'contract-' + Math.random().toString(36).substr(2, 9),
        propertyId: dto.propertyId,
        property: {
          id: dto.propertyId,
          title: dto.propertyId === '1' ? 'Apartaestudio moderno en Laureles' : 'Propiedad Seleccionada',
          location: 'Zona Central',
          address: 'Dirección Registrada',
        },
        tenantId: dto.tenantId,
        tenant: {
          id: dto.tenantId,
          name: dto.tenantId === 'tenant-1' ? 'Admin' : 'Inquilino General',
          email: 'inquilino@propio.com.bo',
        },
        ownerId: dto.ownerId,
        owner: {
          id: dto.ownerId,
          name: dto.ownerId === 'owner-1' ? 'Juan' : 'Propietario General',
          email: 'propietario@propio.com.bo',
        },
        startDate: dto.startDate,
        endDate: dto.endDate,
        monthlyAmount: parseFloat(String(dto.monthlyAmount)),
        status: dto.status || 'VIGENTE',
        observations: dto.observations || null,
        createdAt: new Date().toISOString(),
      };
      mockContracts.push(newContract);
      return {
        message: 'Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente (Simulado).',
        data: newContract,
      };
    }
  },

  async deleteContract(id: string, token?: string): Promise<{ message: string }> {
    try {
      return await apiClient.deleteWithAuth<{ message: string }>(`/contracts/${id}`, token || 'mock-admin-token');
    } catch (error) {
      console.warn('API de backend inalcanzable. Eliminando contrato simular en memoria.');
      const initialLength = mockContracts.length;
      mockContracts = mockContracts.filter(c => c.id !== id);
      if (mockContracts.length === initialLength) {
        throw new Error('El contrato no existe.');
      }
      return { message: 'Contrato eliminado correctamente (Simulado).' };
    }
  }
};
