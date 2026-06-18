import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api.js";
import virajLogo from "../viraj.jpg";

const DEPARTMENTS = [
  "IT", "HR", "Finance", "Operations", "Sales", "Marketing",
  "Production", "Quality", "Maintenance", "Administration", "Other",
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", department: "" });
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e0f2fe_0%,#f8fafc_45%,#e2e8f0_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="bg-navy p-10 text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-2">
            <img src={virajLogo} alt="Viraj Profiles Limited" className="h-full w-full object-contain" />
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight">Create Account</h1>
          <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">User Support Portal</p>

          <p className="mt-4 max-w-md text-slate-300">
            Join the Viraj support portal to submit and track your support requests with ease.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              ⚡ Instant ticket submission
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              📊 Real-time status tracking
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              🔔 Email notifications on every update
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10">
          <h2 className="text-2xl font-bold text-slate-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-slate-500">Fill in your details to get started.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Full Name *</span>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email Address *</span>
              <input
                type="email"
                placeholder="you@virajprofiles.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password *</span>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                required
                minLength={6}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Phone Number</span>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-cyan-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Department</span>
                <select
                  value={form.department}
                  onChange={(e) => setField("department", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : null}

            {success ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-navy px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/user-login" className="font-semibold text-cyan-600 hover:text-cyan-500">
                Sign in →
              </Link>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
