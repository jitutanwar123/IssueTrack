import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { formatDateTime, getStatusLabel } from "../utils/helpers.js";
import { plantLabel } from "../utils/plants.js";

// ─── Department field definitions ───────────────────────────────────────────
const DEPARTMENT_FIELDS = {
  IT: [
    { name: "rootCause",    label: "Root Cause",      placeholder: "What caused the issue?",        required: true },
    { name: "fixApplied",   label: "Fix Applied",     placeholder: "Steps taken to fix the issue",  required: true },
    { name: "toolsUsed",    label: "Tools / Software Used", placeholder: "e.g. Disk Cleanup, SFC /scannow", required: false },
  ],
  Software: [
    { name: "rootCause",    label: "Root Cause",       placeholder: "Describe the root cause",       required: true },
    { name: "fixApplied",   label: "Fix Applied",      placeholder: "Patch / config change applied", required: true },
    { name: "versionInfo",  label: "Software Version", placeholder: "e.g. v3.2.1",                   required: false },
  ],
  Network: [
    { name: "rootCause",    label: "Root Cause",       placeholder: "Network fault / misconfiguration", required: true },
    { name: "fixApplied",   label: "Fix Applied",      placeholder: "Cable replaced / VLAN updated…",   required: true },
    { name: "affectedNodes",label: "Affected Nodes",   placeholder: "List of affected IPs / switches",  required: false },
  ],
  Hardware: [
    { name: "partReplaced",     label: "Part Replaced",   placeholder: "e.g. HDD, RAM, Monitor",     required: true },
    { name: "technicianName",   label: "Technician Name", placeholder: "Name of the technician",     required: true },
    { name: "workOrderNo",      label: "Work Order No.",  placeholder: "WO-XXXXX",                   required: false },
  ],
  Mechanical: [
    { name: "partReplaced",     label: "Part Replaced",   placeholder: "Describe the part or component", required: true },
    { name: "technicianName",   label: "Technician Name", placeholder: "Name of the technician",         required: true },
    { name: "workOrderNo",      label: "Work Order No.",  placeholder: "WO-XXXXX",                        required: false },
  ],
  HR: [
    { name: "actionTaken",      label: "Action Taken",        placeholder: "Describe the HR action",          required: true },
    { name: "hrRepresentative", label: "HR Representative",   placeholder: "Name of HR handling this",        required: true },
    { name: "policyReference",  label: "Policy Reference",    placeholder: "Policy / handbook section (opt.)",required: false },
  ],
  Exchange: [
    { name: "mailboxAffected",  label: "Mailbox Affected",    placeholder: "User@domain.com or all",         required: true },
    { name: "issueType",        label: "Issue Type",          placeholder: "e.g. NDR, Sync issue, Calendar", required: true },
    { name: "resolutionSteps",  label: "Resolution Steps",    placeholder: "Steps performed in Exchange ECP",required: false },
  ],
};

// Fallback generic fields for any unknown department
const GENERIC_FIELDS = [
  { name: "resolutionSummary", label: "Resolution Summary", placeholder: "Provide a clear summary of what was done", required: true },
  { name: "actionTaken",       label: "Action Taken",       placeholder: "Specific steps or actions performed",       required: false },
];

function getFieldsForDepartment(dept = "") {
  if (!dept) return GENERIC_FIELDS;
  // Case-insensitive lookup
  const key = Object.keys(DEPARTMENT_FIELDS).find(
    (k) => k.toLowerCase() === dept.toLowerCase()
  );
  return key ? DEPARTMENT_FIELDS[key] : GENERIC_FIELDS;
}

