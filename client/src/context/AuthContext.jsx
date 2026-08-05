import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, setToken } from "../utils/api.js";

const AuthContext = createContext(null);

/** Decode a JWT payload without verifying signature (safe for UI use only). */
function decodeJwtPayload(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

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

      // ── Step 1: Instantly restore user from the JWT payload ──────────────
      // This makes the app feel fast — no waiting for a network round-trip.
      const payload = decodeJwtPayload(token);
      if (payload) {
        // Check the token hasn't expired locally
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          // Token is already expired — clear it immediately
          clearToken();
          if (mounted) setLoading(false);
          return;
        }
        // Hydrate user state from JWT so the UI renders right away
        if (mounted) {
          setUser(payload);
          setLoading(false); // ← loading done, no spinner
        }
      }

      // ── Step 2: Background server verify (keeps user data fresh) ─────────
      try {
        const response = await api.me();
        if (mounted) setUser(response.user);
      } catch {
        // Server rejected the token — log out silently
        clearToken();
        if (mounted) setUser(null);
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
