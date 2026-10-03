import { useEffect, useState } from 'react';
import styles from './InactivityModal.module.css';
import ButtonInitium from '../../../../transversal/ui/Button/ButtonInitium';

interface InactivityModalProps {
  onContinue: () => void;
  onLogout: () => void;
  countdownSeconds?: number;
}

export const InactivityModal = ({ onContinue, onLogout, countdownSeconds = 50 }: InactivityModalProps) => {
  const [seconds, setSeconds] = useState(countdownSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onLogout();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onLogout]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.icon}>⏳</div>
        <h2 className={styles.title}>Sesión inactiva</h2>
        <p className={styles.subtitle}>
          No hemos detectado actividad. Tu sesión se cerrará automáticamente.
        </p>
        <div className={styles.countdown}>{seconds}s</div>
        <div className={styles.actions}>
          <ButtonInitium onClick={onContinue}>
            Quiero continuar
          </ButtonInitium>
          <ButtonInitium variant="outlined" onClick={onLogout}>
            Salir
          </ButtonInitium>
        </div>
      </div>
    </div>
  );
};

export default InactivityModal;
