import { useState, useMemo } from 'react';
import styles from './BranchUsers.module.css';
import type { BranchItem } from '../Branches';
import { useCallApi } from '../../../../../../../hooks/useCallApi';
import ButtonInitium from '../../../../../../transversal/ui/Button/ButtonInitium';
import Spinner from '../../../../../../transversal/ui/Spinner/Spinner';
import { useSession } from '../../../../../../../hooks/useSession';

interface BranchUsersProps {
  branch: BranchItem;
  onBack: () => void;
}

interface BranchUser {
  userId: number;
  name: string;
  email: string;
  rut: string;
  active: boolean;
  blocked: boolean;
  favorite: boolean;
}

interface TenantUser {
  id: number;
  name: string;
  email: string;
  rut: string;
}

export const BranchUsers = ({ branch, onBack }: BranchUsersProps) => {
  const {access} = useSession()
  const { useFetch, fetcher } = useCallApi();
  const { data, isLoading, mutate } = useFetch<BranchUser[]>({
    clientType: 'InitiumSaaS-Private',
    path: `settings/branches/${branch.id}/users`,
  });

  const [showAddUser, setShowAddUser] = useState(false);
  const [allUsers, setAllUsers] = useState<TenantUser[] | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Filtrar usuarios por búsqueda
  const filteredUsers = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.rut.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  const loadAllUsers = () => {
    setShowAddUser(true);
    setLoadingUsers(true);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'settings/users',
    }).then((users: TenantUser[]) => {
      const existingIds = new Set(data?.map(u => u.userId) || []);
      setAllUsers(users.filter(u => !existingIds.has(u.id)));
      setLoadingUsers(false);
    }).catch(() => setLoadingUsers(false));
  };

  const handleAddUser = (userId: number) => {
    setActionLoading(userId);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/branches/${branch.id}/users/${userId}`,
      method: 'POST',
    }).then(() => {
      setActionLoading(null);
      setShowAddUser(false);
      setAllUsers(null);
      mutate();
    }).catch(() => setActionLoading(null));
  };

  const handleToggleBlocked = (user: BranchUser) => {
    setActionLoading(user.userId);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/branches/${branch.id}/users/${user.userId}`,
      method: 'PUT',
      body: { blocked: !user.blocked },
    }).then(() => {
      setActionLoading(null);
      mutate();
    }).catch(() => setActionLoading(null));
  };

  const handleRemoveUser = (user: BranchUser) => {
    if (!confirm(`¿Eliminar a ${user.name} de esta sucursal?`)) return;
    setActionLoading(user.userId);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/branches/${branch.id}/users/${user.userId}`,
      method: 'DELETE',
    }).then(() => {
      setActionLoading(null);
      mutate();
    }).catch(() => setActionLoading(null));
  };

  if (isLoading) return <Spinner size="md" />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <ButtonInitium size="sm" variant="text" onClick={onBack}>← Volver</ButtonInitium>
          <h3 className={styles.sectionTitle}>
            Usuarios de: <strong>{branch.name}</strong>
            {branch.is_main && <span className={styles.mainBadge}>Principal</span>}
          </h3>
        </div>
        {access("branches.profile") &&<ButtonInitium size="sm" onClick={loadAllUsers}>
          + Agregar usuario
        </ButtonInitium>}
      </div>

      {/* Buscador */}
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Buscar por nombre, RUT o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showAddUser && (
        <div className={styles.addUserPanel}>
          <h4 className={styles.panelTitle}>Selecciona un usuario para agregar</h4>
          {loadingUsers ? (
            <Spinner size="sm" />
          ) : allUsers && allUsers.length > 0 ? (
            <div className={styles.userPickerList}>
              {allUsers.map((u) => (
                <div key={u.id} className={styles.userPickerItem}>
                  <div className={styles.userPickerInfo}>
                    <span className={styles.userPickerName}>{u.name}</span>
                    <span className={styles.userPickerDetail}>{u.rut} · {u.email}</span>
                  </div>
                  <ButtonInitium
                    size="sm"
                    onClick={() => handleAddUser(u.id)}
                    loading={actionLoading === u.id}
                    disabled={actionLoading !== null}
                  >
                    Agregar
                  </ButtonInitium>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>No hay más usuarios disponibles para agregar.</p>
          )}
          <ButtonInitium size="sm" variant="outlined" onClick={() => { setShowAddUser(false); setAllUsers(null); }}>
            Cerrar
          </ButtonInitium>
        </div>
      )}

      <div className={styles.userList}>
        {filteredUsers.length === 0 && (
          <p className={styles.emptyText}>
            {data?.length === 0 ? 'No hay usuarios asignados a esta sucursal.' : 'No se encontraron resultados.'}
          </p>
        )}
        {filteredUsers.map((user) => (
          <div key={user.userId} className={`${styles.userCard} ${user.blocked ? styles.userBlocked : ''}`}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userDetail}>{user.rut} · {user.email}</span>
              <div className={styles.badges}>
                {user.favorite && <span className={styles.favBadge}>⭐ Favorita</span>}
                {user.blocked && <span className={styles.blockedBadge}>🚫 Bloqueado</span>}
              </div>
            </div>
            <div className={styles.userActions}>
              <button
                className={`${styles.actionBtn} ${user.blocked ? styles.actionBtnSuccess : ''}`}
                onClick={() => handleToggleBlocked(user)}
                disabled={actionLoading === user.userId}
                title={user.blocked ? 'Desbloquear' : 'Bloquear'}
              >
                {user.blocked ? '🔓' : '🔒'}
              </button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                onClick={() => handleRemoveUser(user)}
                disabled={actionLoading === user.userId}
                title="Eliminar de la sucursal"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {data && data.length > 0 && (
        <p className={styles.countText}>
          Mostrando {filteredUsers.length} de {data.length} usuario{data.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
