import { Company, UserRecord } from "../dto/login";


export interface ILoginRepository {
  findUserByRut(rut: string, dv: string): Promise<UserRecord | null>;
  getCompanies(rut: string, dv: string): Promise<Company[]>;
  validateUserExist(rut: string): Promise<boolean>;
  createUser(rut: string, password: string, first_name: string, last_name: string, email: string): Promise<number | null>;

}
