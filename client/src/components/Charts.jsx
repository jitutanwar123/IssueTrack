import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const colors = ["#2563eb", "#06b6d4", "#7c3aed", "#059669", "#d97706", "#dc2626", "#64748b", "#0891b2"];

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-white ${className}`}
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="h-[300px] px-4 py-4">{children}</div>
    </div>
  );
}

function EmptyState({ message = "No data available for this period" }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 4-4" strokeDasharray="2 2" />
      </svg>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

export function AgeingChart({ data }) {
  return (
    <Panel title="Active Tickets - Ageing" subtitle="Grouped by age since creation">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="bucket" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#0f172a" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function CategoryPieChart({ data }) {
  return (
    <Panel title="Active Tickets by Category" subtitle="Incident, service request, change and problem split">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={105} paddingAngle={4} label>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function ResolverChart({ data }) {
  return (
    <Panel title="Tickets by Resolver / Workstream" subtitle="Current load by resolver">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#14b8a6" radius={[0, 10, 10, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function StatusPieChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;
  return (
    <Panel title="Tickets by Status" subtitle="Current distribution across all statuses">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              paddingAngle={3}
              label
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}

export function PriorityBarChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;
  return (
    <Panel title="Tickets by Priority" subtitle="High-risk and SLA-sensitive work">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#f97316" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState />
      )}
    </Panel>
  );
}

export function ResolutionLineChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;
  return (
    <Panel title="Tickets Resolved per Day" subtitle="Closure trend over the selected period">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState message="No resolved tickets in the selected period" />
      )}
    </Panel>
  );
}

export function AvgResolutionBarChart({ data = [] }) {
  const hasData = Array.isArray(data) && data.length > 0;
  return (
    <Panel title="Average Resolution Time per Assignee" subtitle="Minutes across resolved work">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={70} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip formatter={(val) => [`${val} min`, "Avg Resolution"]} />
            <Bar dataKey="value" fill="#22c55e" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyState message="No resolution data for the selected period" />
      )}
    </Panel>
  );
}
