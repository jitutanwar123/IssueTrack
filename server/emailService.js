import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ─── Gmail SMTP transporter ──────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || `Viraj IT Support <${process.env.GMAIL_USER}>`;

// ─── Startup diagnostic ──────────────────────────────────────────
console.log("📧 Email config check:");
console.log("  GMAIL_USER         :", process.env.GMAIL_USER         ? `✅ ${process.env.GMAIL_USER}`  : "❌ NOT SET");
console.log("  GMAIL_APP_PASSWORD :", process.env.GMAIL_APP_PASSWORD ? "✅ set"                        : "❌ NOT SET");
console.log("  EMAIL_FROM         :", process.env.EMAIL_FROM         ? `✅ ${process.env.EMAIL_FROM}`  : "⚠️  using default");
console.log("  ADMIN_EMAIL        :", process.env.ADMIN_EMAIL        ? `✅ ${process.env.ADMIN_EMAIL}` : "❌ NOT SET — admin emails will be skipped!");

// Test Gmail SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail SMTP connection FAILED:", error.message);
    console.error("   Fix: Check EMAIL_USER and EMAIL_PASS in Railway Variables");
  } else {
    console.log("✅ Gmail SMTP connection SUCCESS — emails will work!");
  }
});

// ─── Priority color map ──────────────────────────────────────────
const priorityColors = {
  P1: { bg: "#dc2626", label: "P1 — Critical" },
  P2: { bg: "#ea580c", label: "P2 — High" },
  P3: { bg: "#ca8a04", label: "P3 — Medium" },
  P4: { bg: "#16a34a", label: "P4 — Low" },
};

const statusColors = {
  Open: "#3b82f6",
  "In Progress": "#f97316",
  Pending: "#eab308",
  Resolved: "#22c55e",
  Closed: "#64748b",
};

