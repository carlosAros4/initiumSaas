import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Login.module.css';
import AlertInitium from '../../../transversal/ui/Alert/Alert';
import ButtonInitium from '../../../transversal/ui/Button/ButtonInitium';
import ChangePassword from './ChangePassword';
import { useCallApi } from '../../../../hooks/useCallApi';
import { useAuth } from '../../../../context/login/AuthContext';
import { formatRut, validateRut } from '../../../../utils/rut';

interface LoginProps {
  onSuccess?: () => void;
}

interface loginResponse {
  verified: boolean;
  blocked: boolean;
  newUsers: boolean;
}

export default function Login({ onSuccess }: LoginProps) {
  const { fetcher } = useCallApi();
  const navigate = useNavigate();
  const [form, setForm] = useState({ rut: '', password: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [alert, setAlert] = useState<{ title: string; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const { registerLogin } = useAuth();
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
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
    fetcher<loginResponse>({
      method: 'POST',
      clientType: 'InitiumSaaS-Public',
      path: 'auth/session',
      body: {
        rut: form.rut,
        password: form.password,
        isLogin: true
      },
    })
      .then((data) => {
        if (data?.blocked) {
          setAlert({ title: 'Usuario bloqueado', message: 'Tu cuenta se encuentra bloqueada.' });
          return;
        }
        // Usuario nuevo: debe cambiar la contraseña antes de entrar
        if (data?.newUsers) {
          setMustChangePassword(true);
          return;
        }
        // Flujo normal: post-login + ingreso
        return enterApp();
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

  // post-login (establece sesión completa) y navega al área privada.
  const enterApp = () => {
    return fetcher({
      method: 'POST',
      clientType: 'InitiumSaaS-Private',
      path: 'post-login',
    })
      .then(() => {
        registerLogin();
        navigate('/site', { replace: true });
        onSuccess?.();
      });
  };

  if (mustChangePassword) {
    return (
      <ChangePassword
        currentPassword={form.password}
        onChanged={() => enterApp()}
      />
    );
  }

  return (
    <div className={s.wrapper}>
      <div className={s.icon}>🔑</div>
      <h3 className={s.title}>Iniciar sesión</h3>
      <p className={s.desc}>Ingresa tus credenciales para acceder a tu cuenta</p>

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
        <ButtonInitium fullWidth disabled={loading} type='submit'>

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
