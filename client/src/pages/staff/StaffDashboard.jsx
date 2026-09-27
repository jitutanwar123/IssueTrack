import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { TableSkeleton, EmptyState } from "../../components/Skeleton.jsx";
import { formatDateTime } from "../../utils/helpers.js";

const STAT_META = [
  { label: "Open",             color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { label: "Assigned",         color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { label: "Work In Progress", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { label: "On Hold",          color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  { label: "Closed",           color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
];

function StatCard({ label, value, color, bg, border, loading }) {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-5" style={{ border: `1px solid ${border}` }}>
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl skeleton" />
        <div className="skeleton h-3 w-20 rounded-lg mb-4 mt-1" />
        <div className="skeleton h-8 w-12 rounded-lg" />
      </div>
    );
  }
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: color }}
      />
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] mt-1" style={{ color }}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const loadingRef = useRef(false);

  useEffect(() => {
    const nextStatus = searchParams.get("status") || "";
    setStatusFilter((current) => (current === nextStatus ? current : nextStatus));
  }, [searchParams]);

  async function load({ silent = false } = {}) {
    if (loadingRef.current) return;
    loadingRef.current = true;
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await api.staffTickets();
      setTickets(res.data || []);
    } catch (err) {
      if (!silent) setError(err.message || "Failed to load tickets");
    } finally {
      loadingRef.current = false;
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") load({ silent: true });
    };
    const interval = window.setInterval(refreshIfVisible, 15000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, []);

  function applyFilters(e) {
    e.preventDefault();
    setSearchParams(statusFilter ? { status: statusFilter } : {});
    setActiveSearch(search.trim());
  }

  // Computed stats
  const open       = tickets.filter((t) => t.status === "Open").length;
  const assigned   = tickets.filter((t) => t.status === "Assigned").length;
  const inProgress = tickets.filter((t) => t.status === "Work In Progress").length;
  const onHold     = tickets.filter((t) => t.status?.startsWith("On Hold")).length;
  const closed     = tickets.filter((t) => t.status === "Closed").length;
  const statValues = [open, assigned, inProgress, onHold, closed];

  const normalizedStatusFilter =
    statusFilter === "In Progress" ? "Work In Progress" : statusFilter?.startsWith("On Hold") ? "On Hold" : statusFilter;
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      !normalizedStatusFilter ||
      (normalizedStatusFilter === "On Hold"
        ? ticket.status?.startsWith("On Hold")
        : ticket.status === normalizedStatusFilter);
    const term = activeSearch.toLowerCase();
    const matchesSearch =
      !term ||
      ticket.title?.toLowerCase().includes(term) ||
      (ticket.ticket_id || "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  function ticketStatusLink(status) {
    return `/staff/dashboard?status=${encodeURIComponent(status)}`;
  }

  const firstName = user?.name?.split(" ")[0] || "Staff";

  const thCls = "px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 p-5 shadow-soft">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Staff Workspace</div>
          <h2 className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {firstName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user?.role || "IT Staff"} - tickets assigned to you in one focused view.
          </p>
        </div>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_META.map((meta, i) => (
          <Link key={meta.label} to={ticketStatusLink(meta.label === "Work In Progress" ? "Work In Progress" : meta.label)} className="block">
            <StatCard
              label={meta.label}
              value={loading ? 0 : statValues[i]}
              color={meta.color}
              bg={meta.bg}
              border={meta.border}
              loading={loading}
            />
          </Link>
        ))}
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="pro-card flex flex-wrap gap-3 p-4">
        <input
          type="text"
          placeholder="Search by title or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pro-input flex-1 min-w-[180px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="pro-select min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option>Open</option>
          <option>Assigned</option>
          <option>Work In Progress</option>
          <option>On Hold</option>
          <option>Closed</option>
        </select>
        <button type="submit" className="btn-primary">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Apply
        </button>
        <button
          type="button"
          onClick={() => { setSearch(""); setStatusFilter(""); setActiveSearch(""); setSearchParams({}); load(); }}
          className="btn-secondary"
        >
          Clear
        </button>
      </form>

      {/* Ticket table */}
      <div className="pro-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e8eef5" }}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">My Assigned Tickets</h3>
          {!loading && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {filteredTickets.length}
            </span>
          )}
        </div>

        {error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Ticket ID", "Title", "Priority", "Status", "Category", "Raised By", "Created", "Action"].map((h) => (
                    <th key={h} className={thCls} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton count={6} cols={8} />
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState
                        title={statusFilter ? `No ${statusFilter.toLowerCase()} tickets` : "No tickets assigned to you yet"}
                        subtitle={statusFilter ? "Try clearing the filter to see all tickets." : "When tickets are assigned to you, they'll show up here."}
                        icon={
                          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/staff/tickets/${ticket.id}`);
                        }
                      }}
                      className="cursor-pointer transition-colors duration-100 hover:bg-slate-50/70 dark:hover:bg-slate-700/30"
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          {ticket.ticket_id || `INC${ticket.id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{ticket.title}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={ticket.priority} type="priority" />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">{ticket.category || "—"}</td>
                      <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                        {ticket.customer_name || ticket.requested_by || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-500">
                        {formatDateTime(ticket.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/staff/tickets/${ticket.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        >
                          {ticket.status === "Resolved" ? "View" : "View / Resolve"}
                          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
