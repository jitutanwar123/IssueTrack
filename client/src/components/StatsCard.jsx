// accent stripe colors per index
const STRIPES = [
  "linear-gradient(90deg,#2563eb,#3b82f6)",
  "linear-gradient(90deg,#06b6d4,#22d3ee)",
  "linear-gradient(90deg,#d97706,#f59e0b)",
  "linear-gradient(90deg,#dc2626,#ef4444)",
  "linear-gradient(90deg,#7c3aed,#8b5cf6)",
  "linear-gradient(90deg,#059669,#10b981)",
];

export function StatsCard({ title, value, hint, accentIndex = 0 }) {
  const stripe = STRIPES[accentIndex % STRIPES.length];
  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
      style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}
    >
      {/* Top accent stripe */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: stripe }}
      />

      {/* Subtle corner blob */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.06]"
        style={{ background: stripe }}
      />

      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 leading-none">
        {title}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900 leading-none">
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
