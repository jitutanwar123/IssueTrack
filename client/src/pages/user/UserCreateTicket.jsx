import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { api } from "../../utils/api.js";
import { useToast } from "../../context/ToastContext.jsx";

const CATEGORIES = ["Incident", "Service Request", "Change", "Problem"];

const SUB_CATEGORIES = {
  Incident: ["Hardware Failure", "Software Issue", "Network Outage", "Security Breach", "Other"],
  "Service Request": ["New Hardware", "Software Installation", "Access Request", "Password Reset", "Other"],
  Change: ["Infrastructure Change", "Software Upgrade", "Configuration Change", "Other"],
  Problem: ["Root Cause Analysis", "Known Error", "Workaround Request", "Other"],
};

const PRIORITIES = [
  { value: "P1", label: "P1 — Critical", desc: "System down, major business impact", color: "border-red-300 bg-red-50 text-red-800" },
  { value: "P2", label: "P2 — High", desc: "Significant impact, workaround available", color: "border-orange-300 bg-orange-50 text-orange-800" },
  { value: "P3", label: "P3 — Medium", desc: "Moderate impact, some users affected", color: "border-yellow-300 bg-yellow-50 text-yellow-800" },
  { value: "P4", label: "P4 — Low", desc: "Minor issue, minimal impact", color: "border-green-300 bg-green-50 text-green-800" },
];

export default function UserCreateTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    sub_category: "",
    priority: "",
    assigned_to: "",
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);

  // Fetch IT staff list for the assign-to dropdown
  useEffect(() => {
    api.staffMembers()
      .then((res) => setStaffMembers(res.data || []))
      .catch(() => {}); // silently fail — dropdown just stays empty
  }, []);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (field === "category") setForm((prev) => ({ ...prev, category: value, sub_category: "" }));
  }

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category) e.category = "Category is required";
    if (!form.priority) e.priority = "Priority is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleFile(file) {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      showToast("File is too large. Maximum size is 10MB.", "error");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      showToast("Invalid file type. Please upload PNG, JPG, PDF, DOC, or DOCX.", "error");
      return;
    }
    setAttachment(file);
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (attachment) formData.append("attachment", attachment);

      await api.createUserTicket(formData);
      showToast("✅ Ticket raised successfully! Check your email for confirmation.", "success");
      navigate("/user/my-tickets");
    } catch (err) {
      showToast(err.message || "Failed to create ticket", "error");
    } finally {
      setLoading(false);
    }
  }

  const subOptions = SUB_CATEGORIES[form.category] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Support Portal</div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Raise a New Ticket</h2>
        <p className="mt-2 text-sm text-slate-300">
          Describe your issue below. Our team will respond within the SLA for your selected priority.
        </p>
      </section>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Main form */}
        <div className="space-y-5">
          {/* Auto-filled user info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Requester Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Your Name" value={user?.name} />
              <ReadOnlyField label="Email Address" value={user?.email} />
              <ReadOnlyField label="Phone" value={user?.phone || "—"} />
              <ReadOnlyField label="Department" value={user?.department || "—"} />
            </div>
          </div>

          {/* Ticket details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Ticket Details</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${errors.title ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description *
                </label>
                <textarea
                  placeholder="Provide as much detail as possible — steps to reproduce, error messages, affected systems..."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={5}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${errors.description ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 ${errors.category ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Sub-Category</label>
                  <select
                    value={form.sub_category}
                    onChange={(e) => setField("sub_category", e.target.value)}
                    disabled={!form.category}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400 disabled:opacity-50"
                  >
                    <option value="">Select sub-category</option>
                    {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Assign To — IT sub-branch */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Assign To — IT Sub-Branch
                </label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setField("assigned_to", e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                >
                  <option value="">— Select IT Staff Member (optional) —</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} — {s.role}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-400">
                  Select the IT team member who handles your type of issue. They will receive an email notification.
                </p>
              </div>

              {/* Attachment */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Attachment (Optional)</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files[0];
                    handleFile(file);
                  }}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    dragging ? "border-cyan-400 bg-cyan-50/60" : "border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30"
                  }`}
                >
                  {attachment ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      <span className="text-sm text-slate-700">{attachment.name}</span>
                      <span className="text-xs text-slate-400">({(attachment.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAttachment(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      <p className="text-sm text-slate-400">{dragging ? "Drop file here" : "Click to upload or drag & drop"}</p>
                      <p className="text-xs text-slate-300">PNG, JPG, PDF, DOC up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0] || null)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Priority picker + submit */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Priority *</h3>
            <div className="space-y-3">
              {PRIORITIES.map((p) => (
                <label
                  key={p.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition ${
                    form.priority === p.value ? p.color + " border-current" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={form.priority === p.value}
                    onChange={() => setField("priority", p.value)}
                    className="mt-0.5 accent-current"
                  />
                  <div>
                    <div className="text-sm font-bold">{p.label}</div>
                    <div className="text-xs opacity-70">{p.desc}</div>
                  </div>
                </label>
              ))}
              {errors.priority && <p className="text-xs text-red-600">{errors.priority}</p>}
            </div>
          </div>

          {/* SLA info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">SLA Response Times</h3>
            <div className="space-y-2 text-xs text-slate-500">
              {[["P1 Critical", "4 hours", "bg-red-500"], ["P2 High", "8 hours", "bg-orange-500"], ["P3 Medium", "24 hours", "bg-yellow-500"], ["P4 Low", "72 hours", "bg-green-500"]].map(([label, time, dot]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${dot}`} />
                    <span>{label}</span>
                  </div>
                  <span className="font-medium text-slate-700">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-400 py-4 text-sm font-bold text-navy transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
                Submitting...
              </span>
            ) : "Submit Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-700">{value || "—"}</div>
    </div>
  );
}
