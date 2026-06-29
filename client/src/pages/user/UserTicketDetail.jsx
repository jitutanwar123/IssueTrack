import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../utils/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime } from "../../utils/helpers.js";

export default function UserTicketDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await api.userTicket(id);
    setTicket(res.data);
    setComments(res.comments || []);
    setTimeline(res.timeline || []);
  }

  useEffect(() => {
    load()
      .catch(() => showToast("Failed to load ticket", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitReply(e) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await api.addUserComment(id, replyBody.trim());
      setReplyBody("");
      showToast("Reply sent! The admin has been notified.", "success");
      await load();
    } catch (err) {
      showToast(err.message || "Failed to send reply", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="mr-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
        Loading ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        Ticket not found.{" "}
        <Link to="/user/my-tickets" className="underline">Back to My Tickets</Link>
      </div>
    );
  }

  const allThreadItems = [
    ...comments.map((c) => ({ ...c, _type: "comment" })),
    ...timeline.map((h) => ({ ...h, _type: "history" })),
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  return (
    <div className="space-y-6">
      {/* Ticket header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/user/my-tickets"
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              ← Back to My Tickets
            </Link>
            <div className="text-xs font-mono font-semibold text-slate-400">
              {ticket.ticket_id || `#${ticket.id}`}
            </div>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{ticket.title}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={ticket.priority} type="priority" />
              <StatusBadge status={ticket.status} />
              {ticket.category && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {ticket.category}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-slate-400">
            <div>Raised: {formatDateTime(ticket.created_at)}</div>
            {ticket.assigned_to && (
              <div className="mt-1">Assigned to: <span className="font-medium text-slate-700">{ticket.assigned_to}</span></div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Left: Description + Thread */}
        <div className="space-y-5">
          {/* Description */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Description</h3>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* Attachment */}
          {ticket.attachment_name && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Attachment</h3>
              <a
                href={api.ticketAttachmentUrl(ticket.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {ticket.attachment_name}
              </a>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Conversation Thread</h3>
            </div>
            <div className="max-h-[500px] space-y-4 overflow-auto p-5">
              {allThreadItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                  No activity yet. The support team will respond soon.
                </div>
              ) : (
                allThreadItems.map((item, i) => {
                  if (item._type === "comment") {
                    const isAdmin = item.author_role === "admin";
                    return (
                      <div
                        key={`c-${item.id}-${i}`}
                        className={`flex ${isAdmin ? "flex-row" : "flex-row-reverse"} gap-3`}
                      >
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isAdmin ? "bg-slate-800" : "bg-cyan-500"}`}>
                          {isAdmin ? "A" : "U"}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isAdmin ? "bg-slate-100 text-slate-800" : "bg-cyan-50 text-slate-800 border border-cyan-200"}`}>
                          <div className={`mb-1 flex items-center gap-2 text-xs font-semibold ${isAdmin ? "text-slate-600" : "text-cyan-700"}`}>
                            <span>{item.author_name}</span>
                            <span className="opacity-50">·</span>
                            <span className="font-normal opacity-70">{formatDateTime(item.created_at)}</span>
                            {isAdmin && <span className="rounded-full bg-slate-800 px-2 py-0.5 text-white">Support</span>}
                          </div>
                          <p className="whitespace-pre-wrap leading-6">{item.body}</p>
                        </div>
                      </div>
                    );
                  }
                  // Status history
                  return (
                    <div key={`h-${item.id}-${i}`} className="flex items-center justify-center">
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                        Status changed {item.from_status ? `from ${item.from_status} ` : ""}to{" "}
                        <strong>{item.to_status}</strong>
                        {item.changed_by && ` by ${item.changed_by}`}
                        <span className="opacity-60">· {formatDateTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply box */}
            <div className="border-t border-slate-200 p-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Add a Follow-up Reply</h4>
              <form onSubmit={submitReply} className="flex gap-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={3}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={submitting || !replyBody.trim()}
                  className="self-end rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-navy transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Ticket info */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Ticket Information</h3>
            <dl className="space-y-3">
              {[
                ["Ticket ID", ticket.ticket_id || `#${ticket.id}`],
                ["Category", ticket.category],
                ["Sub-Category", ticket.sub_category],
                ["Priority", ticket.priority],
                ["Status", ticket.status],
                ["Assigned To", ticket.assigned_to || "Unassigned"],
                ["Location", ticket.location],
                ["Created", formatDateTime(ticket.created_at)],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex flex-col rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Status timeline */}
          {timeline.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Status History</h3>
              <div className="space-y-3">
                {timeline.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-500" />
                    <div>
                      <div className="text-xs font-semibold text-slate-700">→ {h.to_status}</div>
                      <div className="text-xs text-slate-400">{formatDateTime(h.created_at)}</div>
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
