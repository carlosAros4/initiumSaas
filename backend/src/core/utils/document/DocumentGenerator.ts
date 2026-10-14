import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import { SessionContextService } from '../../providers/user-session';
import { generatePDF, paperFormart } from './index/sectionPDF';
import { generateExcel } from './index/sectionExcel';

export type TypeDocument = 'PDF' | 'EXCEL';


export interface DocumentTemplate {
  id: number;
  code: string;
  description: string | null;
  type: TypeDocument;
  content: string | null;
  paperformat:paperFormart
  file: Buffer | null;
  created_at: Date;
  updated_at: Date;
}

export interface RequestDocument {
  code: string;
  type: TypeDocument;
  data: Record<string, unknown>;
}

export interface Document{
  
  plantilla: string | Buffer;
  format?: paperFormart;

}

@Injectable()
export class DocumentGenerator {
  private readonly logger = new Logger(DocumentGenerator.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly session: SessionContextService,
  ) { }

  async createDocument(input: RequestDocument,preview?:boolean): Promise<Buffer> {
    const { code, data, type } = input;
    if (!code || !data) throw new BadRequestException('parametros de entrada sin ');

    try {
     const  template = await this.getTemplate(code, type);
      this.logger.log(`[generatePDF] Generando PDF — code: ${code}`);
    if (type === 'EXCEL') {
      return await generateExcel(data, template.plantilla);
    } else {
      return await generatePDF(data, template.plantilla, template.format, preview);
    }
    } catch (error) {
      this.logger.error(`[generatePDF] documento template no encontrado para [${code}]`);
      throw error;
    }
    
  }

  /**
   * Obtiene una plantilla
   */
  private async getTemplate(code: string, type: TypeDocument): Promise<Document> {
    const tenant = this.session.getTenant();
    this.logger.log(`[getTemplate] Obteniendo plantilla "${code}" — tenant: ${tenant}`);

    const result = await this.pool.query<DocumentTemplate>(
      `SELECT type, content, file, paperformat
       FROM "${tenant}".document_template
       WHERE code = $1`,
      [code],
    );
    if (result.rows.length === 0) {
      this.logger.warn(`[getTemplate] Plantilla "${code}" no encontrada — tenant: ${tenant}`);
      throw new NotFoundException(`No existe la plantilla con código "${code}"`);
    }
    if ((type === 'PDF' && result.rows[0].content === null) || (type === 'EXCEL' && result.rows[0].file === null)) {
      throw new NotFoundException(`No existe la plantilla con código "${code}" para el tipo ${type}`);
    }
    return result.rows[0] && type === 'PDF' ? 
      { 
        plantilla:result.rows[0].content
        ,format:result.rows[0].paperformat
      } : 
      {
        plantilla:result.rows[0].file
      }
  }
}