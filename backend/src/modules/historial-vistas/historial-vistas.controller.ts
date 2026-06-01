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
  @UseGuards(AuthGuard)
  async recordView(
    @Param('propiedadId', ParseUUIDPipe) propertyId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
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
