import type { PageTree } from "./page-tree";

export interface Company {
  favorite: boolean;
  blocked: boolean;
  tenant_id: string;
  rut: string;
  id: number;
  dv: string;
  logo: string | null;
  name: string;
  type: string;
  active?: boolean;
}

export interface Branch {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  is_main: boolean;
  favorite: boolean;
}

export interface ClienteData {
  companies: Company[];
  userId: number;
  rut: string;
  firstName: string;
  lastName: string;
  email: string;
  blocked: boolean;
  verified: boolean;
}

export interface SessionResponse {
  cliente: ClienteData;
  company: Company | null;
  branch: Branch | null;
  branches: Branch[];
  rules: string[] | null;
  pagetree: PageTree[] | null;
}

export interface SelectCompanyResponse {
  company: Company;
  pageTree: PageTree[];
  accessRule: string[];
  branches: Branch[];
  selectedBranch: Branch | null;
}

export interface SelectBranchResponse {
  branch: Branch;
  pageTree: PageTree[];
  accessRule: string[];
}

export interface user {
  blocked: boolean;
  verified: boolean;
  firstName: string;
  lastName: string;
  email: string;
}
