import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTickets } from "../context/TicketContext.jsx";
import { api } from "../utils/api.js";
import { AgeingChart, CategoryPieChart, ResolverChart } from "../components/Charts.jsx";
import { StatsCard } from "../components/StatsCard.jsx";
import { TicketCard } from "../components/TicketCard.jsx";

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
    <label className="min-w-0">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
      >
        <option value="">All {label}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { summary, reportData, dashboardFilters, setDashboardFilters, refreshSummary } = useTickets();
  const [allTickets, setAllTickets] = useState([]);

  useEffect(() => {
    api
      .tickets({ limit: 100 })
      .then((response) => setAllTickets(response.data))
      .catch(() => {});
  }, []);

  // Dynamic options for fields NOT overridden by static lists
  const dynamicOptions = useMemo(() => {
    const unique = (field) =>
      [...new Set(allTickets.map((ticket) => ticket[field]).filter(Boolean))].sort();
    return {
      category: unique("category"),
      sub_category: unique("sub_category"),
      customer: unique("customer_name"),
    };
  }, [allTickets]);

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Operations Snapshot
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Live ticket control room</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Monitor open work, SLA risk, and resolver load across incident and service request queues.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/tickets/new"
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-navy transition hover:bg-cyan-300"
            >
              Create Ticket
            </Link>
            <button
              onClick={() => refreshSummary()}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Refresh Stats
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats Cards ── */}
      <section className="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard title="Total Tickets (24h)" value={summary?.totalTicketsLast24Hours ?? 0} />
        <StatsCard title="Unassigned"           value={summary?.unassignedTickets ?? 0} />
        <StatsCard title="Incidents"            value={summary?.incidentTickets ?? 0} />
        <StatsCard title="Service Requests"     value={summary?.serviceRequestTickets ?? 0} />
        <StatsCard title="P1 Incidents"         value={summary?.p1Incidents ?? 0} />
        <StatsCard title="Pending / Breach"     value={summary?.pendingBreachTickets ?? 0} />
      </section>

      {/* ── Filters ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-4 xl:grid-cols-6">
          {/* EXPANDED: static India locations */}
          <FilterSelect
            label="Locations"
            value={dashboardFilters.location}
            onChange={(value) => setDashboardFilters({ location: value })}
            options={INDIA_LOCATIONS}
          />

          {/* Dynamic: from ticket data */}
          <FilterSelect
            label="Classifications"
            value={dashboardFilters.category}
            onChange={(value) => setDashboardFilters({ category: value })}
            options={dynamicOptions.category}
          />
          <FilterSelect
            label="Sub-Categories"
            value={dashboardFilters.sub_category}
            onChange={(value) => setDashboardFilters({ sub_category: value })}
            options={dynamicOptions.sub_category}
          />

          {/* EXPANDED: static IT + HR/Admin services */}
          <FilterSelect
            label="Services"
            value={dashboardFilters.service}
            onChange={(value) => setDashboardFilters({ service: value })}
            options={SERVICES}
          />

          {/* EXPANDED: static IT + HR/Admin workgroups */}
          <FilterSelect
            label="Workgroups"
            value={dashboardFilters.workgroup}
            onChange={(value) => setDashboardFilters({ workgroup: value })}
            options={WORKGROUPS}
          />

          {/* Dynamic: from ticket data */}
          <FilterSelect
            label="Customers"
            value={dashboardFilters.customer}
            onChange={(value) => setDashboardFilters({ customer: value })}
            options={dynamicOptions.customer}
          />

          <button
            onClick={() =>
              setDashboardFilters({
                location: "",
                category: "",
                sub_category: "",
                service: "",
                workgroup: "",
                customer: "",
              })
            }
            className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* ── Charts ── */}
      <section className="grid gap-6 xl:grid-cols-2">
        <AgeingChart data={summary?.activeAgeing || []} />
        <CategoryPieChart data={summary?.activeByCategory || []} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ResolverChart data={summary?.resolverBreakdown || []} />
        <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Tickets</h3>
          </div>
          <div className="grid gap-3 p-4">
            {allTickets.slice(0, 5).map((ticket, index) => (
              <TicketCard
                key={ticket.id || ticket.ticket_id || index}
                ticket={ticket}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
