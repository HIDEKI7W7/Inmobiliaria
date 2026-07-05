import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ──────────────────────────────────────────────────────────────────────────────
// Storage local (mismo patrón que deals.json / clients.json)
// ──────────────────────────────────────────────────────────────────────────────
const FILE = path.join(process.cwd(), 'collaborations.json');

export type CollabStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';

export interface Collaboration {
  id: string;              // COLAB-001
  propertyId: string;      // #PR-1024 ó UUID
  propertyTitle: string;
  senderAgentId: string;
  senderAgentName: string;
  senderAgentPhone: string;
  receiverAgentId: string;
  receiverAgentName: string;
  receiverAgentPhone: string;
  platformPercentage: number;   // Fijo 50 — NO editable
  agent1Percentage: number;     // % para el agente emisor
  agent2Percentage: number;     // % para el agente receptor (50 - agent1)
  status: CollabStatus;
  createdAt: string;
}

let _counter = 0; // Contador en memoria para IDs secuenciales

@Injectable()
export class CollaborationsService {
  // ── JSON I/O ──────────────────────────────────────────────────────────────
  private read(): Collaboration[] {
    if (!fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, '[]', 'utf-8');
      return [];
    }
    try {
      const data: Collaboration[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
      // Sincronizar contador con los registros existentes
      _counter = Math.max(_counter, data.length);
      return data;
    } catch {
      return [];
    }
  }

  private write(data: Collaboration[]): void {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  private nextId(records: Collaboration[]): string {
    _counter = Math.max(_counter, records.length) + 1;
    return `COLAB-${String(_counter).padStart(3, '0')}`;
  }

  // ── Validación de comisiones ────────────────────────────────────────────────
  private validatePercentages(a1: number, a2: number): void {
    if (Math.abs(a1 + a2 - 50) > 0.001) {
      throw new BadRequestException(
        `La suma de los porcentajes de agentes debe ser exactamente 50% (recibido: ${a1 + a2}%).`,
      );
    }
    if (a1 < 0 || a1 > 50 || a2 < 0 || a2 > 50) {
      throw new BadRequestException('Cada porcentaje debe estar en el rango [0, 50].');
    }
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  create(dto: {
    propertyId: string;
    propertyTitle: string;
    senderAgentId: string;
    senderAgentName: string;
    senderAgentPhone: string;
    receiverAgentId: string;
    receiverAgentName: string;
    receiverAgentPhone: string;
    agent1Percentage: number;
    agent2Percentage: number;
  }): Collaboration {
    this.validatePercentages(dto.agent1Percentage, dto.agent2Percentage);

    const records = this.read();

    // Regla: no duplicados pendientes
    const dup = records.find(
      (r) =>
        r.propertyId === dto.propertyId &&
        r.senderAgentId === dto.senderAgentId &&
        r.receiverAgentId === dto.receiverAgentId &&
        r.status === 'PENDIENTE',
    );
    if (dup) {
      throw new BadRequestException(
        `Ya existe una colaboración PENDIENTE (${dup.id}) para esta propiedad entre estos agentes.`,
      );
    }

    const collab: Collaboration = {
      id: this.nextId(records),
      propertyId: dto.propertyId,
      propertyTitle: dto.propertyTitle,
      senderAgentId: dto.senderAgentId,
      senderAgentName: dto.senderAgentName,
      senderAgentPhone: dto.senderAgentPhone,
      receiverAgentId: dto.receiverAgentId,
      receiverAgentName: dto.receiverAgentName,
      receiverAgentPhone: dto.receiverAgentPhone,
      platformPercentage: 50,
      agent1Percentage: dto.agent1Percentage,
      agent2Percentage: dto.agent2Percentage,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString(),
    };

    records.unshift(collab);
    this.write(records);
    return collab;
  }

  // ── READ (con filtrado por agentId) ────────────────────────────────────────
  findForAgent(agentId: string): { sent: Collaboration[]; received: Collaboration[] } {
    const records = this.read();
    return {
      sent: records.filter((r) => r.senderAgentId === agentId),
      received: records.filter((r) => r.receiverAgentId === agentId),
    };
  }

  // ── UPDATE STATUS ──────────────────────────────────────────────────────────
  updateStatus(id: string, agentId: string, status: 'ACEPTADA' | 'RECHAZADA'): Collaboration {
    const records = this.read();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException(`Colaboración ${id} no encontrada.`);

    const collab = records[idx];
    // Solo el receptor puede responder
    if (collab.receiverAgentId !== agentId) {
      throw new BadRequestException('Solo el agente receptor puede cambiar el estado de esta colaboración.');
    }
    if (collab.status !== 'PENDIENTE') {
      throw new BadRequestException(`La colaboración ya tiene estado "${collab.status}" y no puede modificarse.`);
    }

    records[idx].status = status;
    this.write(records);
    return records[idx];
  }

  // ── SEED (para demo) ───────────────────────────────────────────────────────
  seed(agentId: string): void {
    const records = this.read();
    if (records.some((r) => r.senderAgentId === agentId || r.receiverAgentId === agentId)) return;

    const demo: Collaboration[] = [
      {
        id: 'COLAB-001',
        propertyId: '#PR-1024',
        propertyTitle: 'Penthouse de Lujo en Queru Queru',
        senderAgentId: 'agent-456',
        senderAgentName: 'Carlos Mendoza',
        senderAgentPhone: '+591601111222',
        receiverAgentId: agentId,
        receiverAgentName: 'Tu Agente',
        receiverAgentPhone: '+591700000001',
        platformPercentage: 50,
        agent1Percentage: 25,
        agent2Percentage: 25,
        status: 'PENDIENTE',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'COLAB-002',
        propertyId: '#PR-2031',
        propertyTitle: 'Casa de Campo en Muyurina',
        senderAgentId: agentId,
        senderAgentName: 'Tu Agente',
        senderAgentPhone: '+591700000001',
        receiverAgentId: 'agent-789',
        receiverAgentName: 'Ana Pereira',
        receiverAgentPhone: '+591774455667',
        platformPercentage: 50,
        agent1Percentage: 30,
        agent2Percentage: 20,
        status: 'ACEPTADA',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    const merged = [...demo, ...records];
    _counter = merged.length;
    this.write(merged);
  }
}
