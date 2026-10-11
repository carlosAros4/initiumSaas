import { createContext, useContext } from 'react';
import type { Branch, ClienteData, Company, user } from '../../types/session';
import type { modulesRouter, PageTree } from '../../types/page-tree';

interface SessionContextType {
  cliente: user | null;
  companies: Company[] | null;
  companySelect: Company | null;
  branches: Branch[] | null;
  branchSelect: Branch | null;
  pageTree: PageTree[] | null;
  accessRules: string[] | null;
  modules: modulesRouter[] | null;
  sessionKey: number;
  setDataCliente: (cliente: ClienteData) => void;
  setCompany: (company: Company) => void;
  setBranches: (branches: Branch[]) => void;
  setBranch: (branch: Branch | null) => void;
  setPageTree: (pages: PageTree[]) => void;
  setAccessRules: (rules: string[]) => void;
  setModules: (modulos: modulesRouter[]) => void;
  updateCompanyFavorite: (companyId: number, favorite: boolean) => void;
  resetSession: () => void;
  access:(key:string)=>boolean
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);
