import PDFKit from "pdfkit";
const PDFDocument = PDFKit.default ?? PDFKit;
import { formatDateTime } from "./helpers.js";

// ── Color palette ──────────────────────────────────────────────
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
  const fontSize = 8;
  doc.fontSize(fontSize).font("Helvetica-Bold");
  const textWidth = doc.widthOfString(text);
  const badgeW = textWidth + padding * 2;
  const badgeH = 14;
  doc.roundedRect(x, y, badgeW, badgeH, 3).fillColor(color).fill();
  doc.fillColor(WHITE).text(text, x + padding, y + 3, { lineBreak: false });
  doc.fillColor(NAVY);
  return badgeW;
}

function sectionHeader(doc, title) {
  doc.moveDown(0.8);
  // Background bar
  doc.rect(40, doc.y, 515, 22).fillColor(NAVY).fill();
  doc.fontSize(10).font("Helvetica-Bold").fillColor(WHITE)
     .text(title, 50, doc.y - 17, { lineBreak: false });
  doc.fillColor(NAVY);
  doc.moveDown(0.8);
}

export function buildTicketPdf(ticket, comments = [], events = []) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = doc.page.width;
    const margin = 40;
    const contentW = pageW - margin * 2;

    // ── TOP HEADER BANNER ────────────────────────────────────────
    doc.rect(0, 0, pageW, 70).fillColor(NAVY).fill();

    // Company name
    doc.fontSize(9).font("Helvetica").fillColor(CYAN)
       .text("VIRAJ PROFILES LIMITED", margin, 14, { lineBreak: false });

    // System name
    doc.fontSize(8).font("Helvetica").fillColor("#94a3b8")
       .text("Ticket Tracking Command Center", margin, 26, { lineBreak: false });

    // Ticket ID (right side)
    doc.fontSize(18).font("Helvetica-Bold").fillColor(WHITE)
       .text(ticket.ticket_id || "—", 0, 14, { align: "right", width: pageW - margin });

    // Generated date (right side)
    doc.fontSize(7).font("Helvetica").fillColor("#94a3b8")
       .text(`Generated: ${formatDateTime(new Date().toISOString())}`, 0, 36,
             { align: "right", width: pageW - margin });

    doc.fillColor(NAVY);
    doc.y = 85;

    // ── TICKET TITLE ─────────────────────────────────────────────
    doc.fontSize(16).font("Helvetica-Bold").fillColor(NAVY)
       .text(ticket.title || "Untitled Ticket", margin, doc.y, { width: contentW - 120 });

    // Status + Priority badges (top right of title)
    const badgeY = 85;
    const p1W = drawBadge(doc, pageW - margin - 120, badgeY,
                          ticket.priority || "—", priorityColor(ticket.priority));
    drawBadge(doc, pageW - margin - 120 + p1W + 6, badgeY,
              ticket.status || "—", statusColor(ticket.status));

    doc.moveDown(0.5);

    // ── DIVIDER ──────────────────────────────────────────────────
    doc.moveTo(margin, doc.y).lineTo(pageW - margin, doc.y)
       .strokeColor(BORDER).lineWidth(1).stroke();
    doc.moveDown(0.6);

    // ── DETAILS GRID (2 columns) ─────────────────────────────────
    const col1X = margin;
    const col2X = margin + contentW / 2;
    const colW  = contentW / 2 - 10;

    const leftDetails = [
      ["Requester",   ticket.customer_name || "—"],
      ["Email",       ticket.requester_email || "—"],
      ["Phone",       ticket.phone || "—"],
      ["Department",  ticket.department || "—"],
      ["Location",    ticket.location || "—"],
    ];

    const rightDetails = [
      ["Category",    ticket.category || "—"],
      ["Sub-Category",ticket.sub_category || "—"],
      ["Assigned To", ticket.assigned_to_name || ticket.assigned_to || "Unassigned"],
      ["Created",     formatDateTime(ticket.created_at)],
      ["Updated",     formatDateTime(ticket.updated_at)],
    ];

    const detailStartY = doc.y;

    // Draw detail rows
    leftDetails.forEach(([label, value], i) => {
      const rowY = detailStartY + i * 18;
      // Alternating row bg
      if (i % 2 === 0) {
        doc.rect(col1X, rowY - 2, colW, 16).fillColor(LIGHT).fill();
      }
      doc.fontSize(8).font("Helvetica-Bold").fillColor(SLATE)
         .text(label.toUpperCase(), col1X + 4, rowY + 1, { lineBreak: false });
      doc.fontSize(9).font("Helvetica").fillColor(NAVY)
         .text(String(value), col1X + 90, rowY + 1, { width: colW - 95, lineBreak: false });
    });

    rightDetails.forEach(([label, value], i) => {
      const rowY = detailStartY + i * 18;
      if (i % 2 === 0) {
        doc.rect(col2X, rowY - 2, colW, 16).fillColor(LIGHT).fill();
      }
      doc.fontSize(8).font("Helvetica-Bold").fillColor(SLATE)
         .text(label.toUpperCase(), col2X + 4, rowY + 1, { lineBreak: false });
      doc.fontSize(9).font("Helvetica").fillColor(NAVY)
         .text(String(value), col2X + 90, rowY + 1, { width: colW - 95, lineBreak: false });
    });

    doc.y = detailStartY + leftDetails.length * 18 + 10;

    // ── DESCRIPTION ──────────────────────────────────────────────
    sectionHeader(doc, "DESCRIPTION");
    doc.fontSize(9).font("Helvetica").fillColor(NAVY)
       .text(ticket.description || "No description provided.", margin, doc.y,
             { width: contentW, lineGap: 4 });

    // ── COMMENTS ─────────────────────────────────────────────────
    sectionHeader(doc, "COMMENTS");

    if (comments.length) {
      comments.forEach((comment, i) => {
        const boxY = doc.y;
        // Comment box background
        doc.rect(margin, boxY, contentW, 12).fillColor(i % 2 === 0 ? LIGHT : WHITE).fill();
        doc.fontSize(8).font("Helvetica-Bold").fillColor(CYAN)
           .text(comment.author_name || "Unknown", margin + 4, boxY + 2, { lineBreak: false });
        doc.fontSize(7).font("Helvetica").fillColor(SLATE)
           .text(formatDateTime(comment.created_at), 0, boxY + 3,
                 { align: "right", width: pageW - margin });
        doc.y = boxY + 14;
        doc.fontSize(9).font("Helvetica").fillColor(NAVY)
           .text(comment.body || "", margin + 4, doc.y, { width: contentW - 8, lineGap: 3 });
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(9).font("Helvetica").fillColor(SLATE)
         .text("No comments yet.", margin);
    }

    // ── ACTIVITY ─────────────────────────────────────────────────
    sectionHeader(doc, "ACTIVITY LOG");

    // Fix: handle both column name formats from MySQL
    const normalizedEvents = events.map(e => ({
      actor_name:  e.actor_name  || e.changed_by   || "System",
      action:      e.action      || "changed status",
      field:       e.field       || "",
      from_value:  e.from_value  || e.from_status  || "",
      to_value:    e.to_value    || e.to_status     || "",
      created_at:  e.created_at,
    }));

    if (normalizedEvents.length) {
      normalizedEvents.forEach((event, i) => {
        const rowY = doc.y;
        if (i % 2 === 0) {
          doc.rect(margin, rowY, contentW, 14).fillColor(LIGHT).fill();
        }
        const from  = event.from_value ? ` from "${event.from_value}"` : "";
        const to    = event.to_value   ? ` → "${event.to_value}"`      : "";
        const field = event.field      ? ` [${event.field}]`           : "";
        const line  = `${event.actor_name} ${event.action}${field}${from}${to}`;

        doc.fontSize(7).font("Helvetica").fillColor(SLATE)
           .text(formatDateTime(event.created_at), margin + 4, rowY + 3, { lineBreak: false });
        doc.fontSize(8).font("Helvetica").fillColor(NAVY)
           .text(line, margin + 110, rowY + 3, { width: contentW - 114, lineBreak: false });
        doc.y = rowY + 16;
      });
    } else {
      doc.fontSize(9).font("Helvetica").fillColor(SLATE)
         .text("No activity recorded.", margin);
    }

    // ── FOOTER ───────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - 30;
      doc.moveTo(margin, footerY).lineTo(pageW - margin, footerY)
         .strokeColor(BORDER).lineWidth(0.5).stroke();
      doc.fontSize(7).font("Helvetica").fillColor(SLATE)
         .text("Viraj Profiles Limited — Ticket Tracking Command Center",
               margin, footerY + 6, { lineBreak: false });
      doc.text(`Page ${i + 1} of ${range.count}`, 0, footerY + 6,
               { align: "right", width: pageW - margin });
    }

    doc.end();
  });
}

export function sanitizePdfField(value) {
  return String(value || "");
}