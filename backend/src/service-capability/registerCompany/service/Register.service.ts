import { Inject, Injectable, ConflictException, Logger } from '@nestjs/common';
import { IRegister } from '../types/interfaces/Register.repository';
import { companiesResult } from '../types/dto/companys';
import { CreateCompanyRequestDto } from '../types/dto/create-company-request.dto';

export interface RegisterResult {
  message: string;
  accessToken?: string;
}

@Injectable()
export class RegisterService {
  private readonly logger = new Logger(RegisterService.name);

  constructor(
    @Inject('REGISTER') private readonly repository: IRegister,
  ) { }

  async getTypecompanies(): Promise<companiesResult[]> {
    this.logger.log('[getTypecompanies] Consultando tipos de empresa');
    const result = await this.repository.getcompanies();
    this.logger.log(`[getTypecompanies] Resultado — cantidad: ${result.length}`);
    return result;
  }

  async createCompany(data: CreateCompanyRequestDto): Promise<any> {
    this.logger.log(`[createCompany] Inicio — nombre: ${data.name}, rut: ${data.rut}`);

    // Validar si existe el esquema a crear
    let name = data.name.replace(/[^a-zA-Z0-9]/g, '');
    name = name.toUpperCase();
    const date = new Date();
    const formatted = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');

    const tenant_id = `${name.slice(0, 10)}_${formatted}`;
    this.logger.log(`[createCompany] Schema generado: ${tenant_id}`);

    // Validamos si existe el esquema
    const flagValidateName = await this.repository.validateSchema(tenant_id);
    if (!flagValidateName) {
      this.logger.error(`[createCompany] Schema ya existe: ${tenant_id}`);
      throw new Error('No se pudo crear el usuario');
    }

    // Creamos el esquema
    this.logger.log(`[createCompany] Creando schema: ${tenant_id}`);
    await this.repository.createSchema(tenant_id);

    this.logger.log(`[createCompany] Iniciar creacion de tablas en schema: ${tenant_id}`);
    await this.repository.insertTablescompany(tenant_id);

    this.logger.log(`[createCompany] Asociar company y usuario creador`);
    await this.repository.asignarCompany(tenant_id, data);

    this.logger.log(`[createCompany] Inicializando datos de empresa`);
    await this.repository.initData(tenant_id, data.branchName.trim());

    this.logger.log(`[createCompany] Empresa creada exitosamente — schema: ${tenant_id}`);
    return {data: tenant_id};
  }
}
