import { Company } from "src/service-capability/Login/types/dto/login";
import { PageTree } from "src/service-capability/PostLogin/types/dto/page-tree";
import type { Branch } from "src/service-capability/PostLogin/service/post-login.service";

export interface ISessionRepository {
  findUserById(userId: number): Promise<SessionUser | null>;
  getPasswordHash(rut: string, dv: string): Promise<string | null>;
  updatePasswordAndClearNewUser(rut: string, dv: string, hashedPassword: string): Promise<boolean>;
  getCompanies(id: number): Promise<Company | null>;
  insertFavorite(id: number): Promise<boolean>;
  resetFavorite(): Promise<boolean>;
  getPageTree(): Promise<PageTree[]>;
  getAccessRuleUser(tenant: string, branchId: number | null): Promise<string[]>;
  getUserBranches(tenant: string): Promise<Branch[]>;
  getBranch(tenant: string, branchId: number): Promise<Branch | null>;
  resetBranchFavorite(tenant: string): Promise<boolean>;
  insertBranchFavorite(tenant: string, branchId: number): Promise<boolean>;
}

export interface SessionUser {
  id: number;
  rut: string;
  dv: string;
  first_name: string;
  last_name: string;
  email: string;
  verified: boolean;
  blocked: boolean;
}
