import { useState } from 'react';
import s from './Login.module.css';
import AlertInitium from '../../../transversal/ui/Alert/Alert';
import ButtonInitium from '../../../transversal/ui/Button/ButtonInitium';
import { useCallApi } from '../../../../hooks/useCallApi';

interface ChangePasswordProps {
  /** Contraseña actual (por defecto, el RUT con el que ingresó el usuario nuevo). */
  currentPassword: string;
  /** Se invoca cuando la contraseña fue cambiada correctamente. */
  onChanged: () => void | Promise<void>;
}

interface FormState {
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword({ currentPassword, onChanged }: ChangePasswordProps) {
  const { fetcher } = useCallApi();
  const [form, setForm] = useState<FormState>({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [alert, setAlert] = useState<{ title: string; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.newPassword) {
      e.newPassword = 'La nueva contraseña es requerida';
    } else if (form.newPassword.length < 6) {
      e.newPassword = 'Debe tener al menos 6 caracteres';
    }
    if (!form.confirmPassword) {
      e.confirmPassword = 'Confirma la nueva contraseña';
    } else if (form.newPassword !== form.confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden';
    }
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setAlert(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    submit();
  };

  const submit = () => {
    setAlert(null);
    setLoading(true);
    fetcher({
      method: 'POST',
      clientType: 'InitiumSaaS-Private',
      path: 'session/change-password',
      body: {
        currentPassword,
        newPassword: form.newPassword,
      },
    })
      .then(() => {
        // Mantener el loading activo mientras onChanged (post-login +
        // navegación) termina. No apagamos el loading en el camino feliz
        // para que el botón no vuelva a ser clicable antes de entrar.
        return onChanged();
      })
      .catch((error) => {
        setLoading(false);
        if (error?.status === 401) {
          setAlert({ title: 'No autorizado', message: 'La contraseña actual no es válida.' });
        } else if (error?.status === 400) {
          setAlert({ title: 'Contraseña inválida', message: 'La nueva contraseña debe ser distinta a la actual.' });
        } else {
          setAlert({ title: 'Error del servicio', message: 'No se pudo cambiar la contraseña. Inténtalo nuevamente.' });
        }
      });
  };

  return (
    <div className={s.wrapper}>
      <div className={s.icon}>🔒</div>
      <h3 className={s.title}>Cambia tu contraseña</h3>
      <p className={s.desc}>
        Es tu primer ingreso. Por seguridad, debes definir una nueva contraseña antes de continuar.
      </p>

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="new-password">Nueva contraseña</label>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            placeholder="Nueva contraseña"
            className={`${s.input}${errors.newPassword ? ` ${s.inputError}` : ''}`}
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.newPassword && <span className={s.error}>{errors.newPassword}</span>}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="confirm-password">Confirmar contraseña</label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            placeholder="Repite la nueva contraseña"
            className={`${s.input}${errors.confirmPassword ? ` ${s.inputError}` : ''}`}
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.confirmPassword && <span className={s.error}>{errors.confirmPassword}</span>}
        </div>

        <ButtonInitium fullWidth disabled={loading} type="submit">
          {loading ? 'Guardando…' : 'Guardar y continuar'}
        </ButtonInitium>

        {alert && (
          <AlertInitium variant="error" title={alert.title} message={alert.message} />
        )}
      </form>
    </div>
  );
}
