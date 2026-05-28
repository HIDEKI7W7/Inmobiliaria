import { Controller, Get, Patch, Param, Body, UseGuards, Request, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('agente/leads')
@UseGuards(AuthGuard, RolesGuard)
@Roles('AGENTE', 'ADMIN')
export class AgentLeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAgentLeads(@Request() req: any) {
    const agentId = req.user.id;
    return this.leadsService.findAgentLeads(agentId);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string },
    @Request() req: any,
  ) {
    const agentId = req.user.id;
    return this.leadsService.updateLeadStatus(id, body.status, agentId);
  }
}
