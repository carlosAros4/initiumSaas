import { useState } from 'react';
import styles from './SelectCompanyModal.module.css';
import type { Company } from '../../types/session';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';

interface SelectCompanyModalProps {
  companies?: Company[];
  companySelect?:Company;
  onSelect?: (company: Company, favorite: boolean) => void;
  onClose: () => void;
  variant?: 'select' | 'empty' | 'change';
  loading?: boolean;
}

export const SelectCompanyModal = ({ companies = [], onSelect, onClose, variant = 'select', companySelect, loading = false }: SelectCompanyModalProps) => {
  const [selectedTenant, setSelectedTenant] = useState(companySelect?.tenant_id || '');
  const [isFavorite, setIsFavorite] = useState(companySelect?.favorite || false);

  const handleSubmit = () => {
    const company = companies.find(c => c.tenant_id === selectedTenant);
    if (company && onSelect) {
      onSelect(company, isFavorite);
    }
  };

  const handleCompany = (data:Company)=>{

    setSelectedTenant(data.tenant_id)
    setIsFavorite(data.favorite)
  }
  if (variant === 'empty') {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.icon}>🏢</div>
          <h2 className={styles.title}>Sin empresas activas</h2>
          <p className={styles.subtitle}>Usted no tiene empresas activas en este momento</p>

          <div className={styles.actions}>
            <ButtonInitium variant="outlined" onClick={onClose}>
              Salir
            </ButtonInitium>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Seleccione la empresa</h2>
        <p className={styles.subtitle}>Elige la empresa con la que deseas trabajar</p>

        <div className={styles.companyList}>
          {companies.map((company) => (
            <div
              key={company.tenant_id}
              className={`${styles.companyItem} ${selectedTenant === company.tenant_id ? styles.companyItemActive : ''} ${company.blocked ? styles.companyItemBlocked : ''}`}
              onClick={() => !company.blocked && handleCompany(company)}
            >
              <span className={styles.companyLogo}>
                {company.logo && <img src={company.logo} alt={company.name} width={28} height={28} />}
              </span>
              <div className={styles.companyInfo}>
                <span className={styles.companyName}>{company.name}</span>
                <span className={styles.companyType}>{company.rut}-{company.dv}</span>
                <span className={styles.companyType}>{company.type}</span>
              </div>
              {company.favorite && <span className={styles.favBadge}>⭐</span>}
              {company.blocked && <span className={styles.blockedBadge}>Bloqueada</span>}
            </div>
          ))}
        </div>

        <div>
          <input
            type="checkbox"
            id="favorite-check"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
          />
          <label htmlFor="favorite-check">Marcar como favorita</label>
        </div>

        <div className={styles.actions}>
          <ButtonInitium onClick={handleSubmit} disabled={!selectedTenant} loading={loading}>
            Entrar
          </ButtonInitium>
          <ButtonInitium variant="outlined" onClick={onClose}>
            {variant === 'change' ? "volver" : "salir"}
          </ButtonInitium>
        </div>
      </div>
    </div>
  );
};
