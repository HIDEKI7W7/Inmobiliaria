import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('client/stats')
  @UseGuards(AuthGuard)
  async getClientStats(@Request() req: any) {
    return this.dashboardService.getClientStats(req.user.id);
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
  @UseGuards(AuthGuard)
  async createMeeting(@Request() req: any, @Body() body: { propertyId: string; scheduledAt: string }) {
    const userId = req.user.id;
    const meeting = await this.dashboardService.createMeeting(userId, body.propertyId, new Date(body.scheduledAt));
    return { success: true, meeting };
  }
}
