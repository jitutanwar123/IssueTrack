import { loginHandler, meHandler } from "../controllers/authController.js";
import { requireAuth } from "../utils/auth.js";

export function registerAuthRoutes(router, ctx) {
  router.post("/api/auth/login", loginHandler(ctx));
  router.get("/api/auth/me", requireAuth(ctx, meHandler(ctx)));
}
