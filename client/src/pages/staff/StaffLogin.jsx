import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import virajLogo from "../../viraaj.webp";

export default function StaffLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate(location.state?.from || "/staff/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setBusy(false);
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
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.9)" }}>IT Staff Portal</p>
        </div>

        {/* Divider */}
        <div className="mb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* Heading */}
        <h2 className="mb-5 text-xl font-bold text-white">IT Staff Sign In</h2>

        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          {/* Work Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(226,232,240,0.9)" }}>
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
              className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/40"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: "rgba(226,232,240,0.9)" }}>
              Password
            </label>
            <div className="relative">
              <input
                id="staff-password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                title={showPw ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
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
            id="staff-login-btn"
            type="submit"
            disabled={busy}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 4px 16px rgba(124,58,237,0.28)" }}
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
        </form>
      </div>
    </main>
  );
}
