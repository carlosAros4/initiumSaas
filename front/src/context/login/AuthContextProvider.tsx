import { useState, type ReactNode } from "react";
import { v4 as uuid } from "uuid";
import { AuthContext } from "./AuthContext";
import { useCallApi } from "../../hooks/useCallApi";

export function AuthProvider({ children }: { children: ReactNode }) {
  const {fetcher} = useCallApi()
  const [flagLogin, setFlagLogin] = useState<boolean>(
    () => localStorage.getItem("_vtxee_down_fl") != null
  );

  async function logout(): Promise<void> {
    localStorage.removeItem("_vtxee_down_fl");
    setFlagLogin(false);

    fetcher({clientType:'InitiumSaaS-Private',
      method: 'DELETE',
     path: 'auth',
})
    
  }
  async function registerLogin(): Promise<void> {
    localStorage.setItem('_vtxee_down_fl',uuid())
    setFlagLogin(true);
  }

  return (
    <AuthContext.Provider value={{ logout, flagLogin,registerLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

