import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { OAuthProfile } from './strategies/oauth-profile';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthProvider, PropertyInterest, Role, UserObjective } from '@prisma/client';

type StoredUser = {
  id: string;
  email: string;
  password?: string | null;
  name: string | null;
  role: Role;
  onboardingCompleted: boolean;
  objective: UserObjective | null;
  propertyInterest: PropertyInterest | null;
  whatsappPhone: string | null;
  authProvider?: AuthProvider;
  providerId?: string | null;
};

type MockUser = Omit<StoredUser, 'password' | 'objective' | 'propertyInterest' | 'whatsappPhone'> & {
  passwordHash: string;
  objective?: UserObjective | null;
  propertyInterest?: PropertyInterest | null;
  whatsappPhone?: string | null;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private readonly mockUsers: MockUser[] = [
    {
      id: 'admin-1',
      email: 'admin@propio.com.bo',
      passwordHash: '$2b$10$cLJN64DUTXWeTCeg8/6GDuXsZrl6eHMnHqWtWpGXnXcE6JJP26XM6',
      name: 'Administrador Propio',
      role: 'ADMIN',
      onboardingCompleted: true,
    },
    {
      id: 'agent-1',
      email: 'agent@propio.com.bo',
      passwordHash: '$2b$10$I2tW68KtGEBxyAfJugFbyuecjAHo..koWtTihqj2WjxAc9U81VI.u',
      name: 'Agente Estrella',
      role: 'AGENTE',
      onboardingCompleted: true,
    },
    {
      id: 'owner-1',
      email: 'owner@propio.com.bo',
      passwordHash: '$2b$10$8/qah3BVrcE2nPDkXKJvdeWregGs3Dt90xTxxv.yTSv1NVQXOOKBq',
      name: 'Propietario Legitimo',
      role: 'PROPIETARIO',
      onboardingCompleted: true,
    },
    {
      id: 'client-1',
      email: 'client@propio.com.bo',
      passwordHash: bcrypt.hashSync('client123', 10),
      name: 'Cliente Interesado',
      role: 'CLIENTE',
      onboardingCompleted: true,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(credentials: LoginDto) {
    const { email, password } = credentials;
    if (!email || !password) {
      throw new BadRequestException('Credenciales incompletas');
    }

    let user: StoredUser | null = null;
    const normalizedEmail = String(email).toLowerCase().trim();

    try {
      user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch {
      this.logger.warn('Error de conexion con la base de datos. Usando fallback en memoria de desarrollo.');
      const mockUser = this.mockUsers.find((u) => u.email === normalizedEmail);
      if (mockUser) {
        user = {
          id: mockUser.id,
          email: mockUser.email,
          password: mockUser.passwordHash,
          name: mockUser.name,
          role: mockUser.role,
          onboardingCompleted: mockUser.onboardingCompleted,
          objective: mockUser.objective || null,
          propertyInterest: mockUser.propertyInterest || null,
          whatsappPhone: mockUser.whatsappPhone || null,
        };
      }
    }

    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.password) {
      throw new UnauthorizedException('Esta cuenta usa inicio social. Ingresa con Google, Facebook o Apple.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return {
      message: 'Inicio de sesion exitoso en Propio',
      user: this.toPublicUser(user),
      backendToken: this.signUser(user),
    };
  }

  async register(data: RegisterDto) {
    const { email, password, name } = data;
    if (!email || !password) {
      throw new BadRequestException('Email y contrasena requeridos');
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: name || null,
          role: 'PROPIETARIO',
          authProvider: 'LOCAL',
        },
      });

      return {
        message: 'Registro exitoso',
        user: this.toPublicUser(newUser),
      };
    } catch (error) {
      this.logger.error(`Error al registrar usuario en la base de datos: ${error.message}`);

      const tempId = `user-${Date.now()}`;
      const tempUser: Omit<StoredUser, 'password'> = {
        id: tempId,
        email: normalizedEmail,
        name: name || 'Usuario Invitado',
        role: 'PROPIETARIO' as Role,
        onboardingCompleted: false,
        objective: null,
        propertyInterest: null,
        whatsappPhone: null,
      };

      this.mockUsers.push({
        id: tempId,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        name: tempUser.name,
        role: tempUser.role,
        onboardingCompleted: false,
      });

      return {
        message: 'Registro exitoso (resiliencia en memoria local)',
        user: tempUser,
      };
    }
  }

  async socialLogin(profile: OAuthProfile) {
    const email = profile.email.toLowerCase().trim();

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });

      if (existing) {
        return tx.user.update({
          where: { id: existing.id },
          data: {
            authProvider: profile.provider,
            providerId: profile.providerId,
            name: existing.name || profile.name || null,
          },
        });
      }

      return tx.user.create({
        data: {
          email,
          password: null,
          name: profile.name || null,
          role: 'PROPIETARIO',
          authProvider: profile.provider,
          providerId: profile.providerId,
          onboardingCompleted: false,
        },
      });
    });

    const token = this.signUser(user);
    const frontendUrl = process.env.FRONTEND_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const nextPath = user.onboardingCompleted
      ? this.getPostLoginPath(user.role, user.objective)
      : '/onboarding';

    return {
      token,
      redirectUrl: `${frontendUrl}/auth/social-callback#token=${encodeURIComponent(token)}&next=${encodeURIComponent(nextPath)}`,
      user: this.toPublicUser(user),
    };
  }

  async completeOnboarding(userId: string, dto: UpdateOnboardingDto) {
    let user: StoredUser | null = null;

    // Determinar el nuevo rol basado en su objetivo seleccionado
    const targetRole: Role = (dto.objective === 'COMPRAR' || dto.objective === 'ALQUILAR')
      ? 'CLIENTE'
      : 'PROPIETARIO';

    try {
      user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          objective: dto.objective,
          propertyInterest: dto.propertyInterest,
          whatsappPhone: dto.whatsappPhone,
          onboardingCompleted: true,
          role: targetRole, // Guardar el rol en base de datos
        },
      });
    } catch (error) {
      this.logger.warn('Error al actualizar onboarding en la base de datos, usando fallback en memoria.');
      
      const mockUserIndex = this.mockUsers.findIndex((u) => u.id === userId || u.email === userId);
      if (mockUserIndex !== -1) {
        const mockUser = this.mockUsers[mockUserIndex];
        mockUser.onboardingCompleted = true;
        mockUser.objective = dto.objective;
        mockUser.propertyInterest = dto.propertyInterest;
        mockUser.whatsappPhone = dto.whatsappPhone;
        mockUser.role = targetRole; // Guardar el rol en memoria local
        
        user = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          objective: mockUser.objective,
          propertyInterest: mockUser.propertyInterest,
          whatsappPhone: mockUser.whatsappPhone,
          onboardingCompleted: true,
        };
      } else {
        user = {
          id: userId,
          email: 'guest@propio.com.bo',
          name: 'Usuario Invitado',
          role: targetRole,
          objective: dto.objective,
          propertyInterest: dto.propertyInterest,
          whatsappPhone: dto.whatsappPhone,
          onboardingCompleted: true,
        };
      }
    }

    return {
      message: 'Perfil de configuracion inicial completado.',
      user: this.toPublicUser(user),
      backendToken: this.signUser(user),
      redirectPath: this.getPostLoginPath(user.role, user.objective),
    };
  }

  private signUser(user: StoredUser) {
    return this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      objective: user.objective || null,
      onboardingCompleted: Boolean(user.onboardingCompleted),
    });
  }

  private toPublicUser(user: StoredUser) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      objective: user.objective || null,
      propertyInterest: user.propertyInterest || null,
      whatsappPhone: user.whatsappPhone || null,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      status: (user as any).status || 'ACTIVE',
      nickname: (user as any).nickname || null,
      avatarUrl: (user as any).avatarUrl || null,
    };
  }

  async updateProfile(userId: string, data: { name?: string; nickname?: string; whatsappPhone?: string; avatarUrl?: string }) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        nickname: data.nickname,
        whatsappPhone: data.whatsappPhone,
        avatarUrl: data.avatarUrl,
      },
    });
    return {
      message: 'Perfil actualizado con éxito',
      user: this.toPublicUser(updated),
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    if (user.password) {
      const isMatch = await bcrypt.compare(currentPass, user.password);
      if (!isMatch) throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Contraseña actualizada con éxito' };
  }

  async unlinkGoogle(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        authProvider: 'LOCAL',
        providerId: null,
      },
    });

    return { message: 'Cuenta de Google desvinculada' };
  }

  async suspendAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });
    return { message: 'Cuenta desactivada de forma lógica' };
  }

  private getPostLoginPath(role: string, objective?: string | null) {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'AGENTE':
        return '/agente/kanban';
      case 'CLIENTE':
        return '/cliente';
      case 'PROPIETARIO':
        return objective === 'VENDER' ? '/propietario/publicar' : '/propietario/dashboard';
      default:
        return '/';
    }
  }
}
