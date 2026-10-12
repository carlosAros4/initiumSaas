import { Inject, Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import {
  IDocumentTemplateRepository,
  DOCUMENT_TEMPLATE_REPOSITORY,
} from '../types/interfaces/document-template.repository';
import {
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  DocumentTemplateItem,
  DocumentTemplateResponse,
} from '../types/dto/document-template.dto';
import { SessionContextService } from 'src/core/providers/user-session';

@Injectable()
export class DocumentTemplateService {
  private readonly logger = new Logger(DocumentTemplateService.name);

  constructor(
    @Inject(DOCUMENT_TEMPLATE_REPOSITORY) private readonly repository: IDocumentTemplateRepository,
    private readonly session: SessionContextService,
  ) {}

  /** Decodifica y valida un .xlsx en base64. */
  private decodeXlsx(fileBase64: string): Buffer {
    const base64 = fileBase64.includes(',') ? fileBase64.split(',').pop()! : fileBase64;
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      throw new BadRequestException('fileBase64 no es un base64 válido');
    }
    if (buffer.length === 0) {
      throw new BadRequestException('El archivo Excel está vacío');
    }
    // Firma ZIP (los .xlsx son contenedores ZIP: "PK\x03\x04")
    if (!(buffer[0] === 0x50 && buffer[1] === 0x4b)) {
      throw new BadRequestException('El archivo no parece ser un .xlsx válido');
    }
    return buffer;
  }

  async listTemplates(): Promise<DocumentTemplateItem[]> {
    this.logger.log('[listTemplates] Listando plantillas');
    const tenant = this.session.getTenant();
    return this.repository.listTemplates(tenant);
  }

  async createTemplate(dto: CreateDocumentTemplateDto): Promise<DocumentTemplateResponse> {
    this.logger.log(`[createTemplate] code: ${dto.code}, type: ${dto.type}`);
    const tenant = this.session.getTenant();

    if (!dto.code || dto.code.trim().length < 2) {
      throw new BadRequestException('El código debe tener al menos 2 caracteres');
    }

    const exists = await this.repository.existsByCode(tenant, dto.code.trim());
    if (exists) {
      throw new ConflictException(`Ya existe una plantilla con el código "${dto.code}"`);
    }

    let content: string | null = null;
    let file: Buffer | null = null;

    if (dto.type === 'pdf') {
      if (!dto.content) throw new BadRequestException('content es requerido para type=pdf');
      content = dto.content;
    } else {
      if (!dto.fileBase64) throw new BadRequestException('fileBase64 es requerido para type=excel');
      file = this.decodeXlsx(dto.fileBase64);
    }

    const id = await this.repository.createTemplate(tenant, {
      code: dto.code.trim(),
      description: dto.description?.trim() || null,
      type: dto.type,
      content,
      file,
    });

    return { message: 'Plantilla creada exitosamente', id };
  }

  async updateTemplate(id: number, dto: UpdateDocumentTemplateDto): Promise<DocumentTemplateResponse> {
    this.logger.log(`[updateTemplate] id: ${id}`);
    const tenant = this.session.getTenant();

    const file = dto.fileBase64 ? this.decodeXlsx(dto.fileBase64) : null;

    await this.repository.updateTemplate(tenant, id, {
      description: dto.description !== undefined ? (dto.description?.trim() || null) : null,
      content: dto.content !== undefined ? dto.content : null,
      file,
    });

    return { message: 'Plantilla actualizada exitosamente' };
  }

  async deleteTemplate(id: number): Promise<DocumentTemplateResponse> {
    this.logger.log(`[deleteTemplate] id: ${id}`);
    const tenant = this.session.getTenant();
    await this.repository.deleteTemplate(tenant, id);
    return { message: 'Plantilla eliminada exitosamente' };
  }
}
