import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './StageTwoCompany.module.css';
import { useRegisterCompany } from '../../../../../hooks/useRegisterCompany';
import { useCallApi } from '../../../../../hooks/useCallApi';
import { useAuth } from '../../../../../context/login/AuthContext';
import { formatRut, validateRut } from '../../../../../utils/rut';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';
import Spinner from '../../../../transversal/ui/Spinner/Spinner';
import AlertInitium from '../../../../transversal/ui/Alert/Alert';

const REDIRECT_SECONDS = 5;


interface StageTwoCompanyProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

interface CompanyForm {
  name: string;
  rut: string;
  type: string;
  branchName: string;
}

type FormErrors = Partial<Record<keyof CompanyForm, string>>;

interface typeCompanies{
  companies:company[]
}

interface company {
  name: string;
  id: number;
}
export default function StageTwoCompany({ onBack, onSuccess }: StageTwoCompanyProps) {
  const {data:dataCli} = useRegisterCompany();
  const { useFetch,fetcher} = useCallApi();
  const { registerLogin } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useFetch<typeCompanies>({
    clientType: 'InitiumSaaS-Public',
    path: 'company/type',
    token:dataCli.accessToken
  })

  const [form, setForm] = useState<CompanyForm>({ name: '', rut: '', type: '', branchName: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<{ title: string; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [tenantId, setTenantId] = useState<string | undefined>(undefined);
  const enteredRef = useRef(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'El nombre de la empresa es requerido';
    if (!form.rut.trim()) {
      e.rut = 'El RUT de la empresa es requerido';
    } else if (!validateRut(form.rut)) {
      e.rut = 'RUT inválido';
    }
    if (!form.type) e.type = 'Selecciona el tipo de empresa';
    if (!form.branchName.trim()) e.branchName = 'El nombre de la sede es requerido';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setAlert(null);
    submit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const parsed = name === 'rut' ? formatRut(value) : value;
    setForm(prev => ({ ...prev, [name]: parsed }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const submit = () => {
    setLoading(true);
    fetcher<{ data?: string }>({
      clientType: 'InitiumSaaS-Public',
      path: 'company',
      method: 'POST',
      token:dataCli.accessToken,
      body: {
        name: form.name,
        rut: form.rut,
        type: form.type,
        branchName: form.branchName,
        token:dataCli.accessToken,
        refresh:dataCli.refresh
      }
    })
      .then((resp) => {
        setLoading(false);
        // tenant_id de la empresa recién creada (opcional)
        setTenantId(resp?.data);
        setCreated(true);
        if (onSuccess) onSuccess();
      })
      .catch((err) => {
        setLoading(false);
        setAlert({
          title: 'Error al crear la empresa',
          message: err.message || 'Ocurrió un error inesperado'
        });
      });

  };

  // Ingresa automáticamente a la cuenta: establece la sesión (cookies) vía
  // post-login usando el token del onboarding y navega al área privada.
  const enterAccount = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    fetcher({
      method: 'POST',
      clientType: 'InitiumSaaS-Private',
      path: 'post-login',
      token: dataCli.accessToken,
      // tenant_id es opcional: si viene, post-login selecciona esa empresa
      ...(tenantId ? { body: { tenant_id: tenantId } } : {}),
    })
      .then(() => {
        registerLogin();
        navigate('/site', { replace: true });
      })
      .catch(() => {
        // Si falla el ingreso automático, permitimos reintentar manualmente.
        enteredRef.current = false;
        setAlert({
          title: 'No se pudo iniciar sesión automáticamente',
          message: 'Tu empresa fue creada. Intenta ingresar manualmente.',
        });
      });
  };

  // Cuenta regresiva de 5s tras crear la empresa; al llegar a 0 ingresa.
  useEffect(() => {
    if (!created) return;

    if (countdown <= 0) {
      enterAccount();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [created, countdown]);
  if (isLoading) {
    return (<Spinner size="xl" />)
  }

  // Vista de éxito con cuenta regresiva e ingreso automático
  if (created) {
    return (
      <div className={s.successWrap}>
        <div className={s.successIcon}>✓</div>
        <h3 className={s.title}>¡Empresa creada con éxito!</h3>
        <p className={s.desc}>
          Tu espacio de trabajo está listo. Te llevaremos a tu cuenta en unos segundos.
        </p>

        <AlertInitium
          variant="success"
          title="Todo listo"
          message={`Ingresando a "${form.name}"…`}
        />

        <p className={s.countdown}>
          Redirigiendo en <strong>{countdown}</strong> segundo{countdown === 1 ? '' : 's'}…
        </p>

        <ButtonInitium fullWidth onClick={enterAccount}>
          Ingresar ahora
        </ButtonInitium>

        {alert && (
          <AlertInitium variant="error" title={alert.title} message={alert.message} />
        )}
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
       <div className={s.volver}>

      <ButtonInitium variant="text" onClick={onBack}>
        ← Volver
      </ButtonInitium>
       </div>

      <div className={s.icon}>🏢</div>
      <h3 className={s.title}>Cuéntanos sobre tu empresa</h3>
      <p className={s.desc}>Esta información nos ayuda a configurar tu espacio de trabajo</p>

      <form className={s.form} onSubmit={handleSubmit} noValidate>

        <div className={s.field}>
          <label className={s.label} htmlFor="co-name">Nombre de la empresa</label>
          <input
            id="co-name"
            name="name"
            type="text"
            placeholder="Empresa S.A."
            className={`${s.input}${errors.name ? ` ${s.inputError}` : ''}`}
            value={form.name}
            onChange={handleChange}
            autoComplete="organization"
          />
          {errors.name && <span className={s.error}>{errors.name}</span>}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="co-rut">RUT empresa</label>
          <input
            id="co-rut"
            name="rut"
            type="text"
            placeholder="76.123.456-7"
            className={`${s.input}${errors.rut ? ` ${s.inputError}` : ''}`}
            value={form.rut}
            onChange={handleChange}
            maxLength={12}
            autoComplete="off"
          />
          {errors.rut && <span className={s.error}>{errors.rut}</span>}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="co-type">Tipo de empresa</label>
          <select
            id="co-type"
            name="type"
            className={`${s.select}${errors.type ? ` ${s.selectError}` : ''}`}
            value={form.type}
            onChange={handleChange}
          >
            <option value="" disabled>Seleccionar…</option>
            {data?.companies.map(map => (
              <option key={map.id} value={map.id}>{map.name}</option>
            ))}
          </select>
          {errors.type && <span className={s.error}>{errors.type}</span>}
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="co-branch">Nombre de la sede principal</label>
          <input
            id="co-branch"
            name="branchName"
            type="text"
            placeholder="Ej: Sede Santiago, Casa Matriz, Sucursal Centro"
            className={`${s.input}${errors.branchName ? ` ${s.inputError}` : ''}`}
            value={form.branchName}
            onChange={handleChange}
            autoComplete="off"
          />
          {errors.branchName && <span className={s.error}>{errors.branchName}</span>}
        </div>

        <ButtonInitium fullWidth disabled={loading} type="submit">
          {loading ? 'Guardando…' : 'Continuar'}
        </ButtonInitium>

        {alert && (
          <AlertInitium variant="error" title={alert.title} message={alert.message} />
        )}
      </form>
    </div>
  );
}
