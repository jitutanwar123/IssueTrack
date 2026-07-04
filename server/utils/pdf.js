import PDFKit from "pdfkit";
const PDFDocument = PDFKit.default ?? PDFKit;
import { formatDateTime } from "./helpers.js";
import { plantLabel } from "./plants.js";

const NAVY   = "#0f172a";
const CYAN   = "#0891b2";
const SLATE  = "#64748b";
const LIGHT  = "#f1f5f9";
const WHITE  = "#ffffff";
const BORDER = "#e2e8f0";

function priorityColor(priority) {
  switch ((priority || "").toUpperCase()) {
    case "P1": return "#dc2626";
    case "P2": return "#ea580c";
    case "P3": return "#ca8a04";
    case "P4": return "#16a34a";
    default:   return SLATE;
  }
}

function statusColor(status) {
  switch ((status || "").toLowerCase()) {
    case "open":             return "#2563eb";
    case "assigned":         return "#7c3aed";
    case "work in progress": return "#ca8a04";
    case "resolved":         return "#16a34a";
    case "closed":           return SLATE;
    case "pending":          return "#ea580c";
    default:                 return SLATE;
  }
}

function drawBadge(doc, x, y, text, color) {
  const padding = 6;
  doc.fontSize(8).font("Helvetica-Bold");
  const textWidth = doc.widthOfString(text);
  const badgeW = textWidth + padding * 2;
  const badgeH = 14;
  doc.roundedRect(x, y, badgeW, badgeH, 3).fillColor(color).fill();
  doc.fillColor(WHITE).text(text, x + padding, y + 3, { lineBreak: false });
  doc.fillColor(NAVY);
  return badgeW;
}

function sectionHeader(doc, title, margin, contentW) {
  const y = doc.y + 10;
  doc.rect(margin, y, contentW, 22).fillColor(NAVY).fill();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE)
     .text(title, margin + 10, y + 7, { lineBreak: false });
  doc.fillColor(NAVY);
  doc.y = y + 30;
}

