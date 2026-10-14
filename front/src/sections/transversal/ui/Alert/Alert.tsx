import { useEffect } from 'react';
import s from './Alert.module.css';

export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
  /** Callback invocado para cerrar/eliminar la alerta. */
  onClose?: () => void;
  /** Tiempo (ms) tras el cual se auto-cierra una alerta success. Por defecto 4000. */
  autoCloseMs?: number;
}
export default function AlertInitium({
  variant = 'error',
  title,
  message,
  className,
  onClose,
  autoCloseMs = 4000,
}: AlertProps) {
  useEffect(() => {
    if (variant !== 'success' || !onClose) return;
    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
  }, [variant, message, onClose, autoCloseMs]);

  return (
    <div
      className={`${s.alert} ${s[variant]}${className ? ` ${className}` : ''}`}
      role="alert"
      aria-live="assertive"
    >
     
      <div className={s.alertContent}>
        {title && <p className={s.alertTitle}>{title}</p>}
        <p className={s.alertMessage}>{message}</p>
      </div>
    </div>
  );
}
