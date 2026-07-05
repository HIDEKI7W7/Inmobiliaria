import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('client/stats')
  @UseGuards(AuthGuard)
  async getClientStats(@Request() req: any) {
    return this.dashboardService.getClientStats(req.user.id);
  }

  @Get('client/dashboard')
  @UseGuards(AuthGuard)
  async getClientDashboardData(@Request() req: any) {
    return this.dashboardService.getClientDashboardData(req.user.id);
  }

  @Get('owner/stats')
  @UseGuards(AuthGuard)
  async getOwnerStats(@Request() req: any) {
    return this.dashboardService.getOwnerStats(req.user.id);
  }

  @Post('offers')
  @UseGuards(AuthGuard)
  async createOffer(@Request() req: any, @Body() body: { propertyId: string; amount: number }) {
    const userId = req.user.id;
    const offer = await this.dashboardService.createOffer(userId, body.propertyId, Number(body.amount));
    return { success: true, offer };
  }

  @Post('inquiries')
  @UseGuards(AuthGuard)
  async createInquiry(@Request() req: any, @Body() body: { propertyId: string; message: string }) {
    const userId = req.user.id;
    const inquiry = await this.dashboardService.createInquiry(userId, body.propertyId, body.message);
    return { success: true, inquiry };
  }

  @Post('meetings')
  async createMeeting(@Request() req: any, @Body() body: {
    propertyId: string;
    scheduledAt: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    notes?: string;
    type?: string;
  }) {
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        const token = parts[1];
        try {
          const payload = this.jwtService.verify(token, {
            secret: process.env.JWT_SECRET || 'ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d',
          });
          userId = payload.userId;
        } catch (e) {
          // Token inválido, tratar como invitado
        }
      }
    }

    const meeting = await this.dashboardService.createMeeting({
      userId,
      propertyId: body.propertyId,
      scheduledAt: new Date(body.scheduledAt),
      clientName: body.clientName,
      clientPhone: body.clientPhone,
      clientEmail: body.clientEmail,
      notes: body.notes,
      type: body.type,
    });
    return { success: true, meeting };
  }

  @Get('meetings')
  @UseGuards(AuthGuard)
  async getMeetings(@Request() req: any) {
    return this.dashboardService.getMeetings(req.user.id, req.user.role);
  }

  /** Admin KPI stats — filterable by branch/city */
  @Get('admin/stats')
  async getAdminStats(@Query('branch') branch?: string) {
    return this.dashboardService.getAdminStats(branch || 'TODOS');
  }

  /** DELETE activity log with admin permission check */
  @Delete('admin/activities/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  async deleteActivityLog(@Param('id') id: string) {
    return this.dashboardService.deleteActivityLog(id);
  }
}
