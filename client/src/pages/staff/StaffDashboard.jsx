import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/helpers.js";

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-2 text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  async function load(params = {}) {
    setLoading(true);
    setError("");
    try {
      const res = await api.staffTickets(params);
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
    load({ search: search || undefined, status: statusFilter || undefined });
  }

  // Computed stats
  const open       = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "Work In Progress" || t.status === "Assigned").length;
  const onHold     = tickets.filter((t) => t.status?.startsWith("On Hold")).length;
  const resolved   = tickets.filter((t) => t.status === "Resolved").length;

  const firstName = user?.name?.split(" ")[0] || "Staff";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {firstName} 👋</h2>
        <p className="mt-1 text-sm text-slate-500">
          {user?.role || "IT Staff"} · Here are the tickets assigned to you.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Open"        value={open}       color="text-blue-500" />
        <StatCard label="In Progress" value={inProgress} color="text-orange-500" />
        <StatCard label="On Hold"     value={onHold}     color="text-amber-500" />
        <StatCard label="Resolved"    value={resolved}   color="text-green-500" />
      </div>

      {/* Filters */}
      <form onSubmit={applyFilters} className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by title or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400"
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
        <button
          type="submit"
          className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-400"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => { setSearch(""); setStatusFilter(""); load(); }}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Clear
        </button>
      </form>

      {/* Tickets table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">
            My Assigned Tickets
            <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {tickets.length}
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">Loading…</div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            No tickets assigned to you yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Ticket ID</th>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Raised By</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-4 text-sm font-mono font-semibold text-slate-700">
                      {ticket.ticket_id || `INC${ticket.id}`}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900 max-w-[200px] truncate">
                      {ticket.title}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.priority} type="priority" />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{ticket.category || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {ticket.customer_name || ticket.requested_by || "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDateTime(ticket.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/staff/tickets/${ticket.id}`}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {ticket.status === "Resolved" ? "View" : "View / Resolve"}
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
