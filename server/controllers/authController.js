import { authenticateUser } from "../models/User.js";
import { signToken } from "../utils/auth.js";
import { getUserById } from "../models/User.js";

export function loginHandler(ctx) {
  return async (req, res) => {
    const { username, password } = req.body || {};
    const user = authenticateUser(username, password);
    if (!user) {
      ctx.sendJson(res, 401, { message: "Invalid username or password" });
      return;
    }
    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role });
    ctx.sendJson(res, 200, { token, user });
  };
}

export function meHandler(ctx) {
  return async (req, res) => {
    const user = getUserById(req.user.id);
    if (!user) {
      ctx.sendJson(res, 404, { message: "User not found" });
      return;
    }
    ctx.sendJson(res, 200, { user });
  };
}
