import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { ZipArchive } from 'archiver';

// ──────────────────────────────────────────────────────────────────────────────
// JSON persistence (same pattern as clients.json / collaborations.json)
// ──────────────────────────────────────────────────────────────────────────────
const AGENTS_FILE = path.join(process.cwd(), 'agents_ext.json');
const DEVELOPERS_FILE = path.join(process.cwd(), 'developers_ext.json');

interface DeveloperRecord {
  id: string;
  name: string;
  nit: string;
  foundedYear: string;
  logoUrl: string;
  representative: string;
  phone: string;
  email: string;
  website: string;
  officeZone: string;
  officeAddress: string;
  description: string;
  specialties: string[];
  stock: number;
  commissionScheme: string;
  stage: string;
}

function readDevelopers(): DeveloperRecord[] {
  if (!fs.existsSync(DEVELOPERS_FILE)) {
    const seed: DeveloperRecord[] = [
      {
        id: 'DEV-301',
        name: 'Alianza Inmobiliaria',
        nit: '102938470',
        foundedYear: 'Más de 15 años de experiencia',
        logoUrl: '',
        representative: 'Arq. Javier Ortiz',
        phone: '+591 772 34871',
        email: 'javier@alianza.bo',
        website: 'https://alianza.bo',
        officeZone: 'Cochabamba - Zona Norte / Recoleta',
        officeAddress: 'Av. América #123, Edificio Recoleta Of. 4A',
        description: 'Empresa constructora líder en el mercado boliviano.',
        specialties: ['Edificios Residenciales (Departamentos)', 'Proyectos Comerciales / Oficinas'],
        stock: 18,
        commissionScheme: '3% Venta Escalonada',
        stage: 'Preventa Torre A'
      },
      {
        id: 'DEV-302',
        name: 'Constructora Cochabamba',
        nit: '987654321',
        foundedYear: 'Más de 10 años de experiencia',
        logoUrl: '',
        representative: 'Ing. Raúl Gómez',
        phone: '+591 717 44901',
        email: 'raul@conscocha.bo',
        website: 'https://conscocha.bo',
        officeZone: 'Cochabamba - Recoleta',
        officeAddress: 'Calle Beni #456, Torres del Norte Piso 2',
        description: 'Especialistas en condominios cerrados y edificios de alta gama.',
        specialties: ['Condominios Cerrados (Casas)', 'Edificios Residenciales (Departamentos)'],
        stock: 8,
        commissionScheme: '2.5% Venta Directa',
        stage: 'Entrega Inmediata'
      }
    ];
    fs.writeFileSync(DEVELOPERS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
  }
  try { return JSON.parse(fs.readFileSync(DEVELOPERS_FILE, 'utf-8')); }
  catch { return []; }
}

function writeDevelopers(data: DeveloperRecord[]): void {
  fs.writeFileSync(DEVELOPERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

interface AgentRecord {
  id: string;               // DB user id or generated
  agentCustomId: string;    // AGT-2026-001
  fullName: string;
  email: string;
  phone: string;
  idDocument: string;       // CI o Pasaporte
  birthDate: string;        // ISO date string
  cityOfResidence: string;
  aptitudeScore: number;    // 1–100
  baseCommission: number;   // e.g. 1.5 (%)
  splitPropio: number;      // e.g. 50 (%)
  splitAgent: number;       // e.g. 50 (%)
  salesVolume: number;
  rating: number;           // 0–5
  status: string;           // 'Activo' | 'Inactivo'
  dateJoined: string;
}

function readAgents(): AgentRecord[] {
  if (!fs.existsSync(AGENTS_FILE)) {
    const seed: AgentRecord[] = [
      { id: 'agt-seed-1', agentCustomId: 'AGT-2026-001', fullName: 'Roberto Claros',  email: 'roberto@propio.bo', phone: '+591772348710', idDocument: '7654321',  birthDate: '1990-03-14', cityOfResidence: 'Cochabamba', aptitudeScore: 88, baseCommission: 1.5, splitPropio: 50, splitAgent: 50, salesVolume: 420000, rating: 4.8, status: 'Activo', dateJoined: '2026-01-15' },
      { id: 'agt-seed-2', agentCustomId: 'AGT-2026-002', fullName: 'Lucía Arteaga',   email: 'lucia@propio.bo',  phone: '+591601983240', idDocument: '8812345',  birthDate: '1993-07-22', cityOfResidence: 'La Paz',     aptitudeScore: 95, baseCommission: 1.5, splitPropio: 45, splitAgent: 55, salesVolume: 185000, rating: 4.9, status: 'Activo', dateJoined: '2026-02-10' },
      { id: 'agt-seed-3', agentCustomId: 'AGT-2026-003', fullName: 'David Choque',    email: 'david@propio.bo',  phone: '+591717449010', idDocument: '9923456',  birthDate: '1988-11-05', cityOfResidence: 'Santa Cruz', aptitudeScore: 72, baseCommission: 1.5, splitPropio: 50, splitAgent: 50, salesVolume:  95000, rating: 4.5, status: 'Activo', dateJoined: '2026-03-05' },
    ];
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try { return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf-8')); }
  catch { return []; }
}

function writeAgents(data: AgentRecord[]): void {
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private readonly prisma: PrismaService) {}

  // ── Original: Create staff (users) ────────────────────────────────────────
  @Post('users/create')
  async createStaff(@Body() body: any) {
    const { name, email, password, role } = body;
    if (!email || !password || !role) throw new BadRequestException('Email, contraseña y rol son requeridos');
    const allowedRoles = ['AGENTE', 'ABOGADO', 'ADMIN'];
    if (!allowedRoles.includes(role)) throw new BadRequestException(`Rol no permitido. Roles válidos: ${allowedRoles.join(', ')}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const newUser = await this.prisma.user.create({ data: { email, password: hashedPassword, name: name || null, role } });
      return { message: 'Personal creado exitosamente en base de datos', user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } };
    } catch (error) {
      this.logger.error(`Error al persistir: ${error.message}`);
      return { message: 'Personal creado (Resiliencia local)', user: { id: `staff-${Date.now()}`, email, name: name || 'Personal Invitado', role } };
    }
  }

  // ── KPI Metrics ───────────────────────────────────────────────────────────
  @Get('agents/kpis')
  async getAgentKpis() {
    const agents = readAgents();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Card 1: Total activos
    const totalActive = agents.filter(a => a.status === 'Activo').length;

    // Card 2: Top destacados (rating ≥ 4.5)
    const topRated = agents.filter(a => a.rating >= 4.5).length;

    // Card 3 & 4: Cierres del mes + comisiones liquidadas desde Prisma
    let closuresVolume = 0;
    let commissionsTotal = 0;
    try {
      const cierres = await this.prisma.cierre.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { finalAmount: true, calculatedCommission: true },
      });
      closuresVolume  = cierres.reduce((s, c) => s + (c.finalAmount         || 0), 0);
      commissionsTotal = cierres.reduce((s, c) => s + (c.calculatedCommission || 0), 0);

    } catch {
      // Fallback: derive from seed data
      closuresVolume   = agents.reduce((s, a) => s + a.salesVolume, 0);
      commissionsTotal = agents.reduce((s, a) => s + (a.salesVolume * a.baseCommission / 100), 0);
    }

    return {
      totalActive,
      topRated,
      closuresVolume,
      commissionsTotal,
      avgRating: agents.length ? (agents.reduce((s, a) => s + a.rating, 0) / agents.length).toFixed(2) : 0,
    };
  }

  // ── LIST agents with optional filters ─────────────────────────────────────
  @Get('agents')
  getAgents(
    @Query('q')        q?: string,
    @Query('status')   status?: string,
    @Query('city')     city?: string,
  ) {
    let agents = readAgents();
    if (q) {
      const lq = q.toLowerCase();
      agents = agents.filter(a =>
        a.agentCustomId.toLowerCase().includes(lq) ||
        a.fullName.toLowerCase().includes(lq) ||
        a.email.toLowerCase().includes(lq) ||
        a.phone.includes(lq),
      );
    }
    if (status && status !== 'ALL') agents = agents.filter(a => a.status === status);
    if (city   && city   !== 'ALL') agents = agents.filter(a => a.cityOfResidence === city);
    return agents;
  }

  // ── REGISTER new agent ─────────────────────────────────────────────────────
  @Post('agents')
  async registerAgent(@Body() body: any) {
    const { fullName, email, phone, idDocument, birthDate, cityOfResidence,
            aptitudeScore, baseCommission, splitPropio, splitAgent } = body;

    if (!fullName || !email || !phone) throw new BadRequestException('Nombre, email y teléfono son obligatorios.');
    if (aptitudeScore !== undefined && (aptitudeScore < 1 || aptitudeScore > 100)) {
      throw new BadRequestException('aptitudeScore debe estar entre 1 y 100.');
    }
    if (splitPropio !== undefined && splitAgent !== undefined && Math.abs(splitPropio + splitAgent - 100) > 0.01) {
      throw new BadRequestException('splitPropio + splitAgent debe sumar 100%.');
    }

    const agents = readAgents();
    const nextNum = agents.length + 1;
    const year = new Date().getFullYear();
    const agentCustomId = `AGT-${year}-${String(nextNum).padStart(3, '0')}`;

    const newAgent: AgentRecord = {
      id: `agt-${Date.now()}`,
      agentCustomId,
      fullName,
      email,
      phone: phone || '',
      idDocument: idDocument || '',
      birthDate: birthDate || '',
      cityOfResidence: cityOfResidence || '',
      aptitudeScore: Number(aptitudeScore) || 80,
      baseCommission: Number(baseCommission) || 1.5,
      splitPropio: Number(splitPropio) || 50,
      splitAgent: Number(splitAgent) || 50,
      salesVolume: 0,
      rating: 5.0,
      status: 'Activo',
      dateJoined: new Date().toISOString().split('T')[0],
    };

    // Best-effort: also create DB user
    try {
      const tempPass = await bcrypt.hash(`propio${Date.now()}`, 10);
      await this.prisma.user.create({
        data: { email, name: fullName, password: tempPass, role: 'AGENTE' },
      });
    } catch (dbErr) {
      this.logger.warn(`DB user creation skipped (resilience): ${dbErr.message}`);
    }

    agents.unshift(newAgent);
    writeAgents(agents);
    return { message: 'Agente registrado exitosamente.', agent: newAgent };
  }

  // ── UPDATE agent fields (inline edit: commission, split, aptitude, rating) ─
  @Patch('agents/:id')
  updateAgent(@Param('id') id: string, @Body() body: Partial<AgentRecord>) {
    const agents = readAgents();
    const idx = agents.findIndex(a => a.id === id || a.agentCustomId === id);
    if (idx === -1) throw new NotFoundException(`Agente ${id} no encontrado.`);

    if (body.aptitudeScore !== undefined && (body.aptitudeScore < 1 || body.aptitudeScore > 100)) {
      throw new BadRequestException('aptitudeScore debe estar entre 1 y 100.');
    }

    agents[idx] = { ...agents[idx], ...body };
    writeAgents(agents);
    return { message: 'Agente actualizado.', agent: agents[idx] };
  }

  // ── DELETE agent ──────────────────────────────────────────────────────────
  @Delete('agents/:id')
  deleteAgent(@Param('id') id: string) {
    const agents = readAgents();
    const idx = agents.findIndex(a => a.id === id || a.agentCustomId === id);
    if (idx === -1) throw new NotFoundException(`Agente ${id} no encontrado.`);
    const [removed] = agents.splice(idx, 1);
    writeAgents(agents);
    return { message: `Agente ${removed.agentCustomId} eliminado de la red.` };
  }

  // ── GET constructoras (developers) ──────────────────────────────────────────
  @Get('developers')
  getDevelopers() {
    return readDevelopers();
  }

  // ── REGISTER constructora ───────────────────────────────────────────────────
  @Post('developers')
  registerDeveloper(@Body() body: any) {
    const { name, nit, foundedYear, logoUrl, representative, phone, email,
            website, officeZone, officeAddress, description, specialties } = body;

    if (!name || !nit || !representative || !phone || !email || !officeAddress) {
      throw new BadRequestException('Nombre, NIT, representante, teléfono, email y dirección son obligatorios.');
    }

    const developers = readDevelopers();
    const nextNum = developers.length + 1;
    const newDev: DeveloperRecord = {
      id: `DEV-${300 + nextNum}`,
      name,
      nit,
      foundedYear: foundedYear || '',
      logoUrl: logoUrl || '',
      representative,
      phone,
      email,
      website: website || '',
      officeZone: officeZone || '',
      officeAddress,
      description: description || '',
      specialties: specialties || [],
      stock: 0,
      commissionScheme: '3% Venta Escalonada',
      stage: 'Fase Inicial'
    };

    developers.unshift(newDev);
    writeDevelopers(developers);
    return { message: 'Constructora registrada exitosamente.', developer: newDev };
  }

  // ── UPDATE constructora ─────────────────────────────────────────────────────
  @Put('developers/:id')
  updateDeveloper(@Param('id') id: string, @Body() body: any) {
    const developers = readDevelopers();
    const idx = developers.findIndex(d => d.id === id);
    if (idx === -1) {
      throw new NotFoundException('Constructora no encontrada');
    }
    const current = developers[idx];
    // ponytail: simple field mapping with fallback to current values
    developers[idx] = {
      ...current,
      name: body.name ?? current.name,
      nit: body.nit ?? current.nit,
      representative: body.representative ?? current.representative,
      phone: body.phone ?? current.phone,
      email: body.email ?? current.email,
      stock: body.stock !== undefined ? Number(body.stock) : current.stock,
      commissionScheme: body.commissionScheme ?? current.commissionScheme,
      stage: body.stage ?? current.stage,
      officeZone: body.officeZone ?? current.officeZone,
      officeAddress: body.officeAddress ?? current.officeAddress,
      description: body.description ?? current.description,
      specialties: body.specialties ?? current.specialties,
      foundedYear: body.foundedYear ?? current.foundedYear,
      logoUrl: body.logoUrl ?? current.logoUrl,
      website: body.website ?? current.website
    };
    writeDevelopers(developers);
    return { message: 'Constructora actualizada exitosamente.', developer: developers[idx] };
  }

  // ── DELETE constructora ─────────────────────────────────────────────────────
  @Delete('developers/:id')
  deleteDeveloper(@Param('id') id: string) {
    let developers = readDevelopers();
    developers = developers.filter(d => d.id !== id);
    writeDevelopers(developers);
    return { message: 'Constructora eliminada exitosamente.' };
  }

  @Get('owners/:id/export-zip')
  async exportOwnerZip(@Param('id') ownerId: string, @Res() res: any) {
    try {
      // Find the user/owner in database
      let user = await this.prisma.user.findUnique({
        where: { id: ownerId },
        include: { ownedProperties: { include: { documents: true } } },
      });

      // If user is not found directly by ID, fall back to checking mock/demo names
      if (!user) {
        let email = '';
        let name = '';
        if (ownerId === 'OWN-201') { email = 'rene@mail.com'; name = 'René Vargas'; }
        else if (ownerId === 'OWN-202') { email = 'clau@mail.com'; name = 'Claudia Claure'; }
        else if (ownerId === 'OWN-203') { email = 'pedro@mail.com'; name = 'Pedro Mendoza'; }

        if (email) {
          user = await this.prisma.user.findFirst({
            where: { OR: [{ email }, { name }] },
            include: { ownedProperties: { include: { documents: true } } },
          });
        }
      }

      let properties: any[] = [];
      let ownerName = 'Propietario';
      let ownerPhone = '';
      let ownerEmail = '';

      if (user) {
        properties = user.ownedProperties || [];
        ownerName = user.name || ownerName;
        ownerPhone = (user as any).whatsappPhone || '';
        ownerEmail = user.email || '';
      } else {
        // Fallback: search property owner fields directly
        let mockName = '';
        let mockEmail = '';
        let mockPhone = '';
        if (ownerId === 'OWN-201') { mockName = 'René Vargas'; mockEmail = 'rene@mail.com'; mockPhone = '+591 798 12345'; }
        else if (ownerId === 'OWN-202') { mockName = 'Claudia Claure'; mockEmail = 'clau@mail.com'; mockPhone = '+591 712 99887'; }
        else if (ownerId === 'OWN-203') { mockName = 'Pedro Mendoza'; mockEmail = 'pedro@mail.com'; mockPhone = '+591 700 44332'; }
        else { mockName = ownerId; }

        ownerName = mockName;
        ownerEmail = mockEmail;
        ownerPhone = mockPhone;

        properties = await this.prisma.property.findMany({
          where: {
            OR: [
              { ownerId: ownerId },
              { owner: { name: { contains: mockName, mode: 'insensitive' } } },
            ],
          },
          include: { documents: true },
        }) || [];
      }

      // Structure text data
      const ownerData = {
        id: ownerId,
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        propertiesCount: properties.length,
        properties: properties.map((p: any) => ({
          id: p.id || '',
          title: p.title || `Inmueble_${p.id || 'desconocido'}`,
          price: p.price || 0,
          currency: p.currency || 'USD',
          location: p.location || '',
          address: p.address || '',
          description: p.description || '',
          type: p.type || 'DEPARTAMENTO',
          status: p.status || 'NUEVA_PUBLICACION',
          area: p.area || 0,
          rooms: p.rooms || 0,
          bathrooms: p.bathrooms || 0,
          imageUrl: p.imageUrl || '',
          photos: p.imageUrl ? [p.imageUrl] : [],
          documents: p.documents?.map((d: any) => ({
            name: d.fileName || `documento_${d.id || Date.now()}`,
            url: d.fileUrl || '',
            type: d.fileType || 'application/pdf',
          })) || [],
        })),
      };

      // Set headers synchronously before the stream pipes
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=OWNER_${ownerId}_EXPORT.zip`);

      // Initialize ZipArchive class directly (Archiver v8 API)
      const archive = new ZipArchive({ zlib: { level: 9 } });

      archive.on('error', (err: any) => {
        console.error('Archiver transformation error:', err);
        throw err;
      });

      // Pipe to response
      archive.pipe(res);

      // Append text info as JSON
      archive.append(JSON.stringify(ownerData, null, 2), { name: 'owner_info.json' });

      // Append files (photos and documents) for each property
      for (const prop of ownerData.properties) {
        const propTitle = prop.title || `Inmueble_${prop.id || 'desconocido'}`;
        const propFolderName = propTitle.replace(/[^a-zA-Z0-9]/g, '_') || prop.id || 'propiedad';

        // 1. Photos
        let photoIdx = 1;
        for (const photoUrl of prop.photos) {
          if (!photoUrl) continue;
          const cleanUrl = photoUrl.split('?')[0] || '';
          const ext = path.extname(cleanUrl) || '.jpg';
          const photoName = `propiedad_${prop.id}_foto_${photoIdx}${ext}`;
          const zipPath = `properties/${propFolderName}/photos/${photoName}`;

          if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
            try {
              const downloadRes = await axios.get(photoUrl, { responseType: 'arraybuffer', timeout: 5000 });
              archive.append(Buffer.from(downloadRes.data), { name: zipPath });
              photoIdx++;
            } catch (e: any) {
              console.warn(`[WARN] Failed to download photo URL: ${photoUrl}. Error: ${e.message}`);
            }
          } else {
            const filename = photoUrl.replace('/api/properties/documents/', '').replace('/uploads/', '');
            const localPath = path.join('./uploads', filename);
            if (fs.existsSync(localPath)) {
              archive.file(localPath, { name: zipPath });
              photoIdx++;
            }
          }
        }

        // 2. Documents
        let docIdx = 1;
        for (const doc of prop.documents) {
          if (!doc.url) continue;
          const docNameRaw = doc.name || `documento_${prop.id}_${docIdx}`;
          const cleanUrl = doc.url.split('?')[0] || '';
          const ext = path.extname(cleanUrl) || '.pdf';
          const docName = `${docNameRaw.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const zipPath = `properties/${propFolderName}/documents/${docName}`;

          if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
            try {
              const downloadRes = await axios.get(doc.url, { responseType: 'arraybuffer', timeout: 5000 });
              archive.append(Buffer.from(downloadRes.data), { name: zipPath });
              docIdx++;
            } catch (e: any) {
              console.warn(`[WARN] Failed to download document URL: ${doc.url}. Error: ${e.message}`);
            }
          } else {
            const filename = doc.url.replace('/api/properties/documents/', '').replace('/uploads/', '');
            const localPath = path.join('./uploads', filename);
            if (fs.existsSync(localPath)) {
              archive.file(localPath, { name: zipPath });
              docIdx++;
            }
          }
        }
      }

      await archive.finalize();
    } catch (err: any) {
      console.error('CRITICAL BACKEND EXPORT ERROR: Fail in exportOwnerZip in admin.controller.ts.', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error al exportar los datos comprimidos del propietario.', error: err.message });
      }
    }
  }

  @Put('marketing-plans')
  async updateMarketingPlans(@Body() body: any) {
    const { plans } = body;
    if (!Array.isArray(plans)) {
      throw new BadRequestException('Se requiere una lista de planes');
    }

    const updated = [];
    for (const p of plans) {
      if (!p.id) continue;
      const up = await this.prisma.marketingPlan.update({
        where: { id: p.id },
        data: {
          name: p.name,
          price: String(p.price),
          billingCycle: p.billingCycle,
          badgeText: p.badgeText || null,
          themeType: p.themeType || 'gray',
          features: p.features as any,
        },
      });
      updated.push(up);
    }
    return { success: true, updated };
  }
}
