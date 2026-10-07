import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentTemplateService } from '../service/document-template.service';
import {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  DocumentTemplateItem,
  DocumentTemplateResponse,
} from '../types/dto/document-template.dto';

@ApiTags('settings')
@Controller({ path: 'settings/document-templates' })
export class DocumentTemplateController {
  private readonly logger = new Logger(DocumentTemplateController.name);

  constructor(private readonly service: DocumentTemplateService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar plantillas', description: 'Lista las plantillas (PDF y Excel) del tenant.' })
  @ApiResponse({ status: 200, description: 'Lista de plantillas' })
  async list(): Promise<DocumentTemplateItem[]> {
    this.logger.log('[list] Listar plantillas');
    return this.service.listTemplates();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear plantilla (PDF o Excel)',
    description: 'Crea una plantilla. type=pdf usa `content` (Handlebars); type=excel usa `fileBase64` (.xlsx en base64).',
  })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una plantilla con ese código' })
  async create(@Body() body: CreateDocumentTemplateDto): Promise<DocumentTemplateResponse> {
    this.logger.log(`[create] code: ${body.code}, type: ${body.type}`);
    return this.service.createTemplate(body);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar plantilla', description: 'Actualiza descripción, content (PDF) o fileBase64 (Excel).' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada' })
  async update(@Param('id') id: string, @Body() body: UpdateDocumentTemplateDto): Promise<DocumentTemplateResponse> {
    this.logger.log(`[update] id: ${id}`);
    return this.service.updateTemplate(Number(id), body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar plantilla', description: 'Elimina una plantilla por ID.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID de la plantilla' })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada' })
  async remove(@Param('id') id: string): Promise<DocumentTemplateResponse> {
    this.logger.log(`[remove] id: ${id}`);
    return this.service.deleteTemplate(Number(id));
  }
}
