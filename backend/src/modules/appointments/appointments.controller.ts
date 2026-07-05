import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(
    @Request() req: any,
    @Body()
    body: {
      propertyId: string;
      scheduledAt: string;
      clientPhone: string;
      clientName: string;
      clientEmail: string;
      notes?: string;
      type?: string;
    },
  ) {
    const userId = req.user.id;
    const meeting = await this.service.create(userId, {
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    });
    return { success: true, meeting };
  }

  @Get()
  @UseGuards(AuthGuard)
  async findAll(@Request() req: any) {
    const userId = req.user.id;
    const role = req.user.role;
    const meetings = await this.service.findAllForAgent(userId, role);
    return { success: true, meetings };
  }
}
