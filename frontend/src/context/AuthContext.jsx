import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import * as authApi from "../services/auth";
import { onSessionExpired, tokenStore } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  const refreshUser = useCallback(async () => {
    try {
      const current = await authApi.fetchCurrentUser();
      setUser(current);
      setStatus("authenticated");
      return current;
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus("anonymous");
      return null;
    }
  }, []);

  useEffect(() => {
    if (tokenStore.getAccess()) {
      refreshUser();
    } else {
      setStatus("anonymous");
    }
  }, [refreshUser]);

  useEffect(() => onSessionExpired(() => {
    setUser(null);
    setStatus("anonymous");
  }), []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    setStatus("authenticated");
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => authApi.register(payload), []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const updateLocalUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, refreshUser, updateLocalUser }),
    [user, status, login, register, logout, refreshUser, updateLocalUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
