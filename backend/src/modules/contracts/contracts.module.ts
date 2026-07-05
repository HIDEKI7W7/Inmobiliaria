import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule,
    MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } }),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
