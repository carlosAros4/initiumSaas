import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IPrescriptionRepository } from '../types/interfaces/prescription.repository';

@Injectable()
export class PrescriptionRepositoryImpl implements IPrescriptionRepository {
  private readonly logger = new Logger(PrescriptionRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async createPrescription(tenant: string, items: [string, string][]): Promise<void> {
    this.logger.log(`[createPrescription] Insertando ${items.length} items — tenant: ${tenant}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const [key, value] of items) {
        await client.query(
          `INSERT INTO "${tenant}".prescription (key, value)
           VALUES ($1, $2)`,
          [key, value],
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[createPrescription] ${items.length} items insertados`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[createPrescription] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
