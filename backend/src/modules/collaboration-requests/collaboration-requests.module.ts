import { Module } from '@nestjs/common';
import { CollaborationRequestsController } from './collaboration-requests.controller';
import { CollaborationRequestsService } from './collaboration-requests.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CollaborationRequestsController],
  providers: [CollaborationRequestsService],
  exports: [CollaborationRequestsService],
})
export class CollaborationRequestsModule {}
