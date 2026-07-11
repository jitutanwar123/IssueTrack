import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { api } from "../utils/api.js";
import { PLANTS, plantLabel } from "../utils/plants.js";
import {
  CATEGORY_OPTIONS,
  CTM_PLANT_ASSIGNMENTS,
  STAFF_ASSIGNMENTS,
  getServiceOptions,
  getSubCategoryOptions,
} from "../utils/ticketTaxonomy.js";

const PRIORITIES = [
  { value: "P1", label: "P1 — Critical", desc: "System down, major business impact", color: "border-red-200 bg-red-50 text-red-800" },
  { value: "P2", label: "P2 — High", desc: "Significant impact, workaround available", color: "border-amber-200 bg-amber-50 text-amber-800" },
  { value: "P3", label: "P3 — Medium", desc: "Moderate impact, some users affected", color: "border-slate-200 bg-slate-50 text-slate-700" },
  { value: "P4", label: "P4 — Low", desc: "Minor issue, minimal impact", color: "border-emerald-200 bg-emerald-50 text-emerald-800" },
];

const REQUEST_SOURCES = [
  { value: "Phone", label: "📞 Phone" },
  { value: "WhatsApp", label: "💬 WhatsApp" },
  { value: "Gmail", label: "📧 Gmail" },
];

const DEFAULT_FORM = {
  title: "",
  description: "",
  service: "",
  plant: "",
  category: "",
  sub_category: "",
  priority: "P3",
  assigned_to: "",
  name: "",
  email: "",
  phone: "",
  cisco_number: "",
  // Staff-on-behalf fields
  requester_name: "",
  requester_email: "",
  requester_phone: "",
  requester_cisco_number: "",
  request_source: "",
};

function normalizeAssignment(item) {
  if (!item) return null;
  const name = item.name || item.staff_name || "";
  const email = item.email || item.staff_email || "";
  if (!name) return null;
  return { name, email };
}

function formatAssignmentLabel(item) {
  const name = item.name || item.staff_name || "";
  const email = item.email || item.staff_email || "";
  return email ? `${name} — ${email}` : name;
}

