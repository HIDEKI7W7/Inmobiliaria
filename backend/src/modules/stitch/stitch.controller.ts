import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { StitchService } from './stitch.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('stitch')
export class StitchController {
  constructor(private readonly stitchService: StitchService) {}

  @Post('generate')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async generateLanding(@Body() body: { prompt: string; title: string }) {
    const html = await this.stitchService.generateLanding(body.prompt, body.title);
    return { html };
  }
}
