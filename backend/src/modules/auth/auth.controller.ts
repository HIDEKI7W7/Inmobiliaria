import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    // Retorna la firma de la autenticación llamando al servicio
    return this.authService.login(body);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }
}
