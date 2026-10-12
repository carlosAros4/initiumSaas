import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { ISessionRepository, SessionUser } from '../types/interfaces/session.repository';
import { Company } from 'src/service-capability/Login/types/dto/login';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';
import { PageTree } from 'src/service-capability/PostLogin/types/dto/page-tree';
import type { Branch } from 'src/service-capability/PostLogin/service/post-login.service';

@Injectable()
export class SessionImpl implements ISessionRepository {
  private readonly logger = new Logger(SessionImpl.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) { }

  async findUserById(userId: number): Promise<SessionUser | null> {
    const result = await this.pool.query<SessionUser>(
      `SELECT id, rut, dv, first_name, last_name, email, verified, blocked
       FROM "CONFIG_MAIN".users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  }

  async getPasswordHash(rut: string, dv: string): Promise<string | null> {
    const result = await this.pool.query<{ password: string }>(
      `SELECT password FROM "CONFIG_MAIN".users WHERE rut = $1 AND dv = $2 LIMIT 1`,
      [rut, dv],
    );
    return result.rowCount > 0 ? result.rows[0].password : null;
  }

  async updatePasswordAndClearNewUser(rut: string, dv: string, hashedPassword: string): Promise<boolean> {
    this.logger.log(`[updatePasswordAndClearNewUser] Actualizando contraseña — rut: ${rut}`);
    const result = await this.pool.query(
      `UPDATE "CONFIG_MAIN".users
       SET password = $1, newusers = false, updated_at = NOW()
       WHERE rut = $2 AND dv = $3`,
      [hashedPassword, rut, dv],
    );
    return result.rowCount > 0;
  }

  async getCompanies(id: number): Promise<Company | null> {
    const result = await this.pool.query<Company>(
      `SELECT 
        uc.favorite,
        uc.blocked,
        c.tenant_id,
        c.logo,
        c.id,
        c.rut,
        c.dv,
        c.name,
        ct.name AS type,
        c.active
      FROM "CONFIG_MAIN".user_company uc
      INNER JOIN "CONFIG_MAIN".company c ON c.id = uc.company_id
      INNER JOIN "CONFIG_MAIN".company_type ct ON ct.id = c.type_id
      INNER JOIN "CONFIG_MAIN".users u ON u.id = uc.user_id
      WHERE u.rut = $1 AND u.dv = $2 AND c.active AND c.id = $3`,
      [this.userSession.rut, this.userSession.dv, id],
    );
    return result.rowCount > 0 ? result.rows[0] : null;
  }

  async insertFavorite(id: number): Promise<boolean> {
    await this.pool.query(
      `UPDATE "CONFIG_MAIN".user_company
       SET favorite = true
       FROM "CONFIG_MAIN".users u,
            "CONFIG_MAIN".company c
       WHERE user_company.user_id = u.id
         AND user_company.company_id = c.id
         AND u.rut = $1
         AND u.dv = $2
         AND c.active
         AND c.id = $3`,
      [this.userSession.rut, this.userSession.dv, id],
    );
    return true;
  }

  async resetFavorite(): Promise<boolean> {
    await this.pool.query(
      `UPDATE "CONFIG_MAIN".user_company
       SET favorite = false
       FROM "CONFIG_MAIN".users u
       WHERE user_company.user_id = u.id
         AND u.rut = $1
         AND u.dv = $2`,
      [this.userSession.rut, this.userSession.dv],
    );
    return true;
  }

  // ─── Branch methods ───

  async getUserBranches(tenant: string): Promise<Branch[]> {
    this.logger.log(`[getUserBranches] Obteniendo sucursales — tenant: ${tenant}`);

    const result = await this.pool.query<Branch>(
      `SELECT 
        b.id,
        b.name,
        b.address,
        b.phone,
        b.active,
        b.is_main,
        ub.favorite
      FROM "${tenant}".branch b
      INNER JOIN "${tenant}".user_branch ub ON ub.branch_id = b.id
      INNER JOIN "${tenant}".users u ON u.id = ub.user_id
      WHERE u.rut = $1 AND u.dv = $2 AND b.active = TRUE AND ub.active = TRUE AND ub.blocked = FALSE
      ORDER BY b.is_main DESC, b.name`,
      [this.userSession.rut, this.userSession.dv],
    );

    this.logger.log(`[getUserBranches] Sucursales encontradas: ${result.rows.length}`);
    return result.rows;
  }

  async getBranch(tenant: string, branchId: number): Promise<Branch | null> {
    this.logger.log(`[getBranch] Obteniendo branch ${branchId} — tenant: ${tenant}`);

    const result = await this.pool.query<Branch>(
      `SELECT 
        b.id,
        b.name,
        b.address,
        b.phone,
        b.active,
        b.is_main,
        ub.favorite
      FROM "${tenant}".branch b
      INNER JOIN "${tenant}".user_branch ub ON ub.branch_id = b.id
      INNER JOIN "${tenant}".users u ON u.id = ub.user_id
      WHERE u.rut = $1 AND u.dv = $2 AND b.id = $3 AND b.active = TRUE AND ub.active = TRUE AND ub.blocked = FALSE`,
      [this.userSession.rut, this.userSession.dv, branchId],
    );

    return result.rowCount > 0 ? result.rows[0] : null;
  }

  async resetBranchFavorite(tenant: string): Promise<boolean> {
    this.logger.log(`[resetBranchFavorite] Reseteando favoritas — tenant: ${tenant}`);

    await this.pool.query(
      `UPDATE "${tenant}".user_branch
       SET favorite = false
       FROM "${tenant}".users u
       WHERE user_branch.user_id = u.id
         AND u.rut = $1
         AND u.dv = $2`,
      [this.userSession.rut, this.userSession.dv],
    );
    return true;
  }

  async insertBranchFavorite(tenant: string, branchId: number): Promise<boolean> {
    this.logger.log(`[insertBranchFavorite] Marcando branch ${branchId} como favorita`);

    await this.pool.query(
      `UPDATE "${tenant}".user_branch
       SET favorite = true
       FROM "${tenant}".users u
       WHERE user_branch.user_id = u.id
         AND user_branch.branch_id = $3
         AND u.rut = $1
         AND u.dv = $2`,
      [this.userSession.rut, this.userSession.dv, branchId],
    );
    return true;
  }

  // ─── Page tree & access rules ───

  async getPageTree(tenant: string): Promise<PageTree[]> {
    this.logger.log(`[getPageTree] Obteniendo árbol de páginas — tenant: ${tenant}`);

    const result = await this.pool.query(
      `SELECT 
        p.id,
        p.name,
        p.module,
        p.url,
        p.slug,
        p."order",
        p.parent_id,
        pt.name AS type,
        ar.id AS access_rule_id,
        ar.access_key,
        ar.description AS access_description
      FROM "CONFIG_MAIN".page p
      INNER JOIN "CONFIG_MAIN".page_type pt ON pt.id = p.type_id
      LEFT JOIN "CONFIG_MAIN".access_rule ar ON ar.id = p.access_id
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

    const pages = result.rows;

    const pageMap = new Map<number, PageTree>();
    const roots: PageTree[] = [];

    for (const page of pages) {
      const accessRule: string | null = page.access_rule_id
        ? page.access_key
        : null;

      const node: PageTree = {
        id: page.id,
        name: page.name,
        module: page.module,
        url: page.url,
        slug: page.slug,
        order: page.order,
        type: page.type,
        accessRule,
        children: [],
      };
      pageMap.set(page.id, node);
    }

    for (const page of pages) {
      const node = pageMap.get(page.id)!;
      if (page.parent_id && pageMap.has(page.parent_id)) {
        pageMap.get(page.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    this.logger.log(`[getPageTree] Árbol construido — raíces: ${roots.length}`);
    return roots;
  }

  async getAccessRuleUser(tenant: string, branchId: number | null): Promise<string[]> {
    this.logger.log(`[getAccessRuleUser] Obteniendo access rules — tenant: ${tenant}, rut: ${this.userSession.rut}, branchId: ${branchId}`);

    // Verificar si el usuario tiene el perfil "Creador"
    const creadorCheck = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*) as count
      FROM "${tenant}".users u
      INNER JOIN "${tenant}".user_profile up ON up.user_id = u.id
      INNER JOIN "${tenant}".profile p ON p.id = up.type_id
      WHERE u.rut = $1 AND u.dv = $2 AND p.name = 'Creador'`,
      [this.userSession.rut, this.userSession.dv],
    );

    const isCreador = parseInt(creadorCheck.rows[0].count) > 0;

    if (isCreador) {
      this.logger.log('[getAccessRuleUser] Usuario es Creador — retornando todos los access_rule');
      const allRules = await this.pool.query<{ access_key: string }>(
        `SELECT access_key FROM "CONFIG_MAIN".access_rule`,
      );
      const accessKeys = allRules.rows.map(row => row.access_key);
      this.logger.log(`[getAccessRuleUser] Access rules (todos): ${accessKeys.length}`);
      return accessKeys;
    }

    // Filtrar por branch: perfiles globales (NULL) + perfiles de la sucursal
    let query: string;
    let params: any[];

    if (branchId) {
      query = `SELECT DISTINCT pua.access_key
        FROM "${tenant}".users u
        INNER JOIN "${tenant}".user_profile up ON up.user_id = u.id
        INNER JOIN "${tenant}".profile_user_access pua ON pua.profile_id = up.type_id
        WHERE u.rut = $1 AND u.dv = $2
          AND (up.branch_id IS NULL OR up.branch_id = $3)`;
      params = [this.userSession.rut, this.userSession.dv, branchId];
    } else {
      query = `SELECT DISTINCT pua.access_key
        FROM "${tenant}".users u
        INNER JOIN "${tenant}".user_profile up ON up.user_id = u.id
        INNER JOIN "${tenant}".profile_user_access pua ON pua.profile_id = up.type_id
        WHERE u.rut = $1 AND u.dv = $2
          AND up.branch_id IS NULL`;
      params = [this.userSession.rut, this.userSession.dv];
    }

    const result = await this.pool.query<{ access_key: string }>(query, params);

    // Accesos GLOBALES del usuario (páginas globales, independientes de sucursal)
    const globalResult = await this.pool.query<{ access_key: string }>(
      `SELECT DISTINCT uga.access_key
       FROM "${tenant}".users u
       INNER JOIN "${tenant}".user_global_access uga ON uga.user_id = u.id
       WHERE u.rut = $1 AND u.dv = $2`,
      [this.userSession.rut, this.userSession.dv],
    );

    const accessKeys = Array.from(
      new Set([
        ...result.rows.map(row => row.access_key),
        ...globalResult.rows.map(row => row.access_key),
      ]),
    );
    this.logger.log(`[getAccessRuleUser] Access rules encontrados: ${accessKeys.length} (globales: ${globalResult.rowCount})`);
    return accessKeys;
  }
}
