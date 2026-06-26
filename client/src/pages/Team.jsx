import { useEffect, useState } from "react";
import { api } from "../utils/api.js";

const roles = ["Admin", "Agent", "Viewer"];

export default function Team() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", role: "Agent", team: "", status: "Available", avatar_color: "#0f172a" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
  const response = await api.users();

  console.log("USERS RESPONSE =", response);
  console.log("USERS DATA =", response.data);

  setUsers(response.data || []);
}

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function startEdit(user) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      username: user.username,
      password: "",
      role: user.role,
      team: user.team || "",
      status: user.status || "Available",
      avatar_color: user.avatar_color || "#0f172a",
    });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      console.log("[Team] Submitting — editingId:", editingId, "form:", form);
      if (editingId) {
        const result = await api.updateUser(editingId, form);
        console.log("[Team] updateUser result:", result);
        setSuccess("Member updated successfully!");
      } else {
        const result = await api.createUser(form);
        console.log("[Team] createUser result:", result);
        setSuccess("Member added successfully!");
      }
      setEditingId(null);
      setForm({ name: "", email: "", username: "", password: "", role: "Agent", team: "", status: "Available", avatar_color: "#0f172a" });
      await load();
    } catch (err) {
      console.error("[Team] submit error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this team member?")) return;
    await api.deleteUser(id);
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
        <p className="mt-1 text-sm text-slate-500">Create, edit and delete engineers or viewers.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="text-base font-semibold text-slate-900">{editingId ? "Edit Member" : "Add Member"}</h3>
          {[
            ["name", "Full Name"],
            ["email", "Email"],
            ["username", "Username"],
            ["password", "Password"],
            ["team", "Team"],
            ["avatar_color", "Avatar Color"],
          ].map(([field, label]) => (
            <label key={field} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
              <input
                type={field === "password" ? "password" : field === "avatar_color" ? "color" : "text"}
                value={form[field]}
                onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
              />
            </label>
          ))}
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
            <input
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            />
          </label>
          {error ? <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          {success ? <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-medium text-green-700">{success}</div> : null}
          <div className="flex gap-3">
            <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              {editingId ? "Update Member" : "Add Member"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ name: "", email: "", username: "", password: "", role: "Agent", team: "", status: "Available", avatar_color: "#0f172a" });
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-semibold text-slate-900">Team Members</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Team</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">{user.role}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{user.team}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{user.status}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(user)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                          Edit
                        </button>
                        <button onClick={() => remove(user.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
