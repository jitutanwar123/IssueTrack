import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Resolved History</h2>
        <p className="mt-1 text-sm text-slate-500">
          All tickets resolved by you, {user?.name}.
        </p>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-green-100 bg-green-50 p-5 flex items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-500 shadow-sm shadow-green-500/30">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div className="text-3xl font-bold text-green-700">{history.length}</div>
          <div className="text-sm font-medium text-green-600">Total Tickets Resolved</div>
        </div>
      </div>

      {/* History table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-700">Resolution Log</h3>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">Loading…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            You haven't resolved any tickets yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Ticket ID</th>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Raised By</th>
                  <th className="px-5 py-4">Resolved At</th>
                  <th className="px-5 py-4">Resolution Note</th>
                  <th className="px-5 py-4">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 text-sm font-mono font-semibold text-green-700">
                      {t.ticket_id || `INC${t.id}`}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900 max-w-[200px] truncate">
                      {t.title}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={t.priority} type="priority" />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{t.category || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{t.customer_name || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {t.resolved_at ? formatDateTime(t.resolved_at) : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 max-w-[220px]">
                      <span className="line-clamp-2">{t.resolution_note || "—"}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/staff/tickets/${t.id}`}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View
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
