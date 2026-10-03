import { useState } from 'react';
import s from './StageOneVerify.module.css';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';
import AlertInitium from '../../../../transversal/ui/Alert/Alert';

interface StageOneVerifyProps {
  onBack: () => void;
  onSuccess?: () => void;
  /** Email o medio al que se envió el código, para mostrarlo en el descriptor */
  destination?: string;
}

type ViewState = 'form' | 'success';

export default function StageOneVerify({ onBack, onSuccess, destination }: StageOneVerifyProps) {
  const [code, setCode]         = useState('');
  const [codeError, setCodeError] = useState('');
  const [alert, setAlert]       = useState<{ title: string; message?: string } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [view, setView]         = useState<ViewState>('form');

  const validate = (): boolean => {
    if (!code.trim()) {
      setCodeError('Ingresa el código de verificación');
      return false;
    }
    if (code.trim().length < 4) {
      setCodeError('El código debe tener al menos 4 caracteres');
      return false;
    }
    setCodeError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setAlert(null);
    verify();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo dígitos, máximo 6
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(val);
    setCodeError('');
    setAlert(null);
  };

  const verify = () => {
    setLoading(true);

    // TODO: reemplazar con llamada real al endpoint de verificación
    setTimeout(() => {
      setLoading(false);

      // Simulación: código "000000" falla, cualquier otro pasa
      if (code === '0000') {
        setAlert({ title: 'Código incorrecto', message: 'Verifica el código e inténtalo de nuevo.' });
        return;
      }

      setView('success');
      setTimeout(() => onSuccess?.(), 2200);
    }, 1200);
  };

  /* ── Vista de éxito ── */
  if (view === 'success') {
    return (
      <div className={s.wrapper}>
        <div className={s.successWrapper}>

          <div className={s.iconStage}>
            <div className={s.haloOuter} />
            <div className={s.haloInner} />

            <div className={s.checkCircle}>
              <svg viewBox="0 0 52 52" fill="none" aria-hidden="true" className={s.checkSvg}>
                <polyline
                  points="14,27 22,35 38,18"
                  stroke="#fff"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Bolitas flotantes */}
            <span className={`${s.dot} ${s.dotTL}`} />
            <span className={`${s.dot} ${s.dotTR}`} />
            <span className={`${s.dot} ${s.dotBL}`} />
            <span className={`${s.dot} ${s.dotBR}`} />
          </div>

          <p className={s.successTitle}>¡Cuenta verificada con éxito!</p>
          <p className={s.successDesc}>
            Tu cuenta ha sido confirmada correctamente.<br />
            Serás dirigido al proceso de creación de tu empresa.
          </p>
        </div>
      </div>
    );
  }

  /* ── Vista del formulario ── */
  return (
    <div className={s.wrapper}>
       <div className={s.volver}>

      <ButtonInitium variant="text" onClick={onBack}>
        ← Volver
      </ButtonInitium>
       </div>

      <div className={s.icon}>📩</div>
      <h3 className={s.title}>Verifica tu cuenta</h3>
      <p className={s.desc}>
        {destination
          ? <>Ingresa el código que enviamos a <strong>{destination}</strong></>
          : 'Ingresa el código de verificación que recibiste'}
      </p>

      <form className={s.form} onSubmit={handleSubmit} noValidate>
        <div className={s.field}>
          <label className={s.label} htmlFor="verify-code">Código de verificación</label>
          <input
            id="verify-code"
            name="code"
            type="text"
            inputMode="numeric"
            placeholder="······"
            maxLength={6}
            className={`${s.codeInput}${codeError ? ` ${s.codeInputError}` : ''}`}
            value={code}
            onChange={handleChange}
            autoComplete="one-time-code"
            autoFocus
          />
          {codeError && <span className={s.error}>{codeError}</span>}
        </div>

        <ButtonInitium fullWidth disabled={loading} type="submit">
          {loading ? 'Verificando…' : 'Verificar código'}
        </ButtonInitium>

        <ButtonInitium
          variant="text"
          fullWidth
          disabled={loading}
          onClick={() => {
            setAlert({ title: 'Código reenviado', message: 'Revisa tu correo o teléfono.' });
          }}
        >
          ¿No recibiste el código? Reenviar
        </ButtonInitium>

        {alert && (
          <AlertInitium
            variant={alert.title.includes('reenviado') ? 'info' : 'error'}
            title={alert.title}
            message={alert.message}
          />
        )}
      </form>
    </div>
  );
}
