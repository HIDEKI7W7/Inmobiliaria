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

  @Post()
  @UseGuards(AuthGuard)
  async createCierre(
    @Request() req: any,
    @Body() body: {
      propiedadId: string;
      tipoTransaccion: string;
      pdfRespaldo: string;
      pdfEstado?: string;
    },
  ) {
    const agenteId = req.user.id;
    if (!body.propiedadId || !body.tipoTransaccion || !body.pdfRespaldo) {
      throw new BadRequestException('Faltan campos obligatorios: propiedadId, tipoTransaccion, pdfRespaldo.');
    }
    return this.cierresService.createCierre(agenteId, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getCierres(@Request() req: any) {
    const agenteId = req.user.id;
    return this.cierresService.getCierresByAgent(agenteId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateCierre(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: {
      tipoTransaccion?: string;
      pdfRespaldo?: string;
      pdfEstado?: string;
    },
  ) {
    const agenteId = req.user.id;
    return this.cierresService.updateCierre(id, agenteId, body);
  }
}
