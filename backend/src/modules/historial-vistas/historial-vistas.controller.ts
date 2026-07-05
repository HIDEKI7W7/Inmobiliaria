import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HistorialVistasService } from './historial-vistas.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('historial-vistas')
export class HistorialVistasController {
  constructor(private readonly service: HistorialVistasService) {}

  /**
   * POST /api/historial-vistas/:propiedadId
   */
  @Post(':propiedadId')
  async recordView(
    @Param('propiedadId') propertyId: string,
    @Request() req: any,
  ) {
    // ponytail: extract userId if token is present, otherwise fallback to guest-user
    let userId = 'guest-user';
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        const token = parts[1];
        try {
          const jwtService = new (require('@nestjs/jwt').JwtService)({
            secret: process.env.JWT_SECRET || 'ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d',
          });
          const payload = jwtService.verify(token);
          if (payload && payload.userId) {
            userId = payload.userId;
          }
        } catch (_) {}
      }
    }
    return this.service.recordView(userId, propertyId);
  }

  /**
   * GET /api/historial-vistas
   */
  @Get()
  @UseGuards(AuthGuard)
  async getHistory(@Request() req: any) {
    const userId = req.user.id;
    return this.service.getHistory(userId);
  }
}
