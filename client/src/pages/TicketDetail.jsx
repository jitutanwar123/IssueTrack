import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CommentBox } from "../components/CommentBox.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api } from "../utils/api.js";
import { formatDateTime, formatMinutes, getStatusLabel } from "../utils/helpers.js";
import { plantLabel } from "../utils/plants.js";

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-soft" style={{ border: "1px solid #dbe3ec" }}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
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

function MetaCard({ label, value, time }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</div>
      {time ? <div className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(time)}</div> : null}
    </div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.ticket(id);
      setTicket(response.data);
      setComments(response.comments || []);
      setTimeline(response.timeline || []);
    } catch (err) {
      setError(err.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const detailRows = useMemo(() => {
    if (!ticket) return [];
    return [
      ["Description", ticket.description || "—"],
      ["Category", ticket.category || "—"],
      ["Sub-Category", ticket.sub_category || "—"],
      ["Priority", ticket.priority || "—"],
      ["Status", getStatusLabel(ticket.status)],
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

  async function deleteTicket() {
    if (!ticket?.id) return;
    if (!window.confirm(`Delete ticket ${ticket.ticket_id || `INC${ticket.id}`}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteTicket(ticket.id);
      navigate("/tickets");
    } catch (err) {
      setError(err.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  }

  async function addComment(body) {
    await api.addComment(id, body);
    await load();
  }

  async function downloadPdf() {
    const response = await fetch(api.ticketPdfUrl(id), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("welserve_token") || ""}`,
      },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${ticket.ticket_id || ticket.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading ticket...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-600">{error}</p>
        <button onClick={() => navigate("/tickets")} className="mt-4 text-sm text-slate-500 underline">
          Back to Tickets
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const closed = String(ticket.status || "").toLowerCase() === "closed";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Viraj Profiles Limited
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/tickets" className="hover:text-slate-800">Tickets</Link>
              <span>›</span>
              <span className="font-medium text-slate-800">{ticket.ticket_id || `INC${ticket.id}`}</span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">{ticket.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={downloadPdf} className="btn-secondary">PDF</button>
            <button
              onClick={deleteTicket}
              disabled={deleting}
              className="btn-danger disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </section>

      {closed && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          This ticket is closed and read-only for everyone.
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 shadow-soft" style={{ border: "1px solid #dbe3ec" }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-slate-500">
            {ticket.ticket_id || `INC${ticket.id}`}
          </span>
          <StatusBadge status={ticket.priority} type="priority" />
          <StatusBadge status={ticket.status} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <SectionCard title="Ticket Details" subtitle="All fields are displayed in read-only mode">
            <div className="grid gap-1">
              {detailRows.map(([label, value]) => (
                <DataRow key={label} label={label} value={value} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Comments" subtitle={`Conversation thread (${comments.length})`}>
            <CommentBox
              comments={comments}
              onAddComment={addComment}
              currentUser={{ name: "Admin" }}
              disabled={closed}
            />
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title="Audit Trail" subtitle="Record metadata">
            <div className="space-y-3">
              <MetaCard label="Created By" value={ticket.created_by || ticket.requested_by || "—"} time={ticket.created_at} />
              <MetaCard label="Assigned To" value={ticket.assigned_to || "—"} time={ticket.updated_at} />
              <MetaCard label="Last Modified By" value={ticket.last_modified_by || "—"} time={ticket.updated_at} />
              <MetaCard label="Response Time" value={formatMinutes(ticket.response_time)} />
              <MetaCard label="Resolution Time" value={formatMinutes(ticket.resolution_time)} />
            </div>
          </SectionCard>

          {timeline.length > 0 && (
            <SectionCard title="Status History" subtitle="Chronological activity log">
              <div className="space-y-3">
                {timeline.map((entry) => (
                  <div key={`${entry.type}-${entry.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-slate-700">
                        {entry.type === "comment"
                          ? "Comment"
                          : `${entry.from_status ? `${getStatusLabel(entry.from_status)} -> ` : ""}${getStatusLabel(entry.to_status || entry.action || "Update")}`}
                      </div>
                      <div className="text-[10px] text-slate-400">{formatDateTime(entry.created_at)}</div>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">by {entry.actor_name || "System"}</div>
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
