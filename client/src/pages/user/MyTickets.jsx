import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/helpers.js";

const STATUSES = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    setLoading(true);
    api.userTickets({ status: filterStatus, priority: filterPriority })
      .then((r) => setTickets(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus, filterPriority]);

  const filtered = tickets.filter((t) =>
    !search ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    (t.ticket_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Tickets</h2>
          <p className="mt-0.5 text-sm text-slate-500">View and manage all your submitted support requests.</p>
        </div>
        <Link
          to="/user/create-ticket"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px self-start"
          style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 4px 14px rgba(8,145,178,0.3)" }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Raise New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 rounded-2xl bg-white p-4"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
      >
        <input
          type="text"
          placeholder="Search by title or ticket ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pro-input flex-1 min-w-48"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="pro-select"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="pro-select"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(search || filterStatus || filterPriority) && (
          <button
            onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); }}
            className="btn-secondary"
          >
            Reset
          </button>
        )}
      </div>

      {/* Ticket list */}
      <div
        className="overflow-hidden rounded-2xl bg-white"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-slate-400">
            <svg className="h-4 w-4 animate-spin mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading tickets…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No tickets found.</p>
            <Link
              to="/user/create-ticket"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
            >
              Raise a ticket
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div
              className="hidden px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80 lg:grid lg:grid-cols-[1fr_110px_110px_130px_72px]"
              style={{ borderBottom: "1px solid #f1f5f9" }}
            >
              <span>Ticket</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Created</span>
              <span></span>
            </div>
            <div>
              {filtered.map((ticket, i) => (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors duration-100 hover:bg-slate-50/70 lg:grid lg:grid-cols-[1fr_110px_110px_130px_72px] lg:items-center"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {ticket.ticket_id || `#${ticket.id}`}
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 line-clamp-1">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ticket.category}{ticket.sub_category ? ` · ${ticket.sub_category}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={ticket.priority} type="priority" />
                  <StatusBadge status={ticket.status} />
                  <span className="text-xs text-slate-500">{formatDateTime(ticket.created_at)}</span>
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
              ))}
            </div>
            <div
              className="px-5 py-3 text-xs text-slate-500"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-700">{tickets.length}</span> tickets
            </div>
          </>
        )}
      </div>
    </div>
  );
}
