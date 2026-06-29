import { useMemo, useState } from "react";
import { formatDateTime } from "../utils/helpers.js";

export function CommentBox({ comments = [], onAddComment, currentUser }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [comments]
  );

  async function submit(event) {
    event.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(body.trim());
      setBody("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden" style={{ boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h3 className="text-sm font-bold text-slate-900">Comments</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          {sortedComments.length}
        </span>
      </div>

      {/* Comment list */}
      <div className="max-h-[340px] space-y-3 overflow-auto px-5 py-4 scrollbar-thin">
        {sortedComments.length ? (
          sortedComments.map((comment) => {
            const initials = comment.author_name?.charAt(0)?.toUpperCase() || "?";
            return (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                  style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl px-4 py-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-800">{comment.author_name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">No comments yet</p>
            <p className="text-xs text-slate-300 mt-1">Be the first to leave a note</p>
          </div>
        )}
      </div>

      {/* Add comment */}
      <form onSubmit={submit} className="border-t border-slate-100 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Add a note as ${currentUser?.name || "you"}…`}
          rows={3}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 resize-none"
          style={{ minHeight: "72px" }}
          onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; }}
          onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = ""; }}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {submitting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
