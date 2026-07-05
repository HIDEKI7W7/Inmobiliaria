import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('latest')
  async getLatestActive() {
    return this.announcementsService.getLatestActive();
  }

  @Post()
  @UseGuards(AuthGuard)
  async saveAnnouncement(@Body() body: any) {
    return this.announcementsService.saveAnnouncement(body);
  }
}
