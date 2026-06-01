import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FavoritosService } from './favoritos.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritosService: FavoritosService) {}

  /**
   * POST /api/favoritos/toggle/:propiedadId
   * Alterna el estado de favoritos para la propiedad especificada.
   * Protegido por AuthGuard.
   */
  @Post('toggle/:propiedadId')
  @UseGuards(AuthGuard)
  async toggleFavorite(
    @Param('propiedadId', ParseUUIDPipe) propertyId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.favoritosService.toggleFavorite(userId, propertyId);
  }

  /**
   * GET /api/favoritos
   * Lista las propiedades favoritas del usuario autenticado.
   * Protegido por AuthGuard.
   */
  @Get()
  @UseGuards(AuthGuard)
  async getFavorites(@Request() req: any) {
    const userId = req.user.id;
    return this.favoritosService.getFavorites(userId);
  }
}
