import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { clearToken } from "../../utils/api.js";
import virajLogo from "../../viraaj.webp";

export default function StaffLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { clearToken(); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/staff/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center login-bg px-4 py-8">
      <div
        className="w-full max-w-md rounded-3xl bg-white px-10 py-10"
        style={{ boxShadow: "0 32px 80px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.06)" }}
      >
        {/* Logo + Company */}
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={virajLogo} alt="Viraj Profiles Limited" className="h-16 w-auto object-contain mb-4" />
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Viraj Profiles Limited</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">IT Staff Portal</p>
        </div>

        {/* Divider */}
        <div className="mb-6 border-t border-slate-100" />

        {/* Heading */}
        <h2 className="mb-5 text-xl font-bold text-slate-900">IT Staff Sign In</h2>

        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          {/* Work Email */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
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
              className="pro-input"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
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
