import { createContext, useContext, } from 'react';


interface AuthContextType {
  flagLogin: boolean;
  logout: () => void;
  registerLogin:()=>void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
