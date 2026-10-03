import { useState } from 'react';
import styles from './SelectBranchModal.module.css';
import type { Branch } from '../../../../../types/session';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';

interface SelectBranchModalProps {
  branches: Branch[];
  branchSelect?: Branch | null;
  onSelect: (branch: Branch, favorite: boolean) => void;
  onClose: () => void;
  variant?: 'select' | 'change';
  loading?: boolean;
}

export const SelectBranchModal = ({
  branches = [],
  branchSelect,
  onSelect,
  onClose,
  variant = 'select',
  loading = false,
}: SelectBranchModalProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(branchSelect?.id || null);
  const [isFavorite, setIsFavorite] = useState(branchSelect?.favorite || false);

  const handleSubmit = () => {
    const branch = branches.find(b => b.id === selectedId);
    if (branch) {
      onSelect(branch, isFavorite);
    }
  };

  const handleBranch = (branch: Branch) => {
    setSelectedId(branch.id);
    setIsFavorite(branch.favorite);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>🏪</div>
        <h2 className={styles.title}>Seleccione la sucursal</h2>
        <p className={styles.subtitle}>Elige la sede en la que deseas trabajar</p>

        <div className={styles.branchList}>
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`${styles.branchItem} ${selectedId === branch.id ? styles.branchItemActive : ''}`}
              onClick={() => handleBranch(branch)}
            >
              <div className={styles.branchInfo}>
                <span className={styles.branchName}>{branch.name}</span>
                {branch.address && <span className={styles.branchAddress}>{branch.address}</span>}
                {branch.is_main && <span className={styles.mainBadge}>Principal</span>}
              </div>
              {branch.favorite && <span className={styles.favBadge}>⭐</span>}
            </div>
          ))}
        </div>

        <div className={styles.favoriteCheck}>
          <input
            type="checkbox"
            id="branch-favorite-check"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
          />
          <label htmlFor="branch-favorite-check">Marcar como favorita</label>
        </div>

        <div className={styles.actions}>
          <ButtonInitium onClick={handleSubmit} disabled={!selectedId} loading={loading}>
            Entrar
          </ButtonInitium>
          <ButtonInitium variant="outlined" onClick={onClose}>
            {variant === 'change' ? 'Volver' : 'Salir'}
          </ButtonInitium>
        </div>
      </div>
    </div>
  );
};
