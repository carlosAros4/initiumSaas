import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IBranchesRepository } from '../types/interfaces/branches.repository';
import { BranchItem, BranchUserItem } from '../types/dto/users.dto';

@Injectable()
export class BranchesRepositoryImpl implements IBranchesRepository {
  private readonly logger = new Logger(BranchesRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getBranches(tenant: string): Promise<BranchItem[]> {
    this.logger.log(`[getBranches] Obteniendo sucursales — tenant: ${tenant}`);

    const result = await this.pool.query<{
      id: number;
      name: string;
      address: string | null;
      phone: string | null;
      active: boolean;
      is_main: boolean;
      user_count: string;
    }>(
      `SELECT 
        b.id,
        b.name,
        b.address,
        b.phone,
        b.active,
        b.is_main,
        COUNT(DISTINCT ub.user_id)::text AS user_count
      FROM "${tenant}".branch b
      LEFT JOIN "${tenant}".user_branch ub ON ub.branch_id = b.id AND ub.active = TRUE
      GROUP BY b.id, b.name, b.address, b.phone, b.active, b.is_main
      ORDER BY b.is_main DESC, b.name`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      active: row.active,
      is_main: row.is_main,
      userCount: parseInt(row.user_count, 10),
    }));
  }

  async createBranch(tenant: string, name: string, address: string | null, phone: string | null): Promise<number> {
    this.logger.log(`[createBranch] Creando sucursal "${name}" — tenant: ${tenant}`);

    const result = await this.pool.query<{ id: number }>(
      `INSERT INTO "${tenant}".branch (name, address, phone, active, is_main)
       VALUES ($1, $2, $3, TRUE, FALSE)
       RETURNING id`,
      [name, address, phone],
    );

    this.logger.log(`[createBranch] Sucursal creada con id ${result.rows[0].id}`);
    return result.rows[0].id;
  }

  async updateBranch(tenant: string, branchId: number, name: string | null, address: string | null, phone: string | null, active: boolean | null): Promise<void> {
    this.logger.log(`[updateBranch] branchId: ${branchId}, tenant: ${tenant}`);

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== null) {
      setClauses.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (address !== null) {
      setClauses.push(`address = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }
    if (phone !== null) {
      setClauses.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }
    if (active !== null) {
      setClauses.push(`active = $${paramIndex}`);
      params.push(active);
      paramIndex++;
    }

    if (setClauses.length === 0) return;

    setClauses.push(`updated_at = NOW()`);
    params.push(branchId);

    await this.pool.query(
      `UPDATE "${tenant}".branch SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      params,
    );

    this.logger.log(`[updateBranch] Sucursal ${branchId} actualizada`);
  }

  async getBranchUsers(tenant: string, branchId: number): Promise<BranchUserItem[]> {
    this.logger.log(`[getBranchUsers] branchId: ${branchId}, tenant: ${tenant}`);

    const result = await this.pool.query<{
      user_id: number;
      first_name: string;
      last_name: string;
      email: string;
      rut: string;
      dv: string;
      active: boolean;
      blocked: boolean;
      favorite: boolean;
    }>(
      `SELECT 
        tu.id AS user_id,
        cu.first_name,
        cu.last_name,
        cu.email,
        cu.rut,
        cu.dv,
        ub.active,
        ub.blocked,
        ub.favorite
      FROM "${tenant}".user_branch ub
      INNER JOIN "${tenant}".users tu ON tu.id = ub.user_id
      INNER JOIN "CONFIG_MAIN".users cu ON cu.rut = tu.rut AND cu.dv = tu.dv
      WHERE ub.branch_id = $1
      ORDER BY cu.first_name, cu.last_name`,
      [branchId],
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      name: `${row.first_name} ${row.last_name ?? ''}`.trim(),
      email: row.email,
      rut: `${row.rut}-${row.dv}`,
      active: row.active,
      blocked: row.blocked,
      favorite: row.favorite,
    }));
  }

  async updateBranchUser(tenant: string, branchId: number, userId: number, active: boolean | null, blocked: boolean | null): Promise<void> {
    this.logger.log(`[updateBranchUser] userId: ${userId}, branchId: ${branchId}`);

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (active !== null) {
      setClauses.push(`active = $${paramIndex}`);
      params.push(active);
      paramIndex++;
    }
    if (blocked !== null) {
      setClauses.push(`blocked = $${paramIndex}`);
      params.push(blocked);
      paramIndex++;
    }

    if (setClauses.length === 0) return;

    params.push(userId);
    params.push(branchId);

    await this.pool.query(
      `UPDATE "${tenant}".user_branch 
       SET ${setClauses.join(', ')} 
       WHERE user_id = $${paramIndex} AND branch_id = $${paramIndex + 1}`,
      params,
    );

    this.logger.log(`[updateBranchUser] Usuario ${userId} actualizado en sucursal ${branchId}`);
  }

  async addUserToBranch(tenant: string, branchId: number, userId: number): Promise<void> {
    this.logger.log(`[addUserToBranch] userId: ${userId}, branchId: ${branchId}`);

    await this.pool.query(
      `INSERT INTO "${tenant}".user_branch (user_id, branch_id, favorite, active, blocked)
       VALUES ($1, $2, FALSE, TRUE, FALSE)
       ON CONFLICT (user_id, branch_id) DO UPDATE SET active = TRUE, blocked = FALSE`,
      [userId, branchId],
    );

    this.logger.log(`[addUserToBranch] Usuario ${userId} agregado a sucursal ${branchId}`);
  }

  async setMainBranch(tenant: string, branchId: number): Promise<void> {
    this.logger.log(`[setMainBranch] branchId: ${branchId}, tenant: ${tenant}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`UPDATE "${tenant}".branch SET is_main = FALSE WHERE is_main = TRUE`);
      await client.query(`UPDATE "${tenant}".branch SET is_main = TRUE WHERE id = $1`, [branchId]);

      await client.query('COMMIT');
      this.logger.log(`[setMainBranch] Sucursal ${branchId} es ahora la principal`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[setMainBranch] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async removeUserFromBranch(tenant: string, branchId: number, userId: number): Promise<void> {
    this.logger.log(`[removeUserFromBranch] userId: ${userId}, branchId: ${branchId}`);

    await this.pool.query(
      `DELETE FROM "${tenant}".user_branch WHERE user_id = $1 AND branch_id = $2`,
      [userId, branchId],
    );

    this.logger.log(`[removeUserFromBranch] Usuario ${userId} eliminado de sucursal ${branchId}`);
  }
}
