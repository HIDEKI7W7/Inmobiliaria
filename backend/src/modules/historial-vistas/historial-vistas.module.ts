import { Module } from '@nestjs/common';
import { HistorialVistasController } from './historial-vistas.controller';
import { HistorialVistasService } from './historial-vistas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HistorialVistasController],
  providers: [HistorialVistasService],
  exports: [HistorialVistasService],
})
export class HistorialVistasModule {}
