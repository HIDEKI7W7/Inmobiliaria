import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  /**
   * GET /api/clients?category=Prospecto&priority=Alta&stage=Nuevo&q=nombre
   */
  @Get()
  findAll(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('stage') stage?: string,
    @Query('q') q?: string,
  ) {
    const agentId: string = req.user?.id || req.user?.sub;
    return this.clientsService.findAll({ agentId, category, priority, stage, q });
  }

  /**
   * POST /api/clients
   */
  @Post()
  create(@Request() req: any, @Body() dto: CreateClientDto) {
    const agentId: string = req.user?.id || req.user?.sub;
    return this.clientsService.create(dto, agentId);
  }

  /**
   * PATCH /api/clients/:id/stage
   */
  @Patch(':id/stage')
  updateStage(
    @Request() req: any,
    @Param('id') id: string,
    @Body('stage') stage: string,
  ) {
    const agentId: string = req.user?.id || req.user?.sub;
    return this.clientsService.updateStage(id, stage, agentId);
  }
}
