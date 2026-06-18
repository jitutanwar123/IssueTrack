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
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Support History</div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">My Tickets</h2>
            <p className="mt-2 text-sm text-slate-300">View and manage all your submitted support requests.</p>
          </div>
          <Link
            to="/user/create-ticket"
            className="self-start rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-navy transition hover:bg-cyan-300"
          >
            + Raise New Ticket
          </Link>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by title or ticket ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-400"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-400"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-cyan-400"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(search || filterStatus || filterPriority) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); }}
              className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Ticket list */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
            Loading tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <svg viewBox="0 0 24 24" className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
            </svg>
            <p className="text-slate-500">No tickets found.</p>
            <Link
              to="/user/create-ticket"
              className="mt-3 inline-block rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-navy hover:bg-cyan-300"
            >
              Raise a ticket
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid lg:grid-cols-[1fr_120px_100px_140px_80px]">
              <span>Ticket</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Created</span>
              <span></span>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 lg:grid lg:grid-cols-[1fr_120px_100px_140px_80px] lg:items-center"
                >
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {ticket.ticket_id || `#${ticket.id}`}
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 line-clamp-1">{ticket.title}</p>
                    <p className="text-xs text-slate-400">{ticket.category} {ticket.sub_category ? `· ${ticket.sub_category}` : ""}</p>
                  </div>
                  <StatusBadge status={ticket.priority} type="priority" />
                  <StatusBadge status={ticket.status} />
                  <span className="text-xs text-slate-500">{formatDateTime(ticket.created_at)}</span>
                  <Link
                    to={`/user/ticket/${ticket.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
              Showing {filtered.length} of {tickets.length} tickets
            </div>
          </>
        )}
      </section>
    </div>
  );
}
