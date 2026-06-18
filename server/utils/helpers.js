import { randomInt } from "node:crypto";

const TZ = "Asia/Kolkata";

export function formatDateTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.day}-${byType.month}-${byType.year} ${byType.hour}:${byType.minute}`;
}

export function toIsoDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function toInputDateTime(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ageInDays(createdAt, now = new Date()) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const diff = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function ageingBucket(days) {
  if (days <= 1) return "0-1 Day";
  if (days <= 3) return "2-3 Days";
  if (days <= 5) return "4-5 Days";
  if (days <= 10) return "6-10 Days";
  if (days <= 20) return "11-20 Days";
  return "21+ Days";
}

export function createTicketId(existingIds = new Set()) {
  for (let i = 0; i < 1000; i += 1) {
    const candidate = `SRN${randomInt(100000, 1000000)}`;
    if (!existingIds.has(candidate)) return candidate;
  }
  return `SRN${Date.now().toString().slice(-6)}`;
}

export function safeJsonParse(text, fallback) {
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function clampNumber(value, min, max) {
  const number = Number(value);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}
