import {
  ticketCreateHandler,
  ticketDeleteHandler,
  ticketDetailHandler,
  ticketNextIdHandler,
  ticketPdfHandler,
  ticketUpdateHandler,
  ticketsListHandler,
} from "../controllers/ticketsController.js";
import { commentsCreateHandler, commentsListHandler } from "../controllers/commentsController.js";
import { requireAuth } from "../utils/auth.js";

export function registerTicketRoutes(router, ctx) {
  router.get("/api/tickets", requireAuth(ctx, ticketsListHandler(ctx)));
  router.post("/api/tickets", requireAuth(ctx, ticketCreateHandler(ctx)));
  router.get("/api/tickets/next-id", requireAuth(ctx, ticketNextIdHandler(ctx)));
  router.get("/api/tickets/:id", requireAuth(ctx, ticketDetailHandler(ctx)));
  router.put("/api/tickets/:id", requireAuth(ctx, ticketUpdateHandler(ctx)));
  router.delete("/api/tickets/:id", requireAuth(ctx, ticketDeleteHandler(ctx)));
  router.get("/api/tickets/:id/comments", requireAuth(ctx, commentsListHandler(ctx)));
  router.post("/api/tickets/:id/comments", requireAuth(ctx, commentsCreateHandler(ctx)));
  router.get("/api/tickets/:id/pdf", requireAuth(ctx, ticketPdfHandler(ctx)));
}
