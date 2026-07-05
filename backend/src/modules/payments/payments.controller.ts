import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll() {
    return this.paymentsService.findAll();
  }

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ) {
    return this.paymentsService.updateStatus(id, body);
  }
}
