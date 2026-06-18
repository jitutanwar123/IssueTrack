import { usersCreateHandler, usersDeleteHandler, usersListHandler, usersUpdateHandler } from "../controllers/usersController.js";
import { requireAuth } from "../utils/auth.js";

export function registerUserRoutes(router, ctx) {
  router.get("/api/users", requireAuth(ctx, usersListHandler(ctx)));
  router.post("/api/users", requireAuth(ctx, usersCreateHandler(ctx)));
  router.put("/api/users/:id", requireAuth(ctx, usersUpdateHandler(ctx)));
  router.delete("/api/users/:id", requireAuth(ctx, usersDeleteHandler(ctx)));
}
