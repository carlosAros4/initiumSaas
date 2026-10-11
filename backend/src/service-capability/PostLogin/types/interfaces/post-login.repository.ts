import { Company } from 'src/service-capability/Login/types/dto/login';
import { PageTree } from '../dto/page-tree';
import { Branch } from '../../service/post-login.service';

export interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  blocked: boolean;
  gender: 'M'|'F'
  verified: boolean;
  newusers: boolean;
}

export interface IPostLoginRepository {
  getCompanies(rut: string, dv: string): Promise<Company[]>;
  getUserData(rut: string, dv: string): Promise<UserData>;
  getPageTree(): Promise<PageTree>;
  getAccessRuleUser(tenant: string, branchId: number | null): Promise<string[]>;
  getUserBranches(tenant: string): Promise<Branch[]>;
}
