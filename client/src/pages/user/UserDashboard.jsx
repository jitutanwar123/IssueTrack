import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/helpers.js";

const STAT_COLORS = [
  { color: "#2563eb", bg: "#eff6ff", gradient: "linear-gradient(90deg,#2563eb,#3b82f6)" },
  { color: "#d97706", bg: "#fffbeb", gradient: "linear-gradient(90deg,#d97706,#f59e0b)" },
  { color: "#7c3aed", bg: "#f5f3ff", gradient: "linear-gradient(90deg,#7c3aed,#8b5cf6)" },
  { color: "#059669", bg: "#f0fdf4", gradient: "linear-gradient(90deg,#059669,#10b981)" },
];

function StatCard({ title, value, icon, index }) {
  const c = STAT_COLORS[index % STAT_COLORS.length];
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: c.gradient }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: c.color }}>{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: c.bg }}
        >
          <span style={{ color: c.color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.userDashboard({ recentLimit: 5 })
      .then((r) => {
        setSummary(r.data?.summary || null);
        setRecentTickets(r.data?.recentTickets || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    open: summary?.open ?? 0,
    inProgress: summary?.inProgress ?? 0,
    pending: summary?.onHold ?? 0,
    resolved: summary?.resolved ?? 0,
  };

  return (
    <div className="space-y-5">
      <section
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-elevated"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #111827 55%, #0f172a 100%)" }}
      >
        <div
          className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: "#cbd5e1" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              My Support Portal
            </div>
            <h2 className="text-[28px] font-semibold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Track and manage your support tickets below. Our team is ready to assist you.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/user/create-ticket"
              className="btn-primary"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Raise New Ticket
            </Link>
            <Link
              to="/user/my-tickets"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
            >
              View All Tickets
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/user/my-tickets?status=Open" className="block">
          <StatCard title="Open Tickets" value={stats.open} index={0}
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" /></svg>}
          />
        </Link>
        <Link to="/user/my-tickets?status=In%20Progress" className="block">
          <StatCard title="In Progress" value={stats.inProgress} index={1}
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" strokeLinecap="round" /></svg>}
          />
        </Link>
        <Link to="/user/my-tickets?status=On%20Hold" className="block">
          <StatCard title="On Hold" value={stats.pending} index={2}
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" /><line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" /></svg>}
          />
        </Link>
        <Link to="/user/my-tickets?status=Resolved" className="block">
          <StatCard title="Resolved" value={stats.resolved} index={3}
            icon={<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" /><polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" /></svg>}
          />
        </Link>
      </section>

      {/* Recent Tickets */}
      <section
        className="pro-card overflow-hidden"
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #e8eef5" }}
        >
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-bold text-slate-900">Recent Tickets</h3>
          </div>
          <Link to="/user/my-tickets" className="text-[11px] font-semibold text-brand-700 hover:text-brand-800 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-400">
            <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading your tickets…
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No tickets yet</p>
            <Link
              to="/user/create-ticket"
              className="mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white btn-primary"
            >
              Raise your first ticket
            </Link>
          </div>
        ) : (
          <div>
            {recentTickets.map((ticket, i) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-100 hover:bg-slate-50/70"
                style={{ borderBottom: i < recentTickets.length - 1 ? "1px solid #f1f5f9" : "none" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {ticket.ticket_id || `#${ticket.id}`}
                    </span>
                    <StatusBadge status={ticket.priority} type="priority" />
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-900">{ticket.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(ticket.created_at)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={ticket.status} />
                  <Link
                    to={`/user/ticket/${ticket.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300"
                  >
                    View
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
