import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('collaborations')
@UseGuards(AuthGuard)
export class CollaborationsController {
  constructor(private readonly service: CollaborationsService) {}

  /**
   * GET /api/collaborations
   * Retorna { sent: [], received: [] } filtrado por el agente autenticado.
   */
  @Get()
  findAll(@Request() req: any) {
    const agentId: string = req.user?.id || req.user?.sub;
    // Semilla de demo si no hay datos
    this.service.seed(agentId);
    return this.service.findForAgent(agentId);
  }

  /**
   * POST /api/collaborations
   * Crea una nueva solicitud de colaboración con distribución de comisiones.
   */
  @Post()
  create(@Request() req: any, @Body() body: any) {
    const agentId: string = req.user?.id || req.user?.sub;
    const agentName: string = req.user?.name || 'Tu Agente';
    const agentPhone: string = req.user?.whatsappPhone || '';

    return this.service.create({
      propertyId:        body.propertyId,
      propertyTitle:     body.propertyTitle || 'Propiedad en Cartera',
      senderAgentId:     agentId,
      senderAgentName:   agentName,
      senderAgentPhone:  agentPhone,
      receiverAgentId:   body.receiverAgentId,
      receiverAgentName: body.receiverAgentName || 'Agente Receptor',
      receiverAgentPhone:body.receiverAgentPhone || '',
      agent1Percentage:  Number(body.agent1Percentage ?? 25),
      agent2Percentage:  Number(body.agent2Percentage ?? 25),
    });
  }

  /**
   * PUT /api/collaborations/:id/status
   * Acepta o Rechaza la colaboración (solo el agente receptor).
   */
  @Put(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: 'ACEPTADA' | 'RECHAZADA',
  ) {
    const agentId: string = req.user?.id || req.user?.sub;
    return this.service.updateStatus(id, agentId, status);
  }
}
