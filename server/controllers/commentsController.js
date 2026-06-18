import { createComment, listComments } from "../models/Comment.js";
import { addTicketEvent } from "../models/Ticket.js";

export function commentsListHandler(ctx) {
  return async (req, res, params) => {
    ctx.sendJson(res, 200, { data: listComments(params.id) });
  };
}

export function commentsCreateHandler(ctx) {
  return async (req, res, params) => {
    const { body } = req.body || {};
    if (!body) {
      ctx.sendJson(res, 400, { message: "Comment body is required" });
      return;
    }

    const comment = createComment(params.id, {
      author_id: req.user.id,
      author_name: req.user.name,
      body,
      created_at: new Date().toISOString(),
    });

    addTicketEvent(params.id, {
      actor_id: req.user.id,
      actor_name: req.user.name,
      action: "added comment",
      field: "comment",
      from_value: "",
      to_value: body,
      created_at: comment.created_at,
    });

    ctx.sendJson(res, 201, { data: comment });
  };
}
