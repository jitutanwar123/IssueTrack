import { createUser, deleteUser, listUsers, updateUser } from "../models/User.js";

export function usersListHandler(ctx) {
  return async (req, res) => {
    const search = req.url.searchParams.get("search") || "";
    ctx.sendJson(res, 200, { data: listUsers({ search }) });
  };
}

export function usersCreateHandler(ctx) {
  return async (req, res) => {
    try {
      const user = createUser(req.body || {});
      ctx.sendJson(res, 201, { data: user });
    } catch (error) {
      ctx.sendJson(res, 400, { message: error.message });
    }
  };
}

export function usersUpdateHandler(ctx) {
  return async (req, res, params) => {
    try {
      const user = updateUser(Number(params.id), req.body || {});
      if (!user) {
        ctx.sendJson(res, 404, { message: "User not found" });
        return;
      }
      ctx.sendJson(res, 200, { data: user });
    } catch (error) {
      ctx.sendJson(res, 400, { message: error.message });
    }
  };
}

export function usersDeleteHandler(ctx) {
  return async (req, res, params) => {
    const removed = deleteUser(Number(params.id));
    if (!removed) {
      ctx.sendJson(res, 404, { message: "User not found" });
      return;
    }
    ctx.sendJson(res, 200, { success: true });
  };
}
