import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../utils/api.js";
import { PLANTS, plantLabel } from "../utils/plants.js";
import { CATEGORY_OPTIONS, SUB_CATEGORIES_BY_CATEGORY } from "../utils/ticketTaxonomy.js";

const STAFF_CATEGORY_OPTIONS = CATEGORY_OPTIONS;

const ROLE_OPTIONS = {
  user: ["User"],
  it_staff: STAFF_CATEGORY_OPTIONS,
  admin: ["Administrator"],
};

const portalRoles = [
  { value: "user", label: "User" },
  { value: "it_staff", label: "IT Staff" },
  { value: "admin", label: "Admin" },
];

function getSubCategories(category) {
  return SUB_CATEGORIES_BY_CATEGORY[category] || [];
}

function emptyForm(portal_role = "it_staff") {
  const defaultCategory = STAFF_CATEGORY_OPTIONS[0] || "";
  const defaultSubCategory = getSubCategories(defaultCategory)[0] || "";
  return {
    name: "",
    email: "",
    username: "",
    password: "",
    role: portal_role === "admin" ? "Administrator" : portal_role === "user" ? "User" : defaultCategory,
    team: portal_role === "it_staff" ? defaultSubCategory : "",
    portal_role,
    department: portal_role === "it_staff" ? "IT" : "",
    plant: "",
    sub_category: portal_role === "it_staff" ? defaultSubCategory : "",
  };
}

