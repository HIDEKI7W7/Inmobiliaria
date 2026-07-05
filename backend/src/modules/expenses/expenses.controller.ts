import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('expenses')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Query('branch_id') branchId?: string) {
    return this.expensesService.findAll(branchId);
  }

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.expensesService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; notes?: string }) {
    return this.expensesService.update(id, body);
  }
}
