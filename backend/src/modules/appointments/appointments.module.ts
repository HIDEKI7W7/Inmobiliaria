import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WebhooksService } from '../webhooks/webhooks.service';

@Module({
  imports: [AuthModule, PrismaModule, HttpModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, WebhooksService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
