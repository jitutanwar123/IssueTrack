import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { clearToken } from "../utils/api.js";
import virajLogo from "../viraaj.webp";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear any stale token so old sessions don't interfere
  useEffect(() => {
    clearToken();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(username, password);
      // Redirect based on role
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_45%,#e2e8f0_100%)] px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:grid-cols-2">

        {/* LEFT SIDE */}
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

          <p className="mt-4 max-w-md text-slate-300">
            Incident, service request, problem and change tracking designed
            for faster triage, better visibility, and clean audit trails.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Secure role-based authentication
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Dashboard ageing, workstream, and breach visibility
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              Ticket workflow, comments, PDF export, and reports
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-slate-900">
            Admin Sign In
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enter your admin credentials to access the command center.
          </p>

          <form
            onSubmit={submit}
            autoComplete="off"
            className="mt-8 space-y-5"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Username
              </span>

              <input
                type="text"
                autoComplete="off"
                placeholder="Enter username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-sky-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </span>

              <input
                type="password"
                autoComplete="new-password"
                placeholder="Enter password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-0 transition focus:border-sky-400"
              />
            </label>

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Login"}
            </button>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-400">
              Not an admin?{" "}
              <Link
                to="/user-login"
                className="font-medium text-cyan-600 hover:text-cyan-500"
              >
                User Portal Login →
              </Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}