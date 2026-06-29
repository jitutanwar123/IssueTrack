import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge.jsx";
import { formatDateTime } from "../utils/helpers.js";

export function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="group block rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elevated"
      style={{ boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400">
              #{ticket.id}
            </span>
            {ticket.priority && (
              <StatusBadge status={ticket.priority} type="priority" />
            )}
          </div>
          <h3 className="mt-1 line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-brand-700 transition-colors">
            {ticket.title || "Untitled Ticket"}
          </h3>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <p className="mt-2 line-clamp-1 text-xs text-slate-500">
        {ticket.description || "No description available"}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          {ticket.assigned_to_name || "Unassigned"}
        </span>
        <span>{formatDateTime(ticket.created_at)}</span>
      </div>
    </Link>
  );
}