import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, setToken } from "../utils/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const token = localStorage.getItem("welserve_token");
      if (!token) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const response = await api.me();
        if (mounted) setUser(response.user);
      } catch {
        clearToken();
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadUser();
    return () => { mounted = false; };
  }, []);

  async function login(username, password, email) {
    const response = await api.login(username, password, email);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    // Match 'admin', 'Admin', 'Administrator' — covers DB values and JWT claims
    isAdmin:
      user?.portal_role === "admin" ||
      user?.role === "Administrator" ||
      user?.role === "admin" ||
      user?.role === "Admin",
    isUser: user?.portal_role === "user",
    isStaff: user?.portal_role === "it_staff",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
