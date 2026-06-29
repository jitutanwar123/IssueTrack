import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { clearToken } from "../utils/api.js";
import virajLogo from "../viraaj.webp";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    text: "Secure role-based authentication",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V5M4 19h16" />
        <path d="M8 17v-6M12 17V8M16 17v-3" />
      </svg>
    ),
    text: "Dashboard ageing, workstream & SLA breach visibility",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
      </svg>
    ),
    text: "Ticket workflow, comments, PDF export & reports",
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { clearToken(); }, []);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(username, password);
      const isAdmin =
        user?.portal_role === "admin" ||
        user?.role === "Administrator" ||
        user?.role === "admin" ||
        user?.role === "Admin";
      if (isAdmin) {
        navigate(location.state?.from || "/", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            {/* background blobs */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }}
            />

            <div className="relative">
              <div className="mb-8">
                <img src={virajLogo} alt="Viraj Profiles Limited" className="h-20 w-auto object-contain" />
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold mb-4"
                style={{ background: "rgba(37,99,235,0.18)", border: "1px solid rgba(37,99,235,0.3)", color: "#93c5fd" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Admin Portal
              </div>

              <h1 className="text-3xl font-bold tracking-tight leading-tight">
                Viraj Profiles<br />
                <span style={{ color: "#93c5fd" }}>IT Command Center</span>
              </h1>

              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(203,213,225,0.8)" }}>
                Incident, service request, problem and change tracking designed
                for faster triage, better visibility, and clean audit trails.
              </p>

              <div className="mt-8 space-y-3">
                {FEATURES.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ color: "#60a5fa" }}>{f.icon}</span>
                    <span className="text-sm" style={{ color: "rgba(226,232,240,0.85)" }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom tagline */}
            <div className="relative mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs" style={{ color: "rgba(148,163,184,0.5)" }}>
                © 2025 Viraj Profiles Limited. Enterprise ITSM Platform.
              </p>
            </div>
          </div>

          {/* ─── Right panel ────────────────────────────────────────────────── */}
          <div className="flex flex-col justify-center bg-white p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Sign In</h2>
              <p className="mt-2 text-sm text-slate-500">
                Enter your credentials to access the command center.
              </p>
            </div>

            <form onSubmit={submit} autoComplete="off" className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pro-input"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pro-input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPw ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing In…
                  </span>
                ) : "Sign In to Admin Portal"}
              </button>

              {/* Links */}
              <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-xs text-slate-500">
                <div>
                  Not an admin?{" "}
                  <Link to="/user-login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    User Portal →
                  </Link>
                </div>
                <div>
                  IT Staff?{" "}
                  <Link to="/staff-login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                    Staff Portal →
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