import { useEffect, type ReactNode } from 'react';
import s from './ModalLateral.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Ancho del panel en desktop (default: 480px) */
  width?: string;
}

export default function ModalLateral({
  open,
  onClose,
  title,
  children,
  width = '480px',
}: ModalProps) {

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className={`${s.overlay}${open ? ` ${s.overlayOpen}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${s.panel}${open ? ` ${s.panelOpen}` : ''}`}
        style={{ '--panel-width': width } as React.CSSProperties}
      >
        <div className={s.handle} />

        <div className={s.header}>
          {title && <h2 className={s.title}>{title}</h2>}
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            ✕
          </button>
        </div>

        <div className={s.body}>{children}</div>
      </div>
    </>
  );
}
