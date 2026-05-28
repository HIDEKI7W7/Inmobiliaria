import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No se proporcionó token de autorización');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Formato de autorización inválido. Debe ser Bearer <token>');
    }

    const token = parts[1];
    if (!token) {
      throw new UnauthorizedException('Token no especificado');
    }

    // 1. Soporte para tokens mock de desarrollo y retrocompatibilidad (exclusivo para no-producción)
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_TOKENS === 'true') {
      if (token === 'mock-admin-token') {
        request.user = {
          id: 'admin-1',
          name: 'Administrador Propio',
          email: 'admin@propio.com.bo',
          role: 'ADMIN',
        };
        return true;
      } else if (token === 'mock-agent-token') {
        request.user = {
          id: 'agent-1',
          name: 'Agente Estrella',
          email: 'agent@propio.com.bo',
          role: 'AGENTE',
        };
        return true;
      }
    }

    // 2. Verificación de JWT real de producción
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d',
      });
      
      // Adjuntar el usuario decodificado al contexto de la petición
      request.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token de autorización inválido o expirado');
    }
  }
}
