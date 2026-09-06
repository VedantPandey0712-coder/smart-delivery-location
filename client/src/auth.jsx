import React, { createContext, useContext, useEffect, useState } from "react";
import { AUTH_TOKEN_KEY, AuthAPI } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    AuthAPI.me()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => localStorage.removeItem(AUTH_TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  function signIn(session) {
    localStorage.setItem(AUTH_TOKEN_KEY, session.token);
    setUser(session.user);
  }

  function signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
