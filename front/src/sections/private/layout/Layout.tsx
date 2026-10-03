import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Headers from './headers/Headers'
import Nav from './nav/Nav'
import style from './Layout.module.css'
import { useInactivity } from '../../../hooks/useInactivity'
import InactivityModal from './utilitatios/InactivityModal/InactivityModal'
import { useAuth } from '../../../context/login/AuthContext'
import { useCallApi } from '../../../hooks/useCallApi'

export const Layout = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { logout } = useAuth()
  const { fetcher } = useCallApi()

  const refreshToken = useCallback(async () => {
    await fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'session/refresh',
      method: 'POST',
    })
  }, [fetcher])

  const { showInactivityModal, handleContinue, handleLogout } = useInactivity({
    timeout: 5 * 60 * 1000,       // 5 min sin actividad → modal
    refreshInterval: 3 * 60 * 1000, // auto-refresh cada 3 min
    onRefresh: refreshToken,
    onLogout: logout,
  })

  return (
    <div className={style.layout}>
      <Nav open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Headers onMenuToggle={() => setMenuOpen(!menuOpen)} />
      <div className={style.content}>
        <Outlet />
      </div>

      {menuOpen && <div className={style.overlay} onClick={() => setMenuOpen(false)} />}

      {showInactivityModal && (
        <InactivityModal
          onContinue={handleContinue}
          onLogout={handleLogout}
          countdownSeconds={50}
        />
      )}
    </div>
  )
}
