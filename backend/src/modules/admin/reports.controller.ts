import { Controller, Get, Param, Query, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// JSON paths for read-only query mapping
const CLIENTS_FILE = path.join(process.cwd(), 'clients.json');
const COLLABS_FILE = path.join(process.cwd(), 'collaborations.json');
const AGENTS_FILE = path.join(process.cwd(), 'agents_ext.json');
const DEVELOPERS_FILE = path.join(process.cwd(), 'developers_ext.json');

@Controller('admin/reports')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':entity')
  async getReport(
    @Param('entity') entity: string,
    @Query('branch_id') branchId: string, // 'TODOS' or region name e.g. 'Cochabamba'
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('download') download: string | undefined, // 'xlsx' | 'pdf'
    @Res() res: Response,
  ) {
    const formattedEntity = entity.toUpperCase();
    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-12-31');
    // Normalize date filters to start/end of day
    if (startDate) start.setHours(0, 0, 0, 0);
    if (endDate) end.setHours(23, 59, 59, 999);

    let data: any[] = [];

    switch (formattedEntity) {
      case 'PROPIEDADES': {
        const queryOptions: any = {
          where: {
            deletedAt: null,
            createdAt: { gte: start, lte: end },
          },
          include: {
            owner: { select: { name: true, email: true } },
            agent: { select: { name: true, email: true } },
          },
        };
        if (branchId !== 'TODOS') {
          queryOptions.where.location = { contains: branchId, mode: 'insensitive' };
        }
        data = await this.prisma.property.findMany(queryOptions);
        break;
      }
      case 'AGENTES': {
        let agents: any[] = [];
        if (fs.existsSync(AGENTS_FILE)) {
          try {
            agents = JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf-8'));
          } catch {
            agents = [];
          }
        }
        // Filter agents
        data = agents.filter(a => {
          const dateJoined = new Date(a.dateJoined);
          const matchesDate = dateJoined >= start && dateJoined <= end;
          const matchesBranch = branchId === 'TODOS' || a.cityOfResidence.toLowerCase() === branchId.toLowerCase();
          return matchesDate && matchesBranch;
        });
        break;
      }
      case 'PROSPECTOS': {
        let clients: any[] = [];
        if (fs.existsSync(CLIENTS_FILE)) {
          try {
            clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf-8'));
          } catch {
            clients = [];
          }
        }
        data = clients.filter(c => {
          const createdAt = new Date(c.createdAt);
          const matchesDate = createdAt >= start && createdAt <= end;
          const matchesCategory = c.category === 'Prospecto';
          // Best effort branch filter: check zone or interest
          const matchesBranch = branchId === 'TODOS' || c.zone.toLowerCase().includes(branchId.toLowerCase()) || c.interest.toLowerCase().includes(branchId.toLowerCase());
          return matchesDate && matchesCategory && matchesBranch;
        });
        break;
      }
      case 'PROPIETARIOS': {
        let clients: any[] = [];
        if (fs.existsSync(CLIENTS_FILE)) {
          try {
            clients = JSON.parse(fs.readFileSync(CLIENTS_FILE, 'utf-8'));
          } catch {
            clients = [];
          }
        }
        data = clients.filter(c => {
          const createdAt = new Date(c.createdAt);
          const matchesDate = createdAt >= start && createdAt <= end;
          const matchesCategory = c.category === 'Propietario';
          const matchesBranch = branchId === 'TODOS' || c.zone.toLowerCase().includes(branchId.toLowerCase());
          return matchesDate && matchesCategory && matchesBranch;
        });
        break;
      }
      case 'CONSTRUCTORAS': {
        // ponytail: read dynamically from developers_ext.json for fresh data
        let devs: any[] = [];
        if (fs.existsSync(DEVELOPERS_FILE)) {
          try {
            devs = JSON.parse(fs.readFileSync(DEVELOPERS_FILE, 'utf-8'));
          } catch {
            devs = [];
          }
        }
        data = devs.filter(d => {
          const matchesBranch = branchId === 'TODOS' || 
            (d.officeZone || '').toLowerCase().includes(branchId.toLowerCase()) || 
            (d.officeAddress || '').toLowerCase().includes(branchId.toLowerCase());
          return matchesBranch;
        }).map(d => ({
          id: d.id,
          name: d.name || d.empresa || '',
          nit: d.nit || '',
          representative: d.representative || d.representante || '',
          contact: d.email || (d.contacto?.email || ''),
          phone: d.phone || (d.contacto?.phone || ''),
          stock: Number(d.stock) || 0,
          commission: d.commissionScheme || d.esquemaComision || '3%',
          location: d.officeZone || '',
          date: d.createdAt || new Date().toISOString()
        }));
        break;
      }
      case 'CONTRATOS': {
        const queryOptions: any = {
          where: {
            createdAt: { gte: start, lte: end },
          },
          include: {
            property: true,
            tenant: { select: { name: true, email: true } },
            owner: { select: { name: true, email: true } },
          },
        };
        if (branchId !== 'TODOS') {
          queryOptions.where.property = {
            location: { contains: branchId, mode: 'insensitive' },
          };
        }
        data = await this.prisma.contract.findMany(queryOptions);
        break;
      }
      case 'INGRESOS': {
        const queryOptions: any = {
          where: {
            paymentDate: { gte: start, lte: end },
          },
          include: {
            contract: { include: { property: true } },
          },
        };
        if (branchId !== 'TODOS') {
          queryOptions.where.contract = {
            property: {
              location: { contains: branchId, mode: 'insensitive' },
            },
          };
        }
        data = await this.prisma.payment.findMany(queryOptions);
        break;
      }
      case 'GASTOS': {
        const queryOptions: any = {
          where: {
            date: { gte: start, lte: end },
          },
          include: {
            property: true,
          },
        };
        if (branchId !== 'TODOS') {
          queryOptions.where.property = {
            location: { contains: branchId, mode: 'insensitive' },
          };
        }
        data = await this.prisma.expense.findMany(queryOptions);
        break;
      }
      case 'PLANES MKT': {
        data = await this.prisma.marketingPlan.findMany({});
        break;
      }
      case 'COLABORACIONES': {
        let collabs: any[] = [];
        if (fs.existsSync(COLLABS_FILE)) {
          try {
            collabs = JSON.parse(fs.readFileSync(COLLABS_FILE, 'utf-8'));
          } catch {
            collabs = [];
          }
        }
        data = collabs.filter(c => {
          const createdAt = new Date(c.createdAt);
          const matchesDate = createdAt >= start && createdAt <= end;
          // Collaboration property check
          const matchesBranch = branchId === 'TODOS' || c.propertyTitle.toLowerCase().includes(branchId.toLowerCase());
          return matchesDate && matchesBranch;
        });
        break;
      }
      default:
        res.status(400).json({ message: 'Entidad de reporte no válida' });
        return;
    }

    if (download) {
      if (download === 'xlsx') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_${formattedEntity.toLowerCase()}_${branchId.toLowerCase()}.csv`);
        
        if (data.length === 0) {
          res.send('Sin datos para los filtros seleccionados');
          return;
        }

        const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
        const csvContent = [
          keys.join(','),
          ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')),
        ].join('\n');
        
        res.send(csvContent);
        return;
      } else if (download === 'pdf') {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
          pdfReportSimulated: true,
          entity: formattedEntity,
          totalRecords: data.length,
          timestamp: new Date().toISOString(),
          simulatedUrl: `https://propioinmuebles.com/downloads/simulated_pdf_${formattedEntity.toLowerCase()}.pdf`,
        }));
        return;
      }
    }

    res.json(data);
  }
}
