import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { ISalesCompanyRepository } from '../types/interfaces/sales-company.repository';
import { SalesRequest, SiteConfigResponse, SiteNameItem } from '../types/dto/sales-company.dto';

@Injectable()
export class SalesCompanyImpl implements ISalesCompanyRepository {
  private readonly logger = new Logger(SalesCompanyImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}


   async setData(tenantId: string, data: SalesRequest){
    this.logger.log(`[setData] Guardando configuración del sitio — tenant: ${tenantId}`);

    await this.pool.query(
      `INSERT INTO "CONFIG_MAIN".sales_sites
        (tenant_id, name_site, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, now(), now())
       ON CONFLICT (tenant_id)
       DO UPDATE SET
        name_site   = EXCLUDED.name_site,
        enabled     = EXCLUDED.enabled,
        updated_at  = now();`,
      [tenantId, data.nameSite, data.enabled],
    );
  }

  async getSiteConfig(tenantId: string): Promise<SiteConfigResponse | null> {
    this.logger.log(`[getSiteConfig] Obteniendo configuración del sitio — tenant: ${tenantId}`);

    const result = await this.pool.query<{
      id: number;
      name_site: string;
      enabled: boolean;
    }>(
      `SELECT id, name_site, enabled
       FROM "CONFIG_MAIN".sales_sites
       WHERE tenant_id = $1`,
      [tenantId],
    );

    if (result.rowCount === 0) {
      this.logger.log(`[getSiteConfig] No se encontró configuración para tenant: ${tenantId}`);
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      nameSite: row.name_site,
      enabled: row.enabled,
    };
  }

  async getAllSiteNames(): Promise<SiteNameItem[]> {
    this.logger.log('[getAllSiteNames] Obteniendo todos los name_site habilitados');

    const result = await this.pool.query<{ name_site: string }>(
      `SELECT name_site
       FROM "CONFIG_MAIN".sales_sites
       WHERE enabled = true`,
    );

    return result.rows.map((row) => ({ nameSite: row.name_site }));
  }
}
