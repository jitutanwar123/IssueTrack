import pkg from "pdfkit";
const { default: PDFDocument } = pkg;
import { formatDateTime } from "./helpers.js";

export function buildTicketPdf(ticket, comments = [], events = []) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ── Header ──
    doc.fontSize(18).font("Helvetica-Bold")
      .text(`Ticket: ${ticket.ticket_id}`, { underline: true });
    doc.fontSize(14).font("Helvetica-Bold")
      .text(ticket.title || "Untitled");
    doc.moveDown(0.5);

    // ── Details ──
    doc.fontSize(10).font("Helvetica");
    const details = [
      ["Status",      ticket.status],
      ["Priority",    ticket.priority],
      ["Category",    ticket.category],
      ["Requester",   ticket.customer_name],
      ["Email",       ticket.requester_email || "—"],
      ["Assigned To", ticket.assigned_to_name || "Unassigned"],
      ["Department",  ticket.department || "—"],
      ["Created",     formatDateTime(ticket.created_at)],
      ["Updated",     formatDateTime(ticket.updated_at)],
    ];

    details.forEach(([label, value]) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true })
         .font("Helvetica").text(value || "—");
    });

    doc.moveDown();

    // ── Description ──
    doc.fontSize(12).font("Helvetica-Bold").text("Description");
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica")
      .text(ticket.description || "No description provided.", { lineGap: 3 });
    doc.moveDown();

    // ── Comments ──
    doc.fontSize(12).font("Helvetica-Bold").text("Comments");
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    if (comments.length) {
      comments.forEach((comment) => {
        doc.font("Helvetica-Bold")
           .text(`${comment.author_name} — ${formatDateTime(comment.created_at)}`, { continued: false });
        doc.font("Helvetica")
           .text(comment.body || "", { lineGap: 3 });
        doc.moveDown(0.5);
      });
    } else {
      doc.text("No comments yet.");
    }

    doc.moveDown();

    // ── Activity ──
    doc.fontSize(12).font("Helvetica-Bold").text("Activity");
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font("Helvetica");

    if (events.length) {
      events.forEach((event) => {
        const from = event.from_value ? ` from "${event.from_value}"` : "";
        const to   = event.to_value   ? ` to "${event.to_value}"`     : "";
        const field = event.field ? ` [${event.field}]` : "";
        doc.text(
          `${formatDateTime(event.created_at)} — ${event.actor_name} ${event.action}${field}${from}${to}`,
          { lineGap: 2 }
        );
      });
    } else {
      doc.text("No activity recorded.");
    }

    doc.end();
  });
}

export function sanitizePdfField(value) {
  return String(value || "");
}