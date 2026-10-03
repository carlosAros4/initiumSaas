import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IPostLoginRepository } from '../types/interfaces/post-login.repository';
import { Company } from 'src/service-capability/Login/types/dto/login';
import { PageTree } from '../types/dto/page-tree';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';
import type { UserData } from '../types/interfaces/post-login.repository';
import type { Branch } from '../service/post-login.service';

@Injectable()
export class PostLoginImpl implements IPostLoginRepository {
  private readonly logger = new Logger(PostLoginImpl.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  async getCompanies(rut: string, dv: string): Promise<Company[]> {
    this.logger.log(`[getCompanies] Buscando empresas — rut: ${rut}`);
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
      WHERE u.rut = $1 AND u.dv = $2 AND c.active`,
      [rut, dv],
    );
    this.logger.log(`[getCompanies] Resultado — cantidad: ${result.rows.length}`);
    return result.rows;
  }

  async getUserBranches(tenant: string): Promise<Branch[]> {
    this.logger.log(`[getUserBranches] Obteniendo sucursales — tenant: ${tenant}, rut: ${this.userSession.rut}`);

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

  async getPageTree(): Promise<PageTree> {
    this.logger.log('[getPageTree] Obteniendo árbol de páginas');

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
      ORDER BY p."order"`,
    );

    const pages = result.rows;

    const pageMap = new Map<number, PageTree>();

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
    let detectMain = null;
    for (const page of pages) {
      const node = pageMap.get(page.id)!;
      if (page.parent_id && pageMap.has(page.parent_id)) {
        pageMap.get(page.parent_id)!.children.push(node);
      }
      if(page.slug ==='main'){
        detectMain = page.id;
      }
    }

    this.logger.log(`[getPageTree] Árbol construido — raíces`);
    return pageMap.get(detectMain);
  }

  async getAccessRuleUser(tenant: string, branchId: number | null): Promise<string[]> {
    this.logger.log(`[getAccessRuleUser] Obteniendo access rules — tenant: ${tenant}, rut: ${this.userSession.rut}, branchId: ${branchId}`);

    // Verificar si el usuario tiene el perfil "Creador" (global, sin branch)
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
      // Si es Creador, traer TODOS los access_rule de CONFIG_MAIN
      this.logger.log('[getAccessRuleUser] Usuario es Creador — retornando todos los access_rule');
      const allRules = await this.pool.query<{ access_key: string }>(
        `SELECT access_key FROM "CONFIG_MAIN".access_rule`,
      );
      const accessKeys = allRules.rows.map(row => row.access_key);
      this.logger.log(`[getAccessRuleUser] Access rules (todos): ${accessKeys.length}`);
      return accessKeys;
    }

    // Si no es Creador, traer access_key filtrados por branch:
    // - Perfiles globales (branch_id IS NULL en user_profile)
    // - Perfiles específicos de la sucursal actual (branch_id = $branchId en user_profile)
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
      // Sin branch seleccionado, solo perfiles globales
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

  async getUserData(rut: string, dv: string): Promise<UserData> {
    this.logger.log(`[getUserData] Obteniendo datos del usuario — rut: ${rut}`);
    const result = await this.pool.query<UserData>(
      `SELECT first_name, last_name, email, blocked, verified, newusers
       FROM "CONFIG_MAIN".users
       WHERE rut = $1 AND dv = $2
       LIMIT 1`,
      [rut, dv],
    );
    return result.rows[0];
  }
}
