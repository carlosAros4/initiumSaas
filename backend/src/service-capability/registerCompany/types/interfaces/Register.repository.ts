import { companiesResult } from "../dto/companys";
import { CreateCompanyRequestDto } from "../dto/create-company-request.dto";

export interface IRegister {
  validateSchema(name: string): Promise<boolean>;
  getcompanies(): Promise<companiesResult[]>;
  asignarCompany(name: string, data: CreateCompanyRequestDto): Promise<boolean>;
  createSchema(name: string): Promise<boolean>;
  insertTablescompany(name: string): Promise<boolean>;
  insertCompanyVeterinaria(name: string): Promise<boolean>;
  initData(name: string, branchName: string): Promise<boolean>;
}
