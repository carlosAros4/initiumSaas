import { useState } from 'react';
import s from './StageOneRegister.module.css';
import { useCallApi } from '../../../../../hooks/useCallApi';
import { useRegisterCompany } from '../../../../../hooks/useRegisterCompany';
import { formatRut, validateRut } from '../../../../../utils/rut';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';
import AlertInitium from '../../../../transversal/ui/Alert/Alert';

interface StageOneRegisterProps {
  onBack: () => void;
  onSuccess?: (data) => void;
}
export interface registerResponse {
  accessToken: string,
}
// ───────────────────────────────────────────────────────────

export default function StageOneRegister({ onBack, onSuccess }: StageOneRegisterProps) {
  const { fetcher } = useCallApi()
  const [form, setForm] = useState({
    name: '',
    rut: '',
    email: '',
    password: '',
    lastName: '',
    gender: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [alert, setAlert] = useState<{ message?: string; title: string } | null>(null);
  const {setData} = useRegisterCompany();
  const validate = () => {
    const e: Partial<Record<keyof typeof form, string>> = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.rut.trim()) {
      e.rut = 'El RUT es requerido';
    } else if (!validateRut(form.rut)) {
      e.rut = 'RUT inválido';
    }
    if (!form.gender) e.gender = 'El género es requerido';
    if (!form.email.trim()) e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    if (!form.password) e.password = 'La contraseña es requerida';
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.confirm !== form.password) e.confirm = 'Las contraseñas no coinciden';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    register();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsed = name === 'rut' ? formatRut(value) : value;
    setForm(prev => ({ ...prev, [name]: parsed }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const register = () => {
    setAlert(null);
    fetcher({
      method: 'POST', clientType: 'InitiumSaaS-Public', path: 'auth/register',
      body: {
        "rut": form.rut,
        "password": form.password,
        "email": form.email,
        "firstName": form.name,
        "lastName": form.lastName,
        "gender": form.gender,
        "isLoginRegister":true
      },
    })
      .then((data:registerResponse) => { 
         setData({
          accessToken:data.accessToken,
          rutClient:form.rut,
          verify:false
        })
        onSuccess(data) 
      })
      .catch((error) => {

        if (error.status === 409) {
          setAlert({
            title: 'Ya existe una cuenta asociada a los datos ingresados.'
          });
        } else {
          setAlert({
            title: 'Ha ocurrido un error en el servicio. Por favor, inténtelo nuevamente.'
          });
        }
      })
  }

  return (
    <div className={s.wrapper}>
      <div className={s.volver}>
         <ButtonInitium variant="text" onClick={onBack}>
        ← Volver
      </ButtonInitium>
      </div>
     
      <div className={s.icon}>✨</div>
      <h3 className={s.title}>Crea tu cuenta</h3>
      <p className={s.desc}>Completa tus datos para comenzar a gestionar tu empresa</p>

      <form className={s.form} onSubmit={handleSubmit} noValidate>

        <div className={s.field}>
          <label className={s.label} htmlFor="reg-name">Nombre</label>
          <input
            id="reg-name"
            name="name"
            type="text"
            placeholder="Juan"
            className={`${s.input}${errors.name ? ` ${s.inputError}` : ''}`}
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />
          {errors.name && <span className={s.error}>{errors.name}</span>}
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="reg-name">Apellido</label>
          <input
            id="reg-lastName"
            name="lastName"
            type="text"
            placeholder="Pérez"
            className={`${s.input}${errors.lastName ? ` ${s.inputError}` : ''}`}
            value={form.lastName}
            onChange={handleChange}
            autoComplete="name"
          />
          {errors.lastName && <span className={s.error}>{errors.lastName}</span>}
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="reg-gender">Género</label>
          <select
            id="reg-gender"
            name="gender"
            className={`${s.input}${errors.gender ? ` ${s.inputError}` : ''}`}
            value={form.gender}
            onChange={handleChange}
          >
            <option value="" disabled>Selecciona una opción</option>
            <option value="M">Hombre</option>
            <option value="F">Mujer</option>
          </select>
          {errors.gender && <span className={s.error}>{errors.gender}</span>}
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="reg-rut">RUT</label>
          <input
            id="reg-rut"
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
          <label className={s.label} htmlFor="reg-email">Correo electrónico</label>
          <input
            id="reg-email"
            name="email"
            type="email"
            placeholder="juan@empresa.com"
            className={`${s.input}${errors.email ? ` ${s.inputError}` : ''}`}
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <span className={s.error}>{errors.email}</span>}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="reg-password">Contraseña</label>
          <input
            id="reg-password"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            className={`${s.input}${errors.password ? ` ${s.inputError}` : ''}`}
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.password && <span className={s.error}>{errors.password}</span>}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="reg-confirm">Confirmar contraseña</label>
          <input
            id="reg-confirm"
            name="confirm"
            type="password"
            placeholder="Repite tu contraseña"
            className={`${s.input}${errors.confirm ? ` ${s.inputError}` : ''}`}
            value={form.confirm}
            onChange={handleChange}
            autoComplete="new-password"
          />
          {errors.confirm && <span className={s.error}>{errors.confirm}</span>}
        </div>

        <ButtonInitium fullWidth type="submit">
          Crear cuenta
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
