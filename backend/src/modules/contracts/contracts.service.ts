import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';

// ─── Almacén en memoria para documentos adjuntos (persistente durante el ciclo de vida del servidor) ───
// En producción, se reemplazaría por S3 / Cloudinary / sistema de archivos compartido.
interface ContractDocument {
  id: string;
  contractId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: Date;
  /** Base64 del buffer para descarga en sesión */
  dataBase64: string;
}

const documentsStore = new Map<string, ContractDocument[]>();

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  private fallbackContracts: any[] = [
    {
      id: 'contract-1',
      propertyId: 'prop-1-muyurina',
      tenantId: 'cli-1',
      ownerId: 'owner-1',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2027-06-01'),
      monthlyAmount: 1500.0,
      status: 'VIGENTE',
      observations: 'Contrato de alquiler residencial estándar.',
      createdAt: new Date(),
      updatedAt: new Date(),
      property: { id: 'prop-1-muyurina', title: 'Casa de Campo en Muyurina', price: 220000.0 },
      tenant: { id: 'cli-1', name: 'María Quispe', email: 'maria@ejemplo.com' },
      owner: { id: 'owner-1', name: 'Propietario Demo', email: 'owner@propio.com' }
    }
  ];

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    this.logger.log('Consultando contratos de la base de datos...');
    try {
      return await this.prisma.contract.findMany({
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Fallo al consultar contratos: ${message}`);
      this.logger.warn('Usando fallback de contratos en memoria.');
      return this.fallbackContracts;
    }
  }

  async findOne(id: string) {
    this.logger.log(`Buscando contrato con ID: ${id}`);
    try {
      const dbContract = await this.prisma.contract.findUnique({
        where: { id },
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      });
      if (!dbContract) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      return dbContract;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error al buscar contrato ${id}: ${message}`);
      this.logger.warn('Intentando recuperar contrato de fallback en memoria.');
      const fallbackContract = this.fallbackContracts.find(c => c.id === id);
      if (!fallbackContract) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      return fallbackContract;
    }
  }

  async create(dto: CreateContractDto) {
    if (!dto.propertyId || !dto.tenantId || !dto.ownerId || !dto.startDate || !dto.endDate || !dto.monthlyAmount) {
      throw new BadRequestException('Todos los campos son obligatorios.');
    }

    this.logger.log('Registrando nuevo contrato de forma persistente...');
    try {
      const dbContract = await this.prisma.contract.create({
        data: {
          propertyId: dto.propertyId,
          tenantId: dto.tenantId,
          ownerId: dto.ownerId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          monthlyAmount: parseFloat(String(dto.monthlyAmount)),
          status: dto.status || 'VIGENTE',
          observations: dto.observations || null,
        },
        include: {
          property: true,
          tenant: { select: { id: true, name: true, email: true } },
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      await this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { status: 'RESERVADO' },
      });

      return {
        message: 'Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente.',
        data: dbContract,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Fallo relacional al crear contrato: ${message}`);
      this.logger.warn('Intentando registrar contrato en fallback en memoria.');
      
      const simulatedContract = {
        id: `contract-mock-${Date.now()}`,
        propertyId: dto.propertyId,
        tenantId: dto.tenantId,
        ownerId: dto.ownerId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        monthlyAmount: parseFloat(String(dto.monthlyAmount)),
        status: dto.status || 'VIGENTE',
        observations: dto.observations || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        property: { id: dto.propertyId, title: 'Inmueble Simulado', price: 150000 },
        tenant: { id: dto.tenantId, name: 'Cliente Simulado', email: 'cliente.simulado@ejemplo.com' },
        owner: { id: dto.ownerId, name: 'Propietario Simulado', email: 'propietario.simulado@ejemplo.com' }
      };

      this.fallbackContracts.push(simulatedContract);

      return {
        message: 'Contrato creado exitosamente. El estado del inmueble se ha actualizado automáticamente (Simulado).',
        data: simulatedContract,
      };
    }
  }

  async remove(id: string) {
    this.logger.warn(`Eliminando contrato con ID: ${id}`);
    try {
      const dbContract = await this.prisma.contract.findUnique({
        where: { id },
      });
      if (!dbContract) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      await this.prisma.contract.delete({ where: { id } });
      // Limpiar documentos asociados al eliminar el contrato
      documentsStore.delete(id);
      return { message: 'Contrato eliminado correctamente de la base de datos.' };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'error desconocido';
      this.logger.error(`Error al eliminar contrato ${id}: ${message}`);
      this.logger.warn('Intentando eliminar contrato de fallback en memoria.');
      const index = this.fallbackContracts.findIndex(c => c.id === id);
      if (index === -1) {
        throw new NotFoundException(`El contrato con ID ${id} no existe.`);
      }
      this.fallbackContracts.splice(index, 1);
      documentsStore.delete(id);
      return { message: 'Contrato eliminado correctamente (Simulado).' };
    }
  }

  // ─── [SERVICIO_DOCUMENTOS_CONTRATO] ────────────────────────────────────────

  /** Devuelve la lista de documentos de un contrato (sin el buffer base64 para economizar ancho de banda) */
  async listDocuments(contractId: string): Promise<Omit<ContractDocument, 'dataBase64'>[]> {
    const docs = documentsStore.get(contractId) ?? [];
    return docs.map(({ dataBase64: _ignored, ...rest }) => rest);
  }

  /** Procesa y almacena los archivos subidos en memoria */
  async uploadDocuments(
    contractId: string,
    files: any[],
  ): Promise<{ message: string; uploaded: Omit<ContractDocument, 'dataBase64'>[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos para subir.');
    }

    const existing = documentsStore.get(contractId) ?? [];

    const newDocs: ContractDocument[] = files.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      contractId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedAt: new Date(),
      dataBase64: file.buffer.toString('base64'),
    }));

    documentsStore.set(contractId, [...existing, ...newDocs]);

    this.logger.log(
      `${newDocs.length} documento(s) almacenados para contrato ${contractId}`,
    );

    const uploaded = newDocs.map(({ dataBase64: _ignored, ...rest }) => rest);
    return {
      message: `${newDocs.length} documento(s) subido(s) exitosamente.`,
      uploaded,
    };
  }

  /** Elimina un documento específico por ID */
  async deleteDocument(
    contractId: string,
    docId: string,
  ): Promise<{ message: string }> {
    const docs = documentsStore.get(contractId) ?? [];
    const index = docs.findIndex((d) => d.id === docId);
    if (index === -1) {
      throw new NotFoundException(`Documento ${docId} no encontrado en contrato ${contractId}.`);
    }
    docs.splice(index, 1);
    documentsStore.set(contractId, docs);
    this.logger.log(`Documento ${docId} eliminado del contrato ${contractId}`);
    return { message: 'Documento eliminado correctamente.' };
  }
}
