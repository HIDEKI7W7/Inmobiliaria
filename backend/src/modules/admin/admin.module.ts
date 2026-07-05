import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, ReportsController],
})
export class AdminModule {}
