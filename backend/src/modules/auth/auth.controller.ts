import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GoogleAuthGuard, FacebookAuthGuard, AppleAuthGuard } from './social-auth.guards';
import { UpdateOnboardingDto } from './dto/update-onboarding.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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

  // TSK-7.1: Máx 10 intentos de login por minuto por IP (protección brute-force)
  private getCookieHeaders(token: string, user: any, maxAge = 604800): string[] {
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction ? '; Secure' : '';
    const domain = isProduction ? '; Domain=.propioinmuebles.com' : '';
    const sameSite = '; SameSite=Lax';

    if (maxAge === 0) {
      return [
        `propio_token=; Path=/; Max-Age=0; HttpOnly${sameSite}${domain}${secure}`,
        `propio_user=; Path=/; Max-Age=0${sameSite}${domain}${secure}`
      ];
    }

    const tokenVal = encodeURIComponent(token || '');
    const userVal = encodeURIComponent(JSON.stringify(user || {}));

    return [
      `propio_token=${tokenVal}; Path=/; Max-Age=${maxAge}; HttpOnly${sameSite}${domain}${secure}`,
      `propio_user=${userVal}; Path=/; Max-Age=${maxAge}${sameSite}${domain}${secure}`
    ];
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body);
    
    // Emitimos la cookie HttpOnly con el token real para el middleware y backend
    // Emitimos una cookie no-HttpOnly legible por JS con la info de perfil público para presentación visual
    res.setHeader('Set-Cookie', this.getCookieHeaders(result.backendToken, result.user));
    
    return result;
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Vaciamos ambas cookies de forma segura e inmediata
    res.setHeader('Set-Cookie', this.getCookieHeaders('', null, 0));
    
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

  @Patch('onboarding')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async completeOnboarding(@Req() req: Request, @Body() body: UpdateOnboardingDto, @Res({ passthrough: true }) res: Response) {
    const user = AuthController.getAuthUser(req);
    const result = await this.authService.completeOnboarding(user.id, body);
    
    // Al actualizar el onboarding, regeneramos el token con el nuevo rol e información actualizada
    res.setHeader('Set-Cookie', this.getCookieHeaders(result.backendToken, result.user));
    
    return result;
  }

  @Patch('profile')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Req() req: Request, @Body() body: any) {
    const user = AuthController.getAuthUser(req);
    return this.authService.updateProfile(user.id, body);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(@Req() req: Request, @Body() body: any) {
    const user = AuthController.getAuthUser(req);
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @Post('unlink-google')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlinkGoogle(@Req() req: Request) {
    const user = AuthController.getAuthUser(req);
    return this.authService.unlinkGoogle(user.id);
  }

  @Post('deactivate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async suspendAccount(@Req() req: Request) {
    const user = AuthController.getAuthUser(req);
    return this.authService.suspendAccount(user.id);
  }

  private async finishSocialLogin(profile: OAuthProfile, res: Response) {
    const result = await this.authService.socialLogin(profile);

    res.setHeader('Set-Cookie', this.getCookieHeaders(result.token, result.user));

    return res.redirect(result.redirectUrl);
  }
}