function SectionShell({ title, subtitle, children, badge }) {
  return (
    <section
      className="overflow-hidden rounded-3xl bg-white"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 8px 30px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Metric({ label, value, hint, accent = "blue" }) {
  const styles = {
    blue: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    cyan: { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
    purple: { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" },
    emerald: { bg: "#f0fdf4", text: "#0f766e", border: "#bbf7d0" },
  };
  const c = styles[accent] || styles.blue;
  return (
    <div className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${c.border}`, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <div className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: c.text }}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function RecordRow({ user, onEdit, onDelete }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold leading-6 text-slate-900 truncate">{user.name}</div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(user.id)}
            className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Team() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm("it_staff"));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [plantFilter, setPlantFilter] = useState("");
  const [splitPercent, setSplitPercent] = useState(38);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updateConfirm, setUpdateConfirm] = useState(null); // { id, name, payload }
  const splitRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  async function load() {
    setLoading(true);
    try {
      const response = await api.users();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    function clampSplit() {
      setSplitPercent((current) => Math.min(62, Math.max(30, current)));
    }

    clampSplit();
    window.addEventListener("resize", clampSplit);
    return () => window.removeEventListener("resize", clampSplit);
  }, []);

  function beginSplitDrag(event) {
    event.preventDefault();
    const container = splitRef.current;
    if (!container) return;
    event.currentTarget?.setPointerCapture?.(event.pointerId);

    const onMove = (moveEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = moveEvent.clientX ?? (moveEvent.touches && moveEvent.touches[0]?.clientX);
      if (typeof clientX !== "number") return;
      const next = ((clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(68, Math.max(32, next)));
    };

    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", stop);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", stop);
  }

  const metrics = useMemo(() => {
    const staff = users.filter((u) => u.portal_role === "it_staff");
    const admins = users.filter((u) => u.portal_role === "admin");
    const userAccounts = users.filter((u) => !u.portal_role || u.portal_role === "user");
    return {
      total: users.length,
      staff: staff.length,
      users: userAccounts.length,
      admins: admins.length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const portal = user.portal_role || "user";
      const matchesFilter =
        filter === "all" ||
        (filter === "staff" && portal === "it_staff") ||
        (filter === "users" && portal === "user") ||
        (filter === "admins" && portal === "admin");
      const matchesSearch =
        !term ||
        [user.name, user.email, user.username, user.role, user.team, user.department, user.plant]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      const matchesPlant = !plantFilter || String(user.plant || "") === plantFilter;
      return matchesFilter && matchesSearch && matchesPlant;
    });
  }, [users, filter, plantFilter, search]);

  const staffRecords = filteredUsers.filter((user) => user.portal_role === "it_staff");
  const userRecords = filteredUsers.filter((user) => !user.portal_role || user.portal_role === "user");
  const adminRecords = filteredUsers.filter((user) => user.portal_role === "admin");

  function resetForm(nextPortalRole = "it_staff") {
    setEditingId(null);
    setForm(emptyForm(nextPortalRole));
  }

  function startEdit(user) {
    setEditingId(user.id);
    const staffCategory = user.portal_role === "it_staff"
      ? (CATEGORY_OPTIONS.includes(user.role) ? user.role : STAFF_CATEGORY_OPTIONS[0])
      : "";
    const staffSubCategory = user.portal_role === "it_staff"
      ? (getSubCategories(staffCategory).includes(user.team) ? user.team : getSubCategories(staffCategory)[0] || "")
      : "";
    setForm({
      name: user.name || "",
      email: user.email || "",
      username: user.username || "",
      password: "",
      role: user.portal_role === "it_staff" ? staffCategory : (user.portal_role === "admin" ? "Administrator" : "User"),
      team: staffSubCategory,
      portal_role: user.portal_role || "user",
      department: user.portal_role === "it_staff" ? "IT" : "",
      plant: user.plant || "",
      sub_category: staffSubCategory,
    });
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const isStaffMode = form.portal_role === "it_staff";
    const resolvedCategory = isStaffMode ? form.role : form.portal_role === "admin" ? "Administrator" : "User";
    const payload = {
      ...form,
      role: resolvedCategory,
      team: isStaffMode ? form.team : "",
      department: isStaffMode ? "IT" : "",
      plant: form.plant,
      sub_category: isStaffMode ? form.team : "",
    };
    delete payload.status;
    delete payload.avatar_color;
    delete payload.custom_position;
    delete payload.staff_position;

    // Show confirmation modal when updating an existing member
    if (editingId) {
      const memberName = users.find((u) => u.id === editingId)?.name || form.name || "this member";
      setUpdateConfirm({ id: editingId, name: memberName, payload });
      return;
    }

    // Creating new member — no confirmation needed
    setSubmitting(true);
    try {
      await api.createUser(payload);
      setSuccess(form.portal_role === "it_staff" ? "Staff member created successfully." : "Member created successfully.");
      window.dispatchEvent(new Event("ticket-metadata-updated"));
      resetForm(form.portal_role);
      await load();
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function doUpdate() {
    if (!updateConfirm) return;
    setUpdateConfirm(null);
    setSubmitting(true);
    setError("");
    try {
      await api.updateUser(updateConfirm.id, updateConfirm.payload);
      setSuccess("Member updated successfully.");
      window.dispatchEvent(new Event("ticket-metadata-updated"));
      resetForm(form.portal_role);
      await load();
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this team member?")) return;
    try {
      await api.deleteUser(id);
      window.dispatchEvent(new Event("ticket-metadata-updated"));
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete member.");
    }
  }

  const currentPortalLabel =
    form.portal_role === "it_staff" ? "IT Staff" : form.portal_role === "admin" ? "Admin" : "User";
  const isStaffMode = form.portal_role === "it_staff";
  const roleOptions = isStaffMode ? STAFF_CATEGORY_OPTIONS : ROLE_OPTIONS[form.portal_role] || ROLE_OPTIONS.user;
  const subCategoryOptions = isStaffMode ? getSubCategories(form.role) : [];

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-3xl bg-white text-slate-900 shadow-soft"
        style={{
          border: "1px solid #dbe3ec",
        }}
      >
        <div className="grid gap-6 p-6 xl:grid-cols-[1.05fr_0.95fr] xl:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Team Directory
            </div>
            <h2 className="mt-4 text-[28px] font-semibold tracking-tight text-slate-900">Separate user and staff records in one place</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Manage portal access cleanly with dedicated records for users, IT staff, and admins. Create new staff members,
              update roles, and keep the login structure organized.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Total Records" value={metrics.total} hint="All portal accounts" accent="cyan" />
            <Metric label="IT Staff" value={metrics.staff} hint="Staff portal members" accent="purple" />
            <Metric label="Users" value={metrics.users} hint="End-user accounts" accent="blue" />
            <Metric label="Admins" value={metrics.admins} hint="Full access accounts" accent="emerald" />
          </div>
        </div>
      </section>

      <div
        ref={splitRef}
        className="grid gap-6 xl:items-stretch xl:gap-0"
        style={{ gridTemplateColumns: `${splitPercent}% 14px ${100 - splitPercent}%` }}
      >
        <div
          ref={editorRef}
          className="min-w-0 xl:sticky xl:top-[5.25rem] xl:self-start xl:max-h-[calc(100vh-6.25rem)] xl:overflow-y-auto xl:pr-3"
          style={{ gridColumn: "1", scrollMarginTop: "6rem" }}
        >
          <SectionShell
            title={editingId ? "Edit Team Member" : "Create Team Member"}
            subtitle="Choose the login type first, then fill in the profile details."
            badge={currentPortalLabel}
          >
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Account Type
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {portalRoles.map((option) => {
                    const active = form.portal_role === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setForm((current) => ({
                            ...current,
                            portal_role: option.value,
                            role:
                              option.value === "it_staff"
                                ? STAFF_CATEGORY_OPTIONS[0] || ""
                                : option.value === "admin"
                                  ? "Administrator"
                                  : "User",
                            team:
                              option.value === "it_staff"
                                ? getSubCategories(STAFF_CATEGORY_OPTIONS[0] || "")[0] || ""
                                : "",
                            department: option.value === "it_staff" ? "IT" : "",
                            plant: current.plant || "",
                            sub_category:
                              option.value === "it_staff"
                                ? getSubCategories(STAFF_CATEGORY_OPTIONS[0] || "")[0] || ""
                                : "",
                          }));
                        }}
                        className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Staff members use the staff portal, while users use the user portal. Admins get full access.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={isStaffMode ? "Staff Name" : "Full Name"}
                  value={form.name}
                  onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                />
                <TextField
                  label={isStaffMode ? "Staff Email" : "Email"}
                  value={form.email}
                  onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                />
                <TextField
                  label="Username"
                  value={form.username}
                  onChange={(value) => setForm((current) => ({ ...current, username: value }))}
                />
                <TextField
                  label={editingId ? "New Password" : "Password"}
                  type="password"
                  value={form.password}
                  onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                  placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                />
              </div>

              {isStaffMode ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Category"
                      value={form.role}
                      onChange={(value) => {
                        const nextSubCategories = getSubCategories(value);
                        setForm((current) => ({
                          ...current,
                          role: value,
                          team: nextSubCategories[0] || "",
                          sub_category: nextSubCategories[0] || "",
                          department: "IT",
                        }));
                      }}
                      options={roleOptions}
                    />
                    <SelectField
                      label="Sub-Category"
                      value={form.team}
                      onChange={(value) => setForm((current) => ({ ...current, team: value, sub_category: value }))}
                      options={subCategoryOptions}
                    />
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Department</div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">IT</div>
                    </div>
                    <SelectField
                      label="Plant / Branch"
                      value={form.plant}
                      onChange={(value) => setForm((current) => ({ ...current, plant: value }))}
                      options={PLANTS.map((plant) => ({ value: plant.value, label: plantLabel(plant.value) }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="Role / Position"
                    value={form.role}
                    onChange={(value) => setForm((current) => ({ ...current, role: value }))}
                    options={roleOptions}
                  />
                  <SelectField
                    label="Plant / Branch"
                    value={form.plant}
                    onChange={(value) => setForm((current) => ({ ...current, plant: value }))}
                    options={PLANTS.map((plant) => ({ value: plant.value, label: plantLabel(plant.value) }))}
                  />
                </div>
              )}

                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {success}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : editingId ? "Update Member" : "Create Member"}
                  </button>
                  <GhostButton type="button" onClick={() => resetForm(form.portal_role)}>
                    Reset
                  </GhostButton>
                </div>
            </form>
          </SectionShell>
        </div>

        <div className="relative hidden xl:flex items-stretch justify-center" style={{ gridColumn: "2" }}>
          <button
            type="button"
            aria-label="Resize team layout"
            onPointerDown={beginSplitDrag}
            onTouchStart={beginSplitDrag}
            className="relative flex h-full w-full items-stretch justify-center"
            style={{ cursor: "col-resize", touchAction: "none", userSelect: "none" }}
          >
            <span className="h-full w-px bg-slate-200" />
            <span className="absolute top-1/2 h-16 w-3 -translate-y-1/2 rounded-full border border-slate-300 bg-white shadow-sm" />
          </button>
        </div>

        <div className="min-w-0 space-y-6 xl:pl-3" style={{ gridColumn: "3" }}>
          <SectionShell
            title="Search and Filter"
            subtitle="Focus on the record set you want to review."
            badge={`${filteredUsers.length} shown`}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_220px_260px]">
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Search</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, username, role..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Record Type</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="all">All Records</option>
                  <option value="staff">Staff Only</option>
                  <option value="users">Users Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Plant</span>
                <select
                  value={plantFilter}
                  onChange={(event) => setPlantFilter(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                >
                  <option value="">All Plants</option>
                  {PLANTS.map((plant) => (
                    <option key={plant.value} value={plant.value}>
                      {plantLabel(plant.value)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </SectionShell>

          <SectionShell title="IT Staff Records" subtitle="Accounts that can sign in to the staff portal." badge={`${staffRecords.length}`}>
            <RecordsTable
              records={staffRecords}
              emptyText="No IT staff members found."
              onEdit={startEdit}
              onDelete={remove}
              loading={loading}
            />
          </SectionShell>

          <SectionShell title="User Records" subtitle="End-user accounts used for the user portal." badge={`${userRecords.length}`}>
            <RecordsTable
              records={userRecords}
              emptyText="No user accounts found."
              onEdit={startEdit}
              onDelete={remove}
              loading={loading}
            />
          </SectionShell>

          <SectionShell title="Admin Records" subtitle="Privileged accounts with full access." badge={`${adminRecords.length}`}>
            <RecordsTable
              records={adminRecords}
              emptyText="No admin accounts found."
              onEdit={startEdit}
              onDelete={remove}
              loading={loading}
            />
          </SectionShell>
        </div>
      </div>

      {/* Staff Update Confirmation Modal */}
      {updateConfirm && (
        <StaffUpdateModal
          name={updateConfirm.name}
          onConfirm={doUpdate}
          onCancel={() => setUpdateConfirm(null)}
        />
      )}
    </div>
  );
}

function StaffUpdateModal({ name, onConfirm, onCancel }) {
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
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Update Member Details</h3>
            <p className="text-xs text-slate-400">Please review before confirming</p>
          </div>
          <button onClick={onCancel} className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">✕</button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">Member</p>
            <p className="text-sm font-bold text-slate-800">{name}</p>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-amber-700 font-medium">
              You are about to save changes to this member&apos;s profile. This will update their role, plant, and access settings immediately.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 transition">
            Yes, Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TextField({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options = [] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
      >
        {options.map((item) => {
          const optionValue = typeof item === "string" ? item : item?.value ?? "";
          const optionLabel = typeof item === "string" ? item : item?.label ?? optionValue;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function RecordsTable({ records, emptyText, onEdit, onDelete, loading = false }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200" />
                <div className="h-3 w-56 rounded bg-slate-200" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-200" />
                <div className="h-6 w-16 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="h-14 rounded-xl bg-slate-200" />
              <div className="h-14 rounded-xl bg-slate-200" />
              <div className="h-14 rounded-xl bg-slate-200" />
              <div className="h-14 rounded-xl bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center text-sm text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((user) => (
        <RecordRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
