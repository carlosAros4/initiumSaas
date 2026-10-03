import { useState } from 'react';
import styles from './SalesHeader2.module.css';

interface SalesHeader2Props {
  siteName: string;
}

const categories = [
  { label: 'Frutas y Verduras', icon: '🥬' },
  { label: 'Carnes y Aves', icon: '🥩' },
  { label: 'Lácteos y Huevos', icon: '🥛' },
  { label: 'Panadería', icon: '🍞' },
  { label: 'Bebidas', icon: '🥤' },
  { label: 'Snacks y Dulces', icon: '🍫' },
  { label: 'Limpieza del Hogar', icon: '🧹' },
  { label: 'Cuidado Personal', icon: '🧴' },
  { label: 'Congelados', icon: '🧊' },
  { label: 'Mascotas', icon: '🐾' },
];

export const SalesHeader2 = ({ siteName }: SalesHeader2Props) => {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Top Bar ── */}
      <div className={styles.topBar}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            {siteName.charAt(0).toUpperCase()}
          </div>
          <span className={styles.logoText}>{siteName}</span>

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
        </div>

        <div className={styles.topActions}>
          {/* Register / Login */}
          <button className={styles.topLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Registrarse | Ingresar
          </button>

          {/* Lista de deseos */}
          <button className={styles.topLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            Lista de Deseos
          </button>

          {/* Carrito */}
          <button className={styles.topLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            Carrito
          </button>

          {/* Teléfono */}
          <span className={`${styles.topLink} ${styles.phone}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            +56 9 1234 5678
          </span>
        </div>
      </div>

      {/* ── Category Bar ── */}
      <div className={styles.categoryBar}>
        <button
          className={styles.categoriesBtn}
          onClick={() => setCategoriesOpen(!categoriesOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          Ver Categorías
        </button>

        <div className={styles.searchSection}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar productos..."
          />
          <button className={styles.searchBtn} aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>

        <div className={styles.categoryActions}>
          <button className={styles.catIconBtn} aria-label="Favoritos">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
          <button className={styles.catIconBtn} aria-label="Cuenta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Categories Modal ── */}
      <div
        className={`${styles.categoriesModalOverlay} ${categoriesOpen ? styles.categoriesModalOverlayOpen : ''}`}
        onClick={() => setCategoriesOpen(false)}
      />
      <div className={`${styles.categoriesModal} ${categoriesOpen ? styles.categoriesModalOpen : ''}`}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Categorías</span>
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
                <span>{cat.icon}</span>
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

      {/* ── Mobile Menu (hamburguesa) ── */}
      <aside className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuHeader}>
          <div className={styles.mobileMenuLogo}>
            <div className={styles.logoIcon}>
              {siteName.charAt(0).toUpperCase()}
            </div>
            <span className={styles.mobileMenuLogoText}>{siteName}</span>
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
            placeholder="Buscar productos..."
          />
          <button className={styles.mobileSearchBtn} aria-label="Buscar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>

        {/* Links principales */}
        <nav className={styles.mobileNav}>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            Registrarse | Ingresar
          </button>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            Lista de Deseos
          </button>
          <button className={styles.mobileNavLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            Carrito
          </button>
        </nav>

        <div className={styles.mobileDivider} />

        {/* Categorías en mobile */}
        <div className={styles.mobileCategories}>
          <span className={styles.mobileCatTitle}>Categorías</span>
          <nav className={styles.mobileNav}>
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
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SalesHeader2;
