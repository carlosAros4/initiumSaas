import { useState } from 'react';
import s from './StageOneLogin.module.css';
import type { Stage } from '../RegisterCompany';
import { useCallApi } from '../../../../../hooks/useCallApi';
import { useRegisterCompany } from '../../../../../hooks/useRegisterCompany';
import { formatRut, validateRut } from '../../../../../utils/rut';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';
import AlertInitium from '../../../../transversal/ui/Alert/Alert';

interface StageOneLoginProps {
  onBack: () => void;
  onSuccess?: (stage: Stage) => void;
}
export interface loginResponse {
  accessToken: string,
  verified: boolean,
  refresh:string,
  blocked: boolean
}

export default function StageOneLogin({ onBack, onSuccess }: StageOneLoginProps) {
  const { fetcher } = useCallApi();
  const {setData} = useRegisterCompany();
  const [form, setForm] = useState({ rut: '', password: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [alert, setAlert] = useState<{ title: string; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.rut.trim()) {
      e.rut = 'El RUT es requerido';
    } else if (!validateRut(form.rut)) {
      e.rut = 'RUT inválido';
    }
    if (!form.password) e.password = 'La contraseña es requerida';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    login();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsed = name === 'rut' ? formatRut(value) : value;
    setForm(prev => ({ ...prev, [name]: parsed }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setAlert(null);
  };

  const login = () => {
    setAlert(null);
    setLoading(true);
    fetcher({
      method: 'POST',
      clientType: 'InitiumSaaS-Public',
      path: 'auth/session',
      body: {
        rut: form.rut,
        password: form.password,
        isLogin: false
      },
    })
      .then((data: loginResponse) => {
        if (data.blocked) {
          setAlert({ title: 'Usuario Bloqueado', message: 'El RUT se encuentra bloqueado.' });
          return;
        }
        setData({
          accessToken:data.accessToken,
          rutClient:form.rut,
          refresh:data.refresh,
          verify:data.verified
        })
        if (!data.verified) {
          onSuccess?.('verify');
          return;
        }
        onSuccess?.('company');
      })
      .catch((error) => {
        if (error?.status === 401) {
          setAlert({ title: 'Credenciales incorrectas', message: 'El RUT o la contraseña no son válidos.' });
        } else {
          setAlert({ title: 'Error del servicio', message: 'No se pudo iniciar sesión. Inténtalo nuevamente.' });
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className={s.wrapper}>
       <div className={s.volver}>
      <ButtonInitium variant="text" onClick={onBack}>
        ← Volver
      </ButtonInitium>

       </div>
      <div className={s.icon}>🔑</div>
      <h3 className={s.title}>Bienvenido de vuelta</h3>
      <p className={s.desc}>Inicia sesión para continuar con la gestión de tu empresa</p>

      <form className={s.form} onSubmit={handleSubmit} noValidate>

        <div className={s.field}>
          <label className={s.label} htmlFor="login-rut">RUT</label>
          <input
            id="login-rut"
            name="rut"
            type="text"
            placeholder="12.345.678-9"
            className={`${s.input}${errors.rut ? ` ${s.inputError}` : ''}`}
            value={form.rut}
            onChange={handleChange}
            maxLength={12}
            autoComplete="off"
          />
          {errors.rut && <span className={s.error}>{errors.rut}</span>}
        </div>

        <div className={s.field}>
          <div className={s.labelRow}>
            <label className={s.label} htmlFor="login-password">Contraseña</label>
            <ButtonInitium variant="text" size="sm">¿Olvidaste tu contraseña?</ButtonInitium>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            className={`${s.input}${errors.password ? ` ${s.inputError}` : ''}`}
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          {errors.password && <span className={s.error}>{errors.password}</span>}
        </div>

        <ButtonInitium fullWidth disabled={loading} type="submit">
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </ButtonInitium>

        {alert && (
          <AlertInitium
            variant="error"
            title={alert.title}
            message={alert.message}
          />
        )}
      </form>
    </div>
  );
}
