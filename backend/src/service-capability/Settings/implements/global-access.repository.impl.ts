import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IGlobalAccessRepository } from '../types/interfaces/global-access.repository';
import { GlobalPageAccess, GlobalAccessUser, GlobalAccessRuleTree } from '../types/dto/users.dto';

@Injectable()
export class GlobalAccessRepositoryImpl implements IGlobalAccessRepository {
  private readonly logger = new Logger(GlobalAccessRepositoryImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async getGlobalPagesWithRules(tenant: string): Promise<GlobalPageAccess[]> {
    this.logger.log(`[getGlobalPagesWithRules] Obteniendo páginas globales y sus reglas — tenant: ${tenant}`);

    const pagesResult = await this.pool.query<{ id: number; name: string; access_id: number }>(
      `SELECT p.id, p.name, p.access_id
       FROM "CONFIG_MAIN".page p
       WHERE p.active = true
         AND p.scope_type = 'global'
         AND p.access_id IS NOT NULL
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

    if (pagesResult.rowCount === 0) {
      this.logger.log('[getGlobalPagesWithRules] No hay páginas globales configuradas');
      return [];
    }

    // Mapa de TODAS las páginas activas (id → parent_id, access_key) para poder
    // subir por la jerarquía y encontrar los accesos de los módulos padre.
    const allPagesResult = await this.pool.query<{
      id: number;
      parent_id: number | null;
      access_key: string | null;
      access_description: string | null;
    }>(
      `SELECT p.id, p.parent_id, ar.access_key, ar.description AS access_description
       FROM "CONFIG_MAIN".page p
       LEFT JOIN "CONFIG_MAIN".access_rule ar ON ar.id = p.access_id
       WHERE p.active = true`,
    );

    const parentById = new Map<number, number | null>();
    const accessKeyByPageId = new Map<number, string | null>();
    const accessDescByPageId = new Map<number, string | null>();
    for (const row of allPagesResult.rows) {
      parentById.set(row.id, row.parent_id);
      accessKeyByPageId.set(row.id, row.access_key);
      accessDescByPageId.set(row.id, row.access_description);
    }

    // Dada una página, devuelve los access_key + descripciones de todos sus
    // ancestros que tengan acceso (de más cercano a más lejano). Son los
    // permisos que el usuario necesita además del acceso de la página global.
    const getRequiredParents = (pageId: number): { keys: string[]; labels: string[] } => {
      const keys: string[] = [];
      const labels: string[] = [];
      let current = parentById.get(pageId) ?? null;
      while (current != null) {
        const key = accessKeyByPageId.get(current);
        if (key) {
          keys.push(key);
          labels.push(accessDescByPageId.get(current) || key);
        }
        current = parentById.get(current) ?? null;
      }
      return { keys, labels };
    };

    const parentIds = pagesResult.rows.map((r) => r.access_id);

    const rulesResult = await this.pool.query<{
      id: number;
      key: string;
      descripcion: string;
      parent: number | null;
    }>(
      `SELECT ar.id, ar.access_key AS key, ar.description AS descripcion, ar.parent_rule_id AS parent
       FROM "CONFIG_MAIN".access_rule ar
       WHERE ar.id = ANY($1::int[]) OR ar.parent_rule_id = ANY($1::int[])
       ORDER BY ar.parent_rule_id NULLS FIRST, ar.id`,
      [parentIds],
    );

    const childrenByParent = new Map<number, GlobalAccessRuleTree[]>();
    const nodeById = new Map<number, GlobalAccessRuleTree>();

    for (const rule of rulesResult.rows) {
      const node: GlobalAccessRuleTree = {
        id: rule.id,
        key: rule.key,
        descripcion: rule.descripcion,
        children: [],
      };
      nodeById.set(rule.id, node);
      if (rule.parent !== null) {
        const arr = childrenByParent.get(rule.parent) ?? [];
        arr.push(node);
        childrenByParent.set(rule.parent, arr);
      }
    }

    const pages: GlobalPageAccess[] = pagesResult.rows.map((p) => {
      const parentNode = nodeById.get(p.access_id);
      const rules: GlobalAccessRuleTree[] = [];
      if (parentNode) {
        parentNode.children = childrenByParent.get(p.access_id) ?? [];
        rules.push(parentNode);
      }
      const required = getRequiredParents(p.id);
      return {
        pageId: p.id,
        pageName: p.name,
        rules,
        requiredParentKeys: required.keys,
        requiredParentLabels: required.labels,
      };
    });

    this.logger.log(`[getGlobalPagesWithRules] Páginas globales: ${pages.length}`);
    return pages;
  }

  async getGlobalAccessUsers(tenant: string): Promise<GlobalAccessUser[]> {
    this.logger.log(`[getGlobalAccessUsers] tenant: ${tenant}`);

    const result = await this.pool.query<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      rut: string;
      dv: string;
    }>(
      `SELECT DISTINCT tu.id, cu.first_name, cu.last_name, cu.email, cu.rut, cu.dv
       FROM "${tenant}".users tu
       INNER JOIN "CONFIG_MAIN".users cu ON cu.rut = tu.rut AND cu.dv = tu.dv
       INNER JOIN "CONFIG_MAIN".user_company uc ON uc.user_id = cu.id
       INNER JOIN "CONFIG_MAIN".company c ON c.id = uc.company_id AND c.tenant_id = $1
       WHERE tu.id NOT IN (
         SELECT up.user_id
         FROM "${tenant}".user_profile up
         INNER JOIN "${tenant}".profile p ON p.id = up.type_id
         WHERE p.name = 'Creador'
       )
       ORDER BY cu.first_name, cu.last_name`,
      [tenant],
    );

    this.logger.log(`[getGlobalAccessUsers] Usuarios encontrados: ${result.rowCount}`);

    return result.rows.map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name ?? ''}`.trim(),
      email: row.email,
      rut: `${row.rut}-${row.dv}`,
    }));
  }

  async getUserGlobalAccess(tenant: string, userId: number): Promise<string[]> {
    this.logger.log(`[getUserGlobalAccess] userId: ${userId}, tenant: ${tenant}`);

    const result = await this.pool.query<{ access_key: string }>(
      `SELECT access_key FROM "${tenant}".user_global_access WHERE user_id = $1`,
      [userId],
    );

    return result.rows.map((row) => row.access_key);
  }

  async assignGlobalAccessToUser(tenant: string, userId: number, accessKeys: string[]): Promise<void> {
    this.logger.log(`[assignGlobalAccessToUser] userId: ${userId}, keys: [${accessKeys.join(',')}]`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM "${tenant}".user_global_access WHERE user_id = $1`,
        [userId],
      );

      if (accessKeys.length > 0) {
        const values: string[] = [];
        const params: (number | string)[] = [userId];
        let paramIndex = 2;

        for (const key of accessKeys) {
          values.push(`($1, $${paramIndex})`);
          params.push(key);
          paramIndex++;
        }

        await client.query(
          `INSERT INTO "${tenant}".user_global_access (user_id, access_key)
           VALUES ${values.join(', ')}
           ON CONFLICT (user_id, access_key) DO NOTHING`,
          params,
        );
      }

      await client.query('COMMIT');
      this.logger.log(`[assignGlobalAccessToUser] Accesos globales asignados a usuario ${userId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[assignGlobalAccessToUser] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
