import { useState } from 'react';
import styles from './GlobalAccess.module.css';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import Spinner from '../../../../../transversal/ui/Spinner/Spinner';
import { GlobalAccessEditor } from './GlobalAccessEditor';

export interface GlobalAccessRuleTree {
  id: number;
  key: string;
  descripcion: string;
  children: GlobalAccessRuleTree[];
}

export interface GlobalPageAccess {
  pageId: number;
  pageName: string;
  rules: GlobalAccessRuleTree[];
  // access_key de los módulos padre (nivel 1) requeridos para esta página global.
  requiredParentKeys: string[];
  // Descripciones legibles de esos módulos padre (para mostrar en la UI).
  requiredParentLabels: string[];
}

export interface GlobalAccessUser {
  id: number;
  name: string;
  email: string;
  rut: string;
}

export interface GlobalAccessSectionResponse {
  pages: GlobalPageAccess[];
  users: GlobalAccessUser[];
}

export const GlobalAccess = () => {
  const { useFetch } = useCallApi();
  const { data, isLoading } = useFetch<GlobalAccessSectionResponse>({
    clientType: 'InitiumSaaS-Private',
    path: 'settings/global-access',
  });

  const [selectedUser, setSelectedUser] = useState<GlobalAccessUser | null>(null);
  const [search, setSearch] = useState('');

  if (isLoading) return <Spinner size="md" />;

  const pages = data?.pages ?? [];
  const users = data?.users ?? [];

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.rut.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Accesos Globales</h2>
      <p className={styles.subtitle}>
        Designa qué usuarios pueden acceder a las páginas globales de la empresa. Estos accesos
        aplican en toda la empresa, sin importar la sucursal seleccionada.
      </p>

      {pages.length === 0 && (
        <div className={styles.emptyState}>
          No hay páginas globales configuradas todavía.
        </div>
      )}

      {selectedUser ? (
        <GlobalAccessEditor
          user={selectedUser}
          pages={pages}
          onBack={() => setSelectedUser(null)}
        />
      ) : (
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <h3 className={styles.sectionTitle}>Usuarios ({filteredUsers.length})</h3>
            <input
              className={styles.searchInput}
              placeholder="Buscar por nombre, email o RUT"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.list}>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={styles.card}
                onClick={() => setSelectedUser(user)}
              >
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{user.name}</span>
                  <span className={styles.cardDetail}>✉️ {user.email}</span>
                  <span className={styles.cardDetail}>🆔 {user.rut}</span>
                </div>
                <button className={styles.actionBtn} title="Administrar accesos">⚙️</button>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className={styles.emptyState}>No se encontraron usuarios.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalAccess;
