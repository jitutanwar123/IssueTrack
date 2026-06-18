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
      ["assigned_to", "Assigned To"],
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
        ...form,
        status: nextStatus,
        requested_by_id: form.requested_by_id || null,
        assigned_to_id: form.assigned_to_id || null,
        expected_closure_date: form.expected_closure_date ? fromInputDateTime(form.expected_closure_date) : "",
        actual_closure_date: form.actual_closure_date ? fromInputDateTime(form.actual_closure_date) : "",
        response_time: Number(form.response_time || 0),
        resolution_time: Number(form.resolution_time || 0),
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{ticket.ticket_id}</div>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{ticket.title}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={ticket.priority} type="priority" />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setField("status", status)}
              className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                form.status === status ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
          <button onClick={save} disabled={saving} className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-navy transition hover:bg-cyan-300">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={downloadPdf} className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Download PDF
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Ticket Details</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Timeline / Activity</h3>
            <div className="mt-4 space-y-3">
              {timeline.map((entry) => (
                <div key={`${entry.type}-${entry.id}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{entry.actor_name}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {entry.type === "comment"
                      ? `Commented: ${entry.body}`
                      : `${entry.action} ${entry.field || ""}${entry.from_value ? ` from ${entry.from_value}` : ""}${entry.to_value ? ` to ${entry.to_value}` : ""}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="text-base font-semibold text-slate-900">Audit Trail</h3>
            <dl className="mt-4 space-y-3 text-sm">
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
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
        />
      ) : (
        <input
          type={type}
          value={type === "datetime-local" ? value || "" : value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
        />
      )}
    </label>
  );
}

function AuditItem({ label, value, time }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">{value || "-"}</dd>
      {time ? <div className="mt-1 text-xs text-slate-500">{formatDateTime(time)}</div> : null}
    </div>
  );
}
