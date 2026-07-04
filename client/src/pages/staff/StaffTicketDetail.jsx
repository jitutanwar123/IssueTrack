import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CommentBox } from "../../components/CommentBox.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { api, getToken } from "../../utils/api.js";
import { formatDateTime, formatMinutes, getStatusLabel } from "../../utils/helpers.js";
import { plantLabel } from "../../utils/plants.js";

const STATUS_OPTIONS = [
  "Open",
  "Assigned",
  "Work In Progress",
  "On Hold - Change",
  "On Hold - Customer",
  "On Hold - Infra",
  "Closed",
  "Reject",
];

function SectionCard({ title, subtitle, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl bg-white ${className}`}
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function MetaItem({ label, value, time }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</div>
      {time ? <div className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(time)}</div> : null}
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="text-sm text-slate-800 whitespace-pre-wrap">{value || "—"}</div>
    </div>
  );
}

export default function StaffTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusDraft, setStatusDraft] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const [transferToId, setTransferToId] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");

  async function loadTicket() {
    setLoading(true);
    setError("");
    try {
      const res = await api.staffTicket(id);
      setTicket(res.data);
      setComments(res.comments || []);
      setTimeline(res.timeline || []);
      setStatusDraft(res.data?.status || "Open");
      setStatusNote("");
      setResolutionNote(res.data?.resolution_note || "");
      setShowResolve(false);
      setResolveError("");
      setStatusError("");
    } catch (err) {
      setError(err.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    api.staffMembers()
      .then((res) => setStaffMembers(res.data || []))
      .catch(() => setStaffMembers([]));
  }, []);

  const detailRows = useMemo(() => {
    if (!ticket) return [];
    return [
      ["Description", ticket.description || "—"],
      ["Category", ticket.category || "—"],
      ["Sub-Category", ticket.sub_category || "—"],
      ["Priority", ticket.priority || "—"],
      ["Current Status", getStatusLabel(ticket.status)],
      ["Department", ticket.department || "—"],
      ["Plant", plantLabel(ticket.plant) || "—"],
      ["Raised By", ticket.customer_name || ticket.requested_by || "—"],
      ["Requester Email", ticket.requester_email || "—"],
      ["Phone", ticket.phone || "—"],
      ["Location", ticket.location || "—"],
      ["Workstream", ticket.workstream || "—"],
      ["Workgroup", ticket.workgroup || "—"],
      ["Service", ticket.service || "—"],
      ["Assigned To", ticket.assigned_to || "—"],
      ["Expected Closure", ticket.expected_closure_date || "—"],
      ["Actual Closure", ticket.actual_closure_date || "—"],
    ];
  }, [ticket]);

  async function saveStatus() {
    if (!statusDraft) {
      setStatusError("Choose a status first.");
      return;
    }
    if (ticket?.status === "Closed") {
      setStatusError("Closed tickets are read-only.");
      return;
    }
    setSavingStatus(true);
    setStatusError("");
    try {
      await api.updateStaffTicketStatus(id, {
        status: statusDraft,
        note: statusNote.trim(),
        resolutionNote: statusDraft === "Resolved" ? resolutionNote.trim() : "",
      });
      await loadTicket();
    } catch (err) {
      setStatusError(err.message || "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleResolve(event) {
    event.preventDefault();
    if (!resolutionNote.trim()) {
      setResolveError(
        statusDraft === "Reject"
          ? "Rejection reason is required."
          : "Resolution note is required."
      );
      return;
    }
    if (ticket?.status === "Closed") {
      setResolveError("Closed tickets are read-only.");
      return;
    }
    setResolving(true);
    setResolveError("");
    try {
      await api.updateStaffTicketStatus(id, {
        status: statusDraft,
        resolutionNote: resolutionNote.trim(),
        note: statusDraft === "Reject" ? resolutionNote.trim() : "",
      });
      await loadTicket();
      setShowResolve(false);
    } catch (err) {
      setResolveError(err.message || `Failed to ${statusDraft === "Reject" ? "reject" : "resolve"} ticket.`);
    } finally {
      setResolving(false);
    }
  }

  async function handleComment(body) {
    await api.addStaffComment(id, body);
    await loadTicket();
  }

  async function handleTransfer(event) {
    event.preventDefault();
    if (!transferToId) {
      setTransferError("Please choose a staff member.");
      return;
    }
    if (ticket?.status === "Closed") {
      setTransferError("Closed tickets are read-only.");
      return;
    }
    setTransferring(true);
    setTransferError("");
    try {
      await api.transferStaffTicket(id, {
        assigneeId: Number(transferToId),
        note: transferNote.trim(),
      });
      navigate("/staff/dashboard");
    } catch (err) {
      setTransferError(err.message || "Failed to transfer ticket.");
    } finally {
      setTransferring(false);
    }
  }

  async function downloadPdf() {
    const response = await fetch(api.ticketPdfUrl(id), {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${ticket.ticket_id || ticket.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const isResolved = ticket?.status === "Resolved";
  const isClosed = ticket?.status === "Closed";
  const isOutcomeAction = showResolve && (statusDraft === "Resolved" || statusDraft === "Reject");
  const outcomeTitle = statusDraft === "Reject" ? "Rejection" : "Resolution";
  const outcomeSubtitle =
    statusDraft === "Reject"
      ? "Use this when the ticket cannot be handled by your team and should be rejected with a clear reason."
      : "Add a detailed resolution note before marking the ticket as resolved.";
  const outcomeButtonLabel = statusDraft === "Reject" ? "Submit Rejection" : "Submit Resolution";
  const outcomeButtonBusyLabel = statusDraft === "Reject" ? "Rejecting..." : "Resolving...";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-400">
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading ticket...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button onClick={() => navigate("/staff/dashboard")} className="mt-4 text-sm text-slate-500 underline">
          Back to My Tickets
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/staff/dashboard" className="hover:text-slate-800">My Tickets</Link>
            <span>›</span>
            <span className="font-medium text-slate-800">{ticket.ticket_id || `INC${ticket.id}`}</span>
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Viraj Profiles Limited
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{ticket.title}</h1>
        </div>
      </div>

      <section
        className="rounded-2xl bg-white p-5"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold tracking-wider text-slate-500">
                {ticket.ticket_id || `INC${ticket.id}`}
              </span>
              <StatusBadge status={ticket.priority} type="priority" />
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              PDF
            </button>
            {!isResolved && !isClosed && (
              <button
                onClick={() => {
                  setStatusDraft("Resolved");
                  setResolutionNote("");
                  setResolveError("");
                  setShowResolve(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Resolve
              </button>
            )}
            {!isResolved && !isClosed && (
              <button
                onClick={() => {
                  setStatusDraft("Reject");
                  setResolutionNote("");
                  setResolveError("");
                  setShowResolve(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                Reject
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              disabled={ticket?.status === "Closed"}
              onClick={() => setStatusDraft(status)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                statusDraft === status
                  ? "bg-slate-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_260px_auto] lg:items-end">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Status Note</span>
            <input
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Optional note for this status change"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/10"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Current Owner</span>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
              {ticket.assigned_to || "Unassigned"}
            </div>
          </label>
            <button
              onClick={saveStatus}
              disabled={savingStatus || ticket?.status === "Closed"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingStatus ? "Saving..." : "Save Status"}
            </button>
        </div>

        {statusError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {statusError}
          </div>
        )}

        {isOutcomeAction && (
            <form
              onSubmit={handleResolve}
              className={`mt-5 rounded-2xl p-5 ${
                statusDraft === "Reject"
                  ? "border border-rose-100 bg-rose-50/70"
                  : "border border-emerald-100 bg-emerald-50/60"
              }`}
            >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{outcomeTitle}</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {outcomeSubtitle}
                </p>
              </div>
              <span
                className={`rounded-full bg-white px-3 py-1 text-[11px] font-semibold ${
                  statusDraft === "Reject" ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                Final stage
              </span>
            </div>
            {resolveError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {resolveError}
              </div>
            )}
            <label className="mt-4 block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                {statusDraft === "Reject" ? "Rejection Reason" : "Resolution Note"}
              </span>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
              placeholder={
                statusDraft === "Reject"
                  ? "Explain why the ticket cannot be accepted or resolved here..."
                  : "Describe the root cause, what you changed, and how it was fixed..."
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:ring-2 resize-none focus:border-emerald-400 focus:ring-emerald-400/10"
            />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={resolving || ticket?.status === "Closed"}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  statusDraft === "Reject"
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                {resolving ? outcomeButtonBusyLabel : outcomeButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => { setShowResolve(false); setResolveError(""); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      {(isResolved || isClosed) && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          Ticket is currently marked as <strong>{getStatusLabel(ticket.status)}</strong>.
          {ticket.resolution_note ? <span className="block mt-1 text-emerald-800">Resolution: {ticket.resolution_note}</span> : null}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard title="Ticket Details" subtitle="Read-only record of the request and its context">
            <div className="grid gap-1">
              {detailRows.map(([label, value]) => (
                <DataRow key={label} label={label} value={value} />
              ))}
            </div>
          </SectionCard>

          {ticket.attachment_name && (
            <SectionCard title="Attachment" subtitle="File uploaded by the requester">
              <a
                href={api.ticketAttachmentUrl(ticket.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {ticket.attachment_name}
              </a>
            </SectionCard>
          )}

          <SectionCard title="Comments" subtitle={`Conversation and updates from the team (${comments.length})`}>
            <CommentBox
              comments={comments}
              onAddComment={handleComment}
              currentUser={user}
              disabled={isClosed}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Audit Trail" subtitle="Who touched the ticket and when">
            <div className="space-y-3">
              <MetaItem label="Created By" value={ticket.created_by || ticket.requested_by || "—"} time={ticket.created_at} />
              <MetaItem label="Assigned To" value={ticket.assigned_to || "—"} time={ticket.updated_at} />
              <MetaItem label="Last Modified By" value={ticket.last_modified_by || "—"} time={ticket.updated_at} />
              <MetaItem label="Response Time" value={formatMinutes(ticket.response_time)} />
              <MetaItem label="Resolution Time" value={formatMinutes(ticket.resolution_time)} />
            </div>
          </SectionCard>

          <SectionCard title="Transfer" subtitle="Move the ticket to the correct staff member">
            <form onSubmit={handleTransfer} className="space-y-3">
              {transferError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {transferError}
                </div>
              )}
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Assign To</span>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/10"
                >
                  <option value="">Select staff member</option>
                  {staffMembers
                    .filter((member) => String(member.id) !== String(user?.id))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}{member.department ? ` (${member.department})` : ""}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Handoff Note</span>
                <input
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Optional note"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-400/10"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                disabled={transferring || !staffMembers.length || ticket?.status === "Closed"}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
              >
                {transferring ? "Transferring..." : "Transfer Ticket"}
              </button>
                <button
                  type="button"
                  onClick={() => { setTransferToId(""); setTransferNote(""); setTransferError(""); }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </SectionCard>

          {timeline.length > 0 && (
            <SectionCard title="Status History" subtitle="Recent workflow changes">
              <div className="space-y-3">
                {timeline.map((entry) => (
                  <div key={`${entry.type}-${entry.id}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">
                        {entry.type === "comment"
                          ? "Comment"
                          : `${entry.from_status ? `${getStatusLabel(entry.from_status)} -> ` : ""}${getStatusLabel(entry.to_status || entry.action || "Update")}`}
                      </div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(entry.created_at)}</div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      by {entry.actor_name || "System"}
                    </div>
                    {entry.type === "comment" ? (
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{entry.body}</p>
                    ) : entry.note ? (
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{entry.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
