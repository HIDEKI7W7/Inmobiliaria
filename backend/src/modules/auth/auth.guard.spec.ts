import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    guard = new AuthGuard(jwtService);
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request = {
      headers: {
        authorization: authHeader,
      },
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('debería lanzar UnauthorizedException si no se proporciona cabecera de autorización', async () => {
      const context = createMockContext(undefined);
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('No se proporcionó token de autorización'),
      );
    });

    it('debería lanzar UnauthorizedException si el formato de la cabecera es inválido', async () => {
      const context = createMockContext('InvalidTokenFormat');
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Formato de autorización inválido. Debe ser Bearer <token>'),
      );
    });

    it('debería lanzar UnauthorizedException si el esquema de autorización no es Bearer', async () => {
      const context = createMockContext('Basic token123');
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Formato de autorización inválido. Debe ser Bearer <token>'),
      );
    });

    it('debería lanzar UnauthorizedException si el token está vacío', async () => {
      const context = createMockContext('Bearer ');
      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token no especificado'),
      );
    });

    describe('En entornos de desarrollo (NODE_ENV !== production)', () => {
      let originalNodeEnv: string | undefined;
      let originalAllowMock: string | undefined;

      beforeAll(() => {
        originalNodeEnv = process.env.NODE_ENV;
        originalAllowMock = process.env.ALLOW_MOCK_TOKENS;
      });

      afterAll(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.ALLOW_MOCK_TOKENS = originalAllowMock;
      });

      beforeEach(() => {
        process.env.NODE_ENV = 'development';
        process.env.ALLOW_MOCK_TOKENS = 'true';
      });

      it('debería permitir el acceso y adjuntar mock-admin si el token es mock-admin-token', async () => {
        const context = createMockContext('Bearer mock-admin-token');
        const result = await guard.canActivate(context);
        const req = context.switchToHttp().getRequest();

        expect(result).toBe(true);
        expect(req.user).toEqual({
          id: 'admin-1',
          name: 'Administrador Propio',
          email: 'admin@propio.com.bo',
          role: 'ADMIN',
        });
      });

      it('debería permitir el acceso y adjuntar mock-agent si el token es mock-agent-token', async () => {
        const context = createMockContext('Bearer mock-agent-token');
        const result = await guard.canActivate(context);
        const req = context.switchToHttp().getRequest();

        expect(result).toBe(true);
        expect(req.user).toEqual({
          id: 'agent-1',
          name: 'Agente Estrella',
          email: 'agent@propio.com.bo',
          role: 'AGENTE',
        });
      });
    });

    describe('En entorno de producción (NODE_ENV === production)', () => {
      let originalNodeEnv: string | undefined;
      let originalAllowMock: string | undefined;

      beforeAll(() => {
        originalNodeEnv = process.env.NODE_ENV;
        originalAllowMock = process.env.ALLOW_MOCK_TOKENS;
      });

      afterAll(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.ALLOW_MOCK_TOKENS = originalAllowMock;
      });

      beforeEach(() => {
        process.env.NODE_ENV = 'production';
        process.env.ALLOW_MOCK_TOKENS = 'true';
      });

      it('debería BLOQUEAR el backdoor de mock-admin y lanzar UnauthorizedException', async () => {
        const context = createMockContext('Bearer mock-admin-token');
        jwtService.verify.mockImplementation(() => {
          throw new Error('JWT verification failed');
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          new UnauthorizedException('Token de autorización inválido o expirado'),
        );
        expect(jwtService.verify).toHaveBeenCalledWith('mock-admin-token', expect.any(Object));
      });

      it('debería BLOQUEAR el backdoor de mock-agent y lanzar UnauthorizedException', async () => {
        const context = createMockContext('Bearer mock-agent-token');
        jwtService.verify.mockImplementation(() => {
          throw new Error('JWT verification failed');
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          new UnauthorizedException('Token de autorización inválido o expirado'),
        );
        expect(jwtService.verify).toHaveBeenCalledWith('mock-agent-token', expect.any(Object));
      });
    });

    describe('Validación de tokens JWT estándar', () => {
      it('debería permitir el acceso si el token JWT es válido', async () => {
        const context = createMockContext('Bearer valid-jwt-token');
        const mockPayload = {
          userId: 'user-123',
          email: 'user@example.com',
          role: 'CLIENTE',
        };

        jwtService.verify.mockReturnValue(mockPayload);

        const result = await guard.canActivate(context);
        const req = context.switchToHttp().getRequest();

        expect(result).toBe(true);
        expect(req.user).toEqual({
          id: 'user-123',
          email: 'user@example.com',
          role: 'CLIENTE',
        });
        expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token', expect.any(Object));
      });

      it('debería lanzar UnauthorizedException si el token JWT es inválido o expiró', async () => {
        const context = createMockContext('Bearer invalid-jwt-token');
        jwtService.verify.mockImplementation(() => {
          throw new Error('Invalid signature');
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          new UnauthorizedException('Token de autorización inválido o expirado'),
        );
      });
    });
  });
});
