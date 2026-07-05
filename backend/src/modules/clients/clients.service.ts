import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateClientDto, ClientPriority, ClientStage, ClientCategory } from './dto/create-client.dto';
import * as fs from 'fs';
import * as path from 'path';

// Almacenamiento en JSON local (misma estrategia que deals.json)
const FILE = path.join(process.cwd(), 'clients.json');

export interface ClientRecord {
  id: string;
  agentId: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  category: string;
  interest: string;
  budget: number;
  priority: string;
  stage: string;
  notes: string;
  rating: number;
  createdAt: string;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  private read(): ClientRecord[] {
    if (!fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, '[]', 'utf-8');
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  private write(data: ClientRecord[]): void {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * GET /api/clients?agentId=&category=&priority=&stage=&q=
   */
  findAll(filters: {
    agentId?: string;
    category?: string;
    priority?: string;
    stage?: string;
    q?: string;
  }): ClientRecord[] {
    let records = this.read();

    if (filters.agentId) {
      records = records.filter((r) => r.agentId === filters.agentId);
    }
    if (filters.category && filters.category !== 'ALL') {
      records = records.filter((r) => r.category === filters.category);
    }
    if (filters.priority && filters.priority !== 'ALL') {
      records = records.filter((r) => r.priority === filters.priority);
    }
    if (filters.stage && filters.stage !== 'ALL') {
      records = records.filter((r) => r.stage === filters.stage);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      records = records.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.interest.toLowerCase().includes(q),
      );
    }

    return records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * POST /api/clients
   */
  create(dto: CreateClientDto, agentId: string): ClientRecord {
    if (!dto.name || !dto.email || !dto.phone) {
      throw new BadRequestException('Nombre, email y teléfono son obligatorios.');
    }

    const records = this.read();
    const newRecord: ClientRecord = {
      id: `cli-${Date.now()}`,
      agentId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      source: dto.source || 'RED PROPIO',
      category: dto.category || ClientCategory.PROSPECTO,
      interest: dto.interest || '',
      budget: dto.budget || 0,
      priority: dto.priority || ClientPriority.MEDIA,
      stage: dto.stage || ClientStage.NUEVO,
      notes: dto.notes || '',
      rating: 5,
      createdAt: new Date().toISOString(),
    };

    records.unshift(newRecord);
    this.write(records);
    this.logger.log(`Cliente registrado: ${newRecord.id} (agente ${agentId})`);
    return newRecord;
  }

  /**
   * PATCH /api/clients/:id/stage
   */
  updateStage(id: string, stage: string, agentId: string): ClientRecord {
    const records = this.read();
    const idx = records.findIndex((r) => r.id === id && r.agentId === agentId);
    if (idx === -1) {
      throw new BadRequestException(`Cliente ${id} no encontrado para este agente.`);
    }
    records[idx].stage = stage;
    this.write(records);
    return records[idx];
  }
}
