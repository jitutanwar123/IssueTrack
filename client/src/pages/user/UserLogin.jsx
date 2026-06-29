import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { clearToken } from "../../utils/api.js";
import virajLogo from "../../viraaj.webp";

export default function UserLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
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
      const user = await login(null, password, email);
      if (
        user?.portal_role === "admin" ||
        user?.role === "Administrator" ||
        user?.role === "admin" ||
        user?.role === "Admin"
      ) {
        navigate("/", { replace: true });
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
        className="w-full max-w-md rounded-3xl px-10 py-10"
        style={{ background: "#0f172a", boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        {/* Logo + Company */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={virajLogo} alt="Viraj Profiles Limited" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-lg font-bold text-white tracking-tight">Viraj Profiles Limited</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.7)" }}>User Support Portal</p>
        </div>

        {/* Divider */}
        <div className="mb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* Heading */}
        <h2 className="mb-5 text-xl font-bold text-white">Welcome Back</h2>

        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/40"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(148,163,184,0.8)" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
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
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 4px 16px rgba(8,145,178,0.28)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In…
              </span>
            ) : "Sign In"}
          </button>

          {/* Create account */}
          <div className="pt-3 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.7)" }}>
            New here?{" "}
            <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
              Create an account →
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
