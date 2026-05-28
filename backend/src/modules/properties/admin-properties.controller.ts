import { Controller, Patch, Param, Body, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
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
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: string; observationNotes?: string },
  ) {
    return this.propertiesService.updateStatus(id, body.status, body.observationNotes);
  }
}
