import { ageingHandler, reportsHandler, summaryHandler } from "../controllers/reportsController.js";
import { requireAuth } from "../utils/auth.js";

export function registerReportRoutes(router, ctx) {
  router.get("/api/reports/summary", requireAuth(ctx, summaryHandler(ctx)));
  router.get("/api/reports/ageing", requireAuth(ctx, ageingHandler(ctx)));
  router.get("/api/reports/detail", requireAuth(ctx, reportsHandler(ctx)));
}
