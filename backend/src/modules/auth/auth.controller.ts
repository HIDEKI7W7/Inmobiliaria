import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GoogleAuthGuard, FacebookAuthGuard, AppleAuthGuard } from './social-auth.guards';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SocialMockDto } from './dto/social-mock.dto';
import { OAuthProfile } from './strategies/oauth-profile';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private static getAuthUser(req: Request): { id: string } {
    const authReq = req as Request & { user?: { id?: string } };
    if (!authReq.user?.id) {
      throw new ForbiddenException('Usuario autenticado inválido.');
    }
    return { id: authReq.user.id };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    
    // Emitimos la cookie HttpOnly con el token real para el middleware y backend
    // Emitimos una cookie no-HttpOnly legible por JS con la info de perfil público para presentación visual
    res.setHeader('Set-Cookie', [
      `propio_token=${encodeURIComponent(result.backendToken)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict${secure}`,
      `propio_user=${encodeURIComponent(JSON.stringify(result.user))}; Path=/; Max-Age=604800; SameSite=Strict${secure}`
    ]);
    
    return result;
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    
    // Vaciamos ambas cookies de forma segura e inmediata
    res.setHeader('Set-Cookie', [
      `propio_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure}`,
      `propio_user=; Path=/; Max-Age=0; SameSite=Strict${secure}`
    ]);
    
    return { success: true, message: 'Sesión cerrada exitosamente en el servidor' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return null;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request & { user: OAuthProfile }, @Res() res: Response) {
    return this.finishSocialLogin(req.user, res);
  }

  @Get('facebook')
  @UseGuards(FacebookAuthGuard)
  async facebookAuth() {
    return null;
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookCallback(@Req() req: Request & { user: OAuthProfile }, @Res() res: Response) {
    return this.finishSocialLogin(req.user, res);
  }

  @Get('apple')
  @UseGuards(AppleAuthGuard)
  async appleAuth() {
    return null;
  }

  @Post('apple/callback')
  @UseGuards(AppleAuthGuard)
  async appleCallback(@Req() req: Request & { user: OAuthProfile }, @Res() res: Response) {
    return this.finishSocialLogin(req.user, res);
  }

  @Post('social-mock')
  @HttpCode(HttpStatus.OK)
  async socialMock(@Body() body: SocialMockDto, @Res() res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      throw new ForbiddenException('El simulador de inicio social sólo está disponible en modo de desarrollo.');
    }

    if (!body.email || !body.provider) {
      throw new ForbiddenException('Faltan campos obligatorios para la simulación de inicio social.');
    }

    const profile: OAuthProfile = {
      provider: body.provider,
      providerId: body.providerId || `mock-${Date.now()}`,
      email: body.email,
      name: body.name || `Usuario ${body.provider.toLowerCase()}`,
    };

    return this.finishSocialLogin(profile, res);
  }

  @Patch('onboarding')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@Req() req: Request, @Body() body: UpdateOnboardingDto, @Res({ passthrough: true }) res: Response) {
    const user = AuthController.getAuthUser(req);
    const result = await this.authService.completeOnboarding(user.id, body);
    
    // Al actualizar el onboarding, regeneramos el token con el nuevo rol e información actualizada
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', [
      `propio_token=${encodeURIComponent(result.backendToken)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict${secure}`,
      `propio_user=${encodeURIComponent(JSON.stringify(result.user))}; Path=/; Max-Age=604800; SameSite=Strict${secure}`
    ]);
    
    return result;
  }

  private async finishSocialLogin(profile: OAuthProfile, res: Response) {
    const result = await this.authService.socialLogin(profile);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

    res.setHeader('Set-Cookie', [
      `propio_token=${encodeURIComponent(result.token)}; Path=/; Max-Age=604800; HttpOnly; SameSite=Strict${secure}`,
      `propio_user=${encodeURIComponent(JSON.stringify(result.user))}; Path=/; Max-Age=604800; SameSite=Strict${secure}`
    ]);

    return res.redirect(result.redirectUrl);
  }
}
