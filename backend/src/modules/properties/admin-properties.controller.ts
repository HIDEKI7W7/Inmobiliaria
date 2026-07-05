import { Controller, Patch, Param, Body, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/properties')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; observationNotes?: string },
  ) {
    return this.propertiesService.updateStatus(id, body.status, body.observationNotes);
  }

  @Patch(':id/plan')
  @HttpCode(HttpStatus.OK)
  async updatePlan(
    @Param('id') id: string,
    @Body() body: { plan: 'gratis' | 'contenidos' | 'venta_pro' | 'cierre_garantizado' },
  ) {
    const VALID_PLANS = ['gratis', 'contenidos', 'venta_pro', 'cierre_garantizado'];
    if (!body?.plan || !VALID_PLANS.includes(body.plan)) {
      throw new BadRequestException(
        `Plan inválido "${body?.plan}". Valores permitidos: ${VALID_PLANS.join(', ')}.`
      );
    }
    return this.propertiesService.updatePlan(id, body.plan);
  }
}