export function CreateTicketForm({ variant = "user" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileRef = useRef(null);

  const [metadata, setMetadata] = useState(null);
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    service: variant === "user" ? "Incident" : "",
  }));
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [errors, setErrors] = useState({});
  const [dragging, setDragging] = useState(false);
  const [priorityModal, setPriorityModal] = useState(null); // { targetPriority }

  // Pre-fill requester info from logged-in user
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
        cisco_number: prev.cisco_number || user.cisco_number || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadMetadata() {
      setLoadingMetadata(true);
      try {
        const response = await api.ticketMetadata();
        if (!mounted) return;
        setMetadata(response?.data || response || null);
      } catch {
        if (mounted) setMetadata(null);
      } finally {
        if (mounted) setLoadingMetadata(false);
      }
    }

    loadMetadata();

    return () => {
      mounted = false;
    };
  }, []);

  const serviceOptions = useMemo(() => {
    return metadata?.servicesByPortal?.[variant] || getServiceOptions(variant);
  }, [metadata, variant]);

  const categoryOptions = useMemo(() => {
    return metadata?.categories || CATEGORY_OPTIONS;
  }, [metadata]);

  const subCategoryOptions = useMemo(() => {
    if (!form.category) return [];
    return metadata?.subCategoriesByCategory?.[form.category] || getSubCategoryOptions(form.category);
  }, [metadata, form.category]);

  const plantOptions = useMemo(() => {
    return metadata?.plants?.length ? metadata.plants : PLANTS;
  }, [metadata]);

  const assignableStaff = useMemo(() => {
    const staffAssignments = metadata?.staffAssignments?.length ? metadata.staffAssignments : STAFF_ASSIGNMENTS;
    const ctmAssignments = metadata?.ctmPlantAssignments?.length ? metadata.ctmPlantAssignments : CTM_PLANT_ASSIGNMENTS;

    if (!form.category || !form.sub_category) return [];

    if (form.category === "SAP Application" && form.sub_category === "CTM") {
      const plantCode = String(form.plant || "");
      return ctmAssignments
        .filter((assignment) => assignment.plant_code === plantCode && (assignment.name || assignment.staff_name))
        .map((assignment) => ({
          name: assignment.name || assignment.staff_name,
          email: assignment.email || assignment.staff_email,
        }));
    }

    return staffAssignments
      .filter((assignment) => assignment.category === form.category && assignment.sub_category === form.sub_category)
      .map((assignment) => ({
        name: assignment.name || assignment.staff_name,
        email: assignment.email || assignment.staff_email,
      }))
      .filter((assignment) => Boolean(assignment.name));
  }, [metadata, form.category, form.sub_category, form.plant]);

  const assignedStaffOption = useMemo(() => {
    if (assignableStaff.length !== 1) return null;
    return assignableStaff[0];
  }, [assignableStaff]);

  useEffect(() => {
    setForm((current) => {
      if (!current.category || !current.sub_category) {
        return current.assigned_to ? { ...current, assigned_to: "" } : current;
      }

      const nextNames = assignableStaff.map((item) => item.name).filter(Boolean);
      const currentAssigned = current.assigned_to || "";
      if (nextNames.includes(currentAssigned)) return current;

      const nextAssigned = nextNames.length === 1 ? nextNames[0] : "";
      return nextAssigned === currentAssigned ? current : { ...current, assigned_to: nextAssigned };
    });
  }, [assignableStaff]);

  useEffect(() => {
    if (variant !== "user") return;
    setForm((current) => (current.service === "Incident" ? current : { ...current, service: "Incident" }));
  }, [variant]);

  function setField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "service") {
        next.category = "";
        next.sub_category = "";
        next.assigned_to = "";
      }

      if (field === "category") {
        next.sub_category = "";
        next.assigned_to = "";
      }

      if (field === "sub_category") {
        next.assigned_to = "";
      }

      if (field === "plant" && prev.category === "SAP Application" && prev.sub_category === "CTM") {
        next.assigned_to = "";
      }

      return next;
    });

    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handlePriorityClick(targetPriority) {
    if (targetPriority === form.priority) return;
    setPriorityModal({ targetPriority });
  }

  function confirmPriorityChange() {
    if (priorityModal?.targetPriority) {
      setField("priority", priorityModal.targetPriority);
    }
    setPriorityModal(null);
  }

  function validate() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = "Title is required";
    if (!form.description.trim()) nextErrors.description = "Description is required";
    if (!form.service) nextErrors.service = "Service is required";
    if (!form.plant) nextErrors.plant = "Plant is required";
    if (!form.category) nextErrors.category = "Category is required";
    if (!form.sub_category) nextErrors.sub_category = "Sub-category is required";
    if (!form.priority) nextErrors.priority = "Priority is required";
    // Staff variant: requester fields validation
    if (variant === "staff") {
      if (!form.requester_name.trim()) nextErrors.requester_name = "Requester name is required";
      if (!form.requester_email.trim()) nextErrors.requester_email = "Requester email is required";
      if (!form.request_source) nextErrors.request_source = "Request source is required";
    }
    if (form.category === "SAP Application" && form.sub_category === "CTM" && !assignedStaffOption?.name) {
      nextErrors.assigned_to = "No CTM assignee is mapped for the selected plant.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleFile(file) {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast("File is too large. Maximum size is 10MB.", "error");
      return;
    }
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
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
      Object.entries(form).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
      if (attachment) formData.append("attachment", attachment);

      if (variant === "staff") {
        await api.createStaffTicket(formData);
      } else {
        await api.createUserTicket(formData);
      }

      showToast("✅ Ticket raised successfully! Check your email for confirmation.", "success");
      navigate(variant === "staff" ? "/staff/dashboard" : "/user/my-tickets");
    } catch (err) {
      showToast(err.message || "Failed to create ticket", "error");
    } finally {
      setLoading(false);
    }
  }

  const currentAssignees = assignableStaff.map(normalizeAssignment).filter(Boolean);
  const isCtm = form.category === "SAP Application" && form.sub_category === "CTM";
  const assignToDisabled = !form.category || !form.sub_category || (isCtm && !currentAssignees.length);

  const isStaff = variant === "staff";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[28px] font-semibold tracking-tight text-slate-900">Raise a New Ticket</h2>
        <p className="mt-1 text-sm text-slate-500">
          {isStaff
            ? "Creating ticket on behalf of a user. Fill in the requester's details below."
            : "Describe your issue below. Our team will respond within the SLA for your selected priority."}
        </p>
      </div>

      {loadingMetadata && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Loading ticket setup...
        </div>
      )}

      <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">

          {/* ── REQUESTER INFORMATION ─────────────────────────────── */}
          <div className="pro-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e8eef5" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {isStaff ? "Requester Information" : "Requester Information"}
                </h3>
                {isStaff && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    On Behalf of User
                  </span>
                )}
              </div>
              {isStaff && (
                <p className="mt-1 text-xs text-slate-500">
                  Enter the user's contact details below. The ticket will be recorded as raised by you on their behalf.
                </p>
              )}
            </div>

            {/* Staff: show their own info as read-only context strip */}
            {isStaff && user && (
              <div className="px-5 pt-4 pb-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap gap-4">
                  <div className="text-xs text-slate-500">
                    <span className="block font-semibold uppercase tracking-wide text-slate-400 text-[10px] mb-0.5">Staff Member (You)</span>
                    <span className="font-semibold text-slate-700">{user.name}</span>
                    <span className="ml-2 text-slate-400">{user.email}</span>
                  </div>
                </div>
              </div>
            )}

            {/* User's 4 editable requester fields (staff variant) OR the normal user fields */}
            <div className="p-5 grid gap-3 sm:grid-cols-2">
              {isStaff ? (
                <>
                  {/* Requester Name */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Requester Name *
                    </label>
                    <input
                      type="text"
                      value={form.requester_name}
                      onChange={(e) => setField("requester_name", e.target.value)}
                      placeholder="User's full name"
                      className={`pro-input ${errors.requester_name ? "border-red-400 bg-red-50" : ""}`}
                    />
                    {errors.requester_name && <p className="mt-1 text-xs text-red-600">{errors.requester_name}</p>}
                  </div>

                  {/* Requester Email */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Requester Email *
                    </label>
                    <input
                      type="email"
                      value={form.requester_email}
                      onChange={(e) => setField("requester_email", e.target.value)}
                      placeholder="user@viraj.com"
                      className={`pro-input ${errors.requester_email ? "border-red-400 bg-red-50" : ""}`}
                    />
                    {errors.requester_email && <p className="mt-1 text-xs text-red-600">{errors.requester_email}</p>}
                  </div>

                  {/* Requester Phone */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Requester Phone
                    </label>
                    <input
                      type="tel"
                      value={form.requester_phone}
                      onChange={(e) => setField("requester_phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="pro-input"
                    />
                  </div>

                  {/* Requester Cisco Number */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Requester Cisco Number
                    </label>
                    <input
                      type="text"
                      value={form.requester_cisco_number}
                      onChange={(e) => setField("requester_cisco_number", e.target.value)}
                      placeholder="e.g. 1234"
                      className="pro-input"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      placeholder="Your full name"
                      className="pro-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField("email", e.target.value)}
                      placeholder="your@email.com"
                      className="pro-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="pro-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Cisco Number
                    </label>
                    <input
                      type="text"
                      value={form.cisco_number}
                      onChange={(e) => setField("cisco_number", e.target.value)}
                      placeholder="e.g. 1234"
                      className="pro-input"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── TICKET DETAILS ────────────────────────────────────── */}
          <div className="pro-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e8eef5" }}>
              <h3 className="text-sm font-semibold text-slate-900">Ticket Details</h3>
            </div>
            <div className="p-5 space-y-4">

              {/* Row 1: Plant + Request Source (staff only) */}
              <div className={isStaff ? "grid gap-4 sm:grid-cols-2" : ""}>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Plant / Branch *
                  </label>
                  <select
                    value={form.plant}
                    onChange={(e) => setField("plant", e.target.value)}
                    className={`pro-select ${errors.plant ? "border-red-400 bg-red-50" : ""}`}
                  >
                    <option value="">Select plant</option>
                    {plantOptions.map((plant) => (
                      <option key={plant.value} value={plant.value}>
                        {plantLabel(plant.value)}
                      </option>
                    ))}
                  </select>
                  {errors.plant && <p className="mt-1 text-xs text-red-600">{errors.plant}</p>}
                </div>

                {/* Request Source — staff portal only */}
                {isStaff && (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Request Source *
                    </label>
                    <select
                      value={form.request_source}
                      onChange={(e) => setField("request_source", e.target.value)}
                      className={`pro-select ${errors.request_source ? "border-red-400 bg-red-50" : ""}`}
                    >
                      <option value="">How did user contact you?</option>
                      {REQUEST_SOURCES.map((src) => (
                        <option key={src.value} value={src.value}>
                          {src.label}
                        </option>
                      ))}
                    </select>
                    {errors.request_source && <p className="mt-1 text-xs text-red-600">{errors.request_source}</p>}
                  </div>
                )}
              </div>

              {/* Row 2: Category & Sub-Category side by side */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                    className={`pro-select ${errors.category ? "border-red-400 bg-red-50" : ""}`}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    Sub-Category *
                  </label>
                  <select
                    value={form.sub_category}
                    onChange={(e) => setField("sub_category", e.target.value)}
                    disabled={!form.category}
                    className={`pro-select ${errors.sub_category ? "border-red-400 bg-red-50" : "disabled:opacity-50"}`}
                  >
                    <option value="">Select sub-category</option>
                    {subCategoryOptions.map((subCategory) => (
                      <option key={subCategory} value={subCategory}>
                        {subCategory}
                      </option>
                    ))}
                  </select>
                  {errors.sub_category && <p className="mt-1 text-xs text-red-600">{errors.sub_category}</p>}
                </div>
              </div>

              {/* Row 3: Assign To */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Assign To — IT Sub-Branch
                </label>
                <select
                  value={form.assigned_to}
                  onChange={(e) => setField("assigned_to", e.target.value)}
                  className="pro-select"
                  disabled={assignToDisabled}
                >
                  <option value="">— Select IT Staff Member (optional) —</option>
                  {currentAssignees.map((staff) => (
                    <option key={`${staff.name}-${staff.email}`} value={staff.name}>
                      {formatAssignmentLabel(staff)}
                    </option>
                  ))}
                </select>
                {errors.assigned_to ? (
                  <p className="mt-1 text-xs text-red-600">{errors.assigned_to}</p>
                ) : isCtm && !currentAssignees.length ? (
                  <p className="mt-1 text-xs text-slate-400">
                    No CTM assignee is mapped for the selected plant.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Select the IT team member who handles your type of issue. They will receive an email notification.
                  </p>
                )}
              </div>

              {/* Row 4: Title */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  className={`pro-input ${errors.title ? "border-red-400 bg-red-50" : ""}`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
              </div>

              {/* Row 5: Description */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Description *
                </label>
                <textarea
                  placeholder="Provide as much detail as possible — steps to reproduce, error messages, affected systems..."
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={5}
                  className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 resize-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-500/10 ${
                    errors.description ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50/30"
                  }`}
                />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Attachment (Optional)
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files[0];
                    handleFile(file);
                  }}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                    dragging ? "border-brand-400 bg-brand-50/70" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {attachment ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="text-sm text-slate-700">{attachment.name}</span>
                      <span className="text-xs text-slate-400">({(attachment.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachment(null);
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-sm text-slate-400">{dragging ? "Drop file here" : "Click to upload or drag & drop"}</p>
                      <p className="text-xs text-slate-300 mt-1">PNG, JPG, PDF, DOC up to 10MB</p>
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

        <div className="space-y-5">
          <div className="pro-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e8eef5" }}>
              <h3 className="text-sm font-semibold text-slate-900">Priority *</h3>
            </div>
            <div className="p-5 space-y-3">
              {PRIORITIES.map((priority) => (
                <label
                  key={priority.value}
                  onClick={() => handlePriorityClick(priority.value)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-150 ${
                    form.priority === priority.value ? priority.color + " shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={form.priority === priority.value}
                    onChange={() => {}}
                    className="mt-0.5 accent-current"
                  />
                  <div>
                    <div className="text-sm font-bold">{priority.label}</div>
                    <div className="text-xs opacity-70">{priority.desc}</div>
                  </div>
                </label>
              ))}
              {errors.priority && <p className="text-xs text-red-600">{errors.priority}</p>}
            </div>
          </div>

          <div className="pro-card overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #e8eef5" }}>
              <h3 className="text-sm font-semibold text-slate-900">SLA Response Times</h3>
            </div>
            <div className="p-5 space-y-2.5 text-xs text-slate-500">
              {[
                ["P1 Critical", "4 hours", "#ef4444"],
                ["P2 High", "8 hours", "#f97316"],
                ["P3 Medium", "24 hours", "#eab308"],
                ["P4 Low", "72 hours", "#22c55e"],
              ].map(([label, time, dot]) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: dot }} />
                    <span>{label}</span>
                  </div>
                  <span className="font-semibold text-slate-700">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Submit Ticket
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Priority Change Confirmation Modal */}
      {priorityModal && (
        <PriorityConfirmModal
          current={form.priority}
          target={priorityModal.targetPriority}
          priorities={PRIORITIES}
          onConfirm={confirmPriorityChange}
          onCancel={() => setPriorityModal(null)}
        />
      )}
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: "#f8fafc", border: "1px solid #dbe3ec" }}>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value || "—"}</div>
    </div>
  );
}

const PRIORITY_META = {
  P1: { icon: "🔴", badge: "bg-red-100 text-red-700", ring: "ring-red-300", banner: "bg-red-50 border-red-200" },
  P2: { icon: "🟠", badge: "bg-amber-100 text-amber-700", ring: "ring-amber-300", banner: "bg-amber-50 border-amber-200" },
  P3: { icon: "🟡", badge: "bg-slate-100 text-slate-600", ring: "ring-slate-300", banner: "bg-slate-50 border-slate-200" },
  P4: { icon: "🟢", badge: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-300", banner: "bg-emerald-50 border-emerald-200" },
};

function PriorityConfirmModal({ current, target, priorities, onConfirm, onCancel }) {
  const from = priorities.find((p) => p.value === current);
  const to = priorities.find((p) => p.value === target);
  const toMeta = PRIORITY_META[target] || PRIORITY_META.P3;
  const isEscalation = ["P1", "P2"].includes(target);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        style={{ border: "1px solid #e2e8f0" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl">
            {toMeta.icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Change Priority?</h3>
            <p className="text-xs text-slate-400">This affects SLA response time</p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${PRIORITY_META[current]?.badge}`}>
              {PRIORITY_META[current]?.icon} {from?.label}
            </span>
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ring-2 ${toMeta.badge} ${toMeta.ring}`}>
              {toMeta.icon} {to?.label}
            </span>
          </div>

          <div className={`rounded-xl border p-3 ${toMeta.banner}`}>
            <p className="text-xs font-semibold text-slate-700">{to?.desc}</p>
          </div>

          {isEscalation && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs text-red-700 font-medium">
                Escalating to {to?.label} will notify IT management and require justification. Please ensure this is accurate.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Keep {from?.value}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2 text-sm font-bold text-white transition ${
              isEscalation ? "bg-red-600 hover:bg-red-700" : "bg-slate-800 hover:bg-slate-700"
            }`}
          >
            Yes, change to {to?.value}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
