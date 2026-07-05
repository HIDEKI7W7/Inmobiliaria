import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('contracts')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class ContractsController {
  private readonly logger = new Logger(ContractsController.name);

  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  async findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  async create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contractsService.remove(id);
  }

  // ─── [DOCUMENTOS_CONTRATO] ─────────────────────────────────────────────────

  /** GET /contracts/:id/documents → Lista todos los documentos adjuntos al contrato */
  @Get(':id/documents')
  async listDocuments(@Param('id') id: string): Promise<any> {
    return this.contractsService.listDocuments(id);
  }

  /**
   * POST /contracts/:id/documents → Sube uno o múltiples archivos (multipart/form-data)
   * Campo del form: "files" (múltiples)
   */
  @Post(':id/documents')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB por archivo
      fileFilter: (_req, file, cb) => {
        // Permitir PDF, imágenes y documentos de Office
        const allowed = /\.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg|webp)$/i;
        if (allowed.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(new Error(`Tipo de archivo no permitido: ${file.originalname}`), false);
        }
      },
    }),
  )
  async uploadDocuments(
    @Param('id') id: string,
    @UploadedFiles() files: any[],
  ): Promise<any> {
    this.logger.log(`Subiendo ${files?.length ?? 0} documento(s) para contrato ${id}`);
    return this.contractsService.uploadDocuments(id, files ?? []);
  }

  /** DELETE /contracts/:id/documents/:docId → Elimina un documento adjunto específico */
  @Delete(':id/documents/:docId')
  @HttpCode(HttpStatus.OK)
  async deleteDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
  ): Promise<any> {
    return this.contractsService.deleteDocument(id, docId);
  }
}
