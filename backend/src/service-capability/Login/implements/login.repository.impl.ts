import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { ILoginRepository } from '../types/interfaces/login.repository';
import { splitRut } from 'src/core/utils/rut.utils';
import * as bcrypt from 'bcrypt';
import { Company, UserRecord } from '../types/dto/login';
@Injectable()
export class LoginImpl implements ILoginRepository {
  private readonly logger = new Logger(LoginImpl.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
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
      WHERE u.rut = $1 AND u.dv = $2 AND c.active `,
      [rut, dv],
    );
    this.logger.log(`[getCompanies] Resultado — cantidad: ${result.rows.length}`);
    return result.rows;
  }

  async findUserByRut(rut: string, dv: string): Promise<UserRecord | null> {
    this.logger.log(`[findUserByRut] Buscando usuario — rut: ${rut}`);
    const result = await this.pool.query<UserRecord>(
      `SELECT id, rut, dv, first_name, last_name, email, password,verified,blocked,newusers
       FROM "CONFIG_MAIN".users
       WHERE rut = $1 AND dv = $2
       LIMIT 1`,
      [rut, dv],
    );
    this.logger.log(`[findUserByRut] Resultado — encontrado: ${result.rowCount > 0}`);
    return result.rowCount > 0 ? result.rows[0] : null;
  }

  async validateUserExist(rut: string): Promise<boolean> {
    this.logger.log(`[validateUserExist] Validando existencia — rut: ${rut}`);
    const { cuerpo, dv } = splitRut(rut);

    const result = await this.pool.query<{ id: number }>(
      'SELECT id FROM "CONFIG_MAIN".users WHERE rut = $1 AND dv = $2 LIMIT 1',
      [cuerpo, dv],
    );

    this.logger.log(`[validateUserExist] Resultado — existe: ${result.rowCount > 0}`);
    return result.rowCount > 0;
  }

  async createUser(rut: string, password: string, first_name: string, last_name: string, email: string): Promise<number | null> {
    this.logger.log(`[createUser] Creando usuario — rut: ${rut}, email: ${email}`);
    const { cuerpo, dv } = splitRut(rut);
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.pool.query<{ id: number }>(
      `INSERT INTO "CONFIG_MAIN".users (first_name, last_name, rut, dv, email, password,verified,blocked,failed_login_attempts)
       VALUES ($1, $2, $3, $4, $5, $6,$7,$8,$9)
       RETURNING id`,
      [first_name, last_name, cuerpo, dv, email, hashedPassword, false, false, 0],
    );

    const userId = result.rowCount > 0 ? result.rows[0].id : null;
    this.logger.log(`[createUser] Resultado — userId: ${userId}`);
    return userId;
  }
}
