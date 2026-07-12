import { getStatusLabel } from "./helpers.js";

function normalizeType(entry = {}) {
  const raw = String(entry.event_type || entry.type || "").toLowerCase();
  if (raw) return raw;
  if (entry.field_name === "assigned_to") return "assignment";
  if (entry.field_name === "status" || entry.from_status || entry.to_status) return "status";
  if (entry.note && !entry.to_status && !entry.to_value) return "note";
  return "update";
}

function prettyStatus(value) {
  if (!value) return "—";
  return getStatusLabel(value);
}

export function formatTicketActivity(entry = {}) {
  const type = normalizeType(entry);
  const actor = entry.actor_name || entry.changed_by || "System";
  const fromValue = entry.from_value ?? entry.from_status ?? null;
  const toValue = entry.to_value ?? entry.to_status ?? null;

  let title = "Ticket update";
  let subtitle = "";

  if (type === "created") {
    title = "Ticket created";
    subtitle = `Created with ${prettyStatus(toValue || "Open")} status`;
  } else if (type === "resolution") {
    title = "Ticket resolved";
    subtitle = `${fromValue ? `From ${prettyStatus(fromValue)} ` : ""}to ${prettyStatus(toValue || "Resolved")}`;
  } else if (type === "assignment") {
    title = "Assignment updated";
    subtitle = `${fromValue ? `From ${fromValue} ` : ""}to ${toValue || "Unassigned"}`;
  } else if (type === "closure") {
    title = "Ticket closed";
    subtitle = `${fromValue ? `From ${prettyStatus(fromValue)} ` : ""}to ${prettyStatus(toValue || "Closed")}`;
  } else if (type === "status") {
    title = "Status changed";
    subtitle = `${fromValue ? `${prettyStatus(fromValue)} → ` : ""}${prettyStatus(toValue)}`;
  } else if (entry.field_name) {
    title = `${entry.field_name.replace(/_/g, " ")} updated`;
    subtitle = `${fromValue ?? "—"} → ${toValue ?? "—"}`;
  }

  return {
    ...entry,
    type,
    actor_name: actor,
    from_value: fromValue,
    to_value: toValue,
    title,
    subtitle,
    note: entry.note || "",
  };
}

export function formatTicketActivitySummary(entry = {}) {
  const item = formatTicketActivity(entry);
  const parts = [];
  if (item.subtitle) parts.push(item.subtitle);
  if (item.note) parts.push(item.note);
  return parts.join(" · ");
}
