import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { USER_SESSION, UserSession } from '../../../core/providers/user-session';
import {
  IPrescriptionRepository,
  PrescriptionInitRow,
  PrescriptionTemplateRow,
} from '../types/interfaces/prescription.repository';
import {
  DEFAULT_PRESCRIPTION_CONTENT,
  DEFAULT_PRESCRIPTION_PAPERFORMAT,
} from '../utils/prescription-default-template';
import { paperFormart } from '../../../core/utils/document/index/sectionPDF';

@Injectable()
export class PrescriptionRepositoryImpl implements IPrescriptionRepository {
  private readonly logger = new Logger(PrescriptionRepositoryImpl.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  /** Resuelve el tenant desde la sesión del usuario. */
  private getTenant(): string {
    if (!this.userSession || !this.userSession.tenant_id) {
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    return this.userSession.tenant_id;
  }

  async downloadTemplate(code: string): Promise<PrescriptionTemplateRow | null> {
    const tenant = this.getTenant();
    this.logger.log(`[downloadTemplate] code: ${code} — tenant: ${tenant}`);

    const result = await this.pool.query<PrescriptionTemplateRow>(
      `SELECT content
       FROM "${tenant}".document_template
       WHERE code = $1`,
      [code],
    );

    return result.rows[0] ?? null;
  }

  async getInit(code: string): Promise<PrescriptionInitRow | null> {
    const tenant = this.getTenant();
    this.logger.log(`[getInit] code: ${code} — tenant: ${tenant}`);

    const result = await this.pool.query<PrescriptionInitRow>(
      `SELECT paperformat
       FROM "${tenant}".document_template
       WHERE code = $1`,
      [code],
    );

    return result.rows[0] ?? null;
  }

  /**
   * Actualiza el contenido y/o formato de papel de la plantilla.
   * Solo actualiza los campos recibidos (UPDATE dinámico).
   */
  async uploadTemplate(
    code: string,
    content?: string,
    paperformat?: paperFormart,
  ): Promise<boolean> {
    const tenant = this.getTenant();
    this.logger.log(`[uploadTemplate] code: ${code} — tenant: ${tenant}`);

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (content !== undefined) {
      sets.push(`content = $${idx++}`);
      values.push(content);
    }
    if (paperformat !== undefined) {
      sets.push(`paperformat = $${idx++}`);
      values.push(paperformat);
    }

    // Nada que actualizar.
    if (sets.length === 0) return false;

    sets.push(`updated_at = now()`);
    values.push(code);

    const result = await this.pool.query(
      `UPDATE "${tenant}".document_template
       SET ${sets.join(', ')}
       WHERE code = $${idx}`,
      values,
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Resetea la plantilla de receta: actualiza el `content` y `paperformat` de la
   * fila existente a los valores por defecto. Devuelve true si actualizó algo.
   */
  async resetTemplate(code: string): Promise<boolean> {
    const tenant = this.getTenant();
    this.logger.log(`[resetTemplate] code: ${code} — tenant: ${tenant}`);

    const result = await this.pool.query(
      `UPDATE "${tenant}".document_template
       SET content = $1, paperformat = $2, updated_at = now()
       WHERE code = $3`,
      [DEFAULT_PRESCRIPTION_CONTENT, DEFAULT_PRESCRIPTION_PAPERFORMAT, code],
    );

    return (result.rowCount ?? 0) > 0;
  }
}
