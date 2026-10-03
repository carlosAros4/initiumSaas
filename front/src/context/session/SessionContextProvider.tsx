import { useState, type ReactNode } from 'react';
import { SessionContext } from './SessionContext';
import type { Branch, ClienteData, Company, user } from '../../types/session';
import type { modulesRouter, PageTree } from '../../types/page-tree';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [cliente, setCliente] = useState<user | null>(null);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [companySelect, setCompanySelect] = useState<Company | null>(null);
  const [branches, setBranchesState] = useState<Branch[] | null>(null);
  const [branchSelect, setBranchSelect] = useState<Branch | null>(null);
  const [pageTree, setPageTreeState] = useState<PageTree[] | null>(null);
  const [accessRules, setAccessRulesState] = useState<string[] | null>(null);
  const [modules, setModulesState] = useState<modulesRouter[] | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  function setDataCliente(data: ClienteData) {
    setCliente({
      blocked: data.blocked,
      verified: data.verified,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    });
    if (data.companies && data.companies.length != 0) {
      setCompanies(data.companies);
    }
  }

  function setCompany(company: Company | null) {
    if (company) {
      setCompanySelect(company);
    }
  }

  function setBranches(branchesList: Branch[]) {
    setBranchesState(branchesList);
  }

  function setBranch(branch: Branch | null) {
    setBranchSelect(branch);
  }

  function updateCompanyFavorite(companyId: number, favorite: boolean) {
    setCompanies((prev) => {
      if (!prev) return prev;
      if (!favorite) {
        return prev.map((c) => ({
          ...c,
          favorite: c.id === companyId ? false : c.favorite,
        }));
      }
      return prev.map((c) => ({
        ...c,
        favorite: c.id === companyId,
      }));
    });
  }

  function setPageTree(pages: PageTree[]) {
    setPageTreeState(pages);
  }

  function setAccessRules(rules: string[]) {
    setAccessRulesState(rules);
  }

  function setModules(modulos: modulesRouter[]) {
    setModulesState(modulos);
  }

  function resetSession() {
    setCompanySelect(null);
    setBranchesState(null);
    setBranchSelect(null);
    setPageTreeState(null);
    setAccessRulesState(null);
    setModulesState(null);
    setSessionKey((k) => k + 1);
  }

  return (
    <SessionContext.Provider value={{
      cliente,
      companies,
      companySelect,
      branches,
      branchSelect,
      pageTree,
      accessRules,
      modules,
      sessionKey,
      setDataCliente,
      setCompany,
      setBranches,
      setBranch,
      setPageTree,
      setAccessRules,
      setModules,
      updateCompanyFavorite,
      resetSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
}
