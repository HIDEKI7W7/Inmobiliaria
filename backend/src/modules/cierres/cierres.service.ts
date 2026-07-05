import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// ─── Commission rates ────────────────────────────────────────────────────────
const COMMISSION_RATE_STANDARD = 0.015; // 1.5%

interface PdfAdjunto {
  name: string;
  url: string; // stored file name / path
}

interface CierreInput {
  propiedadId: string;
  clientId: string;
  ownerId: string;
  tipoTransaccion: string;
  finalAmount: number;
  pdfAdjuntos: PdfAdjunto[];
  pdfEstado?: string;
}

interface CierreRecord {
  id: string;
  propiedadId: string;
  agenteId: string;
  clientId: string;
  ownerId: string;
  tipoTransaccion: string;
  finalAmount: number;
  calculatedCommission: number;
  pdfAdjuntos: PdfAdjunto[];
  pdfEstado?: string | null;
  fechaCierre: string; // ISO String
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CierresService {
  private readonly logger = new Logger(CierresService.name);
  private readonly fallbackFilePath = path.resolve(process.cwd(), 'cierres_fallback.json');

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private calcCommission(finalAmount: number): number {
    return parseFloat((finalAmount * COMMISSION_RATE_STANDARD).toFixed(2));
  }

  private async loadFallbackCierres(): Promise<CierreRecord[]> {
    try {
      const content = await fs.readFile(this.fallbackFilePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async saveFallbackCierres(cierres: CierreRecord[]): Promise<void> {
    try {
      await fs.writeFile(this.fallbackFilePath, JSON.stringify(cierres, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Error al escribir cierres fallback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ─── Get available properties for a given agent ───────────────────────────
  // Own properties (agentId = me) OR collaboration ACEPTADO where I'm the sellingAgent
  async getAvailableProperties(agenteId: string) {
    if (this.prisma.isConnected) {
      try {
        const properties = await this.prisma.property.findMany({
          where: {
            status: { in: ['APROBADO', 'RESERVADO'] },
            OR: [
              { agentId: agenteId },
              {
                collaborations: {
                  some: {
                    sellingAgentId: agenteId,
                    status: 'ACEPTADO',
                  },
                },
              },
            ],
          },
          select: { id: true, title: true, price: true, ownerId: true },
          orderBy: { createdAt: 'desc' },
        });
        return properties;
      } catch (err) {
        this.logger.warn(`getAvailableProperties DB error: ${err instanceof Error ? err.message : err}`);
      }
    }
    return [];
  }

  // ─── Get clients assigned to this agent ──────────────────────────────────
  async getAgentClients(agenteId: string) {
    if (this.prisma.isConnected) {
      try {
        return await (this.prisma as any).client.findMany({
          where: { assignedAgentId: agenteId },
          select: { id: true, name: true, email: true, phone: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        this.logger.warn(`getAgentClients DB error: ${err instanceof Error ? err.message : err}`);
      }
    }
    return [];
  }

  // ─── Create ───────────────────────────────────────────────────────────────
  async createCierre(agenteId: string, input: CierreInput) {
    const { propiedadId, clientId, ownerId, tipoTransaccion, finalAmount, pdfAdjuntos, pdfEstado } = input;
    const calculatedCommission = this.calcCommission(finalAmount);

    if (this.prisma.isConnected) {
      try {
        const newCierre = await (this.prisma as any).cierre.create({
          data: {
            propiedadId,
            agenteId,
            clientId,
            ownerId,
            tipoTransaccion,
            finalAmount,
            calculatedCommission,
            pdfAdjuntos: pdfAdjuntos as any,
            pdfEstado: pdfEstado || null,
          },
        });

        // Mark property as sold/rented
        const nextStatus = tipoTransaccion === 'Alquiler' ? 'RESERVADO' : 'VENDIDO';
        await this.prisma.property.update({
          where: { id: propiedadId },
          data: { status: nextStatus as any },
        });

        this.logger.log(`Cierre creado en DB para propiedad ${propiedadId}`);
        return newCierre;
      } catch (dbError) {
        this.logger.warn(`Error en DB al crear cierre, usando fallback JSON. ${dbError instanceof Error ? dbError.message : dbError}`);
      }
    }

    // Fallback JSON
    const cierres = await this.loadFallbackCierres();
    const newRecord: CierreRecord = {
      id: `cierre-${Date.now()}`,
      propiedadId,
      agenteId,
      clientId,
      ownerId,
      tipoTransaccion,
      finalAmount,
      calculatedCommission,
      pdfAdjuntos,
      pdfEstado: pdfEstado || null,
      fechaCierre: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cierres.push(newRecord);
    await this.saveFallbackCierres(cierres);
    this.logger.log(`Cierre creado en Fallback JSON para propiedad ${propiedadId}`);
    return newRecord;
  }

  // ─── List ─────────────────────────────────────────────────────────────────
  async getCierresByAgent(agenteId: string) {
    if (this.prisma.isConnected) {
      try {
        return await (this.prisma as any).cierre.findMany({
          where: { agenteId },
          include: {
            propiedad: { select: { title: true, price: true } },
            client: { select: { name: true, phone: true } },
          },
          orderBy: { fechaCierre: 'desc' },
        });
      } catch (dbError) {
        this.logger.warn(`Error al leer cierres de DB, usando fallback JSON.`);
      }
    }

    const cierres = await this.loadFallbackCierres();
    return cierres
      .filter((c) => c.agenteId === agenteId)
      .sort((a, b) => new Date(b.fechaCierre).getTime() - new Date(a.fechaCierre).getTime());
  }

  // ─── Update (24-hour window only) ────────────────────────────────────────
  async updateCierre(id: string, agenteId: string, updateData: Partial<CierreInput>) {
    if (this.prisma.isConnected) {
      try {
        const existing = await (this.prisma as any).cierre.findUnique({ where: { id } });

        if (!existing) throw new NotFoundException(`Cierre con ID ${id} no encontrado.`);

        const elapsedMs = Date.now() - new Date(existing.fechaCierre).getTime();
        if (elapsedMs > 86400000) {
          throw new BadRequestException('El tiempo límite de 24 horas para modificar este cierre ha expirado.');
        }

        // Recalculate commission if finalAmount changed
        const dataToUpdate: Record<string, any> = { ...updateData };
        if (updateData.finalAmount !== undefined) {
          dataToUpdate.calculatedCommission = this.calcCommission(updateData.finalAmount);
        }

        return await (this.prisma as any).cierre.update({ where: { id }, data: dataToUpdate });
      } catch (dbError) {
        if (dbError instanceof NotFoundException || dbError instanceof BadRequestException) throw dbError;
        this.logger.warn(`Error al modificar cierre en DB, usando fallback JSON.`);
      }
    }

    // Fallback JSON
    const cierres = await this.loadFallbackCierres();
    const index = cierres.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Cierre con ID ${id} no encontrado.`);

    const existing = cierres[index];
    const elapsedMs = Date.now() - new Date(existing.fechaCierre).getTime();
    if (elapsedMs > 86400000) {
      throw new BadRequestException('El tiempo límite de 24 horas para modificar este cierre ha expirado.');
    }

    const updatedRecord: CierreRecord = {
      ...existing,
      ...updateData,
      calculatedCommission:
        updateData.finalAmount !== undefined
          ? this.calcCommission(updateData.finalAmount)
          : existing.calculatedCommission,
      updatedAt: new Date().toISOString(),
    };

    cierres[index] = updatedRecord;
    await this.saveFallbackCierres(cierres);
    return updatedRecord;
  }
}