// ─── Ticket detail card ──────────────────────────────────────────────────────
function TicketSummaryCard({ ticket }) {
  const rows = [
    ["Ticket ID",       ticket.ticket_id || `INC${ticket.id}`],
    ["Title",           ticket.title],
    ["Raised By",       ticket.customer_name || ticket.requested_by || "—"],
    ["Email",           ticket.requester_email || "—"],
    ["Department",      ticket.department || "—"],
    ["Plant",           plantLabel(ticket.plant) || "—"],
    ["Category",        ticket.category || "—"],
    ["Sub-Category",    ticket.sub_category || null],
    ["Priority",        ticket.priority],
    ["Current Status",  getStatusLabel(ticket.status)],
    ["Created At",      formatDateTime(ticket.created_at)],
    ["Description",     null], // handled separately
  ].filter(([, v]) => v);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Ticket Details
        </h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start gap-4 px-6 py-3 text-sm">
            <span className="w-36 shrink-0 font-semibold text-slate-500">{label}</span>
            {label === "Priority" ? (
              <StatusBadge status={value} type="priority" />
            ) : label === "Current Status" ? (
              <StatusBadge status={value} />
            ) : (
              <span className="text-slate-800">{value}</span>
            )}
          </div>
        ))}
        {ticket.description && (
          <div className="px-6 py-3 text-sm">
            <span className="block font-semibold text-slate-500 mb-1">Description</span>
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {ticket.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Already resolved view ───────────────────────────────────────────────────
function AlreadyResolvedCard({ ticket }) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-green-800">This ticket is already resolved</h3>
          <p className="text-sm text-green-600">No further action is needed.</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-green-900">
        {ticket.resolved_by && (
          <p><span className="font-semibold">Resolved By: </span>{ticket.resolved_by}</p>
        )}
        {ticket.resolved_at && (
          <p><span className="font-semibold">Resolved At: </span>{formatDateTime(ticket.resolved_at)}</p>
        )}
        {ticket.resolution_note && (
          <>
            <p className="font-semibold mt-3">Resolution Note:</p>
            <div className="rounded-xl border border-green-200 bg-white px-4 py-3 whitespace-pre-wrap text-slate-700">
              {ticket.resolution_note}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DepartmentResolve() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [resolvedBy, setResolvedBy] = useState("");
  const [extraFields, setExtraFields] = useState({});
  const [resolutionNoteOverride, setResolutionNoteOverride] = useState("");

  // Load ticket
  useEffect(() => {
    setLoading(true);
    api.ticket(ticketId)
      .then((res) => {
        const t = res.data || res;
        setTicket(t);
        setResolvedBy(user?.name || "");
      })
      .catch(() => setError("Failed to load ticket. Please go back and try again."))
      .finally(() => setLoading(false));
  }, [ticketId, user?.name]);

  const dept = ticket?.department || "";
  const fields = getFieldsForDepartment(dept);

  function handleFieldChange(name, value) {
    setExtraFields((prev) => ({ ...prev, [name]: value }));
  }

  // Build the combined resolution note from all department-specific fields
  function buildResolutionNote() {
    const lines = fields
      .filter((f) => extraFields[f.name]?.trim())
      .map((f) => `${f.label}: ${extraFields[f.name].trim()}`);
    if (resolutionNoteOverride.trim()) {
      lines.push(`Additional Notes: ${resolutionNoteOverride.trim()}`);
    }
    return lines.join("\n");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate required fields
    const missing = fields.filter((f) => f.required && !extraFields[f.name]?.trim());
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    const resolutionNote = buildResolutionNote();
    if (!resolutionNote.trim()) {
      setError("Please provide at least one resolution detail.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await api.resolveStaffTicket(ticketId, { resolutionNote });
      setSuccess(true);
      // Redirect to ticket list after a short delay
      setTimeout(() => navigate("/staff/dashboard"), 2200);
    } catch (err) {
      setError(err.message || "Failed to resolve ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />
          <p className="text-sm">Loading ticket…</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        <p className="font-semibold">{error || "Ticket not found."}</p>
        <Link to="/staff/dashboard" className="mt-4 inline-block text-sm underline text-red-600">
          ← Back to Staff Dashboard
        </Link>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
        <p className="text-base font-semibold">Only assigned staff members can resolve tickets.</p>
        <p className="mt-2 text-sm text-amber-700">
          Please use the staff portal to resolve work items assigned to your account.
        </p>
        <Link to="/staff/dashboard" className="mt-4 inline-block text-sm font-semibold underline">
          Go to Staff Dashboard
        </Link>
      </div>
    );
  }

  // ── Success banner ───────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-green-200 bg-green-50 p-10 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-md">
            <svg className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-800">Ticket Resolved!</h2>
          <p className="mt-2 text-sm text-green-700">
            Ticket <strong>{ticket.ticket_id || `INC${ticket.id}`}</strong> has been marked as resolved
            and a confirmation email has been sent to the user.
          </p>
          <p className="mt-4 text-xs text-green-600">Redirecting to ticket list…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Breadcrumb / header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/staff/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ticket List
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Resolve Ticket
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {dept ? (
              <>
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 mr-2">
                  {dept}
                </span>
                Department Resolution Form
              </>
            ) : (
              "Fill in the resolution details below."
            )}
          </p>
        </div>
      </div>

      {/* ── Ticket summary ── */}
      <TicketSummaryCard ticket={ticket} />

      {/* ── Already resolved ── */}
      {ticket.status === "Resolved" ? (
        <AlreadyResolvedCard ticket={ticket} />
      ) : (
        /* ── Resolution form ── */
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Form header */}
            <div className="border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white shadow">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {dept ? `${dept} Resolution Form` : "Resolution Form"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fields marked with <span className="text-red-500">*</span> are required
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              {/* Resolved By */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Resolved By
                </label>
                <input
                  type="text"
                  value={resolvedBy}
                  placeholder="Your name or department team name"
                  readOnly
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Department-specific fields */}
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={extraFields[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              ))}

              {/* Additional notes — always shown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Additional Notes
                  <span className="ml-2 text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={resolutionNoteOverride}
                  onChange={(e) => setResolutionNoteOverride(e.target.value)}
                  placeholder="Any extra context, follow-up actions, or remarks…"
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Submit footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Link
                to="/staff/dashboard"
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white shadow transition hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Resolving…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                    </svg>
                    Mark as Resolved
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
