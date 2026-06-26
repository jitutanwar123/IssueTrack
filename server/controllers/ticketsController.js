import { buildTicketPdf } from "../utils/pdf.js";
import { createTicketId } from "../utils/helpers.js";
import { getDb } from "../utils/db.js";
import { listTickets, createTicket, getTicketById, updateTicket, deleteTicket, getTicketTimeline, getTicketEvents } from "../models/Ticket.js";
import { listComments } from "../models/Comment.js";

const db = getDb();

export function ticketsListHandler(ctx) {
  return async (req, res) => {
    const filters = Object.fromEntries(req.url.searchParams.entries());
    ctx.sendJson(res, 200, listTickets(filters));
  };
}

export function ticketCreateHandler(ctx) {
  return async (req, res) => {
    try {
      const ticket = createTicket(req.body || {}, req.user);
      ctx.sendJson(res, 201, { data: ticket });
    } catch (error) {
      ctx.sendJson(res, 400, { message: error.message });
    }
  };
}

export function ticketDetailHandler(ctx) {
  return async (req, res, params) => {
    const ticket = getTicketById(params.id);
    if (!ticket) {
      ctx.sendJson(res, 404, { message: "Ticket not found" });
      return;
    }
    ctx.sendJson(res, 200, {
      data: ticket,
      comments: listComments(ticket.ticket_id),
      timeline: getTicketTimeline(ticket.ticket_id),
      audit: {
        created_by: ticket.created_by,
        created_at: ticket.created_at,
        last_modified_by: ticket.last_modified_by,
        updated_at: ticket.updated_at,
        assigned_to: ticket.assigned_to_name,
      },
    });
  };
}

export function ticketUpdateHandler(ctx) {
  return async (req, res, params) => {
    const ticket = updateTicket(params.id, req.body || {}, req.user);
    if (!ticket) {
      ctx.sendJson(res, 404, { message: "Ticket not found" });
      return;
    }
    ctx.sendJson(res, 200, { data: ticket });
  };
}

export function ticketDeleteHandler(ctx) {
  return async (req, res, params) => {
    const removed = deleteTicket(params.id);
    if (!removed) {
      ctx.sendJson(res, 404, { message: "Ticket not found" });
      return;
    }
    ctx.sendJson(res, 200, { success: true });
  };
}

export function ticketPdfHandler(ctx) {
  return async (req, res, params) => {
    const ticket = getTicketById(params.id);
    if (!ticket) {
      ctx.sendJson(res, 404, { message: "Ticket not found" });
      return;
    }
    const comments = listComments(ticket.ticket_id);
    const timeline = getTicketTimeline(ticket.ticket_id);
    const pdf = await buildTicketPdf(ticket, comments, timeline);
    ctx.binary(res, 200, pdf, "application/pdf", {
      "Content-Disposition": `attachment; filename="${ticket.ticket_id}.pdf"`,
    });
  };
}

export function ticketNextIdHandler(ctx) {
  return async (req, res) => {
    const existing = new Set(db.prepare("SELECT ticket_id FROM tickets").all().map((row) => row.ticket_id));
    const ticketId = createTicketId(existing);
    ctx.sendJson(res, 200, { ticket_id: ticketId });
  };
}