export function buildTicketPdf(ticket, comments = [], events = []) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW  = doc.page.width;
    const margin = 40;
    const contentW = pageW - margin * 2;

    // ── HEADER BANNER ────────────────────────────────────────────
    doc.rect(0, 0, pageW, 65).fillColor(NAVY).fill();

    doc.fontSize(9).font("Helvetica-Bold").fillColor(CYAN)
       .text("VIRAJ PROFILES LIMITED", margin, 12, { lineBreak: false });
    doc.fontSize(7).font("Helvetica").fillColor("#94a3b8")
       .text("Ticket Tracking Command Center", margin, 24, { lineBreak: false });

    doc.fontSize(20).font("Helvetica-Bold").fillColor(WHITE)
       .text(ticket.ticket_id || "—", margin, 10,
             { align: "right", width: contentW, lineBreak: false });
    doc.fontSize(7).font("Helvetica").fillColor("#94a3b8")
       .text(`Generated: ${formatDateTime(new Date().toISOString())}`, margin, 34,
             { align: "right", width: contentW, lineBreak: false });

    // ── TITLE + BADGES ───────────────────────────────────────────
    doc.y = 80;
    doc.fontSize(15).font("Helvetica-Bold").fillColor(NAVY)
       .text(ticket.title || "Untitled Ticket", margin, doc.y,
             { width: contentW - 130, lineBreak: false });

    // Badges — fixed position top-right
    const badgeY = 82;
    const p1W = drawBadge(doc, pageW - margin - 120, badgeY,
                          ticket.priority || "—", priorityColor(ticket.priority));
    drawBadge(doc, pageW - margin - 120 + p1W + 6, badgeY,
              ticket.status || "—", statusColor(ticket.status));

    doc.y = 102;

    // ── DIVIDER ──────────────────────────────────────────────────
    doc.moveTo(margin, doc.y).lineTo(pageW - margin, doc.y)
       .strokeColor(BORDER).lineWidth(1).stroke();

    doc.y = doc.y + 10;

    // ── DETAILS GRID ─────────────────────────────────────────────
    const col1X = margin;
    const col2X = margin + contentW / 2 + 5;
    const colW  = contentW / 2 - 8;

    const leftDetails = [
      ["Requester",  ticket.customer_name  || "—"],
      ["Email",      ticket.requester_email || "—"],
      ["Phone",      ticket.phone           || "—"],
      ["Department", ticket.department      || "—"],
      ["Plant",      plantLabel(ticket.plant) || "—"],
      ["Location",   ticket.location        || "—"],
    ];

    const rightDetails = [
      ["Category",     ticket.category      || "—"],
      ["Sub-Category", ticket.sub_category  || "—"],
      ["Assigned To",  ticket.assigned_to_name || ticket.assigned_to || "Unassigned"],
      ["Created",      formatDateTime(ticket.created_at)],
      ["Updated",      formatDateTime(ticket.updated_at)],
    ];

    const gridStartY = doc.y;
    const rowH = 18;

    leftDetails.forEach(([label, value], i) => {
      const rowY = gridStartY + i * rowH;
      if (i % 2 === 0) doc.rect(col1X, rowY, colW, rowH).fillColor(LIGHT).fill();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(SLATE)
         .text(label.toUpperCase(), col1X + 5, rowY + 5, { lineBreak: false });
      doc.fontSize(8).font("Helvetica").fillColor(NAVY)
         .text(String(value), col1X + 85, rowY + 5,
               { width: colW - 90, lineBreak: false });
    });

    rightDetails.forEach(([label, value], i) => {
      const rowY = gridStartY + i * rowH;
      if (i % 2 === 0) doc.rect(col2X, rowY, colW, rowH).fillColor(LIGHT).fill();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(SLATE)
         .text(label.toUpperCase(), col2X + 5, rowY + 5, { lineBreak: false });
      doc.fontSize(8).font("Helvetica").fillColor(NAVY)
         .text(String(value), col2X + 85, rowY + 5,
               { width: colW - 90, lineBreak: false });
    });

    // Move below grid
    doc.y = gridStartY + leftDetails.length * rowH + 5;

    // ── DESCRIPTION ──────────────────────────────────────────────
    sectionHeader(doc, "DESCRIPTION", margin, contentW);

    doc.fontSize(9).font("Helvetica").fillColor(NAVY)
       .text(ticket.description || "No description provided.",
             margin, doc.y, { width: contentW, lineGap: 4 });

    // ── COMMENTS ─────────────────────────────────────────────────
    sectionHeader(doc, "COMMENTS", margin, contentW);

    if (comments.length) {
      comments.forEach((comment, i) => {
        const boxY = doc.y;
        const approxH = 28;
        if (i % 2 === 0) doc.rect(margin, boxY, contentW, approxH).fillColor(LIGHT).fill();

        doc.fontSize(8).font("Helvetica-Bold").fillColor(CYAN)
           .text(comment.author_name || "Unknown", margin + 5, boxY + 4,
                 { lineBreak: false });
        doc.fontSize(7).font("Helvetica").fillColor(SLATE)
           .text(formatDateTime(comment.created_at), margin + 5, boxY + 15,
                 { lineBreak: false });
        doc.fontSize(8).font("Helvetica").fillColor(NAVY)
           .text(comment.body || "", margin + 140, boxY + 4,
                 { width: contentW - 145, lineGap: 3 });

        doc.y = boxY + approxH + 4;
      });
    } else {
      doc.fontSize(9).font("Helvetica").fillColor(SLATE)
         .text("No comments yet.", margin, doc.y);
      doc.y = doc.y + 14;
    }

    // ── ACTIVITY ─────────────────────────────────────────────────
    sectionHeader(doc, "ACTIVITY LOG", margin, contentW);

    const normalizedEvents = events.map(e => ({
      actor_name: e.actor_name  || e.changed_by  || "System",
      action:     e.action      || "changed status",
      field:      e.field       || "",
      from_value: e.from_value  || e.from_status || "",
      to_value:   e.to_value    || e.to_status   || "",
      created_at: e.created_at,
    }));

    if (normalizedEvents.length) {
      normalizedEvents.forEach((event, i) => {
        const rowY = doc.y;
        const rowH = 16;
        if (i % 2 === 0) doc.rect(margin, rowY, contentW, rowH).fillColor(LIGHT).fill();

        const from  = event.from_value ? ` from "${event.from_value}"` : "";
        const to    = event.to_value   ? ` to "${event.to_value}"`      : "";
        const field = event.field      ? ` [${event.field}]`           : "";
        const line  = `${event.actor_name} ${event.action}${field}${from}${to}`;

        doc.fontSize(7).font("Helvetica").fillColor(SLATE)
           .text(formatDateTime(event.created_at), margin + 5, rowY + 4,
                 { lineBreak: false, width: 100 });
        doc.fontSize(8).font("Helvetica").fillColor(NAVY)
           .text(line, margin + 115, rowY + 4,
                 { width: contentW - 120, lineBreak: false });
        doc.y = rowY + rowH + 2;
      });
    } else {
      doc.fontSize(9).font("Helvetica").fillColor(SLATE)
         .text("No activity recorded.", margin, doc.y);
    }

    // ── FOOTER ───────────────────────────────────────────────────
    doc.flushPages();
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 28;
      doc.rect(0, footerY - 5, pageW, 33).fillColor(NAVY).fill();
      doc.fontSize(7).font("Helvetica").fillColor("#94a3b8")
         .text("Viraj Profiles Limited — Ticket Tracking Command Center",
               margin, footerY + 3, { lineBreak: false });
      doc.fillColor("#94a3b8")
         .text(`Page ${i + 1} of ${range.count}`, margin, footerY + 3,
               { align: "right", width: contentW });
    }

    doc.end();
  });
}

export function sanitizePdfField(value) {
  return String(value || "");
}
