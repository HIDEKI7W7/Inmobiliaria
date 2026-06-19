import { Module } from '@nestjs/common';
import { CierresController } from './cierres.controller';
import { CierresService } from './cierres.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CierresController],
  providers: [CierresService],
  exports: [CierresService],
})
export class CierresModule {}
