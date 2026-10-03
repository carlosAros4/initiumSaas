import s from './ServiceError.module.css';

interface ServiceErrorProps {
  /** Título principal del error */
  title?: string;
  /** Mensaje descriptivo */
  message?: string;
  /** Texto del botón de reintentar */
  retryLabel?: string;
  /** Callback al hacer clic en reintentar */
  onRetry?: () => void;
  className?: string;
}

export default function ServiceError({
  title = 'Error de servicio',
  message = 'No pudimos conectar con el servidor. Verifica tu conexión e intenta nuevamente.',
  retryLabel = 'Reintentar',
  onRetry,
  className,
}: ServiceErrorProps) {
  return (
    <div
      className={`${s.container}${className ? ` ${className}` : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={s.iconWrapper}>
        <svg
          className={s.icon}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>

      <h2 className={s.title}>{title}</h2>
      <p className={s.message}>{message}</p>

      {onRetry && (
        <button type="button" className={s.retryBtn} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
