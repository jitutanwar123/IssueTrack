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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_45%,#e2e8f0_100%)] px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:grid-cols-2">

        {/* LEFT SIDE — dark panel */}
        <div className="bg-navy p-10 text-white">
          <div className="mb-8">
            <img
              src={virajLogo}
              alt="Viraj Profiles Limited"
              className="h-24 w-auto object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Viraj Profiles Limited
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">
            IT Staff Portal
          </p>

          <p className="mt-4 max-w-md text-slate-300">
            View and resolve tickets assigned to your IT sub-branch. Keep track of your resolution history and communicate with users.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              View only your assigned tickets
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Resolve tickets &amp; notify users automatically
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Track your full resolution history
            </div>
          </div>
        </div>

        {/* RIGHT SIDE — form */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-slate-900">
            IT Staff Sign In
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your work email and password to access your staff portal.
          </p>

          <form onSubmit={submit} autoComplete="off" className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Work Email
              </span>
              <input
                id="staff-email"
                type="email"
                autoComplete="email"
                placeholder="you@virajprofiles.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-sky-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                id="staff-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-sky-400"
              />
            </label>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              id="staff-login-btn"
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Signing In…" : "Login"}
            </button>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-600 space-y-1.5">
              <div>
                Admin?{" "}
                <Link to="/login" className="font-medium text-cyan-700 hover:text-cyan-600">
                  Admin Portal Login →
                </Link>
              </div>
              <div>
                End user?{" "}
                <Link to="/user-login" className="font-medium text-cyan-700 hover:text-cyan-600">
                  User Portal Login →
                </Link>
              </div>
            </div>
          </form>
        </div>

      </div>
    </main>
  );
}
