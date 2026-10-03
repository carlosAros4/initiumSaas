import s from './Spinner.module.css';

type SpinnerSize    = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor   = 'primary' | 'white' | 'green' | 'gray';

interface SpinnerProps {
  size?:    SpinnerSize;
  color?:   SpinnerColor;
  /** Muestra un overlay de pantalla completa con fondo difuminado */
  overlay?: boolean;
  /** Contenedor centrado de ancho completo (reemplaza div.loading externo) */
  isVisibleModule?: boolean;
  /** Texto debajo del spinner (solo en overlay) */
  label?:   string;
  className?: string;
}

export default function Spinner({
  size    = 'md',
  color   = 'primary',
  overlay = false,
  isVisibleModule = false,
  label,
  className,
}: SpinnerProps) {
  const circle = (
    <span
      className={`${s.circle} ${s[size]} ${s[color]}${className ? ` ${className}` : ''}`}
      role="status"
      aria-label="Cargando"
    />
  );

  if (overlay) {
    return (
      <div className={s.overlay} aria-live="polite">
        <div className={s.wrapper}>{circle}</div>
        {label && <p className={s.overlayLabel}>{label}</p>}
      </div>
    );
  }

  if (isVisibleModule) {
    return (
      <div className={s.loading}>
        <div className={s.wrapper}>{circle}</div>
      </div>
    );
  }

  return <div className={s.wrapper}>{circle}</div>;
}