// ─── Base HTML template ──────────────────────────────────────────
function baseTemplate(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; font-family: 'Segoe UI', Arial, sans-serif; background:#f1f5f9; }
    .wrapper { max-width:620px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.10); }
    .header { background:#1a1f2e; padding:28px 32px; }
    .header h1 { margin:0; color:#fff; font-size:20px; font-weight:700; letter-spacing:0.02em; }
    .header p  { margin:4px 0 0; color:#94a3b8; font-size:13px; }
    .accent-bar { height:4px; background:linear-gradient(90deg,#f97316,#fbbf24); }
    .body  { padding:28px 32px; }
    .badge { display:inline-block; padding:4px 14px; border-radius:999px; font-size:12px; font-weight:700; color:#fff; letter-spacing:0.04em; }
    .info-table { width:100%; border-collapse:collapse; margin:20px 0; font-size:14px; }
    .info-table td { padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#374151; }
    .info-table td:first-child { font-weight:600; color:#0f172a; white-space:nowrap; width:40%; }
    .info-table tr:last-child td { border-bottom:none; }
    .section-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; margin:24px 0 8px; }
    .comment-box { background:#f8fafc; border-left:4px solid #f97316; border-radius:8px; padding:14px 18px; margin:16px 0; font-size:14px; color:#374151; white-space:pre-wrap; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:18px 32px; text-align:center; font-size:12px; color:#94a3b8; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Viraj Profiles Limited</h1>
    <p>Ticket Tracking Command Center</p>
  </div>
  <div class="accent-bar"></div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} Viraj Profiles Limited &nbsp;&bull;&nbsp;
    This is an automated notification. Please do not reply directly to this email.
  </div>
</div>
</body>
</html>`;
}

// ─── Ticket details table ────────────────────────────────────────
function ticketTable(t) {
  const pc = priorityColors[t.priority] || { bg: "#64748b", label: t.priority };
  const sc = statusColors[t.status] || "#64748b";
  const rows = [
    ["Ticket ID", t.ticket_id || t.id],
    ["Title / Subject", t.title],
    ["Priority", `<span class="badge" style="background:${pc.bg}">${pc.label}</span>`],
    ["Status", `<span class="badge" style="background:${sc}">${t.status}</span>`],
    ["Category", t.category],
    ["Sub-Category", t.sub_category],
    ["Customer Name", t.customer_name],
    ["Email", t.requester_email],
    ["Phone", t.phone],
    ["Department", t.department],
    ["Location", t.location],
    ["Assigned To", t.assigned_to || "Unassigned"],
    ["Created At", t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "—"],
  ]
    .filter(([, val]) => val)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join("");
  return `<table class="info-table"><tbody>${rows}</tbody></table>`;
}

// ─── Helper: send email via Gmail SMTP ──────────────────────────
async function sendEmail({ to, subject, html, attachments }) {
  const mailOptions = {
    from: FROM,
    to,
    subject,
    html,
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
  };
  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to} — MessageId: ${info.messageId}`);
  return info;
}

// ─── 1. New ticket → Admin ───────────────────────────────────────
export async function sendNewTicketToAdmin(ticket) {
  if (!process.env.ADMIN_EMAIL) return;
  const pc = priorityColors[ticket.priority] || { label: ticket.priority };
  const html = baseTemplate(
    "New Ticket Received",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">📋 New Support Ticket Raised</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">A user has submitted a new ticket and is awaiting your attention.</p>
     ${ticketTable(ticket)}
     <p class="section-title">Description</p>
     <div class="comment-box">${ticket.description || "—"}</div>`
  );
  const attachments = ticket.attachment_data && ticket.attachment_name ? [{
    filename: ticket.attachment_name,
    content: ticket.attachment_data,
  }] : undefined;
  await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `[NEW TICKET] ${ticket.ticket_id || ticket.id} — ${ticket.title} | Priority: ${pc.label}`, html, attachments });
}

// ─── 2. Ticket confirmation → User ──────────────────────────────
export async function sendTicketConfirmationToUser(ticket) {
  if (!ticket.requester_email) return;
  const slaMap = { P1: "4 hours", P2: "8 hours", P3: "24 hours", P4: "72 hours" };
  const sla = slaMap[ticket.priority] || "48 hours";
  const html = baseTemplate(
    "Ticket Raised Successfully",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">✅ Your ticket has been received!</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">Thank you, <strong>${ticket.customer_name}</strong>. We have received your support request and our team will contact you shortly.</p>
     ${ticketTable(ticket)}
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:16px 0;font-size:14px;color:#166534;">
       <strong>Expected SLA:</strong> ${sla} response time for ${ticket.priority} priority tickets.
     </div>`
  );
  await sendEmail({ to: ticket.requester_email, subject: `[TICKET RAISED] ${ticket.ticket_id || ticket.id} — Your ticket has been received`, html });
}

// ─── 3. Status update → User ─────────────────────────────────────
export async function sendStatusUpdateToUser(ticket, newStatus, adminNote) {
  if (!ticket.requester_email) return;
  const sc = statusColors[newStatus] || "#64748b";
  const html = baseTemplate(
    "Ticket Status Updated",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">🔄 Your ticket status has been updated</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">Ticket <strong>${ticket.ticket_id || ticket.id}</strong> has been moved to:</p>
     <div style="text-align:center;margin:20px 0;">
       <span class="badge" style="background:${sc};font-size:16px;padding:8px 24px;">${newStatus}</span>
     </div>
     ${ticketTable({ ...ticket, status: newStatus })}
     ${adminNote ? `<p class="section-title">Admin Note</p><div class="comment-box">${adminNote}</div>` : ""}`
  );
  await sendEmail({ to: ticket.requester_email, subject: `[TICKET UPDATE] ${ticket.ticket_id || ticket.id} — Status changed to ${newStatus}`, html });
}

// ─── 4. Admin comment → User ─────────────────────────────────────
export async function sendAdminCommentToUser(ticket, comment) {
  if (!ticket.requester_email) return;
  const html = baseTemplate(
    "Admin has responded to your ticket",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">💬 The support team has responded</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">A reply has been added to ticket <strong>${ticket.ticket_id || ticket.id}</strong>.</p>
     <p class="section-title">Admin Reply</p>
     <div class="comment-box">${comment}</div>
     ${ticketTable(ticket)}`
  );
  await sendEmail({ to: ticket.requester_email, subject: `[REPLY] ${ticket.ticket_id || ticket.id} — Admin has responded`, html });
}

// ─── 5. User comment → Admin ─────────────────────────────────────
export async function sendUserCommentToAdmin(ticket, comment, userName) {
  if (!process.env.ADMIN_EMAIL) return;
  const html = baseTemplate(
    "User has replied to a ticket",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">💬 User Follow-up on Ticket</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px"><strong>${userName}</strong> has added a follow-up reply to ticket <strong>${ticket.ticket_id || ticket.id}</strong>.</p>
     <p class="section-title">User's Message</p>
     <div class="comment-box">${comment}</div>
     ${ticketTable(ticket)}`
  );
  await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `[USER REPLY] ${ticket.ticket_id || ticket.id} — ${userName} has responded`, html });
}

// ─── 6. Ticket assigned → Assignee ──────────────────────────────
export async function sendTicketAssignedToAssignee(ticket, assigneeEmail) {
  if (!assigneeEmail) return;
  const pc = priorityColors[ticket.priority] || { bg: "#64748b", label: ticket.priority };
  const html = baseTemplate(
    "A Ticket Has Been Assigned to You",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">📌 A new ticket has been assigned to you</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">A support ticket has been assigned to you. Please log in to your staff portal to view and resolve it.</p>
     ${ticketTable(ticket)}`
  );
  await sendEmail({ to: assigneeEmail, subject: `[TICKET ASSIGNED] ${ticket.ticket_id || ticket.id} — ${ticket.title} | Priority: ${pc.label}`, html });
}

// ─── 7. Admin-created ticket → Admin ────────────────────────────
export async function sendAdminCreatedTicketToAdmin(ticket) {
  if (!process.env.ADMIN_EMAIL) return;
  const pc = priorityColors[ticket.priority] || { label: ticket.priority };
  const html = baseTemplate(
    "Ticket Created by Admin",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">📋 New Ticket Created</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">A new support ticket has been created by the admin.</p>
     ${ticketTable(ticket)}
     <p class="section-title">Description</p>
     <div class="comment-box">${ticket.description || "—"}</div>`
  );
  await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `[TICKET CREATED] ${ticket.ticket_id || ticket.id} — ${ticket.title} | Priority: ${pc.label}`, html });
}

// ─── 8. Ticket resolved → User ───────────────────────────────────
export async function sendResolutionToUser(ticket, resolvedBy, resolutionNote) {
  if (!ticket.requester_email) return;
  const resolvedAt = ticket.resolved_at
    ? new Date(ticket.resolved_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = baseTemplate(
    "Your Ticket Has Been Resolved",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">✅ Your ticket has been resolved!</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">Dear <strong>${ticket.customer_name || "User"}</strong>, ticket <strong>${ticket.ticket_id || ticket.id}</strong> has been resolved.</p>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin:16px 0;">
       <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#15803d;">Resolution Details</p>
       <p><strong>Resolved By:</strong> ${resolvedBy}</p>
       <p><strong>Resolved At:</strong> ${resolvedAt}</p>
       <p><strong>Note:</strong> ${resolutionNote}</p>
     </div>
     ${ticketTable({ ...ticket, status: "Resolved" })}`
  );
  await sendEmail({ to: ticket.requester_email, subject: `[RESOLVED] ${ticket.ticket_id || ticket.id} — Your ticket has been resolved`, html });
}

// ─── 9. Sub-branch resolved ticket → Admin ───────────────────────
export async function sendSubBranchResolutionToAdmin(ticket, resolvedBy, resolutionNote) {
  if (!process.env.ADMIN_EMAIL) return;
  const resolvedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = baseTemplate(
    "Sub-Branch Ticket Resolved",
    `<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">✅ A sub-branch member has resolved a ticket</p>
     <p style="color:#64748b;font-size:14px;margin:0 0 16px">IT Staff member <strong>${resolvedBy}</strong> has resolved the following ticket.</p>
     <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin:16px 0;">
       <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#15803d;">Resolution Details</p>
       <p><strong>Resolved By:</strong> ${resolvedBy}</p>
       <p><strong>Resolved At:</strong> ${resolvedAt}</p>
       <p><strong>Resolution Note:</strong> ${resolutionNote}</p>
     </div>
     ${ticketTable({ ...ticket, status: "Resolved" })}`
  );
  await sendEmail({ to: process.env.ADMIN_EMAIL, subject: `[SUB-BRANCH RESOLVED] ${ticket.ticket_id || ticket.id} — Resolved by ${resolvedBy}`, html });
}