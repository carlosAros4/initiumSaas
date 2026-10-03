import { useState } from 'react';
import styles from './SalesHeader3.module.css';

interface SalesHeader3Props {
  siteName: string;
}

const categories = [
  { label: 'Herramientas', icon: '🔧' },
  { label: 'Pinturas', icon: '🎨' },
  { label: 'Pisos y Muros', icon: '🧱' },
  { label: 'Baño', icon: '🚿' },
  { label: 'Cocina', icon: '🍳' },
  { label: 'Iluminación', icon: '💡' },
  { label: 'Jardín y Terraza', icon: '🌱' },
  { label: 'Muebles', icon: '🛋️' },
  { label: 'Organización', icon: '📦' },
  { label: 'Electricidad', icon: '⚡' },
  { label: 'Plomería', icon: '🔩' },
  { label: 'Seguridad', icon: '🔒' },
];

const navItems = [
  'Ofertas',
  'Nuevos',
  'Construcción',
  'Terminaciones',
  'Herramientas',
  'Jardín',
  'Decoración',
  'Muebles',
  'Organización',
];

export const SalesHeader3 = ({ siteName }: SalesHeader3Props) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Ofertas');

  return (
    <>
      {/* ── Promo Bar ── */}
      <div className={styles.promoBar}>
        🎉 <span>Despacho gratis</span> en compras sobre $49.990 | Retiro en tienda disponible
      </div>

      {/* ── Main Header ── */}
      <header className={styles.header}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            {siteName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.logoText}>{siteName}</div>
            <div className={styles.logoSubtext}>Homecenter</div>
          </div>
        </div>

        {/* Categorías */}
        <button
          className={styles.categoriesBtn}
          onClick={() => setCategoriesOpen(!categoriesOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Categorías
        </button>

        {/* Buscador */}
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="¿Qué estás buscando?"
          />
          <button className={styles.searchBtn} aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>

        {/* Acciones derecha */}
        <div className={styles.actions}>
          {/* Mis pedidos */}
          <button className={styles.actionBtn} aria-label="Mis pedidos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375m11.25 0h3.375a1.125 1.125 0 0 0 1.092-.848l1.142-4.567A1.125 1.125 0 0 0 22.142 12H18M2.25 14.25h3.375" />
            </svg>
            <span className={styles.actionLabel}>Pedidos</span>
          </button>

          {/* Mi cuenta */}
          <button className={styles.actionBtn} aria-label="Mi cuenta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className={styles.actionLabel}>Cuenta</span>
          </button>

          {/* Favoritos */}
          <button className={styles.actionBtn} aria-label="Favoritos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <span className={styles.actionLabel}>Favoritos</span>
          </button>

          {/* Carrito */}
          <button className={styles.actionBtn} aria-label="Carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className={styles.actionLabel}>Carrito</span>
            <span className={styles.cartBadge}>0</span>
          </button>
        </div>

        {/* Hamburguesa mobile */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </header>

      {/* ── Nav Bar ── */}
      <nav className={styles.navBar}>
        {navItems.map((item) => (
          <button
            key={item}
            className={`${styles.navLink} ${activeNav === item ? styles.navLinkActive : ''}`}
            onClick={() => setActiveNav(item)}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* ── Categories Modal ── */}
      <div
        className={`${styles.categoriesModalOverlay} ${categoriesOpen ? styles.categoriesModalOverlayOpen : ''}`}
        onClick={() => setCategoriesOpen(false)}
      />
      <div className={`${styles.categoriesModal} ${categoriesOpen ? styles.categoriesModalOpen : ''}`}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Todas las categorías</span>
          <button
            className={styles.modalCloseBtn}
            onClick={() => setCategoriesOpen(false)}
            aria-label="Cerrar categorías"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ul className={styles.categoryList}>
          {categories.map((cat) => (
            <li key={cat.label}>
              <button className={styles.categoryItem} onClick={() => setCategoriesOpen(false)}>
                <div className={styles.categoryIcon}>{cat.icon}</div>
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Mobile Overlay ── */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayOpen : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile Menu ── */}
      <aside className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.mobileMenuLogo}>
            <div className={styles.mobileLogoIcon}>
              {siteName.charAt(0).toUpperCase()}
            </div>
            <span className={styles.mobileLogoText}>{siteName}</span>
          </div>
          <button
            className={styles.mobileCloseBtn}
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Buscador mobile */}
        <div className={styles.mobileSearch}>
          <input
            type="text"
            className={styles.mobileSearchInput}
            placeholder="¿Qué estás buscando?"
          />
          <button className={styles.mobileSearchBtn} aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>

        {/* Links principales */}
        <div className={styles.mobileSection}>
          <span className={styles.mobileSectionTitle}>Mi cuenta</span>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Ingresar / Registrarse
          </button>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375m11.25 0h3.375a1.125 1.125 0 0 0 1.092-.848l1.142-4.567A1.125 1.125 0 0 0 22.142 12H18M2.25 14.25h3.375" />
            </svg>
            Mis Pedidos
          </button>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            Favoritos
          </button>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            Carrito
          </button>
        </div>

        <div className={styles.mobileDivider} />

        {/* Navegación */}
        <div className={styles.mobileSection}>
          <span className={styles.mobileSectionTitle}>Navegación</span>
          {navItems.map((item) => (
            <button
              key={item}
              className={styles.mobileNavLink}
              onClick={() => { setActiveNav(item); setMobileOpen(false); }}
            >
              {item}
            </button>
          ))}
        </div>

        <div className={styles.mobileDivider} />

        {/* Categorías */}
        <div className={styles.mobileSection}>
          <span className={styles.mobileSectionTitle}>Categorías</span>
          {categories.map((cat) => (
            <button
              key={cat.label}
              className={styles.mobileNavLink}
              onClick={() => setMobileOpen(false)}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default SalesHeader3;
