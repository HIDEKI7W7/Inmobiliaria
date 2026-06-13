import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    const user = req.user;
    if (user.role === 'AGENTE') {
      return this.leadsService.findAgentLeads(user.id);
    }
    if (user.role === 'ADMIN') {
      return this.leadsService.findAll();
    }
    return [];
  }

  @Post()
  async create(@Body() body: CreateLeadDto) {
    return this.leadsService.create(body);
  }
}
