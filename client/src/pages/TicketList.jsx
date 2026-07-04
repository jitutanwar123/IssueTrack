import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useTickets } from "../context/TicketContext.jsx";
import { formatDateTime } from "../utils/helpers.js";
import { PLANTS } from "../utils/plants.js";

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pro-select"
      >
        <option value="">All</option>
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

export default function TicketList() {
  const [searchParams] = useSearchParams();
  const {
    tickets,
    pagination,
    ticketFilters,
    setTicketFilters,
    refreshTickets,
    removeTicket,
  } = useTickets();

  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => ({
    ...ticketFilters,
    status: searchParams.get("status") || ticketFilters.status || "",
  }));

  useEffect(() => {
    setDraft(ticketFilters);
  }, [ticketFilters]);

  useEffect(() => {
    const status = searchParams.get("status") || "";
    if (!status) return;
    const next = { ...ticketFilters, status, page: 1 };
    setDraft((current) => ({ ...current, status }));
    setTicketFilters(next);
    refreshTickets(next).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const statuses = [
    "Open",
    "Assigned",
    "Work In Progress",
    "On Hold - Change",
    "On Hold - Customer",
    "On Hold - Infra",
    "Closed",
    "Reject",
  ];

  const priorities = ["P1", "P2", "P3", "P4"];

  const categories = [
    "Incident",
    "Service Request",
    "Problem",
    "Change",
    "SAP Application",
  ];

  function applyFilters() {
    setTicketFilters({
      ...draft,
      page: 1,
    });

    refreshTickets({
      ...draft,
      page: 1,
    }).catch(() => {});
  }

  function nextPage(page) {
    const updated = { ...ticketFilters, page, limit: pagination.limit };
    setTicketFilters(updated);
    refreshTickets(updated).catch(() => {});
  }

  async function deleteRow(ticket) {
    const ticketId = ticket.id;
    if (!ticketId) { alert("Ticket ID not found"); return; }
    if (!window.confirm(`Delete ticket INC${ticketId}? This cannot be undone.`)) return;
    try {
      await removeTicket(ticketId);
    } catch (err) {
      console.error(err);
      alert("Failed to delete ticket");
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Admin Ticketing</div>
            <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">Tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Search, filter and manage all ticket records from one clean view.</p>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="pro-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          <label className="block xl:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Search</span>
            <input
              value={draft.search}
              onChange={(event) => setDraft((c) => ({ ...c, search: event.target.value }))}
              placeholder="Ticket ID, title…"
              className="pro-input"
            />
          </label>
          <Select label="Status"   value={draft.status}   onChange={(v) => setDraft((c) => ({ ...c, status: v }))}   options={statuses} />
          <Select label="Priority" value={draft.priority} onChange={(v) => setDraft((c) => ({ ...c, priority: v }))} options={priorities} />
          <Select label="Category" value={draft.category} onChange={(v) => setDraft((c) => ({ ...c, category: v }))} options={categories} />
          <Select label="Plant" value={draft.plant} onChange={(v) => setDraft((c) => ({ ...c, plant: v }))} options={PLANTS} />
          <div className="flex flex-col gap-1.5">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Assignee ID</span>
              <input
                value={draft.assignee}
                onChange={(event) => setDraft((c) => ({ ...c, assignee: event.target.value }))}
                placeholder="Numeric user id"
                className="pro-input"
              />
            </label>
          </div>
          <div className="flex items-end">
            <button onClick={applyFilters} className="btn-primary w-full">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="pro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Ticket ID</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Title</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Priority</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Status</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Category</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Assigned To</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Created</th>
                <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 bg-slate-50/80" style={{ borderBottom: "1px solid #f1f5f9" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/tickets/${ticket.id}`);
                      }
                    }}
                    className="cursor-pointer transition-colors duration-100 hover:bg-slate-50/70"
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-bold text-slate-700">INC{ticket.id}</span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[200px]">
                    <span className="text-sm font-medium text-slate-800 line-clamp-1">{ticket.title}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={ticket.priority} type="priority" />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">{ticket.category || "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    {ticket.assigned_to_name || ticket.assigned_to || "Unassigned"}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDateTime(ticket.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 hover:border-slate-300"
                      >
                        View
                      </Link>

                      {ticket.status === "Resolved" ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 select-none">
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                          </svg>
                          Resolved
                        </span>
                      ) : ticket.assigned_to ? (
                        <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 select-none">
                          Staff Resolves
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/resolve/${ticket.id}`); }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-all duration-150 hover:bg-emerald-700"
                        >
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteRow(ticket); }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-all duration-150 hover:bg-red-50 hover:border-red-300"
                      >
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {tickets.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-400">No tickets found</p>
                      <p className="text-xs text-slate-300">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between gap-4 px-4 py-3.5"
          style={{ borderTop: "1px solid #f1f5f9" }}
        >
          <span className="text-xs text-slate-500">
            Page <span className="font-semibold text-slate-700">{pagination.page}</span> of{" "}
            <span className="font-semibold text-slate-700">{pagination.totalPages}</span>{" "}
            &mdash; {pagination.total} total tickets
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => nextPage(pagination.page - 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => nextPage(pagination.page + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
