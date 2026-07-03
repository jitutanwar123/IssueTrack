import { useCallback, useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/api.js";
import { exportStaffReportExcel } from "../../utils/excelExport.js";
import { formatDateTime, formatMinutes } from "../../utils/helpers.js";

// ── Colour palette ──────────────────────────────────────────────────────────
const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#64748b"];
const STATUS_COLOR = {
  Open: "#2563eb", Assigned: "#7c3aed",
  "Work In Progress": "#d97706", "In Progress": "#d97706",
  Resolved: "#059669", Closed: "#64748b", Reject: "#dc2626",
};

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
    >
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl" style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] mt-1" style={{ color }}>{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl p-2.5 mt-1" style={{ background: color + "18" }}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ── Chart panel ──────────────────────────────────────────────────────────────
function Panel({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="h-[280px] px-4 py-4">{children}</div>
    </div>
  );
}

function EmptyChart({ message = "No data for selected period" }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-4" strokeDasharray="2 2" />
      </svg>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

// ── Ticket table at bottom ───────────────────────────────────────────────────
const PRIORITY_STYLE = {
  P1: { bg: "#fef2f2", color: "#dc2626" },
  P2: { bg: "#fff7ed", color: "#ea580c" },
  P3: { bg: "#fefce8", color: "#ca8a04" },
  P4: { bg: "#f0fdf4", color: "#16a34a" },
};

function PriorityBadge({ priority }) {
  const s = PRIORITY_STYLE[priority] || { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: s.bg, color: s.color }}>
      {priority || "—"}
    </span>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] || "#64748b";
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: color }}>
      {status || "—"}
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function StaffReports() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (activeFilters) => {
    setLoading(true);
    try {
      const res = await api.staffReports(activeFilters);
      setData(res.data);
    } catch (err) {
      console.error("Staff report error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(filters); }, []); // eslint-disable-line

  function applyFilters() { loadData({ ...filters }); }

  function clearFilters() {
    const cleared = { from: "", to: "" };
    setFilters(cleared);
    loadData(cleared);
  }

  function handleExport() {
    if (!data?.tickets?.length) return;
    // Export the tickets already loaded for this staff member so the sheet matches the view.
    exportStaffReportExcel(user?.name, data.tickets).catch(console.error);
  }

  const s = data?.summary || {};

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Staff Analytics</div>
            <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">My Reports</h2>
            <p className="mt-1 text-sm text-slate-500">
              Personal performance overview for <span className="font-semibold text-slate-700">{user?.name}</span>
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={!data?.tickets?.length}
            className="btn-secondary disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17l2-3-2-3H10l1.25 2L12.5 11H14l-2 3 2 3h-1.5L11 15l-1.25 2H8.5z"/>
            </svg>
            Export Excel
          </button>
        </div>
      </section>

      <div className="pro-card p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">From</span>
            <input type="date" value={filters.from}
              onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">To</span>
            <input type="date" value={filters.to}
              onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
            />
          </label>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={applyFilters}
              disabled={loading}
              className="btn-primary"
            >
              {loading
                ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Loading…</>
                : <>🔍 Apply Filters</>}
            </button>
            {(filters.from || filters.to) && (
              <button onClick={clearFilters}
                className="btn-secondary">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Assigned"  value={s.total      ?? "—"} color="#7c3aed" icon="📋" />
        <StatCard label="Open"            value={s.open       ?? "—"} color="#2563eb" icon="🔵" />
        <StatCard label="In Progress"     value={s.inProgress ?? "—"} color="#d97706" icon="⚙️" />
        <StatCard label="Resolved"        value={s.resolved   ?? "—"} color="#059669" icon="✅" />
        <StatCard label="Avg Resolution"  value={s.avgResolutionMinutes ? formatMinutes(s.avgResolutionMinutes) : "—"} color="#0891b2" icon="⏱️" />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="My Tickets by Status" subtitle="Current distribution of your assigned tickets">
          {data?.byStatus?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byStatus} dataKey="value" nameKey="name" outerRadius={100} paddingAngle={3} label>
                  {data.byStatus.map((entry, i) => (
                    <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Panel>

        <Panel title="My Tickets by Priority" subtitle="P1 → P4 breakdown of your workload">
          {data?.byPriority?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {data.byPriority.map((entry) => {
                    const c = { P1:"#dc2626", P2:"#ea580c", P3:"#ca8a04", P4:"#16a34a" };
                    return <Cell key={entry.name} fill={c[entry.name] || "#7c3aed"} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Panel>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Tickets Resolved per Month" subtitle="Monthly resolution trend for your tickets">
          {data?.resolvedPerMonth?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.resolvedPerMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart message="No resolved tickets in this period" />}
        </Panel>

        <Panel title="My Tickets by Category" subtitle="Category breakdown of your assigned tickets">
          {data?.byCategory?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byCategory} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </Panel>
      </div>

      {/* Ticket list */}
      {data?.tickets?.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white" style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h3 className="text-sm font-bold text-slate-900">All My Tickets ({data.tickets.length})</h3>
            <p className="mt-0.5 text-xs text-slate-400">Complete list of tickets assigned to you</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Ticket ID", "Title", "Category", "Priority", "Status", "Requester", "Created", "Closed"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.tickets.map((t, i) => (
                  <tr key={t.ticket_id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{t.ticket_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{t.title}</td>
                    <td className="px-4 py-3 text-slate-500">{t.category || "—"}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{t.customer_name || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatDateTime(t.actual_closure_date || t.resolved_at || t.closed_at || t.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
