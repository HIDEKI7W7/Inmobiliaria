import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MarketingOrdersService } from './marketing-orders.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('marketing-orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class MarketingOrdersController {
  constructor(private readonly service: MarketingOrdersService) {}

  @Get()
  async getOrders(@Query('branch') branch?: string) {
    return this.service.findAll(branch);
  }

  @Post()
  async createOrder(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.service.updateStatus(id, body.status);
  }
}
