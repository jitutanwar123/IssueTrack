// accent color sets per index
const ACCENTS = [
  { from: "#1d4ed8", to: "#3b82f6", glow: "rgba(37,99,235,0.12)", icon: "🎯" },
  { from: "#0e7490", to: "#06b6d4", glow: "rgba(6,182,212,0.12)", icon: "📋" },
  { from: "#b45309", to: "#f59e0b", glow: "rgba(245,158,11,0.12)", icon: "⏱" },
  { from: "#b91c1c", to: "#ef4444", glow: "rgba(239,68,68,0.12)", icon: "🔴" },
  { from: "#5b21b6", to: "#8b5cf6", glow: "rgba(139,92,246,0.12)", icon: "📊" },
  { from: "#047857", to: "#10b981", glow: "rgba(16,185,129,0.12)", icon: "✅" },
];

export function StatsCard({ title, value, hint, accentIndex = 0, icon }) {
  const acc = ACCENTS[accentIndex % ACCENTS.length];
  const gradient = `linear-gradient(135deg, ${acc.from}, ${acc.to})`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated"
      style={{
        border: "1px solid #dce5f0",
        boxShadow: "0 1px 3px rgba(15,23,42,0.05), 0 1px 0 rgba(255,255,255,0.9) inset",
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: gradient }}
      />

      {/* Background glow blob */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07]"
        style={{ background: gradient }}
      />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between">
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 leading-none">
            {title}
          </div>
          {/* Icon badge */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
            style={{
              background: acc.glow,
              border: `1px solid ${acc.glow}`,
            }}
          >
            <span style={{ filter: "saturate(1.3)" }}>{icon || acc.icon}</span>
          </div>
        </div>

        <div
          className="mt-3 text-3xl font-bold tracking-tight leading-none stats-value"
          style={{ color: "#0f172a" }}
        >
          {value}
        </div>

        {hint && (
          <div className="mt-2.5 text-[11px] font-medium text-slate-400 leading-none">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
