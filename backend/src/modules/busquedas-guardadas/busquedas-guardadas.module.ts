import { Module } from '@nestjs/common';
import { BusquedasGuardadasController } from './busquedas-guardadas.controller';
import { BusquedasGuardadasService } from './busquedas-guardadas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusquedasGuardadasController],
  providers: [BusquedasGuardadasService],
  exports: [BusquedasGuardadasService],
})
export class BusquedasGuardadasModule {}
