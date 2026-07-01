import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api.js";

const ROLE_OPTIONS = {
  user: ["User"],
  it_staff: [
    "Help Desk Engineer",
    "Technical Support Engineer",
    "Network Administrator",
    "System Administrator",
    "Infrastructure Manager",
  ],
  admin: [
    "Administrator",
    "System Administrator",
    "IT Manager",
  ],
};

const STAFF_ROLE_OPTIONS = [
  "Help Desk Engineer",
  "Technical Support Engineer",
  "Network Administrator",
  "System Administrator",
  "Infrastructure Manager",
  "New Position",
];

const portalRoles = [
  { value: "user", label: "User" },
  { value: "it_staff", label: "IT Staff" },
  { value: "admin", label: "Admin" },
];

const departments = ["IT", "HR", "Finance", "Operations", "Sales", "Marketing", "Administration"];
const statuses = ["Available", "Busy", "Away", "Offline"];

function emptyForm(portal_role = "it_staff") {
  return {
    name: "",
    email: "",
    username: "",
    password: "",
    role: portal_role === "admin" ? "Administrator" : portal_role === "user" ? "User" : "Help Desk Engineer",
    staff_position: portal_role === "user" ? "" : "Help Desk Engineer",
    custom_position: "",
    team: "",
    status: portal_role === "user" ? "Active" : "Available",
    avatar_color: "#0f172a",
    portal_role,
    department: portal_role === "user" ? "" : "IT",
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
    blue: { bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe" },
    cyan: { bg: "#ecfeff", text: "#0891b2", border: "#a5f3fc" },
    purple: { bg: "#f5f3ff", text: "#7c3aed", border: "#ddd6fe" },
    emerald: { bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" },
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

function RecordRow({ user, onEdit, onDelete, showDepartment = true }) {
  const portalLabel =
    user.portal_role === "it_staff" ? "IT Staff" : user.portal_role === "admin" ? "Admin" : "User";

  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80">
      <td className="px-3 py-3 lg:px-4">
        <div className="font-semibold text-slate-900">{user.name}</div>
        <div className="text-sm text-slate-500">{user.email}</div>
      </td>
      <td className="px-3 py-3 text-sm text-slate-700 lg:px-4">{user.role || "—"}</td>
      <td className="px-3 py-3 lg:px-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            user.portal_role === "admin"
              ? "bg-purple-100 text-purple-700"
              : user.portal_role === "it_staff"
                ? "bg-cyan-100 text-cyan-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {portalLabel}
        </span>
      </td>
      {showDepartment ? <td className="px-3 py-3 text-sm text-slate-700 lg:px-4">{user.department || "—"}</td> : null}
      <td className="px-3 py-3 text-sm text-slate-700 lg:px-4">{user.status || "—"}</td>
      <td className="px-3 py-3 lg:px-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(user.id)}
            className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
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
  const [newStaffOpen, setNewStaffOpen] = useState(false);
  const [splitPercent, setSplitPercent] = useState(38);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const splitRef = useRef(null);

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
        [user.name, user.email, user.username, user.role, user.team, user.department]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [users, filter, search]);

  const staffRecords = filteredUsers.filter((user) => user.portal_role === "it_staff");
  const userRecords = filteredUsers.filter((user) => !user.portal_role || user.portal_role === "user");
  const adminRecords = filteredUsers.filter((user) => user.portal_role === "admin");

  function resetForm(nextPortalRole = "it_staff") {
    setEditingId(null);
    setForm(emptyForm(nextPortalRole));
    setNewStaffOpen(false);
  }

  function startEdit(user) {
    setNewStaffOpen(false);
    setEditingId(user.id);
    const staffRole = user.portal_role === "it_staff" ? user.role || "Help Desk Engineer" : "";
    const isCustomStaffRole = user.portal_role === "it_staff" && staffRole && !STAFF_ROLE_OPTIONS.includes(staffRole);
    setForm({
      name: user.name || "",
      email: user.email || "",
      username: user.username || "",
      password: "",
      role: user.portal_role === "it_staff" && isCustomStaffRole ? "New Position" : user.role || (user.portal_role === "user" ? "User" : "Help Desk Engineer"),
      staff_position: user.portal_role === "it_staff" ? (isCustomStaffRole ? "New Position" : staffRole || "Help Desk Engineer") : "",
      custom_position: user.portal_role === "it_staff" && isCustomStaffRole ? staffRole : "",
      team: user.team || "",
      status: user.status || (user.portal_role === "user" ? "Active" : "Available"),
      avatar_color: user.avatar_color || "#0f172a",
      portal_role: user.portal_role || "user",
      department: user.portal_role === "user" ? "" : user.department || "IT",
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        role:
          form.portal_role === "user"
            ? "User"
            : form.staff_position === "New Position"
              ? form.custom_position || "Custom Position"
              : form.staff_position || form.role,
        department: form.portal_role === "user" ? "" : form.department,
      };
      if (editingId) {
        await api.updateUser(editingId, payload);
        setSuccess("Member updated successfully.");
      } else {
        await api.createUser(payload);
        setSuccess(form.portal_role === "it_staff" ? "Staff member created successfully." : "Member created successfully.");
      }
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
      await load();
    } catch (err) {
      setError(err.message || "Failed to delete member.");
    }
  }

  const currentPortalLabel =
    form.portal_role === "it_staff" ? "IT Staff" : form.portal_role === "admin" ? "Admin" : "User";
  const isStaffMode = form.portal_role === "it_staff";
  const isNewStaffMode = newStaffOpen && isStaffMode;
  const roleOptions = isStaffMode ? STAFF_ROLE_OPTIONS : ROLE_OPTIONS[form.portal_role] || ROLE_OPTIONS.it_staff;

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-3xl text-white"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%)",
          boxShadow: "0 18px 50px rgba(15,23,42,0.18)",
        }}
      >
        <div className="grid gap-6 p-6 xl:grid-cols-[1.05fr_0.95fr] xl:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
              Team Directory
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Separate user and staff records in one place</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
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
        <div className="min-w-0 xl:pr-3" style={{ gridColumn: "1" }}>
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
                          const nextRole =
                            option.value === "it_staff"
                              ? "New Position"
                              : option.value === "admin"
                                ? "Administrator"
                                : "User";
                          setForm((current) => ({
                            ...current,
                            portal_role: option.value,
                            role: nextRole,
                            staff_position:
                              option.value === "it_staff" ? current.staff_position || "Help Desk Engineer" : "",
                            custom_position: "",
                            department: option.value === "user" ? "" : current.department || "IT",
                            status: option.value === "user" ? "Active" : current.status || "Available",
                          }));
                          setNewStaffOpen(option.value === "it_staff");
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

              {isNewStaffMode ? (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">New Staff Member</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Fill this dedicated staff panel to create a fresh IT staff login.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewStaffOpen(false);
                        setForm((current) => ({
                          ...current,
                          role: current.staff_position || "Help Desk Engineer",
                          portal_role: "it_staff",
                          staff_position: current.staff_position || "Help Desk Engineer",
                          custom_position: "",
                          department: "IT",
                          status: "Available",
                        }));
                      }}
                      className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-cyan-700 transition hover:bg-cyan-100"
                    >
                      Back to Positions
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Staff Name"
                      value={form.name}
                      onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                    />
                    <TextField
                      label="Staff Email"
                      value={form.email}
                      onChange={(value) => setForm((current) => ({ ...current, email: value }))}
                    />
                    <TextField
                      label="Username"
                      value={form.username}
                      onChange={(value) => setForm((current) => ({ ...current, username: value }))}
                    />
                    <TextField
                      label="Password"
                      type="password"
                      value={form.password}
                      onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                      placeholder="Set staff login password"
                    />
                    <SelectField
                      label="Role / Position"
                      value={form.staff_position}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          staff_position: value,
                          role: value === "New Position" ? "New Position" : value,
                          custom_position: value === "New Position" ? current.custom_position : "",
                        }))
                      }
                      options={STAFF_ROLE_OPTIONS}
                    />
                    {form.staff_position === "New Position" ? (
                      <TextField
                        label="Custom Role / Position"
                        value={form.custom_position}
                        onChange={(value) => setForm((current) => ({ ...current, custom_position: value }))}
                        placeholder="Enter a new role for this staff member"
                      />
                    ) : null}
                    <SelectField
                      label="Department"
                      value={form.department}
                      onChange={(value) => setForm((current) => ({ ...current, department: value }))}
                      options={departments}
                    />
                    <SelectField
                      label="Status"
                      value={form.status}
                      onChange={(value) => setForm((current) => ({ ...current, status: value }))}
                      options={statuses}
                    />
                    <div>
                      <span className="mb-2 block text-sm font-medium text-slate-700">Avatar Color</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <input
                          type="color"
                          value={form.avatar_color}
                          onChange={(event) => setForm((current) => ({ ...current, avatar_color: event.target.value }))}
                          className="h-10 w-12 rounded-lg border border-slate-200 bg-white p-1"
                        />
                        <div className="text-xs text-slate-500">Used in avatar badges.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isNewStaffMode ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Full Name"
                      value={form.name}
                      onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                    />
                    <TextField
                      label="Email"
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
                      placeholder={editingId ? "Leave blank to keep current" : "Set a login password"}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      label="Role / Position"
                      value={form.role}
                      onChange={(value) => {
                        if (value === "New Position") {
                          setNewStaffOpen(true);
                          setForm((current) => ({
                            ...current,
                            portal_role: "it_staff",
                            role: "New Position",
                            staff_position: current.staff_position || "Help Desk Engineer",
                            custom_position: "",
                            department: "IT",
                            status: "Available",
                          }));
                          return;
                        }
                        setNewStaffOpen(false);
                        setForm((current) => ({ ...current, role: value, staff_position: "", custom_position: "" }));
                      }}
                      options={roleOptions}
                    />
                    {form.portal_role !== "user" ? (
                      <SelectField
                        label="Department"
                        value={form.department}
                        onChange={(value) => setForm((current) => ({ ...current, department: value }))}
                        options={departments}
                      />
                    ) : null}
                    <TextField
                      label="Team"
                      value={form.team}
                      onChange={(value) => setForm((current) => ({ ...current, team: value }))}
                      placeholder="Optional team name"
                    />
                    <SelectField
                      label="Status"
                      value={form.status}
                      onChange={(value) => setForm((current) => ({ ...current, status: value }))}
                      options={form.portal_role === "user" ? ["Active", "Inactive"] : statuses}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                    <div>
                      <span className="mb-2 block text-sm font-medium text-slate-700">Avatar Color</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <input
                          type="color"
                          value={form.avatar_color}
                          onChange={(event) => setForm((current) => ({ ...current, avatar_color: event.target.value }))}
                          className="h-10 w-12 rounded-lg border border-slate-200 bg-white p-1"
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{form.avatar_color}</div>
                          <div className="text-xs text-slate-400">Used in portal badges and cards</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}

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
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
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
            </div>
          </SectionShell>

          <SectionShell title="IT Staff Records" subtitle="Accounts that can sign in to the staff portal." badge={`${staffRecords.length}`}>
            <RecordsTable
              records={staffRecords}
              emptyText="No IT staff members found."
              onEdit={startEdit}
              onDelete={remove}
              showDepartment
            />
          </SectionShell>

          <SectionShell title="User Records" subtitle="End-user accounts used for the user portal." badge={`${userRecords.length}`}>
            <RecordsTable
              records={userRecords}
              emptyText="No user accounts found."
              onEdit={startEdit}
              onDelete={remove}
              showDepartment={false}
            />
          </SectionShell>

          <SectionShell title="Admin Records" subtitle="Privileged accounts with full access." badge={`${adminRecords.length}`}>
            <RecordsTable
              records={adminRecords}
              emptyText="No admin accounts found."
              onEdit={startEdit}
              onDelete={remove}
              showDepartment
            />
          </SectionShell>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-400">
          Loading team records...
        </div>
      )}
    </div>
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
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function RecordsTable({ records, emptyText, onEdit, onDelete, showDepartment = true }) {
  if (!records.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-10 text-center text-sm text-slate-400">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-slate-50/80 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-3 py-3 lg:px-4" style={{ width: showDepartment ? "30%" : "34%" }}>
                Member
              </th>
              <th className="px-3 py-3 lg:px-4" style={{ width: showDepartment ? "18%" : "20%" }}>
                Role
              </th>
              <th className="px-3 py-3 lg:px-4" style={{ width: "14%" }}>
                Access
              </th>
              {showDepartment ? (
                <th className="px-3 py-3 lg:px-4" style={{ width: "14%" }}>
                  Department
                </th>
              ) : null}
              <th className="px-3 py-3 lg:px-4" style={{ width: "12%" }}>
                Status
              </th>
              <th className="px-3 py-3 lg:px-4" style={{ width: showDepartment ? "12%" : "20%" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((user) => (
              <RecordRow key={user.id} user={user} onEdit={onEdit} onDelete={onDelete} showDepartment={showDepartment} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
