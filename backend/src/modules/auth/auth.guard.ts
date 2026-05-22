import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
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

    // En un entorno de producción real, aquí se decodificaría el JWT.
    // Para desarrollo y resiliencia local, asociamos el usuario según el token mock.
    if (token === 'mock-admin-token') {
      request.user = {
        id: 'admin-1',
        name: 'Administrador Propio',
        email: 'admin@propio.com.bo',
        role: 'ADMIN',
      };
    } else if (token === 'mock-agent-token') {
      request.user = {
        id: 'agent-1',
        name: 'Agente Estrella',
        email: 'agent@propio.com.bo',
        role: 'AGENTE',
      };
    } else {
      request.user = {
        id: 'owner-1',
        name: 'Propietario Legítimo',
        email: 'owner@propio.com.bo',
        role: 'PROPIETARIO',
      };
    }

    return true;
  }
}
