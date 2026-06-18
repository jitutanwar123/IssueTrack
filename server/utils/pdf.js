import { escapeHtml, formatDateTime } from "./helpers.js";

function escapePdfText(value = "") {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

export function buildTicketPdf(ticket, comments = [], events = []) {
  const lines = [
    `Ticket ${ticket.ticket_id} - ${ticket.title}`,
    `Status: ${ticket.status} | Priority: ${ticket.priority} | Category: ${ticket.category}`,
    `Requester: ${ticket.customer_name} | ${ticket.requester_email || ""}`,
    `Assigned To: ${ticket.assigned_to_name || "Unassigned"}`,
    `Created: ${formatDateTime(ticket.created_at)} | Updated: ${formatDateTime(ticket.updated_at)}`,
    "",
    "Description:",
    ticket.description || "No description provided.",
    "",
    "Comments:",
    ...(comments.length ? comments.map((comment) => `${formatDateTime(comment.created_at)} - ${comment.author_name}: ${comment.body}`) : ["No comments yet."]),
    "",
    "Activity:",
    ...(events.length
      ? events.map((event) => `${formatDateTime(event.created_at)} - ${event.actor_name} ${event.action} ${event.field || ""} ${event.from_value ? `from ${event.from_value}` : ""} ${event.to_value ? `to ${event.to_value}` : ""}`.trim())
      : ["No activity recorded."]),
  ];

  const width = 595;
  const height = 842;
  const margin = 40;
  const fontSize = 11;
  const lineHeight = 15;
  const textLines = lines.flatMap((line) => (line ? line.split("\n") : [""]));

  const contentLines = [
    "BT",
    "/F1 11 Tf",
    `${margin} ${height - margin} Td`,
    ...textLines.map((line, index) => {
      if (index === 0) return `(${escapePdfText(line)}) Tj`;
      return `0 -${lineHeight} Td (${escapePdfText(line)}) Tj`;
    }),
    "ET",
  ];

  const content = contentLines.join("\n");
  const objects = [];

  objects.push(`1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj`);
  objects.push(`2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj`);
  objects.push(`3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj`);
  objects.push(`4 0 obj<< /Length ${content.length} >>stream\n${content}\nendstream endobj`);
  objects.push(`5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj`);

  const header = "%PDF-1.4\n";
  let offset = header.length;
  const xrefEntries = ["0000000000 65535 f "];
  const body = objects
    .map((obj) => {
      xrefEntries.push(String(offset).padStart(10, "0") + " 00000 n ");
      offset += Buffer.byteLength(obj + "\n", "utf8");
      return `${obj}\n`;
    })
    .join("");
  const xrefStart = offset;
  const xref = `xref\n0 ${xrefEntries.length}\n${xrefEntries.join("\n")}\ntrailer<< /Size ${xrefEntries.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(header + body + xref, "utf8");
}

export function sanitizePdfField(value) {
  return escapeHtml(value || "");
}
