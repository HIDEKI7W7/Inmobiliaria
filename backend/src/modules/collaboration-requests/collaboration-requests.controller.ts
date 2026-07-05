import { Controller, Get, Post, Param, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { CollaborationRequestsService } from './collaboration-requests.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('collaboration-requests')
@UseGuards(AuthGuard)
export class CollaborationRequestsController {
  constructor(private readonly service: CollaborationRequestsService) {}

  @Post('create/:propertyId')
  async createRequest(
    @Param('propertyId') propertyId: string,
    @Request() req: any,
  ) {
    const sellingAgentId = req.user.id;
    return this.service.createRequest(propertyId, sellingAgentId);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    const agentId = req.user.id;
    return this.service.getRequestsForAgent(agentId);
  }

  @Patch('respond/:id')
  async respondToRequest(
    @Param('id') id: string,
    @Body('status') status: 'ACEPTADO' | 'RECHAZADO',
    @Request() req: any,
  ) {
    const agentId = req.user.id;
    return this.service.updateRequestStatus(id, agentId, status);
  }
}
