import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IRegister } from '../types/interfaces/Register.repository';
import { splitRut } from '../../../core/utils/rut.utils';
import { companiesResult } from '../types/dto/companys';
import { INIT_COMPANY_SQL } from '../utils/initCompany';
import { CreateCompanyRequestDto } from '../types/dto/create-company-request.dto';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';

@Injectable()
export class RegisterImpl implements IRegister {
  private readonly logger = new Logger(RegisterImpl.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) { }

  async initData(tenant_id: string, branchName: string): Promise<boolean> {
    this.logger.log(`[initData] Insertando datos iniciales — schema: ${tenant_id}, sucursal: ${branchName}`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Crear la sucursal principal
      const branchResult = await client.query<{ id: number }>(
        `INSERT INTO "${tenant_id}".branch (name, is_main, active)
         VALUES ($1, TRUE, TRUE) RETURNING id`,
        [branchName],
      );
      const branchId = branchResult.rows[0].id;

      // 2. Insertar usuario en el tenant
      const userResult = await client.query<{ id: number }>(
        `INSERT INTO "${tenant_id}".users (rut, dv)
         VALUES ($1, $2) RETURNING id`,
        [this.userSession.rut, this.userSession.dv],
      );
      const userId = userResult.rows[0].id;

      // 3. Asignar usuario a la sucursal principal como favorita
      await client.query(
        `INSERT INTO "${tenant_id}".user_branch (user_id, branch_id, favorite, active)
         VALUES ($1, $2, TRUE, TRUE)`,
        [userId, branchId],
      );

      // 4. Asignar perfil Creador al usuario (global, sin branch)
      await client.query(
        `INSERT INTO "${tenant_id}".user_profile (user_id, type_id, branch_id)
         VALUES ($1, (SELECT id FROM "${tenant_id}".profile WHERE name = 'Creador'), NULL)`,
        [userId],
      );

      await client.query('COMMIT');
      this.logger.log(`[initData] Datos iniciales creados — userId: ${userId}, branchId: ${branchId}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[initData] Error: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  async asignarCompany(tenant_id: string, data: CreateCompanyRequestDto): Promise<boolean> {
    const { cuerpo, dv } = splitRut(data.rut);
    await this.pool.query(
      `CALL "CONFIG_MAIN".sp_create_company($1, $2, $3, $4, $5, $6, null)`,
      [data.name, cuerpo, dv, data.type, tenant_id, this.userSession.rut],
    );
    return true;
  }

  async insertTablescompany(tenant_id: string): Promise<boolean> {
    this.logger.log(`[insertTablescompany] Creando tablas — schema: ${tenant_id}`);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const sql = INIT_COMPANY_SQL.replaceAll('__SCHEMA__', tenant_id);
      await client.query(sql);
      await client.query('COMMIT');
      this.logger.log(`[insertTablescompany] Tablas creadas exitosamente — schema: ${tenant_id}`);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`[insertTablescompany] Error al crear tablas — schema: ${tenant_id}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createSchema(tenant_id: string): Promise<boolean> {
    this.logger.log(`[createSchema] Creando schema: ${tenant_id}`);
    await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${tenant_id}"`);
    this.logger.log(`[createSchema] Schema creado: ${tenant_id}`);
    return this.validateSchema(tenant_id);
  }

  async validateSchema(tenant_id: string): Promise<boolean> {
    this.logger.log(`[validateSchema] Validando schema: ${tenant_id}`);
    const result = await this.pool.query<{ id: number }>(
      'SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1 LIMIT 1',
      [tenant_id],
    );
    this.logger.log(`[validateSchema] Resultado — disponible: ${result.rowCount == 0}`);
    return result.rowCount == 0;
  }

  async getcompanies(): Promise<companiesResult[]> {
    this.logger.log('[getcompanies] Consultando tipos de empresa');
    const result = await this.pool.query<companiesResult>(
      'SELECT * FROM "CONFIG_MAIN".company_type',
    );
    this.logger.log(`[getcompanies] Resultado — cantidad: ${result.rows.length}`);
    return result.rows;
  }
}
