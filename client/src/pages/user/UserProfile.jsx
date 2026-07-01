import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/api.js";
import { formatDateTime } from "../../utils/helpers.js";

export default function UserProfile() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.userDashboard({ recentLimit: 6 })
      .then((r) => {
        setSummary(r.data?.summary || null);
        setRecentTickets(r.data?.recentTickets || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Total Tickets", value: summary?.total ?? 0, color: "text-slate-900", bg: "bg-slate-100" },
    { label: "Open", value: summary?.open ?? 0, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "In Progress", value: summary?.inProgress ?? 0, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Resolved", value: summary?.resolved ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  const initials = user?.name?.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Account</div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="mt-2 text-sm text-slate-300">Your account information and ticket summary.</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        {/* Profile card */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft text-center">
            {/* Avatar */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-2xl font-bold text-white shadow-lg">
              {initials}
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">{user?.name}</h3>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              ● Active User
            </span>
          </div>

          {/* Contact info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Contact Information</h3>
            <dl className="space-y-3">
              {[
                { icon: "mail", label: "Email", value: user?.email },
                { icon: "phone", label: "Phone", value: user?.phone || "Not set" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <FieldIcon name={icon} />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="text-sm font-medium text-slate-700">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Stats + recent tickets */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft text-center">
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${s.bg}`}>
                  <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent tickets table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Recent Ticket Activity</h3>
              <Link to="/user/my-tickets" className="text-sm font-medium text-cyan-600 hover:text-cyan-500">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
              ) : recentTickets.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-slate-400">No tickets yet.</p>
                  <Link
                    to="/user/create-ticket"
                    className="mt-3 inline-block rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-navy hover:bg-cyan-300"
                  >
                    Raise your first ticket
                  </Link>
                </div>
              ) : (
                recentTickets.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs text-slate-400">{t.ticket_id || `#${t.id}`}</span>
                      <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <PriorityDot priority={t.priority} />
                      <StatusChip status={t.status} />
                      <Link
                        to={`/user/ticket/${t.id}`}
                        className="rounded-xl bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Portal info card */}
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <h3 className="text-sm font-semibold text-cyan-900">Need Help?</h3>
            <p className="mt-2 text-sm text-cyan-700">
              Our support team is available during business hours. For urgent issues, please raise a P1 or P2 ticket and we'll respond within the SLA window.
            </p>
            <Link
              to="/user/create-ticket"
              className="mt-3 inline-block rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600"
            >
              + Raise a Ticket
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldIcon({ name }) {
  const cls = "h-5 w-5 text-slate-400 flex-shrink-0";
  if (name === "mail") return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </svg>
  );
  if (name === "phone") return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.37 19a19.45 19.45 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M9 21V7l7-4v18" />
      <path d="M13 21V10.5" />
    </svg>
  );
}

function PriorityDot({ priority }) {
  const colors = { P1: "bg-red-500", P2: "bg-orange-500", P3: "bg-yellow-500", P4: "bg-green-500" };
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
      <span className={`h-2 w-2 rounded-full ${colors[priority] || "bg-slate-400"}`} />
      {priority}
    </span>
  );
}

function StatusChip({ status }) {
  const map = {
    Open: "bg-blue-100 text-blue-700",
    "In Progress": "bg-orange-100 text-orange-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Resolved: "bg-emerald-100 text-emerald-700",
    Closed: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
