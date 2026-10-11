import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IUsersRepository } from '../types/interfaces/users.repository';
import { UserWithProfiles, UserSearchResult } from '../types/dto/users.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRepositoryImpl implements IUsersRepository {
  private readonly logger = new Logger(UsersRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getUsersWithProfiles(tenant: string, branchId: number | null): Promise<UserWithProfiles[]> {
    this.logger.log(`[getUsersWithProfiles] tenant: ${tenant}, branchId: ${branchId}`);

    let query: string;
    let params: any[];

    if (branchId) {
      query = `SELECT 
        tu.id,
        cu.first_name,
        cu.last_name,
        cu.email,
        cu.rut,
        cu.dv,
        uc.blocked,
        COALESCE(STRING_AGG(DISTINCT p.name, ','), '') AS profiles
      FROM "${tenant}".users tu
      INNER JOIN "CONFIG_MAIN".users cu ON cu.rut = tu.rut AND cu.dv = tu.dv
      INNER JOIN "CONFIG_MAIN".user_company uc ON uc.user_id = cu.id
      INNER JOIN "CONFIG_MAIN".company c ON c.id = uc.company_id AND c.tenant_id = $1
      INNER JOIN "${tenant}".user_branch ubr ON ubr.user_id = tu.id AND ubr.branch_id = $2 AND ubr.active = TRUE
      LEFT JOIN "${tenant}".user_profile up ON up.user_id = tu.id AND (up.branch_id IS NULL OR up.branch_id = $2)
      LEFT JOIN "${tenant}".profile p ON p.id = up.type_id
      GROUP BY tu.id, cu.first_name, cu.last_name, cu.email, cu.rut, cu.dv, uc.blocked
      ORDER BY cu.first_name, cu.last_name`;
      params = [tenant, branchId];
    } else {
      query = `SELECT 
        tu.id,
        cu.first_name,
        cu.last_name,
        cu.email,
        cu.rut,
        cu.dv,
        uc.blocked,
        COALESCE(STRING_AGG(DISTINCT p.name, ','), '') AS profiles
      FROM "${tenant}".users tu
      INNER JOIN "CONFIG_MAIN".users cu ON cu.rut = tu.rut AND cu.dv = tu.dv
      INNER JOIN "CONFIG_MAIN".user_company uc ON uc.user_id = cu.id
      INNER JOIN "CONFIG_MAIN".company c ON c.id = uc.company_id AND c.tenant_id = $1
      LEFT JOIN "${tenant}".user_profile up ON up.user_id = tu.id
      LEFT JOIN "${tenant}".profile p ON p.id = up.type_id
      GROUP BY tu.id, cu.first_name, cu.last_name, cu.email, cu.rut, cu.dv, uc.blocked
      ORDER BY cu.first_name, cu.last_name`;
      params = [tenant];
    }

    const result = await this.pool.query(query, params);

    this.logger.log(`[getUsersWithProfiles] Usuarios encontrados: ${result.rowCount}`);

    return result.rows.map((row: any) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name ?? ''}`.trim(),
      email: row.email,
      rut: `${row.rut}-${row.dv}`,
      profiles: row.profiles ? row.profiles.split(',') : [],
      active: !row.blocked,
    }));
  }

  async searchUsersNotInCompany(tenant: string, query: string): Promise<UserSearchResult[]> {
    this.logger.log(`[searchUsersNotInCompany] Buscando "${query}" excluyendo tenant: ${tenant}`);

    const searchPattern = `%${query}%`;

    const result = await this.pool.query<{
      id: number;
      first_name: string;
      last_name: string;
      rut: string;
      dv: string;
      email: string;
    }>(
      `SELECT cu.id, cu.first_name, cu.last_name, cu.rut, cu.dv, cu.email
       FROM "CONFIG_MAIN".users cu
       WHERE cu.id NOT IN (
         SELECT uc.user_id
         FROM "CONFIG_MAIN".user_company uc
         INNER JOIN "CONFIG_MAIN".company c ON c.id = uc.company_id
         WHERE c.tenant_id = $1
       )
       AND (
         cu.first_name ILIKE $2
         OR cu.last_name ILIKE $2
         OR cu.email ILIKE $2
         OR CONCAT(cu.rut, '-', cu.dv) ILIKE $2
         OR cu.rut ILIKE $2
       )
       ORDER BY cu.first_name, cu.last_name
       LIMIT 10`,
      [tenant, searchPattern],
    );

    this.logger.log(`[searchUsersNotInCompany] Resultados: ${result.rowCount}`);

    return result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name ?? '',
      rut: `${row.rut}-${row.dv}`,
      email: row.email,
    }));
  }

  async addUserToCompany(tenant: string, userId: number, branchId: number | null): Promise<void> {
    this.logger.log(`[addUserToCompany] userId: ${userId}, tenant: ${tenant}, branchId: ${branchId}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query<{ rut: string; dv: string }>(
        `SELECT rut, dv FROM "CONFIG_MAIN".users WHERE id = $1`,
        [userId],
      );

      if (userResult.rowCount === 0) {
        throw new Error(`Usuario con id ${userId} no encontrado`);
      }

      const { rut, dv } = userResult.rows[0];

      const existsInTenant = await client.query(
        `SELECT id FROM "${tenant}".users WHERE rut = $1 AND dv = $2 LIMIT 1`,
        [rut, dv],
      );

      let tenantUserId: number;

      if (existsInTenant.rowCount === 0) {
        const insertResult = await client.query<{ id: number }>(
          `INSERT INTO "${tenant}".users (rut, dv) VALUES ($1, $2) RETURNING id`,
          [rut, dv],
        );
        tenantUserId = insertResult.rows[0].id;

        await client.query(
          `INSERT INTO "CONFIG_MAIN".user_company (user_id, company_id, created_at)
           VALUES ($1, (SELECT id FROM "CONFIG_MAIN".company WHERE tenant_id = $2), NOW())
           ON CONFLICT DO NOTHING`,
          [userId, tenant],
        );
      } else {
        tenantUserId = existsInTenant.rows[0].id;
      }

      if (branchId) {
        await client.query(
          `INSERT INTO "${tenant}".user_branch (user_id, branch_id, favorite, active)
           VALUES ($1, $2, FALSE, TRUE)
           ON CONFLICT (user_id, branch_id) DO UPDATE SET active = TRUE`,
          [tenantUserId, branchId],
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[addUserToCompany] Usuario ${userId} agregado exitosamente`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[addUserToCompany] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async findUserByRut(rut: string, dv: string): Promise<UserSearchResult | null> {
    this.logger.log(`[findUserByRut] Buscando usuario con RUT: ${rut}-${dv}`);

    const result = await this.pool.query<{
      id: number;
      first_name: string;
      last_name: string;
      rut: string;
      dv: string;
      email: string;
    }>(
      `SELECT id, first_name, last_name, rut, dv, email
       FROM "CONFIG_MAIN".users
       WHERE rut = $1 AND dv = $2`,
      [rut, dv],
    );

    if (result.rowCount === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name ?? '',
      rut: `${row.rut}-${row.dv}`,
      email: row.email,
    };
  }

  async isUserInCompany(userId: number, tenant: string): Promise<boolean> {
    this.logger.log(`[isUserInCompany] userId: ${userId}, tenant: ${tenant}`);

    const result = await this.pool.query(
      `SELECT 1 FROM "CONFIG_MAIN".user_company
       WHERE user_id = $1 AND company_id = (SELECT id FROM "CONFIG_MAIN".company WHERE tenant_id = $2)
       LIMIT 1`,
      [userId, tenant],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async createUserAndAddToCompany(
    tenant: string,
    firstName: string,
    lastName: string,
    rut: string,
    dv: string,
    email: string,
    gender: string,
    branchId: number | null,
  ): Promise<void> {
    this.logger.log(`[createUserAndAddToCompany] ${firstName} ${lastName} (${rut}-${dv}), tenant: ${tenant}, branchId: ${branchId}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const hashedPassword = await bcrypt.hash(rut, 10);
      const insertResult = await client.query<{ id: number }>(
        `INSERT INTO "CONFIG_MAIN".users (first_name, last_name, rut, dv, email, gender, password, "newusers")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [firstName, lastName, rut, dv, email, gender, hashedPassword, true],
      );

      const newUserId = insertResult.rows[0].id;

      await client.query(
        `INSERT INTO "CONFIG_MAIN".user_company (user_id, company_id, created_at)
         VALUES ($1, (SELECT id FROM "CONFIG_MAIN".company WHERE tenant_id = $2), NOW())`,
        [newUserId, tenant],
      );

      const tenantUserResult = await client.query<{ id: number }>(
        `INSERT INTO "${tenant}".users (rut, dv) VALUES ($1, $2) RETURNING id`,
        [rut, dv],
      );
      const tenantUserId = tenantUserResult.rows[0].id;

      if (branchId) {
        await client.query(
          `INSERT INTO "${tenant}".user_branch (user_id, branch_id, favorite, active)
           VALUES ($1, $2, FALSE, TRUE)`,
          [tenantUserId, branchId],
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[createUserAndAddToCompany] Usuario creado con id ${newUserId} y agregado`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[createUserAndAddToCompany] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
