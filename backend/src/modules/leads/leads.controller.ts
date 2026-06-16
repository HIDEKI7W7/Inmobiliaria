import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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

  // TSK-7.1: Máx 20 envíos de lead por minuto por IP (anti-spam en formulario de contacto)
  @Post()
  @Throttle({ leads: { limit: 20, ttl: 60_000 } })
  async create(@Body() body: CreateLeadDto) {
    return this.leadsService.create(body);
  }
}

