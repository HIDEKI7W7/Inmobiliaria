import { apiClient } from './api.client';

export interface SystemModule {
  id: string;
  name: string;
  displayName: string;
}

export interface RolePermission {
  id: string;
  role: 'ADMIN' | 'AGENTE' | 'PROPIETARIO' | 'CLIENTE';
  moduleId: string;
  module: SystemModule;
  allowed: boolean;
}

export interface UserPermissionOverride {
  id: string;
  userId: string;
  moduleId: string;
  module: SystemModule;
  allowed: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENTE' | 'PROPIETARIO' | 'CLIENTE';
  isActive: boolean;
  accessRevokedAt?: string | null;
  permissionOverrides: UserPermissionOverride[];
}

export const permissionsService = {
  async getModules(token: string): Promise<SystemModule[]> {
    return apiClient.getWithAuth<SystemModule[]>('/permissions/modules', token);
  },

  async getRolePermissions(token: string): Promise<RolePermission[]> {
    return apiClient.getWithAuth<RolePermission[]>('/permissions/roles', token);
  },

  async updateRolePermission(
    token: string,
    role: string,
    moduleId: string,
    allowed: boolean,
  ): Promise<any> {
    return apiClient.putWithAuth<any>(
      '/permissions/role',
      { role, moduleId, allowed },
      token,
    );
  },

  async getUsers(token: string): Promise<AuthUser[]> {
    return apiClient.getWithAuth<AuthUser[]>('/permissions/users', token);
  },

  async createUser(token: string, userDto: any): Promise<AuthUser> {
    return apiClient.postWithAuth<AuthUser>('/permissions/users', userDto, token);
  },

  async updateUser(token: string, userId: string, userDto: any): Promise<AuthUser> {
    return apiClient.patchWithAuth<AuthUser>(
      `/permissions/users/${userId}`,
      userDto,
      token,
    );
  },

  async deactivateUser(token: string, userId: string): Promise<any> {
    return apiClient.deleteWithAuth<any>(`/permissions/users/${userId}`, token);
  },

  async updateUserOverride(
    token: string,
    userId: string,
    moduleId: string,
    allowed: boolean,
  ): Promise<any> {
    return apiClient.putWithAuth<any>(
      '/permissions/user-override',
      { userId, moduleId, allowed },
      token,
    );
  },
};
