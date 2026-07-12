import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../utils/api.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { formatDateTime, getStatusLabel } from "../../utils/helpers.js";
import { plantLabel } from "../../utils/plants.js";
import { formatTicketActivity } from "../../utils/ticketActivity.js";

const TRACKER_STEPS = [
  "Open",
  "Assigned",
  "Work In Progress",
  "On Hold",
  "Resolved",
  "Closed",
];

function normalizeTrackerStep(status = "") {
  const value = String(status || "").toLowerCase();
  if (value.includes("hold")) return "On Hold";
  if (value.includes("progress")) return "Work In Progress";
  if (value.includes("assign")) return "Assigned";
  if (value.includes("resolve")) return "Resolved";
  if (value.includes("closed")) return "Closed";
  if (value.includes("reject") || value.includes("cancel")) return "Closed";
  return "Open";
}

function getTrackerIndex(status = "") {
  const step = normalizeTrackerStep(status);
  return Math.max(0, TRACKER_STEPS.indexOf(step));
}

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
    ...timeline.map((h) => ({ ...formatTicketActivity(h), _type: "history" })),
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const isClosed = String(ticket.status || "").toLowerCase() === "closed";
  const currentStepIndex = getTrackerIndex(ticket.status);
  const activityItems = timeline.map(formatTicketActivity);
  const lastUpdate = activityItems[activityItems.length - 1] || null;
  const currentStageLabel = normalizeTrackerStep(ticket.status);
  const milestoneMap = buildMilestones(activityItems);

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
              {ticket.plant && (
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                  {plantLabel(ticket.plant)}
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

      {/* Tracking panel */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Ticket Tracker</h3>
            <p className="mt-1 text-xs text-slate-500">
              Follow the current stage, the latest update, and the full status path.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Current stage: {currentStageLabel}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {TRACKER_STEPS.map((step, index) => {
            const active = index === currentStepIndex;
            const done = index < currentStepIndex;
            const blocked = index > currentStepIndex;

            return (
              <div
                key={step}
                className={`rounded-2xl border p-4 transition ${
                  active
                    ? "border-cyan-300 bg-cyan-50"
                    : done
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-slate-200 bg-slate-50/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      active
                        ? "bg-cyan-500"
                        : done
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                    }`}
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                    active ? "text-cyan-700" : done ? "text-emerald-700" : "text-slate-400"
                  }`}>
                    {done ? "Done" : blocked ? "Next" : "Now"}
                  </span>
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-900">{step}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {step === "On Hold"
                    ? "Waiting for customer or internal action"
                    : step === "Resolved"
                      ? "Work completed by the support team"
                      : step === "Closed"
                        ? "Ticket is finalized"
                        : step === "Work In Progress"
                          ? "Support is actively working on it"
                          : step === "Assigned"
                            ? "Assigned to a support owner"
                            : "Ticket has been created"}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Current Status</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{getStatusLabel(ticket.status)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Last Update</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {lastUpdate?.created_at ? formatDateTime(lastUpdate.created_at) : formatDateTime(ticket.updated_at)}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {lastUpdate?.actor_name ? `Updated by ${lastUpdate.actor_name}` : "No history yet"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Current Owner</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{ticket.assigned_to || "Unassigned"}</div>
            <div className="mt-0.5 text-xs text-slate-500">Who is handling the ticket now</div>
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
                      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                            {item.title}
                          </div>
                          <span className="opacity-60">{formatDateTime(item.created_at)}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {item.subtitle}
                          {item.actor_name ? ` · by ${item.actor_name}` : ""}
                        </div>
                        {item.note ? <div className="mt-2 text-[11px] text-slate-600">{item.note}</div> : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply box */}
            <div className="border-t border-slate-200 p-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Add a Follow-up Reply</h4>
              {isClosed && (
                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                  This ticket is closed and can only be viewed.
                </div>
              )}
              <form onSubmit={submitReply} className="flex gap-3">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={isClosed ? "Replies are disabled for closed tickets" : "Type your message here..."}
                  rows={3}
                  disabled={isClosed}
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={isClosed || submitting || !replyBody.trim()}
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
                ["Plant", plantLabel(ticket.plant)],
                ["Priority", ticket.priority],
                ["Status", getStatusLabel(ticket.status)],
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Ticket Log Summary</h3>
            <div className="space-y-3">
              {[
                ["Opened", milestoneMap.opened],
                ["Assigned", milestoneMap.assigned],
                ["Work In Progress", milestoneMap.inProgress],
                ["Resolved", milestoneMap.resolved],
                ["Rejected", milestoneMap.rejected],
                ["Closed", milestoneMap.closed],
              ].map(([label, entry]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {entry?.time ? formatDateTime(entry.time) : "—"}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {entry?.actor ? `By ${entry.actor}` : "No record yet"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status timeline */}
          {activityItems.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="mb-4 text-sm font-semibold text-slate-900">Ticket Log</h3>
              <div className="space-y-3">
                {activityItems.map((item, i) => (
                  <div key={item.id || i} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="mt-0.5 text-xs text-slate-500">{item.subtitle || "Workflow event"}</div>
                      </div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(item.created_at)}</div>
                    </div>
                    <div className="mt-2 text-[11px] font-medium text-slate-500">
                      by {item.actor_name || "System"}
                    </div>
                    {item.note ? (
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                        {item.note}
                      </div>
                    ) : null}
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

function buildMilestones(items = []) {
  const pick = (predicate) => items.find(predicate) || null;
  return {
    opened: pick((item) => item.type === "created"),
    assigned: pick((item) => item.type === "assignment"),
    inProgress: pick((item) => item.title === "Work started" || item.subtitle === "Work In Progress"),
    resolved: pick((item) => item.type === "resolution" || item.title === "Ticket resolved"),
    rejected: pick((item) => item.title === "Ticket rejected"),
    closed: pick((item) => item.type === "closure" || item.title === "Ticket closed"),
  };
}
