import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSession } from '../../../../context/session/SessionContext'
import { slugify } from '../../../../utils/slugify'
import type { PageTree } from '../../../../types/page-tree'
import style from './Nav.module.css'

const IconChevron = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 20 20"
    fill="currentColor"
    width={14}
    height={14}
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
)

interface NavItemProps {
  node: PageTree
  basePath: string
  depth?: number
  onNavigate?: () => void
}

const NavItem = ({ node, basePath, depth = 0, onNavigate }: NavItemProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const hasChildren = node.children && node.children.length > 0
  const indent = `${16 + depth * 16}px`

  // type: "label" — no es accionable, solo agrupa hijos
  if (node.type === 'label') {
    return (
      <div className={style.labelGroup}>
        <button
          className={style.labelBtn}
          onClick={() => setOpen(!open)}
          style={{ paddingLeft: indent }}
        >
          <span className={style.labelText}>{node.name}</span>
          {hasChildren && <span className={style.chevronWrap}><IconChevron open={open} /></span>}
        </button>
        {open && hasChildren && (
          <ul className={style.subList}>
            {node.children.map(child => (
              <NavItem key={child.id} node={child} basePath={basePath} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </ul>
        )}
      </div>
    )
  }

  // type: "link" — enlace accionable con NavLink
  if (node.type === 'link' && node.url) {
    const href = `${basePath}${node.url.startsWith('/') ? node.url : '/' + node.url}`
    return (
      <li className={style.item}>
        <NavLink
          to={href}
          className={({ isActive }) => `${style.link} ${isActive ? style.active : ''}`}
          onClick={onNavigate}
          style={{ paddingLeft: indent }}
        >
          <span>{node.name}</span>
        </NavLink>
        {hasChildren && (
          <ul className={style.subList}>
            {node.children.map(child => (
              <NavItem key={child.id} node={child} basePath={basePath} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  // type: "module" — navega con useNavigate a la url
  if (node.type === 'module' && node.url) {
    const href = `${basePath}${node.url.startsWith('/') ? node.url : '/' + node.url}`
    return (
      <li className={style.item}>
        <button
          className={style.link}
          onClick={() => {
            navigate(href)
            onNavigate?.()
          }}
          type="button"
          style={{ paddingLeft: indent }}
        >
          <span>{node.name}</span>
          {hasChildren && <span className={style.chevronWrap}><IconChevron open={open} /></span>}
        </button>
        {hasChildren && (
          <ul className={style.subList}>
            {node.children.map(child => (
              <NavItem key={child.id} node={child} basePath={basePath} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </ul>
        )}
      </li>
    )
  }

  return null
}

interface NavProps {
  open: boolean
  onClose: () => void
}

const Nav = ({ open, onClose }: NavProps) => {
  const { pageTree, companySelect } = useSession()
  const companySlug = companySelect ? slugify(companySelect.name) : ''
  const basePath = `/site/${companySlug}`
  const buscarScope = (nodes: PageTree[], scope: string): PageTree[] => {
    for (const node of nodes) {
      if (node.slug === scope) return [node]
      if (node.children.length > 0) {
        const found = buscarScope(node.children, scope)
        if (found.length > 0) return found
      }
    }
    return []
  }

  const menuRoot = pageTree ? buscarScope(pageTree, 'menu-principal') : []
  // Si encontramos el nodo "menu-principal", pintamos sus hijos
  const menuItems = menuRoot.length > 0 && menuRoot[0].children.length > 0
    ? menuRoot[0].children
    : menuRoot


  const items = menuItems
  return (
    <nav className={`${style.nav} ${open ? style.open : ''}`} aria-label="Navegación principal">
      <div className={style.logoRow}>
        <div className={style.logo}>
          <img src={companySelect.logo} alt="" />
        </div>
        <button className={style.closeBtn} onClick={onClose} aria-label="Cerrar menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ul className={style.list}>
        {items.map(node => (
          <NavItem key={node.id} node={node} basePath={basePath} onNavigate={onClose} />
        ))}
      </ul>
    </nav>
  )
}

export default Nav
