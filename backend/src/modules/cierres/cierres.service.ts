import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CierreInput {
  propiedadId: string;
  tipoTransaccion: string;
  pdfRespaldo: string;
  pdfEstado?: string;
}

interface CierreRecord {
  id: string;
  propiedadId: string;
  agenteId: string;
  tipoTransaccion: string;
  fechaCierre: string; // ISO String
  pdfRespaldo: string;
  pdfEstado?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CierresService {
  private readonly logger = new Logger(CierresService.name);
  private readonly fallbackFilePath = path.resolve(process.cwd(), 'cierres_fallback.json');

  constructor(private readonly prisma: PrismaService) {}

  // Helper to load fallback JSON
  private async loadFallbackCierres(): Promise<CierreRecord[]> {
    try {
      const content = await fs.readFile(this.fallbackFilePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  // Helper to save fallback JSON
  private async saveFallbackCierres(cierres: CierreRecord[]): Promise<void> {
    try {
      await fs.writeFile(this.fallbackFilePath, JSON.stringify(cierres, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Error al escribir cierres fallback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createCierre(agenteId: string, input: CierreInput) {
    const { propiedadId, tipoTransaccion, pdfRespaldo, pdfEstado } = input;

    // Try DB first
    if (this.prisma.isConnected) {
      try {
        // Create closure record
        const newCierre = await (this.prisma as any).cierre.create({
          data: {
            propiedadId,
            agenteId,
            tipoTransaccion,
            pdfRespaldo,
            pdfEstado: pdfEstado || null,
          },
        });

        // Soft delete / set property to sold status (PropertyStatus enum: VENDIDO)
        await this.prisma.property.update({
          where: { id: propiedadId },
          data: { status: 'VENDIDO' },
        });

        this.logger.log(`Cierre creado en DB para propiedad ${propiedadId}`);
        return newCierre;
      } catch (dbError) {
        this.logger.warn(`Error en DB al crear cierre, usando fallback JSON. Detalle: ${dbError instanceof Error ? dbError.message : dbError}`);
      }
    }

    // Fallback JSON persistence
    const cierres = await this.loadFallbackCierres();
    const newRecord: CierreRecord = {
      id: `cierre-${Date.now()}`,
      propiedadId,
      agenteId,
      tipoTransaccion,
      fechaCierre: new Date().toISOString(),
      pdfRespaldo,
      pdfEstado: pdfEstado || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cierres.push(newRecord);
    await this.saveFallbackCierres(cierres);

    this.logger.log(`Cierre creado en Fallback JSON para propiedad ${propiedadId}`);
    return newRecord;
  }

  async getCierresByAgent(agenteId: string) {
    if (this.prisma.isConnected) {
      try {
        const dbCierres = await (this.prisma as any).cierre.findMany({
          where: { agenteId },
          orderBy: { fechaCierre: 'desc' },
        });
        return dbCierres;
      } catch (dbError) {
        this.logger.warn(`Error al leer cierres de DB, usando fallback JSON.`);
      }
    }

    const cierres = await this.loadFallbackCierres();
    return cierres
      .filter(c => c.agenteId === agenteId)
      .sort((a, b) => new Date(b.fechaCierre).getTime() - new Date(a.fechaCierre).getTime());
  }

  async updateCierre(id: string, agenteId: string, updateData: Partial<CierreInput>) {
    // Try DB first
    if (this.prisma.isConnected) {
      try {
        const existing = await (this.prisma as any).cierre.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new NotFoundException(`Cierre con ID ${id} no encontrado.`);
        }

        // Validate 24 hours rule
        const elapsedMs = Date.now() - new Date(existing.fechaCierre).getTime();
        if (elapsedMs > 86400000) {
          throw new BadRequestException('El tiempo límite de 24 horas para modificar este cierre ha expirado.');
        }

        const updated = await (this.prisma as any).cierre.update({
          where: { id },
          data: {
            ...updateData,
          },
        });

        return updated;
      } catch (dbError) {
        if (dbError instanceof NotFoundException || dbError instanceof BadRequestException) {
          throw dbError;
        }
        this.logger.warn(`Error al modificar cierre en DB, usando fallback JSON.`);
      }
    }

    // Fallback JSON persistence
    const cierres = await this.loadFallbackCierres();
    const index = cierres.findIndex(c => c.id === id);
    if (index === -1) {
      throw new NotFoundException(`Cierre con ID ${id} no encontrado.`);
    }

    const existing = cierres[index];
    
    // Validate 24 hours rule
    const elapsedMs = Date.now() - new Date(existing.fechaCierre).getTime();
    if (elapsedMs > 86400000) {
      throw new BadRequestException('El tiempo límite de 24 horas para modificar este cierre ha expirado.');
    }

    const updatedRecord: CierreRecord = {
      ...existing,
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    cierres[index] = updatedRecord;
    await this.saveFallbackCierres(cierres);

    return updatedRecord;
  }
}
