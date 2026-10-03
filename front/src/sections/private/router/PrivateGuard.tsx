import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/login/AuthContext';
import { SessionProvider } from '../../../context/session/SessionContextProvider';
import Transition from '../../../transition';

export function PrivateGuard() {
  const { flagLogin } = useAuth();

  if (!flagLogin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SessionProvider>
      <Transition />
    </SessionProvider>
  );
}
