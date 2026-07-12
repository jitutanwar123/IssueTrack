import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../utils/api.js";
import virajLogo from "../viraaj.webp";

const LOGIN_PATHS = {
  admin: "/login",
  staff: "/staff-login",
  user: "/user-login",
};

function normalizePortal(value) {
  const portal = String(value || "user").toLowerCase();
  if (portal === "admin" || portal === "staff" || portal === "user") return portal;
  return "user";
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const portal = normalizePortal(searchParams.get("portal") || location.state?.portal);
  const loginPath = LOGIN_PATHS[portal] || LOGIN_PATHS.user;

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const heading = useMemo(() => {
    if (step === "request") return "Forgot Password";
    if (step === "verify") return "Verify OTP";
    if (step === "reset") return "Update Password";
    return "Password Updated";
  }, [step]);

  async function requestOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.requestPasswordReset(email.trim());
      setMessage(response?.message || "OTP has been sent to your email.");
      setStep("verify");
    } catch (err) {
      setError(err.message || "Unable to send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.verifyPasswordResetOtp(email.trim(), otp.trim());
      setResetToken(response.resetToken);
      setMessage(response?.message || "OTP verified successfully.");
      setStep("reset");
    } catch (err) {
      setError(err.message || "Unable to verify OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api.confirmPasswordReset(resetToken, newPassword);
      setMessage(response?.message || "Password updated successfully.");
      setStep("done");
      setTimeout(() => navigate(loginPath), 1800);
    } catch (err) {
      setError(err.message || "Unable to update password.");
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
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={virajLogo} alt="Viraj Profiles Limited" className="mb-4 h-16 w-auto object-contain" />
          <h1 className="text-lg font-bold tracking-tight text-white">Viraj Profiles Limited</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "rgba(148,163,184,0.9)" }}>
            Password Recovery
          </p>
        </div>

        <div className="mb-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />

        <div className="mb-5">
          <h2 className="text-xl font-bold text-white">{heading}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {step === "request"
              ? "Enter your email address and we will send a one-time OTP."
              : step === "verify"
              ? "Enter the OTP from your email to continue."
              : step === "reset"
              ? "Create a new password for your account."
              : "Your password has been updated."}
          </p>
        </div>

        {step === "request" && (
          <form onSubmit={requestOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(226,232,240,0.9)" }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 4px 16px rgba(8,145,178,0.28)" }}
            >
              {busy ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              OTP sent to <strong>{email}</strong>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(226,232,240,0.9)" }}>
                OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("request")}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
              >
                Change Email
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 4px 16px rgba(8,145,178,0.28)" }}
              >
                {busy ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={updatePassword} className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              OTP verified for <strong>{email}</strong>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(226,232,240,0.9)" }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "rgba(226,232,240,0.9)" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/40"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 4px 16px rgba(8,145,178,0.28)" }}
            >
              {busy ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Password updated successfully. You can now sign in again.
            </div>
            <Link
              to={loginPath}
              className="flex min-h-11 items-center justify-center rounded-xl py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 4px 16px rgba(8,145,178,0.28)" }}
            >
              Back to Login
            </Link>
          </div>
        )}

        {message && step !== "done" && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-300">
          <Link to={loginPath} className="font-semibold text-cyan-300 transition-colors hover:text-cyan-200">
            Back to Login
          </Link>
          <span className="text-slate-500">{portal.toUpperCase()} portal</span>
        </div>
      </div>
    </main>
  );
}
