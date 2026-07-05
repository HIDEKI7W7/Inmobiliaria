import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CierresService } from './cierres.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('cierres')
export class CierresController {
  constructor(private readonly cierresService: CierresService) {}

  /** Propiedades disponibles del agente (propias + colaboraciones aceptadas) */
  @Get('available-properties')
  @UseGuards(AuthGuard)
  async getAvailableProperties(@Request() req: any) {
    return this.cierresService.getAvailableProperties(req.user.id);
  }

  /** Clientes asignados al agente (para selector) */
  @Get('my-clients')
  @UseGuards(AuthGuard)
  async getMyClients(@Request() req: any) {
    return this.cierresService.getAgentClients(req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createCierre(
    @Request() req: any,
    @Body()
    body: {
      propiedadId: string;
      clientId: string;
      ownerId: string;
      tipoTransaccion: string;
      finalAmount: number;
      pdfAdjuntos: { name: string; url: string }[];
      pdfEstado?: string;
    },
  ) {
    const { propiedadId, clientId, ownerId, tipoTransaccion, finalAmount, pdfAdjuntos } = body;
    if (!propiedadId || !clientId || !ownerId || !tipoTransaccion || finalAmount === undefined || !pdfAdjuntos?.length) {
      throw new BadRequestException(
        'Campos obligatorios: propiedadId, clientId, ownerId, tipoTransaccion, finalAmount y al menos un PDF adjunto.',
      );
    }
    return this.cierresService.createCierre(req.user.id, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getCierres(@Request() req: any) {
    return this.cierresService.getCierresByAgent(req.user.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateCierre(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      tipoTransaccion?: string;
      finalAmount?: number;
      pdfAdjuntos?: { name: string; url: string }[];
      pdfEstado?: string;
    },
  ) {
    return this.cierresService.updateCierre(id, req.user.id, body);
  }
}
