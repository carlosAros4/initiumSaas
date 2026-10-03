import { useState } from 'react';
import style from '../ProfilesTab.module.css';
import type { ProfileWithAccess } from '../ProfilesTab';
import { useCallApi } from '../../../../../../../hooks/useCallApi';
import AlertInitium from '../../../../../../transversal/ui/Alert/Alert';

interface DeleteProfileConfirmProps {
  profile: ProfileWithAccess;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DeleteProfileConfirm({ profile, onSuccess, onCancel }: DeleteProfileConfirmProps) {
  const { fetcher } = useCallApi();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleDelete() {
    setSubmitting(true);
    setErrorMsg('');

    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: `settings/profiles/${profile.id}`,
        method: 'DELETE',
      });
      onSuccess();
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string }; status?: number };
      if (errorData?.status && errorData.status >= 400 && errorData.status < 500 && errorData?.data?.message) {
        setErrorMsg(errorData.data.message);
      } else {
        setErrorMsg('Ocurrió un error al eliminar el perfil. Intenta nuevamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {errorMsg && <AlertInitium variant="error" title="Error" message={errorMsg} />}

      <p className={style.deleteText}>
        ¿Estás seguro de que deseas eliminar el perfil <strong>{profile.name}</strong>?
      </p>
      <p className={style.deleteWarning}>
        Se eliminarán sus permisos y se desasignarán los {profile.userCount} usuario(s) asociados. Esta acción no se puede deshacer.
      </p>

      <div className={style.modalActions}>
        <button type="button" className={style.btnCancel} onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button
          type="button"
          className={`${style.btnPrimary} ${style.btnDangerFill}`}
          onClick={handleDelete}
          disabled={submitting}
        >
          {submitting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
}
