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

const colors = ["#0284c7", "#f97316", "#eab308", "#22c55e", "#ef4444", "#64748b", "#7c3aed", "#14b8a6"];

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-soft ${className}`}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="h-[320px] px-4 py-4">{children}</div>
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
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500">
        No chart data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
          fill="#8884d8"
          label
        />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PriorityBarChart({ data }) {
  return (
    <Panel title="Tickets by Priority" subtitle="High-risk and SLA-sensitive work">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#f97316" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function ResolutionLineChart({ data }) {
  return (
    <Panel title="Tickets Resolved per Day" subtitle="Closure trend over the selected period">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

export function AvgResolutionBarChart({ data }) {
  return (
    <Panel title="Average Resolution Time per Assignee" subtitle="Minutes across resolved work">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} interval={0} angle={-18} textAnchor="end" height={70} />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#22c55e" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  );
}
