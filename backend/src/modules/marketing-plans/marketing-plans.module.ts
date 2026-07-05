import { Module } from '@nestjs/common';
import { MarketingPlansController } from './marketing-plans.controller';
import { MarketingPlansService } from './marketing-plans.service';
import { MarketingOrdersController } from './marketing-orders.controller';
import { MarketingOrdersService } from './marketing-orders.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [MarketingPlansController, MarketingOrdersController],
  providers: [MarketingPlansService, MarketingOrdersService],
  exports: [MarketingPlansService, MarketingOrdersService],
})
export class MarketingPlansModule {}
