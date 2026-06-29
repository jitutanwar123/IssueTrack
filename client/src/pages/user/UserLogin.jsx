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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear stale token when login page mounts
  useEffect(() => {
    clearToken();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(null, password, email);
      // Redirect based on role
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_45%,#e2e8f0_100%)] px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="bg-navy p-10 text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-2">
            <img src={virajLogo} alt="Viraj Profiles Limited" width={72} height={72} className="h-full w-full object-contain" />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight">Viraj Profiles Limited</h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">User Support Portal</p>

          <p className="mt-4 max-w-md text-slate-300">
            Submit, track and follow up on your support tickets anytime. Our team is here to help you.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              🎫 Raise incidents, service requests & change tickets
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              📧 Get email notifications on every update
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              💬 Communicate directly with the support team
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to your support portal account.</p>

          <form onSubmit={submit} autoComplete="off" className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email Address</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </label>

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-navy px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>New here?</span>
              <Link to="/register" className="font-semibold text-cyan-600 hover:text-cyan-500">
                Create an account →
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400 space-y-1.5">
              <div>
                Admin?{" "}
                <Link to="/login" className="font-medium text-slate-600 hover:text-slate-900">
                  Admin Login
                </Link>
              </div>
              <div>
                IT Staff?{" "}
                <Link to="/staff-login" className="font-medium text-cyan-600 hover:text-cyan-800">
                  Staff Portal Login →
                </Link>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
