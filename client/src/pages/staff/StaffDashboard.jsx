import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/helpers.js";

const STAT_META = [
  { label: "Open",        color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { label: "In Progress", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { label: "On Hold",     color: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  { label: "Resolved",    color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
];

function StatCard({ label, value, color, bg, border }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ background: color }}
      />
      <div className="text-[11px] font-bold uppercase tracking-[0.1em] mt-1" style={{ color }}>
        {label}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
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

  useEffect(() => {
    const nextStatus = searchParams.get("status") || "";
    setStatusFilter((current) => (current === nextStatus ? current : nextStatus));
  }, [searchParams]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.staffTickets();
      setTickets(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilters(e) {
    e.preventDefault();
    setSearchParams(statusFilter ? { status: statusFilter } : {});
    setActiveSearch(search.trim());
  }

  // Computed stats
  const open       = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "Work In Progress" || t.status === "Assigned").length;
  const onHold     = tickets.filter((t) => t.status?.startsWith("On Hold")).length;
  const resolved   = tickets.filter((t) => t.status === "Resolved").length;
  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "In Progress"
        ? ["Assigned", "Work In Progress", "In Progress"].includes(ticket.status)
        : statusFilter === "On Hold"
          ? ticket.status?.startsWith("On Hold")
          : ticket.status === statusFilter);
    const term = activeSearch.toLowerCase();
    const matchesSearch =
      !term ||
      ticket.title?.toLowerCase().includes(term) ||
      (ticket.ticket_id || "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  function ticketStatusLink(status) {
    const next = status === "In Progress" ? "Work In Progress" : status;
    return `/staff/dashboard?status=${encodeURIComponent(next)}`;
  }

  const firstName = user?.name?.split(" ")[0] || "Staff";

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Staff Workspace</div>
          <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">
            Welcome back, {firstName}
          </h2>
          <p className="text-sm text-slate-500">
            {user?.role || "IT Staff"} - tickets assigned to you in one focused view.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link to={ticketStatusLink("Open")} className="block">
          <StatCard label="Open" value={open} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
        </Link>
        <Link to={ticketStatusLink("In Progress")} className="block">
          <StatCard label="In Progress" value={inProgress} color="#b45309" bg="#fffbeb" border="#fde68a" />
        </Link>
        <Link to={ticketStatusLink("On Hold")} className="block">
          <StatCard label="On Hold" value={onHold} color="#475569" bg="#f8fafc" border="#e2e8f0" />
        </Link>
        <Link to={ticketStatusLink("Resolved")} className="block">
          <StatCard label="Resolved" value={resolved} color="#0f766e" bg="#f0fdfa" border="#99f6e4" />
        </Link>
      </div>

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
          <option>On Hold - Change</option>
          <option>On Hold - Customer</option>
          <option>On Hold - Infra</option>
          <option>Resolved</option>
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

      <div className="pro-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e8eef5" }}>
          <h3 className="text-sm font-semibold text-slate-900">My Assigned Tickets</h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {filteredTickets.length}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No tickets assigned to you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Ticket ID", "Title", "Priority", "Status", "Category", "Raised By", "Created", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
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
                    className="cursor-pointer transition-colors duration-100 hover:bg-slate-50/70"
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {ticket.ticket_id || `INC${ticket.id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <span className="text-sm font-medium text-slate-800 line-clamp-1">{ticket.title}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={ticket.priority} type="priority" />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">{ticket.category || "—"}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {ticket.customer_name || ticket.requested_by || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {formatDateTime(ticket.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/staff/tickets/${ticket.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300"
                      >
                        {ticket.status === "Resolved" ? "View" : "View / Resolve"}
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
