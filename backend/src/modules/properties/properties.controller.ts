import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AuthGuard } from '../auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get('count-active')
  async countActive() {
    const total = await this.propertiesService.countActive();
    return { total };
  }

  @Get('owner')
  @UseGuards(AuthGuard)
  async findOwnerProperties(@Req() req: any, @Query() query: any) {
    const ownerId = req.user.id;
    return this.propertiesService.findOwnerProperties(ownerId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  async create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Post('propietario')
  @UseGuards(AuthGuard)
  async createForPropietario(@Body() createPropertyDto: CreatePropertyDto, @Req() req: any) {
    // Vinculación obligatoria del ownerId del usuario logueado
    const ownerId = req.user.id;
    return this.propertiesService.create({
      ...createPropertyDto,
      ownerId,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, updatePropertyDto);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.propertiesService.updateStatus(id, 'APROBADO');
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.propertiesService.remove(id);
  }

  @Post(':id/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadDocument(
    @Param('id') propertyId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new Error('No se cargó ningún archivo o el formato no es válido.');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Formato de archivo no soportado. Debe ser PDF, Word o Imagen (JPG/PNG).');
    }

    const fs = require('fs');
    const path = require('path');
    const dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // ponytail: check and delete old document/file of the same category prefix
    const categoryPrefix = file.originalname.split(' - ')[0];
    if (categoryPrefix) {
      try {
        const existingDocs = await this.propertiesService.getDocuments(propertyId);
        const match = existingDocs.find((d: any) =>
          d.fileName && d.fileName.split(' - ')[0] === categoryPrefix
        );
        if (match) {
          if (match.fileUrl && match.fileUrl.startsWith('/api/properties/documents/')) {
            const oldFilename = match.fileUrl.split('/').pop();
            const oldFilePath = path.join(dir, oldFilename);
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          await this.propertiesService.deleteDocument(match.id).catch(() => {});
        }
      } catch (err) {
        console.warn('[uploadDocument] Error cleaning up old document:', err);
      }
    }

    // ponytail: sanitize filename (remove accents, spaces, special chars) to prevent double-encoding URL bugs in Chrome/Edge
    const cleanOriginalName = file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_');

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${cleanOriginalName}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // ponytail: derive correct category ID (FR, CT, etc.) instead of saving generic mimeType
    const nameUpper = file.originalname.toUpperCase();
    let derivedFileType = file.mimetype;
    if (nameUpper.includes('FOLIO REAL')) derivedFileType = 'FR';
    else if (nameUpper.includes('CERTIFICAD')) derivedFileType = 'CT';
    else if (nameUpper.includes('TESTIMONIO')) derivedFileType = 'TS';
    else if (nameUpper.includes('IMPUESTOS')) derivedFileType = 'IM';
    else if (nameUpper.includes('PLANO DE U')) derivedFileType = 'PU';
    else if (nameUpper.includes('OTROS DOCU')) derivedFileType = 'OD';
    else if (nameUpper.includes('CÉDULA DE') || nameUpper.includes('CEDULA DE')) derivedFileType = 'CI';
    else {
      const parts = file.originalname.split(' - ');
      if (parts.length > 1 && parts[0].length < 30) {
        derivedFileType = parts[0];
      }
    }

    return this.propertiesService.addDocument(propertyId, {
      fileName: file.originalname,
      fileUrl: `/api/properties/documents/${filename}`,
      fileType: derivedFileType,
    });
  }

  @Delete('documents/:docId')
  async deleteDocument(@Param('docId') docId: string) {
    return this.propertiesService.deleteDocument(docId);
  }

  @Get('documents/:filename')
  async getDocument(@Param('filename') filename: string, @Res() res: any) {
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join('./uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado.' });
    }

    // ponytail: strip Helmet headers to bypass CSP/X-Frame-Options frame blocking on localhost:3000
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000 https://propioinmuebles.com https://www.propioinmuebles.com");
    res.removeHeader('X-Frame-Options');

    return res.sendFile(path.resolve(filePath));
  }

  @Get(':id/documents')
  async getDocuments(@Param('id') id: string) {
    return this.propertiesService.getDocuments(id);
  }

  @Patch(':id/documents/:docType')
  async updateDocumentStatus(
    @Param('id') id: string,
    @Param('docType') docType: string,
    @Body() body: { status: string; observations?: string },
  ) {
    return this.propertiesService.updateDocumentStatus(id, docType, body.status, body.observations);
  }

  /**
   * PATCH /api/properties/:id/documents/batch-review
   * [BATCH_REVIEW_DOCUMENTS] — Actualiza el estado de múltiples documentos en un solo request.
   * Body: { items: [{ docId, fileType, status, observations? }] }
   */
  @Patch(':id/documents/batch-review')
  @UseGuards(AuthGuard)
  async batchReviewDocuments(
    @Param('id') propertyId: string,
    @Body() body: { items: Array<{ docId: string; fileType: string; status: string; observations?: string }> },
  ) {
    return this.propertiesService.batchReviewDocuments(propertyId, body.items || []);
  }
}
