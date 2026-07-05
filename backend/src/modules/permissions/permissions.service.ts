import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionsService implements OnModuleInit {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      this.logger.log('Inicializando semillas de módulos y permisos base (RBAC)...');
      
      const modules = [
        { name: 'PROPERTIES', displayName: 'Propiedades' },
        { name: 'AGENTS', displayName: 'Agentes' },
        { name: 'PROSPECTS', displayName: 'Prospectos' },
        { name: 'CONTRACTS', displayName: 'Contratos' },
        { name: 'INCOMES', displayName: 'Ingresos' },
        { name: 'EXPENSES', displayName: 'Gastos' },
        { name: 'REPORTS', displayName: 'Reportes' },
        { name: 'SETTINGS', displayName: 'Permisos' },
      ];

      for (const m of modules) {
        await this.prisma.systemModule.upsert({
          where: { name: m.name },
          update: { displayName: m.displayName },
          create: { name: m.name, displayName: m.displayName },
        });
      }

      const allDbModules = await this.prisma.systemModule.findMany();

      const defaultRolePermissions: { role: Role; allowedModules: string[] }[] = [
        {
          role: Role.ADMIN,
          allowedModules: ['PROPERTIES', 'AGENTS', 'PROSPECTS', 'CONTRACTS', 'INCOMES', 'EXPENSES', 'REPORTS', 'SETTINGS'],
        },
        {
          role: Role.AGENTE,
          allowedModules: ['PROPERTIES', 'PROSPECTS', 'CONTRACTS', 'INCOMES', 'EXPENSES', 'REPORTS'],
        },
        {
          role: Role.PROPIETARIO,
          allowedModules: ['PROPERTIES', 'CONTRACTS'],
        },
        {
          role: Role.CLIENTE,
          allowedModules: ['PROPERTIES'],
        },
      ];

      for (const rp of defaultRolePermissions) {
        for (const mod of allDbModules) {
          const isAllowed = rp.allowedModules.includes(mod.name);
          await this.prisma.rolePermission.upsert({
            where: {
              role_moduleId: {
                role: rp.role,
                moduleId: mod.id,
              },
            },
            update: {},
            create: {
              role: rp.role,
              moduleId: mod.id,
              allowed: isAllowed,
            },
          });
        }
      }
      this.logger.log('Semillas de módulos y permisos base inicializadas con éxito.');
    } catch (err) {
      this.logger.error(`Error al sembrar permisos base: ${err.message}`);
    }
  }

  async getModules() {
    return this.prisma.systemModule.findMany({
      orderBy: { displayName: 'asc' },
    });
  }

  async getRolePermissions() {
    return this.prisma.rolePermission.findMany({
      include: { module: true },
    });
  }

  async updateRolePermission(role: Role, moduleId: string, allowed: boolean) {
    return this.prisma.rolePermission.upsert({
      where: {
        role_moduleId: {
          role,
          moduleId,
        },
      },
      update: { allowed },
      create: { role, moduleId, allowed },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        accessRevokedAt: true,
        permissionOverrides: {
          include: { module: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(dto: any) {
    const { name, email, password, role } = dto;
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
        isActive: true,
      },
    });
  }

  async updateUser(id: string, dto: any) {
    const data: any = {
      name: dto.name,
      email: dto.email,
      role: dto.role as any,
    };
    if (dto.password) {
      const bcrypt = await import('bcrypt');
      data.password = await bcrypt.hash(dto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        accessRevokedAt: new Date(),
      },
    });
  }

  async updateUserOverride(userId: string, moduleId: string, allowed: boolean) {
    return this.prisma.userPermissionOverride.upsert({
      where: {
        userId_moduleId: {
          userId,
          moduleId,
        },
      },
      update: { allowed },
      create: { userId, moduleId, allowed },
    });
  }
}
