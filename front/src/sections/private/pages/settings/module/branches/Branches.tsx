import { useState } from 'react';
import styles from './Branches.module.css';
import { BranchList } from './tabs/BranchList';
import { BranchUsers } from './tabs/BranchUsers';

export interface BranchItem {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
  is_main: boolean;
  userCount: number;
}

export const Branches = () => {
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gestión de Sucursales</h2>
      <p className={styles.subtitle}>Crea, edita sucursales y administra el acceso de usuarios a cada sede.</p>

      {!selectedBranch ? (
        <BranchList onSelectBranch={setSelectedBranch} />
      ) : (
        <BranchUsers branch={selectedBranch} onBack={() => setSelectedBranch(null)} />
      )}
    </div>
  );
};

export default Branches;
