import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { clearToken } from "../../utils/api.js";
import virajLogo from "../../viraaj.webp";

export default function StaffLogin() {
  const { login, isAuthenticated, isAdmin, isStaff, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [busy, setBusy]         = useState(false);

  // Clear stale token on mount
  useEffect(() => { clearToken(); }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isAdmin)        navigate("/", { replace: true });
      else if (isStaff)   navigate("/staff/dashboard", { replace: true });
      else                navigate("/user/dashboard", { replace: true });
    }
  }, [loading, isAuthenticated, isAdmin, isStaff, navigate]);

  async function submit(event) {
    event.preventDefault();
    if (!email || !password) { setError("Email and password are required."); return; }
    setBusy(true);
    setError("");
    try {
      const user = await login(null, password, email);
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
    <main className="flex min-h-screen items-center justify-center login-bg px-4 py-8">
      <div
        className="grid w-full max-w-5xl overflow-hidden rounded-3xl"
        style={{ boxShadow: "0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)" }}
      >
        <div className="grid lg:grid-cols-2">
          {/* ─── Left panel ────────────────────────────────────────────────── */}
          <div
            className="relative flex flex-col justify-between p-10 text-white overflow-hidden"
            style={{ background: "linear-gradient(150deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)" }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #a78bfa 0%, transparent 70%)" }}
            />

            <div className="relative">
              <div className="mb-8">
                <img src={virajLogo} alt="Viraj Profiles Limited" className="h-20 w-auto object-contain" />
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-4"
                style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd" }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#a78bfa" }} />
                IT Staff Portal
              </div>

              <h1 className="text-3xl font-bold tracking-tight leading-tight">
                Viraj Profiles<br />
                <span style={{ color: "#c4b5fd" }}>Staff Workspace</span>
              </h1>

              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(203,213,225,0.8)" }}>
                View and resolve tickets assigned to your IT sub-branch. Track resolution history and communicate with users.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "View only your assigned tickets",
                  "Resolve tickets &amp; notify users automatically",
                  "Track your full resolution history",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span style={{ color: "#a78bfa" }}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-sm" style={{ color: "rgba(226,232,240,0.85)" }} dangerouslySetInnerHTML={{ __html: text }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
                © 2025 Viraj Profiles Limited. IT Staff Portal.
              </p>
            </div>
          </div>

          {/* ─── Right panel ────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-center bg-white p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">IT Staff Sign In</h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter your work email and password to access your staff portal.
              </p>
            </div>

            <form onSubmit={submit} autoComplete="off" className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-2">
                  Work Email
                </label>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@virajprofiles.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-2">
                  Password
                </label>
                <input
                  id="staff-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                id="staff-login-btn"
                type="submit"
                disabled={busy}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                }}
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In…
                  </span>
                ) : "Sign In to Staff Portal"}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-500">
                <div>
                  Admin?{" "}
                  <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    Admin Portal →
                  </Link>
                </div>
                <div>
                  End user?{" "}
                  <Link to="/user-login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    User Portal →
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
