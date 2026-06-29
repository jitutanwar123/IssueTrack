import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CommentBox } from "../components/CommentBox.jsx";
import { StatusBadge } from "../components/StatusBadge.jsx";
import { api } from "../utils/api.js";
import { fromInputDateTime, formatDateTime, formatMinutes, toInputDateTime } from "../utils/helpers.js";

const statuses = ["Open", "Assigned", "Work In Progress", "On Hold - Change", "On Hold - Customer", "On Hold - Infra", "Closed", "Cancelled"];

export default function TicketDetail() {
  const { id } = useParams();
  console.log("ROUTE ID =", id);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [users, setUsers] = useState([]);

  async function load() {
    const response = await api.ticket(id);
    setTicket(response.data);
    setComments(response.comments || []);
    setTimeline(response.timeline || []);
    setForm({
      ...response.data,
      expected_closure_date: toInputDateTime(response.data.expected_closure_date),
      actual_closure_date: toInputDateTime(response.data.actual_closure_date),
    });
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    api.users().then((res) => setUsers(res.data || [])).catch(() => {})
  }, [id]);

  const sections = useMemo(
    () => [
      ["title", "Title / Subject"],
      ["description", "Description"],
      ["category", "Category"],
      ["sub_category", "Sub-Category"],
      ["priority", "Priority"],
      ["status", "Status"],
      ["customer_name", "Customer / Requester Name"],
      ["requester_email", "Requester Email"],
      ["phone", "Phone Number"],
      ["department", "Department"],
      ["requested_by", "Requested By"],
      ["expected_closure_date", "Expected Closure Date"],
      ["actual_closure_date", "Actual Closure Date"],
      ["response_time", "Response Time"],
      ["resolution_time", "Resolution Time"],
      ["location", "Location"],
      ["workstream", "Workstream"],
      ["workgroup", "Workgroup"],
      ["service", "Service"],
    ],
    []
  );

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(nextStatus = form.status) {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title || "",
        description: form.description || "",
        category: form.category || "",
        sub_category: form.sub_category || "",
        priority: form.priority || "",
        status: nextStatus,
        customer_name: form.customer_name || "",
        requester_email: form.requester_email || "",
        phone: form.phone || "",
        department: form.department || "",
        requested_by: form.requested_by || "",
        assigned_to: form.assigned_to || "",
        requested_by_id: form.requested_by_id || null,
        assigned_to_id: form.assigned_to_id || null,
        expected_closure_date: form.expected_closure_date ? fromInputDateTime(form.expected_closure_date) : "",
        actual_closure_date: form.actual_closure_date ? fromInputDateTime(form.actual_closure_date) : "",
        response_time: Number(form.response_time || 0),
        resolution_time: Number(form.resolution_time || 0),
        location: form.location || "",
        workstream: form.workstream || "",
        workgroup: form.workgroup || "",
        service: form.service || "",
      };
      await api.updateTicket(id, payload);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    anchor.download = `${ticket.ticket_id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!form) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-soft">Loading ticket...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Ticket header bar */}
      <div
        className="flex flex-col gap-4 rounded-2xl bg-white p-5 lg:flex-row lg:items-start lg:justify-between"
        style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 rounded px-2 py-0.5">
              {ticket.ticket_id}
            </span>
            <StatusBadge status={ticket.priority} type="priority" />
            <StatusBadge status={ticket.status} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">{ticket.title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Status quick-change */}
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setField("status", status)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  form.status === status
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: "1px solid #e2e8f0" }}>
            <button
              onClick={() => save()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 3px 12px rgba(37,99,235,0.3)" }}
            >
              {saving ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13" /><polyline points="7 3 7 8 15 8" />
                </svg>
              )}
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={downloadPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:-translate-y-px"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-5">
          {/* Ticket details form */}
          <section
            className="rounded-2xl bg-white overflow-hidden"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h3 className="text-sm font-bold text-slate-900">Ticket Details</h3>
            </div>
            <div className="p-5 grid gap-4 md:grid-cols-2">
              {sections.map(([field, label]) => (
                <Field
                  key={field}
                  label={label}
                  value={form[field] || ""}
                  onChange={(value) => setField(field, value)}
                  type={field.includes("date") ? "datetime-local" : field === "response_time" || field === "resolution_time" ? "number" : "text"}
                  multiline={field === "description"}
                />
              ))}
              {/* Assignee dropdown */}
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Assigned To</span>
                <select
                  value={form.assigned_to_id || ""}
                  onChange={(e) => {
                    const selected = users.find((u) => String(u.id) === e.target.value);
                    setForm((cur) => ({
                      ...cur,
                      assigned_to_id: selected ? selected.id : null,
                      assigned_to: selected ? selected.name : "",
                    }));
                  }}
                  className="pro-select"
                >
                  <option value="">— Unassigned —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}{u.department ? ` (${u.department})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Attachment */}
          {ticket.attachment_name && (
            <section
              className="rounded-2xl bg-white overflow-hidden"
              style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
            >
              <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
                <h3 className="text-sm font-bold text-slate-900">Attachment</h3>
              </div>
              <div className="p-5">
                <a
                  href={api.ticketAttachmentUrl(ticket.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  {ticket.attachment_name}
                </a>
              </div>
            </section>
          )}

          {/* Timeline */}
          <section
            className="rounded-2xl bg-white overflow-hidden"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h3 className="text-sm font-bold text-slate-900">Timeline / Activity</h3>
            </div>
            <div className="p-5 space-y-3">
              {timeline.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No activity yet.</p>
              )}
              {timeline.map((entry) => (
                <div key={`${entry.type}-${entry.id}`} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    {entry.type === "comment" ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 rounded-xl p-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-800">{entry.actor_name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatDateTime(entry.created_at)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {entry.type === "comment"
                        ? `“${entry.body}”`
                        : `${entry.action} ${entry.field || ""}${entry.from_value ? ` from ${entry.from_value}` : ""}${entry.to_value ? ` → ${entry.to_value}` : ""}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <section
            className="rounded-2xl bg-white overflow-hidden"
            style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <h3 className="text-sm font-bold text-slate-900">Audit Trail</h3>
            </div>
            <dl className="p-5 space-y-3">
              <AuditItem label="Created By" value={ticket.created_by} time={ticket.created_at} />
              <AuditItem label="Assigned To" value={ticket.assigned_to_name || ticket.assigned_to} time={ticket.updated_at} />
              <AuditItem label="Last Modified By" value={ticket.last_modified_by} time={ticket.updated_at} />
              <AuditItem label="Response Time" value={formatMinutes(ticket.response_time)} time="" />
              <AuditItem label="Resolution Time" value={formatMinutes(ticket.resolution_time)} time="" />
            </dl>
          </section>

          <CommentBox comments={comments} onAddComment={addComment} currentUser={{ name: "You" }} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", multiline = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-[3px] focus:ring-brand-500/10 resize-none"
        />
      ) : (
        <input
          type={type}
          value={type === "datetime-local" ? value || "" : value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-brand-500 focus:bg-white focus:ring-[3px] focus:ring-brand-500/10"
        />
      )}
    </label>
  );
}

function AuditItem({ label, value, time }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value || "—"}</dd>
      {time ? <div className="mt-0.5 text-[10px] text-slate-400">{formatDateTime(time)}</div> : null}
    </div>
  );
}
