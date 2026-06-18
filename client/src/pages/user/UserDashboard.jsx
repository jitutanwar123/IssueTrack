import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/helpers.js";

function StatCard({ title, value, color, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${color || "text-slate-900"}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color ? color.replace("text-", "bg-").replace("-600", "-100").replace("-500", "-100") : "bg-slate-100"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.userTickets()
      .then((r) => setTickets(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    open: tickets.filter((t) => t.status === "Open").length,
    inProgress: tickets.filter((t) => t.status === "In Progress" || t.status === "Assigned" || t.status === "Work In Progress").length,
    pending: tickets.filter((t) => t.status?.toLowerCase().includes("pending") || t.status?.toLowerCase().includes("hold")).length,
    resolved: tickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length,
  };

  const recent = [...tickets].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">My Support Portal</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Track and manage your support tickets below. Our team is ready to assist you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/user/create-ticket"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-cyan-300"
            >
              + Raise New Ticket
            </Link>
            <Link
              to="/user/my-tickets"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View All Tickets
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value={stats.open}
          color="text-blue-600"
          icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>}
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          color="text-orange-500"
          icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>}
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          color="text-amber-500"
          icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          color="text-emerald-600"
          icon={<svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
        />
      </section>

      {/* Recent tickets */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">Recent Tickets</h3>
          <Link to="/user/my-tickets" className="text-sm font-medium text-cyan-600 hover:text-cyan-500">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Loading your tickets...</div>
          ) : recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">No tickets yet.</p>
              <Link to="/user/create-ticket" className="mt-3 inline-block rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-navy hover:bg-cyan-300">
                Raise your first ticket
              </Link>
            </div>
          ) : (
            recent.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-400">{ticket.ticket_id || `#${ticket.id}`}</span>
                    <StatusBadge status={ticket.priority} type="priority" />
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{ticket.title}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(ticket.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={ticket.status} />
                  <Link
                    to={`/user/ticket/${ticket.id}`}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
