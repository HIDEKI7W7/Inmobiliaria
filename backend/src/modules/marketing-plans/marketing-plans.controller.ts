import { Controller, Get, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { MarketingPlansService } from './marketing-plans.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller(['marketing-plans', 'plans'])
export class MarketingPlansController {
  constructor(private readonly service: MarketingPlansService) {}

  @Get()
  async getAll() {
    return this.service.findAll();
  }

  @Put(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updatePlanPut(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updatePlanPatch(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }
}
