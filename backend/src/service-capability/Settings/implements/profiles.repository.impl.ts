import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IProfilesRepository } from '../types/interfaces/profiles.repository';
import { AccessScope, PageAccessRow, AccessActionRow, ProfileWithAccess, UserProfileInfo } from '../types/dto/users.dto';

@Injectable()
export class ProfilesRepositoryImpl implements IProfilesRepository {
  private readonly logger = new Logger(ProfilesRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  // Páginas activas que poseen un access_rule. Son la fuente de los nodos de
  // acceso: su posición en el árbol se deriva de la jerarquía de páginas
  // (page.parent_id), y su scope del scope_type de la página.
  async getPageAccessRows(tenant: string): Promise<PageAccessRow[]> {
    this.logger.log(`[getPageAccessRows] Obteniendo páginas con access_rule — tenant: ${tenant}`);

    const result = await this.pool.query<{
      page_id: number;
      parent_page_id: number | null;
      order: number;
      scope_type: AccessScope;
      access_rule_id: number;
      access_key: string;
      access_description: string;
    }>(
      `SELECT
        p.id            AS page_id,
        p.parent_id     AS parent_page_id,
        p."order"       AS order,
        p.scope_type    AS scope_type,
        ar.id           AS access_rule_id,
        ar.access_key   AS access_key,
        ar.description  AS access_description
      FROM "CONFIG_MAIN".page p
      INNER JOIN "CONFIG_MAIN".access_rule ar ON ar.id = p.access_id
      WHERE p.active = true
        AND (
          -- Página transversal: sin asociación a tipos de empresa.
          NOT EXISTS (
            SELECT 1 FROM "CONFIG_MAIN".page_company_type pct
            WHERE pct.page_id = p.id
          )
          -- Página exclusiva: pertenece al tipo de empresa del tenant actual.
          OR EXISTS (
            SELECT 1
            FROM "CONFIG_MAIN".page_company_type pct
            INNER JOIN "CONFIG_MAIN".company c ON c.type_id = pct.company_type_id
            WHERE pct.page_id = p.id AND c.tenant_id = $1
          )
        )
      ORDER BY p."order"`,
      [tenant],
    );

    this.logger.log(`[getPageAccessRows] Páginas con acceso: ${result.rows.length}`);

    return result.rows.map((r) => ({
      pageId: r.page_id,
      parentPageId: r.parent_page_id,
      order: r.order,
      scopeType: r.scope_type,
      accessRuleId: r.access_rule_id,
      accessKey: r.access_key,
      accessDescription: r.access_description,
    }));
  }

  // Acciones internas de un módulo: access_rule con parent_rule_id apuntando a
  // otro access_rule (ej: branches.new/branches.profile cuelgan de branches).
  // Estas quedan DENTRO del nodo de acceso de la página correspondiente.
  async getAccessActions(): Promise<AccessActionRow[]> {
    this.logger.log('[getAccessActions] Obteniendo acciones internas (parent_rule_id NOT NULL)');

    const result = await this.pool.query<{
      id: number;
      key: string;
      descripcion: string;
      parent_rule_id: number;
    }>(
      `SELECT
        ar.id,
        ar.access_key   AS key,
        ar.description  AS descripcion,
        ar.parent_rule_id
      FROM "CONFIG_MAIN".access_rule ar
      WHERE ar.parent_rule_id IS NOT NULL
      ORDER BY ar.id`,
    );

    this.logger.log(`[getAccessActions] Acciones internas: ${result.rows.length}`);

    return result.rows.map((r) => ({
      id: r.id,
      key: r.key,
      descripcion: r.descripcion,
      parentRuleId: r.parent_rule_id,
    }));
  }

  async getProfilesWithAccess(tenant: string, branchId: number | null): Promise<ProfileWithAccess[]> {
    this.logger.log(`[getProfilesWithAccess] tenant: ${tenant}, branchId: ${branchId}`);

    let whereClause: string;
    let params: any[];

    if (branchId) {
      whereClause = `WHERE p.name != 'Creador' AND (p.branch_id IS NULL OR p.branch_id = $1)`;
      params = [branchId];
    } else {
      whereClause = `WHERE p.name != 'Creador'`;
      params = [];
    }

    const result = await this.pool.query<{
      id: number;
      name: string;
      descripcion: string;
      branch_id: number | null;
      user_count: string;
      access_keys: string;
    }>(
      `SELECT 
        p.id,
        p.name,
        p.descripcion,
        p.branch_id,
        COUNT(DISTINCT up.user_id)::text AS user_count,
        COALESCE(STRING_AGG(DISTINCT pua.access_key, ','), '') AS access_keys
      FROM "${tenant}".profile p
      LEFT JOIN "${tenant}".user_profile up ON up.type_id = p.id
      LEFT JOIN "${tenant}".profile_user_access pua ON pua.profile_id = p.id
      ${whereClause}
      GROUP BY p.id, p.name, p.descripcion, p.branch_id
      ORDER BY p.name`,
      params,
    );

    this.logger.log(`[getProfilesWithAccess] Perfiles encontrados: ${result.rowCount}`);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      descripcion: row.descripcion,
      userCount: parseInt(row.user_count, 10),
      accessKeys: row.access_keys ? row.access_keys.split(',') : [],
    }));
  }

  async createProfile(tenant: string, name: string, description: string, accessKeys: string[], branchId: number | null): Promise<void> {
    this.logger.log(`[createProfile] "${name}", branchId: ${branchId}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const insertResult = await client.query<{ id: number }>(
        `INSERT INTO "${tenant}".profile (name, descripcion, branch_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [name, description, branchId],
      );

      const profileId = insertResult.rows[0].id;

      if (accessKeys.length > 0) {
        const values: string[] = [];
        const params: (number | string)[] = [profileId];
        let paramIndex = 2;

        for (const key of accessKeys) {
          values.push(`($1, $${paramIndex})`);
          params.push(key);
          paramIndex++;
        }

        await client.query(
          `INSERT INTO "${tenant}".profile_user_access (profile_id, access_key)
           VALUES ${values.join(', ')}`,
          params,
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[createProfile] Perfil creado con id ${profileId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[createProfile] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateProfile(tenant: string, profileId: number, name: string, description: string, accessKeys: string[]): Promise<void> {
    this.logger.log(`[updateProfile] profileId: ${profileId}, tenant: ${tenant}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE "${tenant}".profile SET name = $1, descripcion = $2 WHERE id = $3`,
        [name, description, profileId],
      );

      await client.query(
        `DELETE FROM "${tenant}".profile_user_access WHERE profile_id = $1`,
        [profileId],
      );

      if (accessKeys.length > 0) {
        const values: string[] = [];
        const params: (number | string)[] = [profileId];
        let paramIndex = 2;

        for (const key of accessKeys) {
          values.push(`($1, $${paramIndex})`);
          params.push(key);
          paramIndex++;
        }

        await client.query(
          `INSERT INTO "${tenant}".profile_user_access (profile_id, access_key)
           VALUES ${values.join(', ')}`,
          params,
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[updateProfile] Perfil ${profileId} actualizado`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[updateProfile] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteProfile(tenant: string, profileId: number): Promise<void> {
    this.logger.log(`[deleteProfile] profileId: ${profileId}, tenant: ${tenant}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM "${tenant}".profile_user_access WHERE profile_id = $1`,
        [profileId],
      );

      await client.query(
        `DELETE FROM "${tenant}".user_profile WHERE type_id = $1`,
        [profileId],
      );

      await client.query(
        `DELETE FROM "${tenant}".profile WHERE id = $1`,
        [profileId],
      );

      await client.query('COMMIT');
      this.logger.log(`[deleteProfile] Perfil ${profileId} eliminado`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[deleteProfile] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserProfiles(tenant: string, userId: number, branchId: number | null): Promise<UserProfileInfo[]> {
    this.logger.log(`[getUserProfiles] userId: ${userId}, tenant: ${tenant}, branchId: ${branchId}`);

    let profileFilter: string;
    let assignedFilter: string;
    let params: any[];

    if (branchId) {
      profileFilter = `WHERE p.name != 'Creador' AND (p.branch_id IS NULL OR p.branch_id = $2)`;
      assignedFilter = `SELECT 1 FROM "${tenant}".user_profile up WHERE up.type_id = p.id AND up.user_id = $1 AND (up.branch_id IS NULL OR up.branch_id = $2)`;
      params = [userId, branchId];
    } else {
      profileFilter = `WHERE p.name != 'Creador'`;
      assignedFilter = `SELECT 1 FROM "${tenant}".user_profile up WHERE up.type_id = p.id AND up.user_id = $1`;
      params = [userId];
    }

    const result = await this.pool.query<{
      id: number;
      name: string;
      descripcion: string;
      access_keys: string;
      assigned: boolean;
    }>(
      `SELECT 
        p.id,
        p.name,
        COALESCE(p.descripcion, '') AS descripcion,
        COALESCE(STRING_AGG(DISTINCT pua.access_key, ','), '') AS access_keys,
        EXISTS(${assignedFilter}) AS assigned
      FROM "${tenant}".profile p
      LEFT JOIN "${tenant}".profile_user_access pua ON pua.profile_id = p.id
      ${profileFilter}
      GROUP BY p.id, p.name, p.descripcion
      ORDER BY p.name`,
      params,
    );

    this.logger.log(`[getUserProfiles] Perfiles encontrados: ${result.rowCount}`);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      descripcion: row.descripcion,
      accessKeys: row.access_keys ? row.access_keys.split(',') : [],
      assigned: row.assigned,
    }));
  }

  async assignProfilesToUser(tenant: string, userId: number, profileIds: number[], branchId: number | null): Promise<void> {
    this.logger.log(`[assignProfilesToUser] userId: ${userId}, profiles: [${profileIds.join(',')}], branchId: ${branchId}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      if (branchId) {
        await client.query(
          `DELETE FROM "${tenant}".user_profile 
           WHERE user_id = $1 
           AND (branch_id = $2 OR branch_id IS NULL)
           AND type_id NOT IN (SELECT id FROM "${tenant}".profile WHERE name = 'Creador')`,
          [userId, branchId],
        );
      } else {
        await client.query(
          `DELETE FROM "${tenant}".user_profile 
           WHERE user_id = $1 
           AND type_id NOT IN (SELECT id FROM "${tenant}".profile WHERE name = 'Creador')`,
          [userId],
        );
      }

      if (profileIds.length > 0) {
        const values: string[] = [];
        const params: (number | null)[] = [userId];
        let paramIndex = 2;

        for (const profileId of profileIds) {
          values.push(`($1, $${paramIndex}, $${paramIndex + 1})`);
          params.push(profileId);
          params.push(branchId);
          paramIndex += 2;
        }

        await client.query(
          `INSERT INTO "${tenant}".user_profile (user_id, type_id, branch_id)
           VALUES ${values.join(', ')}
           ON CONFLICT (user_id, type_id, branch_id) DO NOTHING`,
          params,
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[assignProfilesToUser] Perfiles asignados correctamente`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[assignProfilesToUser] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
