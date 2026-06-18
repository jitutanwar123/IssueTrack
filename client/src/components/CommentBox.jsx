import { useMemo, useState } from "react";
import { formatDateTime } from "../utils/helpers.js";

export function CommentBox({ comments = [], onAddComment, currentUser }) {
  const [body, setBody] = useState("");
  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [comments]
  );

  async function submit(event) {
    event.preventDefault();
    if (!body.trim()) return;
    await onAddComment(body.trim());
    setBody("");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-900">Comments</h3>
      </div>
      <div className="max-h-[360px] space-y-3 overflow-auto px-5 py-4">
        {sortedComments.length ? (
          sortedComments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900">{comment.author_name}</div>
                <div className="text-xs text-slate-500">{formatDateTime(comment.created_at)}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{comment.body}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No comments yet.
          </div>
        )}
      </div>
      <form onSubmit={submit} className="border-t border-slate-200 p-4">
        <div className="flex gap-3">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Add a comment as ${currentUser?.name || "you"}`}
            className="min-h-24 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-400 focus:outline-none"
          />
          <button className="self-end rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
