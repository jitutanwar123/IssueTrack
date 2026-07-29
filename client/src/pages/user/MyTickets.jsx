import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../utils/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { ListSkeleton, EmptyState } from "../../components/Skeleton.jsx";
import { formatDateTime } from "../../utils/helpers.js";

const STATUSES = ["Open", "In Progress", "Pending", "Resolved", "Closed"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];

export default function MyTickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    setLoading(true);
    api.userTickets()
      .then((r) => setTickets(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const status = searchParams.get("status") || "";
    setFilterStatus((current) => (current === status ? current : status));
  }, [searchParams]);

  const filtered = tickets.filter((t) =>
    (!filterStatus ||
      (filterStatus === "In Progress"
        ? ["In Progress", "Assigned", "Work In Progress"].includes(t.status)
        : filterStatus === "On Hold"
          ? t.status?.toLowerCase().includes("hold") || t.status?.toLowerCase().includes("pending")
          : t.status === filterStatus)) &&
    (!filterPriority || t.priority === filterPriority) &&
    (!search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      (t.ticket_id || "").toLowerCase().includes(search.toLowerCase()))
  );

  function applyStatusFilter(status) {
    const next = status === filterStatus ? "" : status;
    setFilterStatus(next);
    setSearchParams(next ? { status: next } : {});
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">My Tickets</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">View and manage all your submitted support requests from a single workspace.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyStatusFilter("Open")}
            className={`btn-secondary ${filterStatus === "Open" ? "border-brand-300 bg-brand-50 text-brand-700" : ""}`}
          >
            Open Tickets
          </button>
          <Link
            to="/user/create-ticket"
            className="btn-primary self-start"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Raise New Ticket
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="pro-card p-4">
        <div className="flex flex-wrap gap-3">
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
      </div>

      {/* Ticket list */}
      <div className="pro-card overflow-hidden">
        {loading ? (
          <ListSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search || filterStatus || filterPriority ? "No matching tickets" : "No tickets yet"}
            subtitle={
              search || filterStatus || filterPriority
                ? "Try adjusting your search or filters."
                : "Raise your first support request and track it here."
            }
            icon={
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
              </svg>
            }
            action={
              !search && !filterStatus && !filterPriority
                ? { label: "Raise a ticket", href: "/user/create-ticket" }
                : undefined
            }
          />
        ) : (
          <>
            {/* Table header */}
            <div
              className="hidden px-5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40 lg:grid lg:grid-cols-[1fr_110px_110px_130px_72px]"
              style={{ borderBottom: "1px solid #e8eef5" }}
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
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/user/ticket/${ticket.id}`);
                    }
                  }}
                  className="flex cursor-pointer flex-col gap-3 px-5 py-4 transition-colors duration-100 hover:bg-slate-50/70 dark:hover:bg-slate-700/30 lg:grid lg:grid-cols-[1fr_110px_110px_130px_72px] lg:items-center"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #e8eef5" : "none" }}
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {ticket.ticket_id || `#${ticket.id}`}
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ticket.category}{ticket.sub_category ? ` · ${ticket.sub_category}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={ticket.priority} type="priority" />
                  <StatusBadge status={ticket.status} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(ticket.created_at)}</span>
                  <Link
                    to={`/user/ticket/${ticket.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
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
              className="px-5 py-3 text-xs text-slate-500 dark:text-slate-400"
              style={{ borderTop: "1px solid #e8eef5" }}
            >
              Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span> of{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">{tickets.length}</span> tickets
            </div>
          </>
        )}
      </div>
    </div>
  );
}
