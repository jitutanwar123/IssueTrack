import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { clearToken } from "../../utils/api.js";

export default function StaffLogin() {
  const { login, isAuthenticated, isAdmin, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Clear any stale token on mount
  useEffect(() => { clearToken(); }, []);

  // If already logged in, redirect to the right portal
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin) navigate("/", { replace: true });
      else if (isStaff) navigate("/staff/dashboard", { replace: true });
      else navigate("/user/dashboard", { replace: true });
    }
  }, [loading, isAuthenticated, isAdmin, isStaff, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const user = await login(null, form.password, form.email);
      if (user.portal_role === "it_staff") {
        navigate("/staff/dashboard", { replace: true });
      } else if (user.portal_role === "admin" || user.role === "Administrator" || user.role === "Admin") {
        navigate("/", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 px-4">
      <div className="w-full max-w-md">
        {/* Header card */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 shadow-lg shadow-cyan-500/30">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">IT Staff Portal</h1>
          <p className="mt-1 text-sm text-slate-400">Viraj Profiles Limited — IT Department</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <h2 className="mb-6 text-lg font-semibold text-white">Sign in to your account</h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Work Email
              </label>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@virajprofiles.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                Password
              </label>
              <input
                id="staff-password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <button
              id="staff-login-btn"
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-center text-xs text-slate-500">
            <p>
              Admin?{" "}
              <Link to="/login" className="text-cyan-400 hover:underline">
                Go to Admin Login
              </Link>
            </p>
            <p>
              End user?{" "}
              <Link to="/user-login" className="text-cyan-400 hover:underline">
                Go to User Portal
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} Viraj Profiles Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}
