import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll() {
    return this.leadsService.findAll();
  }

  @Post()
  async create(@Body() body: CreateLeadDto) {
    return this.leadsService.create(body);
  }
}
