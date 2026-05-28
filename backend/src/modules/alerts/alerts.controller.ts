import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AlertsService, CreateAlertDto } from './alerts.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * POST /api/alerts
   * Crea una nueva alerta de búsqueda para el usuario autenticado.
   */
  @Post()
  @UseGuards(AuthGuard)
  async createAlert(@Body() body: Omit<CreateAlertDto, 'userId'>, @Request() req: any) {
    return this.alertsService.createAlert({
      ...body,
      userId: req.user.id,
    });
  }

  /**
   * GET /api/alerts/my
   * Lista las alertas activas del usuario autenticado.
   */
  @Get('my')
  @UseGuards(AuthGuard)
  async getMyAlerts(@Request() req: any) {
    return this.alertsService.getUserAlerts(req.user.id);
  }

  /**
   * DELETE /api/alerts/:alertId
   * Desactiva una alerta del usuario autenticado.
   */
  @Delete(':alertId')
  @UseGuards(AuthGuard)
  async deactivateAlert(@Param('alertId', ParseUUIDPipe) alertId: string, @Request() req: any) {
    return this.alertsService.deactivateAlert(alertId, req.user.id);
  }

  /**
   * POST /api/alerts/engine/run (ADMIN ONLY)
   * Dispara manualmente el motor de emparejamiento asíncrono.
   */
  @Post('engine/run')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async runMatchEngine() {
    const result = await this.alertsService.runMatchEngine();
    return {
      message: `Motor ejecutado: ${result.processedAlerts} alertas procesadas, ${result.totalMatches} matches encontrados`,
      ...result,
    };
  }

  /**
   * POST /api/alerts/match/:propertyId (ADMIN/AGENTE)
   * Dispara match inmediato para una propiedad recién publicada.
   */
  @Post('match/:propertyId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'AGENTE')
  async matchNewProperty(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    const notified = await this.alertsService.matchNewProperty(propertyId);
    return {
      message: `Match inmediato ejecutado. Se notificó a ${notified} usuario(s) interesados.`,
      notifiedUsers: notified,
    };
  }
}
