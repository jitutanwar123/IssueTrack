import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "../context/TicketContext.jsx";
import { AgeingChart, CategoryPieChart, ResolverChart } from "../components/Charts.jsx";
import { StatsCard } from "../components/StatsCard.jsx";
import { TicketCard } from "../components/TicketCard.jsx";
import { PLANTS } from "../utils/plants.js";
import { CATEGORY_OPTIONS, getServiceOptions, getSubCategoryOptions } from "../utils/ticketTaxonomy.js";

// ─── FilterSelect component ────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="min-w-0 block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pro-select"
      >
        <option value="">All {label}</option>
        {options.map((item) => {
          const optionValue = typeof item === "string" ? item : item?.value ?? "";
          const optionLabel = typeof item === "string" ? item : item?.label ?? optionValue;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    tickets,
    summary,
    reportData,
    dashboardFilters,
    setDashboardFilters,
    loadReports,
    refreshSummary,
    refreshTickets,
  } = useTickets();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [activeFocus, setActiveFocus] = useState("all");

  const quickFilters = useMemo(() => ({
    all: {
      label: "Total (24h)",
      test: () => true,
      accentIndex: 0,
    },
    unassigned: {
      label: "Unassigned",
      test: (ticket) =>
        !ticket.assigned_to &&
        !ticket.assigned_to_id &&
        !ticket.assigned_to_name &&
        !(ticket.assigned_to || "").trim(),
      accentIndex: 3,
    },
    incidents: {
      label: "Incidents",
      test: (ticket) => ticket.category === "Incident",
      accentIndex: 0,
    },
    service_requests: {
      label: "Service Requests",
      test: (ticket) => ticket.category === "Service Request",
      accentIndex: 1,
    },
    p1_incidents: {
      label: "P1 Incidents",
      test: (ticket) => ticket.category === "Incident" && ticket.priority === "P1",
      accentIndex: 3,
    },
    pending_breach: {
      label: "Pending / Breach",
      test: (ticket) => !["Closed", "Cancelled", "Reject"].includes(ticket.status),
      accentIndex: 2,
    },
  }), []);

  useEffect(() => {
    loadReports(dashboardFilters).catch(() => {});
  }, [dashboardFilters, loadReports]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshSummary(), refreshTickets(), loadReports(dashboardFilters)]);
      setLastRefreshed(new Date());
    } catch (_) {}
    finally { setRefreshing(false); }
  }

  // Dynamic dropdown options derived from already-loaded ticket data
  const dynamicOptions = useMemo(() => {
    const allSubCategories = [...new Set(CATEGORY_OPTIONS.flatMap((category) => getSubCategoryOptions(category)))].sort();
    return {
      category:     CATEGORY_OPTIONS,
      sub_category: allSubCategories,
      service:      getServiceOptions("staff"),
      plant:        PLANTS,
    };
  }, []);

  const reportTickets = reportData?.tickets?.length ? reportData.tickets : tickets;
  const focusedTickets = useMemo(() => {
    const filter = quickFilters[activeFocus] || quickFilters.all;
    return reportTickets.filter((ticket) => filter.test(ticket));
  }, [activeFocus, quickFilters, reportTickets]);

  const visibleCards = [
    { key: "all", title: "Total (24h)", value: summary?.totalTicketsLast24Hours ?? 0, accentIndex: 0 },
    { key: "unassigned", title: "Unassigned", value: summary?.unassignedTickets ?? 0, accentIndex: 3 },
    { key: "incidents", title: "Incidents", value: summary?.incidentTickets ?? 0, accentIndex: 0 },
    { key: "service_requests", title: "Service Requests", value: summary?.serviceRequestTickets ?? 0, accentIndex: 1 },
    { key: "p1_incidents", title: "P1 Incidents", value: summary?.p1Incidents ?? 0, accentIndex: 3 },
    { key: "pending_breach", title: "Pending / Breach", value: summary?.pendingBreachTickets ?? 0, accentIndex: 2 },
  ];

  const activeLabel = quickFilters[activeFocus]?.label || "Total (24h)";

  const chartData = useMemo(() => {
    const bucketMap = { "0-7 Days": 0, "8-30 Days": 0, "31-60 Days": 0, "60+ Days": 0 };
    const categoryMap = new Map();
    const resolverMap = new Map();

    focusedTickets.forEach((ticket) => {
      const created = new Date(ticket.created_at);
      if (!Number.isNaN(created.getTime())) {
        const age = Math.floor((Date.now() - created.getTime()) / 86400000);
        const bucket =
          age <= 7 ? "0-7 Days" :
          age <= 30 ? "8-30 Days" :
          age <= 60 ? "31-60 Days" :
          "60+ Days";
        bucketMap[bucket] += 1;
      }

      const category = ticket.category || "Uncategorised";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

      const assignee = ticket.assigned_to_name || ticket.assigned_to || "Unassigned";
      resolverMap.set(assignee, (resolverMap.get(assignee) || 0) + 1);
    });

    const activeAgeing = ["0-7 Days", "8-30 Days", "31-60 Days", "60+ Days"].map((bucket) => ({
      bucket,
      count: bucketMap[bucket],
    }));
    const activeByCategory = [...categoryMap.entries()].map(([name, value]) => ({ name, value }));
    const resolverBreakdown = [...resolverMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));

    return { activeAgeing, activeByCategory, resolverBreakdown };
  }, [focusedTickets]);

  const recentTickets = useMemo(() => focusedTickets.slice(0, 5), [focusedTickets]);

  function selectFocus(key) {
    setActiveFocus((current) => (current === key ? "all" : key));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] mb-3 text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Operations Snapshot
            </div>
            <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">Live Ticket Control Room</h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Monitor open work, SLA risk, and resolver load across the ticket types your project actually uses.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary disabled:opacity-60"
            >
              {refreshing ? (
                <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                  Refreshing…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
        {lastRefreshed && <div className="mt-3 text-right text-[11px] text-slate-400">Updated at {lastRefreshed.toLocaleTimeString("en-IN")}</div>}
      </section>

      {/* ── Stats Cards ── */}
      <section className="grid gap-3 grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
        {visibleCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => selectFocus(card.key)}
            aria-pressed={activeFocus === card.key}
            className={`block text-left transition-transform duration-150 ${activeFocus === card.key ? "scale-[1.01]" : "hover:-translate-y-0.5"}`}
          >
            <div className={activeFocus === card.key ? "ring-2 ring-slate-900/10 rounded-2xl" : ""}>
              <StatsCard title={card.title} value={card.value} accentIndex={card.accentIndex} />
            </div>
          </button>
        ))}
      </section>

      {/* ── Filters ── */}
      <section
        className="rounded-2xl bg-white p-4"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Filters</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FilterSelect label="Classifications" value={dashboardFilters.category}     onChange={(v) => setDashboardFilters({ category: v })}      options={dynamicOptions.category} />
          <FilterSelect label="Sub-Categories" value={dashboardFilters.sub_category} onChange={(v) => setDashboardFilters({ sub_category: v })} options={dynamicOptions.sub_category} />
          <FilterSelect label="Services"        value={dashboardFilters.service}      onChange={(v) => setDashboardFilters({ service: v })}       options={dynamicOptions.service.length ? dynamicOptions.service : []} />
          <FilterSelect label="Plants"          value={dashboardFilters.plant}        onChange={(v) => setDashboardFilters({ plant: v })}         options={PLANTS} />
          <div className="flex items-end">
            <button
              onClick={() => setDashboardFilters({ category:"", sub_category:"", service:"", plant:"" })}
              className="btn-secondary w-full text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {/* ── Charts ── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-soft">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current focus</div>
          <div className="text-sm font-semibold text-slate-900">{activeLabel}</div>
        </div>
        <button
          type="button"
          onClick={() => setActiveFocus("all")}
          className="btn-secondary text-xs"
        >
          Show all
        </button>
      </div>
      <section className="grid gap-6 xl:grid-cols-2">
        <AgeingChart data={chartData.activeAgeing} />
        <CategoryPieChart data={chartData.activeByCategory} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ResolverChart data={chartData.resolverBreakdown} />
        <div
          className="rounded-2xl bg-white overflow-hidden"
          style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <h3 className="text-sm font-bold text-slate-900">Recent Tickets</h3>
            <Link to="/tickets" className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="p-4 space-y-2">
            {recentTickets.map((ticket, index) => (
              <TicketCard key={ticket.id || ticket.ticket_id || index} ticket={ticket} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
