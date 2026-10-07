import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import {
  IDocumentTemplateRepository,
  CreateTemplateData,
  UpdateTemplateData,
} from '../types/interfaces/document-template.repository';
import { DocumentTemplateItem } from '../types/dto/document-template.dto';

@Injectable()
export class DocumentTemplateRepositoryImpl implements IDocumentTemplateRepository {
  private readonly logger = new Logger(DocumentTemplateRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async listTemplates(tenant: string): Promise<DocumentTemplateItem[]> {
    this.logger.log(`[listTemplates] tenant: ${tenant}`);

    const result = await this.pool.query<DocumentTemplateItem>(
      `SELECT id, code, description, type, created_at, updated_at
       FROM "${tenant}".document_template
       ORDER BY code`,
    );

    return result.rows;
  }

  async existsByCode(tenant: string, code: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM "${tenant}".document_template WHERE code = $1 LIMIT 1`,
      [code],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createTemplate(tenant: string, data: CreateTemplateData): Promise<number> {
    this.logger.log(`[createTemplate] code: ${data.code}, type: ${data.type}, tenant: ${tenant}`);

    const result = await this.pool.query<{ id: number }>(
      `INSERT INTO "${tenant}".document_template (code, description, type, content, file)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.code, data.description, data.type, data.content, data.file],
    );

    this.logger.log(`[createTemplate] Plantilla creada con id ${result.rows[0].id}`);
    return result.rows[0].id;
  }

  async updateTemplate(tenant: string, id: number, data: UpdateTemplateData): Promise<void> {
    this.logger.log(`[updateTemplate] id: ${id}, tenant: ${tenant}`);

    const setClauses: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (data.description !== null) {
      setClauses.push(`description = $${i++}`);
      params.push(data.description);
    }
    if (data.content !== null) {
      setClauses.push(`content = $${i++}`);
      params.push(data.content);
    }
    if (data.file !== null) {
      setClauses.push(`file = $${i++}`);
      params.push(data.file);
    }

    if (setClauses.length === 0) return;

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    await this.pool.query(
      `UPDATE "${tenant}".document_template SET ${setClauses.join(', ')} WHERE id = $${i}`,
      params,
    );

    this.logger.log(`[updateTemplate] Plantilla ${id} actualizada`);
  }

  async deleteTemplate(tenant: string, id: number): Promise<void> {
    this.logger.log(`[deleteTemplate] id: ${id}, tenant: ${tenant}`);
    await this.pool.query(`DELETE FROM "${tenant}".document_template WHERE id = $1`, [id]);
  }
}
