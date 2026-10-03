import s from './Alert.module.css';

type AlertVariant = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  className?: string;
}
export default function AlertInitium({ variant = 'error', title, message, className }: AlertProps) {
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
