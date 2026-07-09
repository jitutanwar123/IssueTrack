import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "../context/TicketContext.jsx";
import { AgeingChart, CategoryPieChart, ResolverChart } from "../components/Charts.jsx";
import { StatsCard } from "../components/StatsCard.jsx";
import { TicketCard } from "../components/TicketCard.jsx";
import { PLANTS } from "../utils/plants.js";

// ─── Static option lists ───────────────────────────────────────────────────────

const INDIA_LOCATIONS = [
  // States
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  // Union Territories
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi (NCT)", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
  // Major Cities
  "Ahmedabad", "Bangalore", "Bhopal", "Chennai", "Coimbatore", "Delhi",
  "Faridabad", "Gandhinagar", "Gurgaon", "Hyderabad", "Indore", "Jaipur",
  "Kochi", "Kolkata", "Lucknow", "Ludhiana", "Mumbai", "Nagpur", "Nashik",
  "Noida", "Patna", "Pune", "Rajkot", "Surat", "Thane", "Vadodara",
  "Varanasi", "Visakhapatnam",
];

const SERVICES = [
  // IT Services
  "Hardware Support",
  "Software Installation & Licensing",
  "Network & Connectivity",
  "Email & Communication",
  "Server & Infrastructure",
  "Cybersecurity & Access Control",
  "Database Administration",
  "ERP / SAP Support",
  "IT Helpdesk",
  "Backup & Disaster Recovery",
  "CCTV & Surveillance",
  "Printer & Peripheral Support",
  "VPN & Remote Access",
  "Website & Application Support",
  // HR & Admin Services
  "Recruitment & Onboarding",
  "Payroll & Compensation",
  "Leave & Attendance Management",
  "Employee Relations",
  "Training & Development",
  "Performance Management",
  "Travel & Accommodation",
  "Facilities & Housekeeping",
  "Canteen & Pantry",
  "Stationery & Office Supplies",
  "Security & Access Cards",
  "Compliance & Legal",
  "Health & Safety",
  "Vendor Management",
];

const WORKGROUPS = [
  // IT Workgroups
  "IT - Level 1 Support",
  "IT - Level 2 Support",
  "IT - Level 3 / Engineering",
  "Network Operations",
  "Server & Cloud Ops",
  "Database Team",
  "Security Operations Center (SOC)",
  "ERP / SAP Team",
  "Application Development",
  "IT Infrastructure",
  // HR & Admin Workgroups
  "HR - Recruitment",
  "HR - Payroll",
  "HR - Employee Engagement",
  "HR - Compliance & Legal",
  "HR - Training & Development",
  "Admin - Facilities",
  "Admin - Travel Desk",
  "Admin - Procurement",
  "Admin - Security",
  "Management / Leadership",
];

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
    dashboardFilters,
    setDashboardFilters,
    refreshSummary,
    refreshTickets,
  } = useTickets();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([refreshSummary(), refreshTickets()]);
      setLastRefreshed(new Date());
    } catch (_) {}
    finally { setRefreshing(false); }
  }

  // Dynamic dropdown options derived from already-loaded ticket data
  const dynamicOptions = useMemo(() => {
    const unique = (field) =>
      [...new Set(tickets.map((t) => t[field]).filter(Boolean))].sort();
    return {
      category:     unique("category"),
      sub_category: unique("sub_category"),
      customer:     unique("customer_name"),
      plant:        unique("plant"),
    };
  }, [tickets]);

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
              Monitor open work, SLA risk, and resolver load across incident and service request queues.
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
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="Total (24h)"       value={summary?.totalTicketsLast24Hours ?? 0} accentIndex={0} />
        <StatsCard title="Unassigned"         value={summary?.unassignedTickets ?? 0}       accentIndex={3} />
        <StatsCard title="Incidents"          value={summary?.incidentTickets ?? 0}          accentIndex={0} />
        <StatsCard title="Service Requests"   value={summary?.serviceRequestTickets ?? 0}   accentIndex={1} />
        <StatsCard title="P1 Incidents"       value={summary?.p1Incidents ?? 0}              accentIndex={3} />
        <StatsCard title="Pending / Breach"   value={summary?.pendingBreachTickets ?? 0}     accentIndex={2} />
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
          <FilterSelect label="Locations"      value={dashboardFilters.location}     onChange={(v) => setDashboardFilters({ location: v })}      options={INDIA_LOCATIONS} />
          <FilterSelect label="Classifications" value={dashboardFilters.category}     onChange={(v) => setDashboardFilters({ category: v })}      options={dynamicOptions.category} />
          <FilterSelect label="Sub-Categories" value={dashboardFilters.sub_category} onChange={(v) => setDashboardFilters({ sub_category: v })} options={dynamicOptions.sub_category} />
          <FilterSelect label="Services"        value={dashboardFilters.service}      onChange={(v) => setDashboardFilters({ service: v })}       options={SERVICES} />
          <FilterSelect label="Plants"          value={dashboardFilters.plant}        onChange={(v) => setDashboardFilters({ plant: v })}         options={PLANTS} />
          <FilterSelect label="Workgroups"      value={dashboardFilters.workgroup}    onChange={(v) => setDashboardFilters({ workgroup: v })}     options={WORKGROUPS} />
          <FilterSelect label="Customers"       value={dashboardFilters.customer}     onChange={(v) => setDashboardFilters({ customer: v })}      options={dynamicOptions.customer} />
          <div className="flex items-end">
            <button
              onClick={() => setDashboardFilters({ location:"", category:"", sub_category:"", service:"", plant:"", workgroup:"", customer:"" })}
              className="btn-secondary w-full text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {/* ── Charts ── */}
      <section className="grid gap-6 xl:grid-cols-2">
        <AgeingChart data={summary?.activeAgeing || []} />
        <CategoryPieChart data={summary?.activeByCategory || []} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ResolverChart data={summary?.resolverBreakdown || []} />
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
            {tickets.slice(0, 5).map((ticket, index) => (
              <TicketCard key={ticket.id || ticket.ticket_id || index} ticket={ticket} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
