import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [AlertsController],
  providers: [AlertsService, WebhooksService],
  exports: [AlertsService],
})
export class AlertsModule {}
