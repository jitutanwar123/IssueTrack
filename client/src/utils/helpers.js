const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

function formatMysqlDateTime(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  if (!hour || !minute) return `${day}/${month}/${year}`;
  return `${day}/${month}/${year}, ${hour}:${minute}`;
}

export function formatDateTime(value) {
  if (!value) return "-";
  // Always parse through Date so Intl.DateTimeFormat can apply the Asia/Kolkata timezone.
  // The old MySQL fast-path was returning UTC times directly without conversion.
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return dateFormatter.format(date);
}

export function toInputDateTime(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (match) {
      const [, year, month, day, hour = "00", minute = "00"] = match;
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function fromInputDateTime(value) {
  if (!value) return "";
  return new Date(value).toISOString();
}

export function formatMinutes(minutes) {
  const total = Number(minutes || 0);
  if (!total) return "-";
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  return `${hours}h ${remaining}m`;
}

export function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export function downloadCsv(filename, rows) {
  // UTF-8 BOM ensures Excel opens the file with correct encoding
  const BOM = "\uFEFF";
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell === null || cell === undefined ? "" : String(cell);
          // Escape double-quotes and wrap in quotes
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(",")
    )
    .join("\r\n"); // Windows line endings for Excel compatibility

  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function getStatusTone(status = "") {
  const lower = status.toLowerCase();
  if (lower.includes("open")) return "blue";
  if (lower.includes("progress")) return "orange";
  if (lower.includes("hold")) return "yellow";
  if (lower.includes("closed")) return "slate";
  if (lower.includes("resolved")) return "green";
  if (lower.includes("reject") || lower.includes("cancel")) return "red";
  return "slate";
}

export function getStatusLabel(status = "") {
  const lower = String(status || "").toLowerCase();
  if (lower.includes("cancel")) return "Reject";
  return status || "—";
}

export function getPriorityTone(priority = "") {
  const map = {
    P1: "red",
    P2: "orange",
    P3: "yellow",
    P4: "green",
  };
  return map[priority] || "slate";
}
