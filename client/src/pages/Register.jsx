import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import virajLogo from "../viraaj.webp";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.register(form);
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/user-login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-white/20";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };
  const labelClass = "block text-[10px] font-bold uppercase tracking-[0.12em] mb-1.5";
  const labelStyle = { color: "rgba(148,163,184,0.8)" };

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
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.7)" }}>
            User Support Portal
          </p>
        </div>

        {/* Divider */}
        <div className="mb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        {/* Heading */}
        <h2 className="mb-5 text-xl font-bold text-white">Create Account</h2>

        <form onSubmit={submit} autoComplete="off" className="space-y-4">
          {/* Full Name */}
          <div>
            <label className={labelClass} style={labelStyle}>Full Name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass} style={labelStyle}>Email Address</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@virajprofiles.com"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label className={labelClass} style={labelStyle}>Password</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                required
                minLength={6}
                className={`${inputClass} pr-10`}
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
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

          {/* Phone */}
          <div>
            <label className={labelClass} style={labelStyle}>Phone Number</label>
            <input
              id="reg-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
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

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            id="reg-submit-btn"
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
                Creating Account…
              </span>
            ) : "Create Account"}
          </button>

          {/* Sign in link */}
          <div className="pt-3 text-center text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.7)" }}>
            Already have an account?{" "}
            <Link to="/user-login" className="font-semibold text-white hover:text-slate-300 transition-colors">
              Sign in →
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
