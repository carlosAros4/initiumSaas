import { useEffect } from "react";
import { useAuth } from "./context/login/AuthContext";
import { useSession } from "./context/session/SessionContext";
import { useCallApi } from "./hooks/useCallApi";
import type { Branch, Company, SelectBranchResponse, SelectCompanyResponse, SessionResponse } from "./types/session";

import { PrivateRouter } from "./sections/private/router/PrivateRouter";
import { pageFilter } from "./utils/pageFilter";
import Spinner from "./sections/transversal/ui/Spinner/Spinner";
import { SelectCompanyModal } from "./sections/private/layout/utilitatios/SelectCompanyModal/SelectCompanyModal";
import { SelectBranchModal } from "./sections/private/layout/utilitatios/SelectBranchModal/SelectBranchModal";


export const Transition = () => {

  const { useFetch, fetcher } = useCallApi()
  const {
    setDataCliente, companies, setCompany, companySelect,
    setAccessRules, setPageTree, setModules, updateCompanyFavorite,
    setBranches, setBranch, branches, branchSelect
  } = useSession()
  const { logout } = useAuth()
  const { data, error, isLoading } = useFetch<SessionResponse>({
    clientType: 'InitiumSaaS-Private',
    path: 'session',
  })

  const selectCompany = (company: Company, favorite: boolean) => {
    updateCompanyFavorite(company.id, favorite);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'session/company',
      method: 'POST',
      body: { id: company.id, favorite }
    }).then((data: SelectCompanyResponse) => {
      setCompany(data.company);
      setBranches(data.branches);
      if (data.selectedBranch) {
        setBranch(data.selectedBranch);
      }
      setModules(pageFilter(data.pageTree))
      setPageTree(data.pageTree)
      setAccessRules(data.accessRule)
    })
  }

  const selectBranch = (branch: Branch, favorite: boolean) => {
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'session/branch',
      method: 'POST',
      body: { id: branch.id, favorite }
    }).then((data: SelectBranchResponse) => {
      setBranch(data.branch);
      setModules(pageFilter(data.pageTree))
      setPageTree(data.pageTree)
      setAccessRules(data.accessRule)
    })
  }

  // Cargar sesión al montar
  useEffect(() => {
    if (data) {
      setDataCliente(data.cliente)
      setCompany(data.company)

      // Cargar branches desde sesión
      if (data.branches && data.branches.length > 0) {
        setBranches(data.branches);
      }

      // Cargar branch desde sesión si existe
      if (data.branch) {
        setBranch(data.branch);
      }

      if (data.pagetree) {
        setModules(pageFilter(data.pagetree))
        setPageTree(data.pagetree)
      }
      if (data.rules) setAccessRules(data.rules)

      // Refrescar tokens al entrar a la sesión
      fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'session/refresh',
        method: 'POST',
      }).catch(() => {
        logout();
      });
    }
  }, [data])


  if (isLoading) {
    return (<Spinner overlay size="xl" />)
  }
  if (error) logout();

  // Sin companies → modal vacío
  if (!companies) return (
    <SelectCompanyModal variant="empty" onClose={() => logout()} />
  )

  // Company no seleccionada → selector de empresa
  if (!companySelect && companies) return (
    <SelectCompanyModal
      companies={companies}
      onSelect={selectCompany}
      onClose={() => { logout() }}
    />
  )

  // Company seleccionada pero branch no seleccionado y hay múltiples branches → selector de sucursal
  if (companySelect && !branchSelect && branches && branches.length > 1) return (
    <SelectBranchModal
      branches={branches}
      onSelect={selectBranch}
      onClose={() => { logout() }}
    />
  )

  return (
    <PrivateRouter />
  )
}



export default Transition;
