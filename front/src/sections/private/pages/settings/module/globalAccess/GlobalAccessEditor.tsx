import { useEffect, useState } from 'react';
import styles from './GlobalAccess.module.css';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import Spinner from '../../../../../transversal/ui/Spinner/Spinner';
import ButtonInitium from '../../../../../transversal/ui/Button/ButtonInitium';
import AlertInitium from '../../../../../transversal/ui/Alert/Alert';
import type { GlobalPageAccess, GlobalAccessRuleTree, GlobalAccessUser } from './GlobalAccess';

interface GlobalAccessEditorProps {
  user: GlobalAccessUser;
  pages: GlobalPageAccess[];
  onBack: () => void;
}

interface UserGlobalAccessResponse {
  accessKeys: string[];
}

export const GlobalAccessEditor = ({ user, pages, onBack }: GlobalAccessEditorProps) => {
  const { useFetch, fetcher } = useCallApi();
  const { data, isLoading } = useFetch<UserGlobalAccessResponse>({
    clientType: 'InitiumSaaS-Private',
    path: `settings/global-access/users/${user.id}`,
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (data?.accessKeys) {
      setSelected(new Set(data.accessKeys));
    }
  }, [data]);

  const toggleKey = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Al marcar/desmarcar el padre, arrastra a los hijos
  const toggleParent = (parent: GlobalAccessRuleTree) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const isOn = next.has(parent.key);
      if (isOn) {
        next.delete(parent.key);
        parent.children.forEach((c) => next.delete(c.key));
      } else {
        next.add(parent.key);
      }
      return next;
    });
  };

  // Reúne todas las keys propias de una página (acceso de página + acciones).
  const collectPageKeys = (page: GlobalPageAccess): string[] => {
    const keys: string[] = [];
    const walk = (nodes: GlobalAccessRuleTree[]) => {
      for (const n of nodes) {
        keys.push(n.key);
        if (n.children.length > 0) walk(n.children);
      }
    };
    walk(page.rules);
    return keys;
  };

  // Resuelve el set final a enviar: lo seleccionado por el usuario + los
  // accesos de los módulos padre (nivel 1) requeridos por cada página que
  // tenga al menos un acceso marcado.
  const resolveAccessKeys = (): string[] => {
    const final = new Set(selected);
    for (const page of pages) {
      const pageKeys = collectPageKeys(page);
      const hasAny = pageKeys.some((k) => selected.has(k));
      if (hasAny) {
        page.requiredParentKeys.forEach((k) => final.add(k));
      }
    }
    return Array.from(final);
  };

  const handleSave = () => {
    setSaving(true);
    setAlert(null);
    fetcher({
      clientType: 'InitiumSaaS-Private',
      path: `settings/global-access/users/${user.id}`,
      method: 'PUT',
      body: { accessKeys: resolveAccessKeys() },
    })
      .then(() => {
        setSaving(false);
        setAlert({ variant: 'success', message: 'Accesos globales actualizados correctamente.' });
      })
      .catch(() => {
        setSaving(false);
        setAlert({ variant: 'error', message: 'No se pudieron guardar los cambios. Intenta nuevamente.' });
      });
  };

  if (isLoading) return <Spinner size="md" />;

  return (
    <div className={styles.wrapper}>
      <div className={styles.editorHeader}>
        <button className={styles.backBtn} onClick={onBack}>← Volver</button>
        <div className={styles.editorUser}>
          <span className={styles.cardName}>{user.name}</span>
          <span className={styles.cardDetail}>{user.email} · {user.rut}</span>
        </div>
      </div>

      {alert && (
        <AlertInitium variant={alert.variant} message={alert.message} />
      )}

      <div className={styles.pagesGrid}>
        {pages.map((page) => (
          <div key={page.pageId} className={styles.pageCard}>
            <h4 className={styles.pageTitle}>{page.pageName}</h4>
            {page.requiredParentLabels.length > 0 && (
              <p className={styles.requiredNote}>
                Requiere también: {page.requiredParentLabels.join(', ')}
              </p>
            )}
            {page.rules.map((parent) => {
              const parentChecked = selected.has(parent.key);
              return (
                <div key={parent.id} className={styles.ruleGroup}>
                  <label className={styles.ruleParent}>
                    <input
                      type="checkbox"
                      checked={parentChecked}
                      onChange={() => toggleParent(parent)}
                    />
                    <span>{parent.descripcion || parent.key}</span>
                  </label>

                  {parent.children.length > 0 && (
                    <div className={styles.ruleChildren}>
                      {parent.children.map((child) => (
                        <label key={child.id} className={styles.ruleChild}>
                          <input
                            type="checkbox"
                            checked={selected.has(child.key)}
                            disabled={!parentChecked}
                            onChange={() => toggleKey(child.key)}
                          />
                          <span>{child.descripcion || child.key}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className={styles.editorActions}>
        <ButtonInitium size="sm" onClick={handleSave} loading={saving}>
          Guardar accesos
        </ButtonInitium>
        <ButtonInitium size="sm" variant="outlined" onClick={onBack}>
          Cancelar
        </ButtonInitium>
      </div>
    </div>
  );
};
