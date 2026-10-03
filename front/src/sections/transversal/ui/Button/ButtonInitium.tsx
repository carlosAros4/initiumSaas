import type { ReactNode, ButtonHTMLAttributes } from 'react';
import s from './ButtonInitium.module.css';

type Variant = 'contained' | 'outlined' | 'text';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  /** Renderiza como <a> en vez de <button> */
  href?: string;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export default function ButtonInitium({
  variant = 'contained',
  size = 'md',
  startIcon,
  endIcon,
  href,
  fullWidth = false,
  loading = false,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const classes = [
    s.btn,
    s[variant],
    s[size],
    fullWidth ? s.fullWidth : '',
    isDisabled ? s.disabled : '',
    loading ? s.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href && !isDisabled) {
    return (
      <a href={href} className={classes}>
        {startIcon && <span className={s.icon}>{startIcon}</span>}
        <span>{children}</span>
        {endIcon && <span className={s.icon}>{endIcon}</span>}
      </a>
    );
  }

  return (
    <button type="button" className={classes} disabled={isDisabled} {...rest}>
      {loading && <span className={s.spinner} />}
      {startIcon && !loading && <span className={s.icon}>{startIcon}</span>}
      <span>{children}</span>
      {endIcon && !loading && <span className={s.icon}>{endIcon}</span>}
    </button>
  );
}
