import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProfileModal from './ProfileModal'
import style from './Headers.module.css'
import ModalLateral from '../../../transversal/modal/lateral/ModalLateral'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SelectCompanyModal } from '../utilitatios/SelectCompanyModal/SelectCompanyModal'
import { SelectBranchModal } from '../utilitatios/SelectBranchModal/SelectBranchModal'
import type { Branch, Company } from '../../../../types/session'
import { useCallApi } from '../../../../hooks/useCallApi'
import { useSession } from '../../../../hooks/useSession'
interface HeadersProps {
  onMenuToggle: () => void
}

const Headers = ({ onMenuToggle }: HeadersProps) => {
  const { cliente, companies, companySelect, branchSelect, branches, updateCompanyFavorite, resetSession } = useSession();
  const { fetcher } = useCallApi()
  const navigate = useNavigate()
  const [loadingButton,setLoadingButton] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false);
  const [openChangeCompany, setOpenChangeCompany] = useState(false);
  const [openChangeBranch, setOpenChangeBranch] = useState(false);
  const firstName = cliente?.firstName || ''
  const lastName = cliente?.lastName || ''
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U'
  const userName = firstName || 'Usuario'

  const selectCompany = (company: Company, favorite: boolean) => {
    setLoadingButton(true);
    updateCompanyFavorite(company.id, favorite);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'session/company',
      method: 'POST',
      body: { id: company.id, favorite }
    }).then(() => {
      setOpenChangeCompany(false);
      setLoadingButton(false);
      // Limpiar sesión y volver a cargar Transition desde cero
      resetSession();
      navigate('/site', { replace: true });
    }).catch(() => {
      setLoadingButton(false);
    })
  }

  const selectBranch = (branch: Branch, favorite: boolean) => {
    setLoadingButton(true);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'session/branch',
      method: 'POST',
      body: { id: branch.id, favorite }
    }).then(() => {
      setOpenChangeBranch(false);
      setLoadingButton(false);
      // Limpiar sesión y volver a cargar Transition desde cero (como cambio de empresa)
      resetSession();
      navigate('/site', { replace: true });
    }).catch(() => {
      setLoadingButton(false);
    })
  }

  return (
    <>
      <header className={style.header}>
        <div className={style.spacer} />


        {companies && companies.length > 1 ?
          <div className={style.company} onClick={() => { setOpenChangeCompany(true) }}>
            <span className={style.companyName}>{companySelect?.name}</span>
            {companies && companies.length > 1 && (
              <svg className={style.chevron} viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
                <ExpandMoreIcon />
              </svg>
            )}
          </div>

          :
          <div className={style.company}>
            <span className={style.companyName}>{companySelect?.name}</span>

          </div>
        }
        {/* Indicador de sucursal */}
        {branchSelect && (
          <div
            className={style.company}
            onClick={() => { if (branches && branches.length > 1) setOpenChangeBranch(true) }}
            style={{ cursor: branches && branches.length > 1 ? 'pointer' : 'default' }}
          >
            <span className={style.companyName}>📍 {branchSelect.name}</span>
            {branches && branches.length > 1 && (
              <svg className={style.chevron} viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
                <ExpandMoreIcon />
              </svg>
            )}
          </div>
        )}

        {/* Botón de perfil */}
        <button className={`${style.profileBtn} ${profileOpen ? style.active : ''}`} onClick={() => setProfileOpen(true)}>
          <div className={style.avatar}>{initials}</div>
          <span className={style.userName}>Hola {userName}</span>
          <svg className={style.chevron} viewBox="0 0 20 20" fill="currentColor" width={16} height={16}>
            <ExpandMoreIcon />
          </svg>
        </button>

        {/* Hamburguesa - solo mobile, a la derecha */}
        <button className={style.hamburger} onClick={onMenuToggle} aria-label="Abrir menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={22} height={22}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </header>


      <ModalLateral
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={'Usuario'}>
        <ProfileModal />
      </ModalLateral>


      {openChangeCompany && <SelectCompanyModal
        companies={companies}
        companySelect={companySelect}
        variant='change'
        onSelect={selectCompany}
        onClose={() => { setOpenChangeCompany(false) }}
        loading={loadingButton}
      />
      }

      {openChangeBranch && branches && (
        <SelectBranchModal
          branches={branches}
          branchSelect={branchSelect}
          variant='change'
          onSelect={selectBranch}
          onClose={() => { setOpenChangeBranch(false) }}
          loading={loadingButton}
        />
      )}
    </>
  )
}

export default Headers
