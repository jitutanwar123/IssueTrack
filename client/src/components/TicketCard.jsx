import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge.jsx";
import { formatDateTime } from "../utils/helpers.js";

export function TicketCard({ ticket }) {
  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-sky-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            #{ticket.id}
          </div>

          <h3 className="mt-1 line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-sky-700">
            {ticket.title || "Untitled Ticket"}
          </h3>
        </div>

        <StatusBadge status={ticket.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-600">
        {ticket.description || "No description available"}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{ticket.assigned_to_name || "Unassigned"}</span>
        <span>•</span>
        <span>{formatDateTime(ticket.created_at)}</span>
      </div>
    </Link>
  );
}