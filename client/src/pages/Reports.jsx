import { useCallback, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { AvgResolutionBarChart, PriorityBarChart, ResolutionLineChart, StatusPieChart } from "../components/Charts.jsx";
import { useTickets } from "../context/TicketContext.jsx";

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
    const now = new Date().toLocaleDateString("en-GB").replaceAll("/", "-");
    const wb = XLSX.utils.book_new();

    // Helper: build a section block [title row, header row, ...data rows]
    function makeSection(title, headers, rows) {
      return [
        [title],          // section title
        headers,          // column headers
        ...rows,          // data
        [],               // blank spacer
      ];
    }

    const allRows = [
      // Workbook title
      [`Viraj Profiles Limited — Ticket Report`],
      [`Generated: ${now}`],
      [],
      ...makeSection(
        "TICKETS BY STATUS",
        ["Status", "Count"],
        data.byStatus.map((r) => [r.name, r.value])
      ),
      ...makeSection(
        "TICKETS BY PRIORITY",
        ["Priority", "Count"],
        data.byPriority.map((r) => [r.name, r.value])
      ),
      ...makeSection(
        "TICKETS RESOLVED PER DAY",
        ["Date", "Resolved Count"],
        data.resolvedPerDay.map((r) => [r.name, r.value])
      ),
      ...makeSection(
        "AVERAGE RESOLUTION TIME PER ASSIGNEE",
        ["Assignee", "Avg Time (Minutes)"],
        data.avgResolutionByAssignee.map((r) => [r.name, r.value])
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // Bold the title and section header rows
    const boldRows = new Set();
    boldRows.add(0); // "Viraj Profiles Limited..."
    let cursor = 3;  // after title block
    ["TICKETS BY STATUS", "TICKETS BY PRIORITY", "TICKETS RESOLVED PER DAY", "AVERAGE RESOLUTION TIME PER ASSIGNEE"].forEach((title, i) => {
      boldRows.add(cursor);       // section title
      boldRows.add(cursor + 1);   // column headers
      const sectionLengths = [
        data.byStatus.length,
        data.byPriority.length,
        data.resolvedPerDay.length,
        data.avgResolutionByAssignee.length,
      ];
      cursor += 2 + sectionLengths[i] + 1; // title + headers + data rows + spacer
    });

    // Apply bold style to those rows (SheetJS community edition supports cell styles via sheet_add_aoa)
    Object.keys(ws).forEach((addr) => {
      if (addr.startsWith("!")) return;
      const rowIndex = XLSX.utils.decode_cell(addr).r;
      if (boldRows.has(rowIndex)) {
        ws[addr].s = { font: { bold: true } };
      }
    });

    // Auto column width
    ws["!cols"] = [{ wch: 42 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, ws, "Ticket Report");
    XLSX.writeFile(wb, `Viraj-Ticket-Report-${now}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">Operational charts and exportable summary views.</p>
        </div>
        <button
          onClick={exportExcel}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
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
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 3px 12px rgba(37,99,235,0.3)" }}
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
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
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
