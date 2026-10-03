import { useEffect, type ReactNode } from 'react';
import s from './CenterModal.module.css';

interface CenterModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Ancho del modal (default: 520px) */
  width?: string;
}

export default function CenterModal({
  open,
  onClose,
  title,
  children,
  width = '520px',
}: CenterModalProps) {

  // Cierra con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Bloquea scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`${s.overlay}${open ? ` ${s.overlayOpen}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel centrado */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`${s.panel}${open ? ` ${s.panelOpen}` : ''}`}
        style={{ '--modal-width': width } as React.CSSProperties}
      >
        {/* Header */}
        <div className={s.header}>
          {title && <h2 className={s.title}>{title}</h2>}
          <button
            type="button"
            className={s.closeBtn}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className={s.body}>{children}</div>
      </div>
    </>
  );
}
