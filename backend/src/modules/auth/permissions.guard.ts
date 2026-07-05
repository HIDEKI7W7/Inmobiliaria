import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // 1. Resolve request.user if not already set by AuthGuard
    let user = request.user;
    if (!user) {
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
          const token = parts[1];
          // Handle development mock tokens
          if (
            process.env.NODE_ENV !== 'production' &&
            process.env.ALLOW_MOCK_TOKENS === 'true'
          ) {
            if (token === 'mock-admin-token') {
              user = {
                id: 'admin-1',
                name: 'Administrador Propio',
                email: 'admin@propio.com.bo',
                role: 'ADMIN',
              };
            } else if (token === 'mock-agent-token') {
              user = {
                id: 'agent-1',
                name: 'Agente Estrella',
                email: 'agent@propio.com.bo',
                role: 'AGENTE',
              };
            }
          }

          if (!user) {
            try {
              const payload = this.jwtService.verify(token, {
                secret:
                  process.env.JWT_SECRET ||
                  'ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d',
              });
              user = {
                id: payload.userId,
                email: payload.email,
                role: payload.role,
              };
            } catch (error) {
              // Token invalid, we will let AuthGuard throw Unauthorized if the route is protected
            }
          }
        }
      }
    }

    // If there is no authenticated user context, let other guards (like AuthGuard) handle it
    if (!user || !user.id) {
      return true;
    }

    // 2. Fetch user from DB to verify isActive status in real-time
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, role: true, isActive: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!dbUser.isActive) {
      throw new UnauthorizedException(
        'Su cuenta ha sido desactivada o el acceso ha sido revocado.',
      );
    }

    // 3. Map request path to system module
    const path = request.path || '';
    const moduleName = this.getModuleFromPath(path);

    // If the route doesn't map to a specific system module, skip permission matrix check
    if (!moduleName) {
      return true;
    }

    // 4. Check individual overrides first (user-specific overrides have highest priority)
    const override = await this.prisma.userPermissionOverride.findFirst({
      where: {
        userId: dbUser.id,
        module: { name: moduleName },
      },
    });

    if (override !== null && override !== undefined) {
      if (override.allowed) {
        return true;
      } else {
        throw new ForbiddenException(
          `No tiene permisos para acceder al módulo: ${moduleName}`,
        );
      }
    }

    // 5. Fallback to base role permissions
    const rolePermission = await this.prisma.rolePermission.findFirst({
      where: {
        role: dbUser.role,
        module: { name: moduleName },
      },
    });

    if (rolePermission && rolePermission.allowed) {
      return true;
    }

    throw new ForbiddenException(
      `No tiene permisos para acceder al módulo: ${moduleName}`,
    );
  }

  private getModuleFromPath(path: string): string | null {
    const cleanPath = path.toLowerCase();

    if (
      cleanPath.startsWith('/permissions') ||
      cleanPath.startsWith('/admin/permissions')
    ) {
      return 'SETTINGS';
    }
    if (
      cleanPath.startsWith('/admin/reports') ||
      cleanPath.startsWith('/reports')
    ) {
      return 'REPORTS';
    }
    if (
      cleanPath.startsWith('/properties') ||
      cleanPath.startsWith('/admin/properties')
    ) {
      return 'PROPERTIES';
    }
    if (
      cleanPath.startsWith('/contracts') ||
      cleanPath.startsWith('/admin/contracts')
    ) {
      return 'CONTRACTS';
    }
    if (
      cleanPath.startsWith('/payments') ||
      cleanPath.startsWith('/incomes') ||
      cleanPath.startsWith('/admin/payments')
    ) {
      return 'INCOMES';
    }
    if (
      cleanPath.startsWith('/expenses') ||
      cleanPath.startsWith('/admin/expenses')
    ) {
      return 'EXPENSES';
    }
    if (
      cleanPath.startsWith('/leads') ||
      cleanPath.startsWith('/clients') ||
      cleanPath.startsWith('/prospects') ||
      cleanPath.startsWith('/agente/leads')
    ) {
      return 'PROSPECTS';
    }
    if (
      cleanPath.startsWith('/admin/agents') ||
      cleanPath.startsWith('/agents')
    ) {
      return 'AGENTS';
    }

    return null;
  }
}
