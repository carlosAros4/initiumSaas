import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInactivityOptions {
  /** Tiempo de inactividad antes de activar la modal */
  timeout?: number;
  /** Intervalo para refresh automatico */
  refreshInterval?: number;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

export function useInactivity({
  timeout = 5 * 60 * 1000,
  refreshInterval = 3 * 60 * 1000,
  onRefresh,
  onLogout,
}: UseInactivityOptions) {
  const [showModal, setShowModal] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (showModal) return;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      setShowModal(true);
    }, timeout);
  }, [timeout, showModal]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetInactivityTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [resetInactivityTimer]);

  // Auto-refresh cada 3 minutos
  useEffect(() => {
    refreshTimer.current = setInterval(() => {
      if (!showModal) {
        onRefresh().catch(() => {
          onLogout();
        });
      }
    }, refreshInterval);

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [refreshInterval, onRefresh, onLogout, showModal]);

  const handleContinue = useCallback(() => {
    setShowModal(false);
    // Refrescar token al continuar
    onRefresh().catch(() => {
      onLogout();
    });
    // Resetear el timer de inactividad
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setShowModal(true);
    }, timeout);
  }, [onRefresh, onLogout, timeout]);

  const handleLogout = useCallback(() => {
    setShowModal(false);
    onLogout();
  }, [onLogout]);

  return {
    showInactivityModal: showModal,
    handleContinue,
    handleLogout,
  };
}
