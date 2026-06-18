import { useEffect, useState } from "react";
import { AvgResolutionBarChart, PriorityBarChart, ResolutionLineChart, StatusPieChart } from "../components/Charts.jsx";
import { useTickets } from "../context/TicketContext.jsx";
import { downloadCsv, formatDateTime } from "../utils/helpers.js";

export default function Reports() {
  const { loadReports } = useTickets();
  const [filters, setFilters] = useState({ from: "", to: "", category: "", assignee: "" });
  const [data, setData] = useState({ byStatus: [], byPriority: [], resolvedPerDay: [], avgResolutionByAssignee: [] });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(next = filters) {
  try {
    const response = await loadReports(next);

    console.log(
      "REPORT RESPONSE =",
      JSON.stringify(response, null, 2)
    );

    setData(
      response.data || {
        byStatus: [],
        byPriority: [],
        resolvedPerDay: [],
        avgResolutionByAssignee: [],
      }
    );
  } catch (err) {
    console.error(err);
  }
}
 function applyFilters() {
  console.log("APPLY FILTERS CLICKED");
  console.log("FILTER VALUES =", filters);

  loadData(filters).catch(console.error);
}
  function exportCsv() {
    const rows = [
      ["Metric", "Value"],
      ...data.byStatus.map((row) => [`Status: ${row.name}`, row.value]),
      ...data.byPriority.map((row) => [`Priority: ${row.name}`, row.value]),
      ...data.resolvedPerDay.map((row) => [`Resolved: ${row.name}`, row.value]),
      ...data.avgResolutionByAssignee.map((row) => [`Assignee: ${row.name}`, row.value]),
    ];
    downloadCsv(`welserve-reports-${Date.now()}.csv`, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">Operational charts and exportable summary views.</p>
        </div>
        <button onClick={exportCsv} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2 xl:grid-cols-4">
        <FilterInput label="From" type="date" value={filters.from} onChange={(value) => setFilters((current) => ({ ...current, from: value }))} />
        <FilterInput label="To" type="date" value={filters.to} onChange={(value) => setFilters((current) => ({ ...current, to: value }))} />
        <FilterInput label="Category" value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))} />
        <FilterInput label="Assignee" value={filters.assignee} onChange={(value) => setFilters((current) => ({ ...current, assignee: value }))} />
        <button onClick={applyFilters} className="self-end rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-navy transition hover:bg-cyan-300">
          Apply Filters
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <StatusPieChart data={data.byStatus} />
        <PriorityBarChart data={data.byPriority} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ResolutionLineChart data={data.resolvedPerDay} />
        <AvgResolutionBarChart data={data.avgResolutionByAssignee} />
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
      />
    </label>
  );
}
