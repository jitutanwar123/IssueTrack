import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, getToken } from "../../utils/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/helpers.js";

export default function StaffTicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ticket, setTicket]         = useState(null);
  const [comments, setComments]     = useState([]);
  const [timeline, setTimeline]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [staffMembers, setStaffMembers] = useState([]);

  // Resolve form
  const [showResolve, setShowResolve] = useState(false);
  const [note, setNote]               = useState("");
  const [resolving, setResolving]     = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [resolved, setResolved]       = useState(false);

  // Transfer form
  const [transferToId, setTransferToId] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");

  // Comment form
  const [commentBody, setCommentBody] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.staffTicket(id);
      setTicket(res.data);
      setComments(res.comments || []);
      setTimeline(res.timeline || []);
    } catch (err) {
      setError(err.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    api.staffMembers()
      .then((res) => setStaffMembers(res.data || []))
      .catch(() => setStaffMembers([]));
  }, []);

  async function handleResolve(e) {
    e.preventDefault();
    if (!note.trim()) { setResolveError("Resolution note is required."); return; }
    setResolving(true);
    setResolveError("");
    try {
      await api.resolveStaffTicket(id, { resolutionNote: note.trim() });
      setResolved(true);
      await load();
      setShowResolve(false);
      setNote("");
    } catch (err) {
      setResolveError(err.message || "Failed to resolve ticket.");
    } finally {
      setResolving(false);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setAddingComment(true);
    try {
      await api.addStaffComment(id, commentBody.trim());
      setCommentBody("");
      await load();
    } catch (err) {
      alert(err.message || "Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!transferToId) {
      setTransferError("Please choose a staff member.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        Loading ticket…
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

  const isResolved = ticket.status === "Resolved";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/staff/dashboard" className="hover:text-slate-800">My Tickets</Link>
        <span>›</span>
        <span className="font-medium text-slate-800">{ticket.ticket_id || `INC${ticket.id}`}</span>
      </div>

      {/* Resolved success banner */}
      {resolved && (
        <div className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-200 px-5 py-4 text-sm font-medium text-green-700">
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ticket resolved! Emails sent to user and admin.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main panel */}
        <div className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {ticket.ticket_id || `INC${ticket.id}`}
                </div>
                <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={ticket.priority} type="priority" />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
              {!isResolved && (
                <button
                  id="resolve-btn"
                  onClick={() => setShowResolve((s) => !s)}
                  className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-green-500/20 transition hover:bg-green-400"
                >
                  {showResolve ? "Cancel" : "✓ Resolve Ticket"}
                </button>
              )}
              {isResolved && (
                <span className="rounded-xl bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700">
                  ✓ Resolved
                </span>
              )}
            </div>

            {/* Resolve form */}
            {showResolve && (
              <form onSubmit={handleResolve} className="mt-6 space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-800">Resolution Note</h3>
                <p className="text-xs text-slate-500">
                  Describe what you did to fix this issue. This will be emailed to the user and admin.
                </p>
                {resolveError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600">
                    {resolveError}
                  </div>
                )}
                <textarea
                  id="resolution-note"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the root cause and steps taken to resolve…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-400 focus:ring-1 focus:ring-green-400 resize-none"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={resolving}
                    className="rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-400 disabled:opacity-60"
                  >
                    {resolving ? "Resolving…" : "Submit Resolution"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowResolve(false); setNote(""); setResolveError(""); }}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Transfer form */}
            {!isResolved && (
              <form onSubmit={handleTransfer} className="mt-4 space-y-3 rounded-xl border border-sky-100 bg-sky-50/70 p-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Transfer to another staff member</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Use this when the ticket was assigned to the wrong person. The ticket will move to the selected staff member and disappear from your queue.
                  </p>
                </div>
                {transferError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                    {transferError}
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Assign To</span>
                    <select
                      value={transferToId}
                      onChange={(e) => setTransferToId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
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
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Handoff Note</span>
                    <input
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      placeholder="Optional note for the new assignee"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={transferring || !staffMembers.length}
                    className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
                  >
                    {transferring ? "Transferring…" : "Transfer Ticket"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTransferToId(""); setTransferNote(""); setTransferError(""); }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Ticket details */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ticket Details</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                ["Description",   ticket.description || "—"],
                ["Category",      ticket.category || "—"],
                ["Sub-Category",  ticket.sub_category || "—"],
                ["Department",    ticket.department || "—"],
                ["Raised By",     ticket.customer_name || ticket.requested_by || "—"],
                ["Email",         ticket.requester_email || "—"],
                ["Phone",         ticket.phone || "—"],
                ["Location",      ticket.location || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4 px-5 py-3 text-sm">
                  <span className="w-32 shrink-0 font-semibold text-slate-500">{label}</span>
                  <span className="text-slate-800 whitespace-pre-wrap">{value}</span>
                </div>
              ))}
              {isResolved && (
                <>
                  <div className="flex gap-4 px-5 py-3 text-sm bg-green-50">
                    <span className="w-32 shrink-0 font-semibold text-green-700">Resolved By</span>
                    <span className="text-green-800 font-medium">{ticket.resolved_by || user?.name}</span>
                  </div>
                  <div className="flex gap-4 px-5 py-3 text-sm bg-green-50">
                    <span className="w-32 shrink-0 font-semibold text-green-700">Resolution Note</span>
                    <span className="text-green-800">{ticket.resolution_note}</span>
                  </div>
                  <div className="flex gap-4 px-5 py-3 text-sm bg-green-50">
                    <span className="w-32 shrink-0 font-semibold text-green-700">Resolved At</span>
                    <span className="text-green-800">{formatDateTime(ticket.resolved_at)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Attachment */}
          {ticket.attachment_name && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachment</h2>
              </div>
              <div className="p-5">
                {ticket.attachment_mime?.startsWith("image/") ? (
                  // Show image inline
                  <div className="space-y-3">
                    <img
                      src={api.ticketAttachmentUrl(ticket.id)}
                      alt={ticket.attachment_name}
                      className="max-h-80 w-auto rounded-xl border border-slate-200 object-contain"
                    />
                    <a
                      href={api.ticketAttachmentUrl(ticket.id)}
                      download={ticket.attachment_name}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download {ticket.attachment_name}
                    </a>
                  </div>
                ) : (
                  // Non-image: show download button
                  <a
                    href={api.ticketAttachmentUrl(ticket.id)}
                    download={ticket.attachment_name}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {ticket.attachment_name}
                    <span className="text-xs text-slate-400">{ticket.attachment_mime}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Comments ({comments.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {comments.length === 0 && (
                <p className="px-5 py-6 text-sm text-slate-400">No comments yet.</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="px-5 py-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{c.author_name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {c.author_role}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <form onSubmit={handleComment} className="border-t border-slate-100 p-5 space-y-3">
              <textarea
                id="staff-comment"
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment or update…"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 resize-none"
              />
              <button
                type="submit"
                disabled={addingComment || !commentBody.trim()}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {addingComment ? "Sending…" : "Add Comment"}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Audit Trail */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Audit Trail</h3>
            <dl className="space-y-3 text-sm">
              {[
                ["Created At",   formatDateTime(ticket.created_at)],
                ["Last Updated", formatDateTime(ticket.updated_at)],
                ["Assigned To",  ticket.assigned_to || "—"],
                ["Status",       ticket.status],
              ].map(([label, val]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Status Timeline */}
          {timeline.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status History
              </h3>
              <div className="space-y-3">
                {timeline.map((h) => (
                  <div key={h.id} className="flex gap-3 text-xs">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400 mt-1" />
                    <div>
                      <div className="font-semibold text-slate-700">
                        {h.from_status ? `${h.from_status} → ` : ""}{h.to_status}
                      </div>
                      <div className="text-slate-400">
                        by {h.changed_by || "System"} · {formatDateTime(h.created_at)}
                      </div>
                      {h.note && <div className="mt-1 text-slate-600 italic">{h.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
