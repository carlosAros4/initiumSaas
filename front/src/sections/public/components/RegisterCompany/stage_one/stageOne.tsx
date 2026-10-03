import s from './stageOne.module.css';

interface StageOneProps {
  onRegister: () => void;
  onLogin: () => void;
}

export default function StageOne({ onRegister, onLogin }: StageOneProps) {
  return (
    <div className={s.wrapper}>
      <div className={s.icon}>🏢</div>
      <h3 className={s.title}>Para crear tu empresa necesitas una cuenta</h3>
      <p className={s.desc}>
        Si ya tienes una cuenta inicia sesión, de lo contrario regístrate gratis
        y comienza a gestionar tu empresa en minutos.
      </p>

      <div className={s.options}>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} onClick={onRegister}>
          <span className={s.btnIcon}>✨</span>
          <div className={s.btnText}>
            <strong>Regístrate gratis</strong>
            <small>Crea tu cuenta en menos de 2 minutos</small>
          </div>
          <span className={s.btnArrow}>→</span>
        </button>

        <div className={s.divider}>
          <span>o si ya tienes cuenta</span>
        </div>

        <button type="button" className={`${s.btn} ${s.btnSecondary}`} onClick={onLogin}>
          <span className={s.btnIcon}>🔑</span>
          <div className={s.btnText}>
            <strong>Iniciar sesión</strong>
            <small>Accede con tu cuenta existente</small>
          </div>
          <span className={s.btnArrow}>→</span>
        </button>
      </div>
    </div>
  );
}
