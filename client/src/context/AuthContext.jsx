import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../api";
import { clearToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("rs_token")) {
      setLoading(false);
      return;
    }
    auth.me()
      .then(({ user }) => setUser(user))
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    clearToken();
    auth.logout().finally(() => setUser(null));
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
