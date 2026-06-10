import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { BusquedasGuardadasService } from './busquedas-guardadas.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Controller('busquedas-guardadas')
export class BusquedasGuardadasController {
  constructor(private readonly service: BusquedasGuardadasService) {}

  @Post()
  @UseGuards(AuthGuard)
  async saveSearch(@Request() req: any, @Body() dto: CreateSavedSearchDto) {
    const userId = req.user.id;
    const queryStr = typeof dto.query === 'object' ? JSON.stringify(dto.query) : String(dto.query);
    return this.service.create(userId, queryStr);
  }

  @Get()
  @UseGuards(AuthGuard)
  async getSavedSearches(@Request() req: any) {
    const userId = req.user.id;
    return this.service.findAll(userId);
  }
}
