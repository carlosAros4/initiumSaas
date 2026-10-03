import ButtonInitium from '../../../transversal/ui/Button/ButtonInitium';
import { useAuth } from '../../../../context/login/AuthContext'
import { useSession } from '../../../../context/session/SessionContext';
import style from './ProfileModal.module.css'
import LogoutIcon from '@mui/icons-material/Logout';
const ProfileModal = () => {
  const { logout } = useAuth()
  const {cliente } = useSession()

  return (
    <div className={style.container}>
      <div className={style.top}>
        {/* Mis datos */}
        <div className={style.section}>
          <span className={style.sectionLabel}>Mis datos</span>
          <span className={style.sectionValue}>{cliente.firstName} {cliente.lastName}</span>
        </div>

        <div className={style.menuList}>
          <button className={style.menuItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={20} height={20}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            <span>debe ir cambio clave</span>

          </button>
          <button className={style.menuItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={20} height={20}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span>otro menu</span>
          </button>
        </div>

      </div>

      <div >
        <ButtonInitium fullWidth onClick={logout} startIcon= {<LogoutIcon />}>
           Salir
        </ButtonInitium>
      </div>
    </div>
  )
}

export default ProfileModal
