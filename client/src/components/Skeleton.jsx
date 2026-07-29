// ─── Skeleton & Empty State Components ───────────────────────────────────────
// Reusable loading skeletons and empty state UI for consistent UX across portals

// ── Single shimmer block (free-form rectangle) ────────────────────────────────
export function SkeletonBlock({ className = "" }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

// ── Single table row skeleton ─────────────────────────────────────────────────
export function SkeletonRow({ cols = 6 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className={`skeleton h-4 rounded-lg ${i === 0 ? "w-20" : i === 1 ? "w-36" : "w-16"}`} />
        </td>
      ))}
    </tr>
  );
}

// ── Multiple table skeleton rows ──────────────────────────────────────────────
export function TableSkeleton({ count = 6, cols = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}

// ── Single stat card skeleton ─────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <div className="skeleton h-3 w-20 rounded-lg mb-4" />
      <div className="skeleton h-8 w-12 rounded-lg" />
    </div>
  );
}

// ── Multiple stat card skeletons ──────────────────────────────────────────────
export function StatSkeleton({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

// ── List item skeleton (for non-table lists) ──────────────────────────────────
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-3/5 rounded-lg" />
        <div className="skeleton h-3 w-2/5 rounded-lg" />
      </div>
      <div className="skeleton h-6 w-16 rounded-full" />
      <div className="skeleton h-6 w-16 rounded-full" />
    </div>
  );
}

// ── Multiple list item skeletons ──────────────────────────────────────────────
export function ListSkeleton({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </>
  );
}

// ── Chart placeholder skeleton ────────────────────────────────────────────────
export function ChartSkeleton({ height = "h-64" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${height} flex items-end gap-2 p-6`}>
      {[55, 80, 45, 90, 65, 70, 40].map((h, i) => (
        <div
          key={i}
          className="skeleton flex-1 rounded-t-lg"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ── Polished empty state component ────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  subtitle,
  action,          // { label, onClick, href }
  className = "",
}) {
  const defaultIcon = (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7a2 2 0 0 0 2 2 2 2 0 0 1 0 4 2 2 0 0 0-2 2v2h16v-2a2 2 0 0 0-2-2 2 2 0 0 1 0-4 2 2 0 0 0 2-2V5H4Z" />
    </svg>
  );

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {/* Icon circle */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 shadow-sm">
        {icon || defaultIcon}
      </div>

      {/* Text */}
      <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{title || "Nothing here yet"}</p>
      {subtitle && (
        <p className="mt-1.5 max-w-xs text-sm text-slate-400 dark:text-slate-500">{subtitle}</p>
      )}

      {/* CTA */}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-800 hover:-translate-y-px"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-800 hover:-translate-y-px"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
