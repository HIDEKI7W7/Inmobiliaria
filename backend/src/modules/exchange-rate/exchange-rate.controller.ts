import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('exchange-rate')
export class ExchangeRateController {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  @Get()
  async getCurrentRate() {
    return this.exchangeRateService.getCurrentRate();
  }

  @Post('sync')
  @UseGuards(AuthGuard)
  async syncRate() {
    return this.exchangeRateService.syncExchangeRate();
  }

  @Post('manual')
  @UseGuards(AuthGuard)
  async updateRateManually(
    @Body() body: { rateBuy: number; rateSell: number },
  ) {
    return this.exchangeRateService.updateRateManually(body.rateBuy, body.rateSell);
  }

  @Get('history')
  @UseGuards(AuthGuard)
  async getHistory() {
    return this.exchangeRateService.getHistory();
  }
}
