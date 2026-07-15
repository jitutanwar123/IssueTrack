import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTickets } from "../context/TicketContext.jsx";
import { api } from "../utils/api.js";
import { PLANTS, plantLabel } from "../utils/plants.js";

const categories = ["Incident", "Service Request", "Problem", "Change"];
const priorities = ["P1", "P2", "P3", "P4"];
const statuses = [
  "Open",
  "Assigned",
  "Work In Progress",
  "On Hold - Change",
  "On Hold - Customer",
  "On Hold - Infra",
  "Closed",
  "Reject",
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const { createTicket } = useTickets();
  const [ticketId, setTicketId] = useState("Generating...");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Incident",
    sub_category: "",
    priority: "",
    status: "Open",
    customer_name: "",
    requester_email: "",
    phone: "",
    department: "",
    plant: "",
    requested_by_id: "",
    assigned_to_id: "",
    expected_closure_date: "",
    actual_closure_date: "",
    response_time: 0,
    resolution_time: 0,
    service: "Incident",
  });

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch next ticket ID and users in parallel
        const [idResponse, usersResponse] = await Promise.all([
          api.nextTicketId("Incident"),
          api.users(),
        ]);

        if (idResponse?.ticket_id) {
          setTicketId(idResponse.ticket_id);
        }

        if (Array.isArray(usersResponse)) {
          setUsers(usersResponse);
        } else if (Array.isArray(usersResponse?.data)) {
          setUsers(usersResponse.data);
        } else if (Array.isArray(usersResponse?.users)) {
          setUsers(usersResponse.users);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("CreateTicket load error:", err);
        setTicketId("Error");
        setUsers([]);
      }
    }

    loadData();
  }, []);

  const userOptions = useMemo(() => {
    return (users || []).map((user) => ({
      value: user.id,
      label: `${user.name} (${user.role})`,
    }));
  }, [users]);

  const assigneeOptions = useMemo(() => {
    const selectedPlant = String(form.plant || "");
    return (users || [])
      .filter((user) => {
        if (user.portal_role !== "it_staff") return false;
        if (!selectedPlant) return true;
        return String(user.plant || "") === selectedPlant;
      })
      .map((user) => ({
        value: user.id,
        label: `${user.name} (${user.role})${user.plant ? ` - ${plantLabel(user.plant)}` : ""}`,
      }));
  }, [users, form.plant]);

  async function submit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!form.priority) {
        throw new Error("Priority is required");
      }
      const payload = {
        ...form,
        requested_by_id: form.requested_by_id
          ? Number(form.requested_by_id)
          : null,
        assigned_to_id: form.assigned_to_id
          ? Number(form.assigned_to_id)
          : null,
        response_time: Number(form.response_time || 0),
        resolution_time: Number(form.resolution_time || 0),
      };

      const ticket = await createTicket(payload);

if (ticket?.id) {
  alert(`Ticket Created Successfully! Ticket No: ${ticket.id}`);
}

navigate("/tickets");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      ...(field === "plant" ? { assigned_to_id: "" } : {}),
      [field]: value,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Create Ticket
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Ticket ID is pre-assigned automatically when the form loads.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Ticket ID"
            value={ticketId}
            readOnly
          />

          <Field
            label="Title / Subject"
            value={form.title}
            onChange={(value) => setField("title", value)}
          />

          <Field
            label="Customer / Requester Name"
            value={form.customer_name}
            onChange={(value) => setField("customer_name", value)}
          />

          <Field
            label="Requester Email"
            value={form.requester_email}
            onChange={(value) => setField("requester_email", value)}
          />

          <Field
            label="Phone Number"
            value={form.phone}
            onChange={(value) => setField("phone", value)}
          />

          <Field
            label="Department"
            value={form.department}
            onChange={(value) => setField("department", value)}
          />

          <SelectField
            label="Plant / Branch"
            value={form.plant}
            onChange={(value) => setField("plant", value)}
            options={PLANTS.map((plant) => ({ value: plant.value, label: plantLabel(plant.value) }))}
          />

          <SelectField
            label="Category"
            value={form.category}
            onChange={(value) => setField("category", value)}
            options={categories}
          />

          <Field
            label="Sub-Category"
            value={form.sub_category}
            onChange={(value) => setField("sub_category", value)}
          />

          <SelectField
            label="Priority"
            value={form.priority}
            onChange={(value) => setField("priority", value)}
            options={priorities}
          />

          <SelectField
            label="Status"
            value={form.status}
            onChange={(value) => setField("status", value)}
            options={statuses}
          />

          <SelectField
            label="Requested By"
            value={form.requested_by_id}
            onChange={(value) => setField("requested_by_id", value)}
            options={userOptions}
          />

          <SelectField
            label="Assigned To"
            value={form.assigned_to_id}
            onChange={(value) => setField("assigned_to_id", value)}
            options={assigneeOptions}
          />

          <Field
            label="Expected Closure Date"
            type="datetime-local"
            value={form.expected_closure_date}
            onChange={(value) =>
              setField("expected_closure_date", value)
            }
          />

          <Field
            label="Actual Closure Date"
            type="datetime-local"
            value={form.actual_closure_date}
            onChange={(value) =>
              setField("actual_closure_date", value)
            }
          />

          <Field
            label="Response Time (mins)"
            type="number"
            value={form.response_time}
            onChange={(value) => setField("response_time", value)}
          />

          <Field
            label="Resolution Time (mins)"
            type="number"
            value={form.resolution_time}
            onChange={(value) => setField("resolution_time", value)}
          />

          <Field
            label="Service"
            value={form.service}
            onChange={(value) => setField("service", value)}
          />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </span>

          <textarea
            value={form.description}
            onChange={(event) =>
              setField("description", event.target.value)
            }
            className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
            placeholder="Explain the issue, impact, and urgency..."
          />
        </label>

        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Save Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={
          onChange
            ? (event) => onChange(event.target.value)
            : undefined
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 read-only:bg-slate-50"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options = [],
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400"
      >
        <option value="">Select</option>

        {(options || []).map((option) => {
          if (typeof option === "string") {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          }

          return (
            <option
              key={option?.value ?? Math.random()}
              value={option?.value ?? ""}
            >
              {option?.label ?? ""}
            </option>
          );
        })}
      </select>
    </label>
  );
}
