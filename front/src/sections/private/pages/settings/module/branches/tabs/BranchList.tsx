import { useState } from 'react';
import styles from './BranchList.module.css';
import type { BranchItem } from '../Branches';
import { useCallApi } from '../../../../../../../hooks/useCallApi';
import Spinner from '../../../../../../transversal/ui/Spinner/Spinner';
import ButtonInitium from '../../../../../../transversal/ui/Button/ButtonInitium';

interface BranchListProps {
  onSelectBranch: (branch: BranchItem) => void;
}

export const BranchList = ({ onSelectBranch }: BranchListProps) => {
  const { useFetch, fetcher } = useCallApi();
  const { data, isLoading, mutate } = useFetch<BranchItem[]>({
    clientType: 'InitiumSaaS-Private',
    path: 'settings/branches',
  });

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    if (!formName.trim()) return;
    setSaving(true);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: 'settings/branches',
      method: 'POST',
      body: { name: formName.trim(), address: formAddress.trim() || undefined, phone: formPhone.trim() || undefined },
    }).then(() => {
      setShowCreate(false);
      setFormName('');
      setFormAddress('');
      setFormPhone('');
      setSaving(false);
      mutate();
    }).catch(() => setSaving(false));
  };

  const handleEdit = (branch: BranchItem) => {
    setEditingId(branch.id);
    setFormName(branch.name);
    setFormAddress(branch.address || '');
    setFormPhone(branch.phone || '');
  };

  const handleSaveEdit = () => {
    if (!formName.trim() || !editingId) return;
    setSaving(true);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/branches/${editingId}`,
      method: 'PUT',
      body: { name: formName.trim(), address: formAddress.trim() || undefined, phone: formPhone.trim() || undefined },
    }).then(() => {
      setEditingId(null);
      setFormName('');
      setFormAddress('');
      setFormPhone('');
      setSaving(false);
      mutate();
    }).catch(() => setSaving(false));
  };

  const handleToggleActive = (branch: BranchItem) => {
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/branches/${branch.id}`,
      method: 'PUT',
      body: { active: !branch.active },
    }).then(() => mutate());
  };

  const handleSetMain = (branch: BranchItem) => {
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/branches/${branch.id}/main`,
      method: 'PUT',
    }).then(() => mutate());
  };

  if (isLoading) return <Spinner size="md" />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Sucursales ({data?.length || 0})</h3>
        <ButtonInitium size="sm" onClick={() => { setShowCreate(true); setEditingId(null); setFormName(''); setFormAddress(''); setFormPhone(''); }}>
          + Nueva sucursal
        </ButtonInitium>
      </div>

      {showCreate && (
        <div className={styles.formCard}>
          <h4 className={styles.formTitle}>Crear nueva sucursal</h4>
          <input
            className={styles.input}
            placeholder="Nombre de la sucursal"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Dirección (opcional)"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder="Teléfono (opcional)"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />
          <div className={styles.formActions}>
            <ButtonInitium size="sm" onClick={handleCreate} loading={saving} disabled={!formName.trim()}>
              Crear
            </ButtonInitium>
            <ButtonInitium size="sm" variant="outlined" onClick={() => setShowCreate(false)}>
              Cancelar
            </ButtonInitium>
          </div>
        </div>
      )}

      <div className={styles.list}>
        {data?.map((branch) => (
          <div key={branch.id} className={`${styles.card} ${!branch.active ? styles.cardInactive : ''}`}>
            {editingId === branch.id ? (
              <div className={styles.editForm}>
                <input
                  className={styles.input}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nombre"
                />
                <input
                  className={styles.input}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Dirección"
                />
                <input
                  className={styles.input}
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Teléfono"
                />
                <div className={styles.formActions}>
                  <ButtonInitium size="sm" onClick={handleSaveEdit} loading={saving} disabled={!formName.trim()}>
                    Guardar
                  </ButtonInitium>
                  <ButtonInitium size="sm" variant="outlined" onClick={() => setEditingId(null)}>
                    Cancelar
                  </ButtonInitium>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.cardInfo} onClick={() => onSelectBranch(branch)}>
                  <span className={styles.cardName}>
                    {branch.name}
                    {branch.is_main && <span className={styles.mainBadge}>Principal</span>}
                    {!branch.active && <span className={styles.inactiveBadge}>Inactiva</span>}
                  </span>
                  {branch.address && <span className={styles.cardDetail}>📍 {branch.address}</span>}
                  {branch.phone && <span className={styles.cardDetail}>📞 {branch.phone}</span>}
                  <span className={styles.cardDetail}>👥 {branch.userCount} usuario{branch.userCount !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} onClick={() => handleEdit(branch)} title="Editar">✏️</button>
                  {!branch.is_main && (
                    <>
                      <button className={styles.actionBtn} onClick={() => handleSetMain(branch)} title="Hacer sede principal">🏠</button>
                      <button className={styles.actionBtn} onClick={() => handleToggleActive(branch)} title={branch.active ? 'Desactivar' : 'Activar'}>
                        {branch.active ? '🔴' : '🟢'}
                      </button>
                    </>
                  )}
                  <button className={styles.actionBtn} onClick={() => onSelectBranch(branch)} title="Ver usuarios">👥</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
