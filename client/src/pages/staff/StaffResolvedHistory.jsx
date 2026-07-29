import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { TableSkeleton, EmptyState } from "../../components/Skeleton.jsx";
import { formatDateTime } from "../../utils/helpers.js";

export default function StaffResolvedHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.staffResolvedHistory()
      .then((res) => setHistory(res.data || []))
      .catch((err) => setError(err.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const thCls = "px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resolved History</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          All tickets resolved or closed by you, {user?.name}.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-green-100 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 p-5 flex items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500 shadow-sm shadow-green-500/30">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          {loading ? (
            <div className="skeleton h-9 w-12 rounded-lg mb-1" />
          ) : (
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">{history.length}</div>
          )}
          <div className="text-sm font-medium text-green-600 dark:text-green-500">Total Tickets Handled</div>
        </div>
      </div>

      {/* History table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Resolution Log</h3>
        </div>

        {error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700/60">
              <thead className="bg-slate-50 dark:bg-slate-900/40">
                <tr>
                  {["Ticket ID", "Title", "Priority", "Category", "Raised By", "Status", "Resolved At", "Closed At", "Resolution Note", "View"].map((h) => (
                    <th key={h} className={thCls}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {loading ? (
                  <TableSkeleton count={5} cols={10} />
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="10">
                      <EmptyState
                        title="No resolved tickets yet"
                        subtitle="Tickets you resolve or close will appear here as a record of your work."
                        icon={
                          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  history.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-5 py-4 text-sm font-mono font-semibold text-green-700 dark:text-green-400">
                        {t.ticket_id || `INC${t.id}`}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-slate-200 max-w-[200px] truncate">
                        {t.title}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={t.priority} type="priority" />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{t.category || "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">{t.customer_name || "—"}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {t.resolved_at ? formatDateTime(t.resolved_at) : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {t.closed_at ? formatDateTime(t.closed_at) : "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-[220px]">
                        <span className="line-clamp-2">{t.resolution_note || "—"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          to={`/staff/tickets/${t.id}`}
                          className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          View
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
