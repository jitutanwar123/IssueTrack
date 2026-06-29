import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { useTickets } from "../context/TicketContext.jsx";
import { formatDateTime } from "../utils/helpers.js";

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
      >
        <option value="">All</option>

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TicketList() {
  const {
    tickets,
    pagination,
    ticketFilters,
    setTicketFilters,
    refreshTickets,
    removeTicket,
  } = useTickets();

  const navigate = useNavigate();
  const [draft, setDraft] = useState(ticketFilters);

  useEffect(() => {
    setDraft(ticketFilters);
  }, [ticketFilters]);

  const statuses = [
    "Open",
    "Assigned",
    "Work In Progress",
    "On Hold - Change",
    "On Hold - Customer",
    "On Hold - Infra",
    "Closed",
    "Cancelled",
  ];

  const priorities = ["P1", "P2", "P3", "P4"];

  const categories = [
    "Incident",
    "Service Request",
    "Problem",
    "Change",
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
  const updated = { ...ticketFilters, page };
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Ticket List
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Search, filter and jump into any ticket record.
          </p>
        </div>

        <Link
          to="/tickets/new"
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Create Ticket
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="block xl:col-span-2">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </span>

            <input
              value={draft.search}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Ticket ID, title..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>

          <Select
            label="Status"
            value={draft.status}
            onChange={(value) =>
              setDraft((c) => ({
                ...c,
                status: value,
              }))
            }
            options={statuses}
          />

          <Select
            label="Priority"
            value={draft.priority}
            onChange={(value) =>
              setDraft((c) => ({
                ...c,
                priority: value,
              }))
            }
            options={priorities}
          />

          <Select
            label="Category"
            value={draft.category}
            onChange={(value) =>
              setDraft((c) => ({
                ...c,
                category: value,
              }))
            }
            options={categories}
          />

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assignee Id
            </span>

            <input
              value={draft.assignee}
              onChange={(event) =>
                setDraft((c) => ({
                  ...c,
                  assignee: event.target.value,
                }))
              }
              placeholder="Numeric user id"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>

          <button
            onClick={applyFilters}
            className="self-end rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-navy transition hover:bg-cyan-300"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-4">Ticket ID</th>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Assigned To</th>
                <th className="px-5 py-4">Created Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                    INC{ticket.id}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {ticket.title}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      status={ticket.priority}
                      type="priority"
                    />
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {ticket.category || "-"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-700">
                    {ticket.assigned_to_name || ticket.assigned_to || "Unassigned"}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatDateTime(ticket.created_at)}
                  </td>

                  <td className="px-5 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View
                      </Link>

                      {ticket.status === "Resolved" ? (
                        <span className="inline-flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 cursor-default select-none">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" /></svg>
                          Resolved
                        </span>
                      ) : ticket.assigned_to ? (
                        // Ticket is assigned to IT staff — only they can resolve it
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 cursor-default select-none">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Staff Resolves
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/resolve/${ticket.id}`);
                          }}
                          className="rounded-xl border border-green-300 bg-green-600 px-3 py-2 font-semibold text-white transition hover:bg-green-700 active:scale-95"
                        >
                          Resolve
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRow(ticket);
                        }}
                        className="rounded-xl border border-red-200 px-3 py-2 font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {tickets.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No tickets found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
          <div className="text-sm text-slate-500">
            Showing page {pagination.page} of{" "}
            {pagination.totalPages} from{" "}
            {pagination.total} tickets
          </div>

          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => nextPage(pagination.page - 1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => nextPage(pagination.page + 1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}