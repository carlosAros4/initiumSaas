import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import {
  IPrescriptionRepository,
  PrescriptionTemplateRow,
} from '../types/interfaces/prescription.repository';

@Injectable()
export class PrescriptionRepositoryImpl implements IPrescriptionRepository {
  private readonly logger = new Logger(PrescriptionRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getTemplate(tenant: string, code: string): Promise<PrescriptionTemplateRow | null> {
    this.logger.log(`[getTemplate] code: ${code} — tenant: ${tenant}`);

    const result = await this.pool.query<PrescriptionTemplateRow>(
      `SELECT id, code, type, content, file
       FROM "${tenant}".document_template
       WHERE code = $1`,
      [code],
    );

    return result.rows[0] ?? null;
  }

  async resetTemplate(tenant: string, code: string): Promise<boolean> {
    this.logger.log(`[resetTemplate] code: ${code} — tenant: ${tenant}`);

    const result = await this.pool.query(
      `DELETE FROM "${tenant}".document_template WHERE code = $1`,
      [code],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
