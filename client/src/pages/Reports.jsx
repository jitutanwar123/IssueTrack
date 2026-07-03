import { useCallback, useEffect, useState } from "react";
import { AvgResolutionBarChart, PriorityBarChart, ResolutionLineChart, StatusPieChart } from "../components/Charts.jsx";
import { useTickets } from "../context/TicketContext.jsx";
import { exportReportExcel } from "../utils/excelExport.js";

export default function Reports() {
  const { loadReports } = useTickets();
  const [filters, setFilters] = useState({ from: "", to: "", category: "", assignee: "" });
  const [data, setData] = useState({ byStatus: [], byPriority: [], resolvedPerDay: [], avgResolutionByAssignee: [] });
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async (activeFilters) => {
    setLoading(true);
    try {
      const response = await loadReports(activeFilters);
      setData(
        response.data || {
          byStatus: [],
          byPriority: [],
          resolvedPerDay: [],
          avgResolutionByAssignee: [],
        }
      );
    } catch (err) {
      console.error("Report load error:", err);
    } finally {
      setLoading(false);
    }
  }, [loadReports]);

  useEffect(() => {
    loadData(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters() {
    loadData({ ...filters });
  }

  function exportExcel() {
    exportReportExcel(filters).catch(console.error);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Admin Analytics</div>
            <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">Reports</h2>
            <p className="mt-1 text-sm text-slate-500">Operational charts and exportable summary views.</p>
          </div>
          <button
            onClick={exportExcel}
            className="btn-secondary"
            disabled={!data?.tickets?.length}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 17l2-3-2-3H10l1.25 2L12.5 11H14l-2 3 2 3h-1.5L11 15l-1.25 2H8.5z"/>
            </svg>
            Export Excel
          </button>
        </div>
      </section>

      <div className="pro-card p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterInput label="From" type="date" value={filters.from} onChange={(v) => setFilters((f) => ({ ...f, from: v }))} />
          <FilterInput label="To" type="date" value={filters.to} onChange={(v) => setFilters((f) => ({ ...f, to: v }))} />
          <FilterInput label="Category" value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} />
          <FilterInput label="Assignee" value={filters.assignee} onChange={(v) => setFilters((f) => ({ ...f, assignee: v }))} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Apply Filters
              </>
            )}
          </button>
          {(filters.from || filters.to || filters.category || filters.assignee) && (
            <button
              onClick={() => {
                const cleared = { from: "", to: "", category: "", assignee: "" };
                setFilters(cleared);
                loadData(cleared);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
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
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
      />
    </label>
  );
}
